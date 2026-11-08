import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { sendBotSignals } from "./botSignals";
import { validatePublicHttpUrl } from "./urlSafety";
import {
    createIndexingResultsInInsforge,
    readUserByIdFromInsforge,
    updateIndexingResultInInsforge,
    updateUserInInsforge,
} from "./adminData";

export const INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS";

function parseAllowedBots(user) {
    try {
        const parsed = JSON.parse(user.allowedBots || '["google"]');
        return Array.isArray(parsed) ? parsed : ["google"];
    } catch {
        return ["google"];
    }
}

/**
 * Shared discovery submission pipeline used by the dashboard route and the
 * public API v1. Validates URLs (SSRF guard), filters bots by plan/permissions,
 * charges credits atomically, and starts bot signaling in the background.
 *
 * @returns {{ status: number, payload: object }}
 */
export async function submitDiscovery({ userId, rawUrls, requestedBots }) {
    if (!rawUrls || !Array.isArray(rawUrls)) {
        return { status: 400, payload: { error: "Invalid URLs. A list of URLs is required." } };
    }

    const normalizedUrls = rawUrls
        .map((url) => (typeof url === "string" ? url.trim() : ""))
        .filter(Boolean);

    if (normalizedUrls.length === 0) {
        return { status: 400, payload: { error: "Invalid URLs. At least one URL is required." } };
    }

    const validation = await Promise.all(normalizedUrls.map((url) => validatePublicHttpUrl(url)));
    const safeUrls = validation.filter((v) => v.ok).map((v) => v.url);
    const skippedUrls = validation
        .filter((v) => !v.ok)
        .map((v) => ({ url: v.value, reason: v.reason }));

    if (safeUrls.length === 0) {
        return {
            status: 400,
            payload: {
                error: "Invalid URLs. None of the submitted URLs are publicly reachable.",
                skippedUrls,
            },
        };
    }

    if (!requestedBots || !Array.isArray(requestedBots)) {
        return { status: 400, payload: { error: "Invalid bots. At least one bot must be selected." } };
    }

    const bots = requestedBots.filter((bot) => typeof bot === "string");

    if (bots.length === 0) {
        return { status: 400, payload: { error: "Invalid bots. At least one bot must be selected." } };
    }

    const user = await readUserByIdFromInsforge(
        userId,
        "id,plan,allowedBots,googleIndexingConfig,balance"
    );

    if (!user) {
        return { status: 404, payload: { error: "User not found" } };
    }

    const allowedBots = parseAllowedBots(user);

    // Filter bots based on user's allowed bots
    let filteredBots = bots.filter((bot) => allowedBots.includes(bot));

    // For free plan, only allow google bot
    if (user.plan === "free" && filteredBots.length === 0) {
        filteredBots = ["google"];
    }

    if (filteredBots.length === 0) {
        return {
            status: 403,
            payload: {
                error: "No allowed bots selected. Please upgrade your plan or contact admin.",
            },
        };
    }

    const balance = Number(user.balance || 0);

    if (balance <= 0) {
        return {
            status: 402,
            payload: {
                error: INSUFFICIENT_CREDITS,
                message: "Your credit balance is exhausted. Please top up to continue.",
                balance,
            },
        };
    }

    const affordableUrlCount = Math.min(safeUrls.length, Math.floor(balance / filteredBots.length));

    if (affordableUrlCount <= 0) {
        return {
            status: 402,
            payload: {
                error: INSUFFICIENT_CREDITS,
                message: "Not enough credits for the selected bots.",
                balance,
            },
        };
    }

    const actualUrls = safeUrls.slice(0, affordableUrlCount);
    const actualCost = actualUrls.length * filteredBots.length;

    // Atomic charge: records + conditional balance decrement in one
    // transaction, so concurrent submissions can never overspend.
    let createdRecords;
    try {
        const timestamp = new Date();
        const records = actualUrls.map((url) => ({
            id: randomUUID(),
            url,
            bots: JSON.stringify(filteredBots),
            status: "Delivered",
            userId,
            createdAt: timestamp,
        }));

        createdRecords = await prisma.$transaction(async (tx) => {
            await tx.indexingResult.createMany({ data: records });
            const charged = await tx.user.updateMany({
                where: { id: userId, balance: { gte: actualCost } },
                data: { balance: { decrement: actualCost } },
            });
            if (charged.count === 0) {
                throw new Error("INSUFFICIENT_CREDITS_RACE");
            }
            return records;
        });
    } catch (error) {
        if (error.message === "INSUFFICIENT_CREDITS_RACE") {
            return {
                status: 402,
                payload: {
                    error: INSUFFICIENT_CREDITS,
                    message: "Your balance changed while submitting. Please try again.",
                    balance,
                },
            };
        }

        // Prisma is unreachable — degrade to the InsForge write path.
        console.warn("Prisma write failed, using InsForge fallback:", error.message);
        createdRecords = await createIndexingResultsInInsforge({
            urls: actualUrls,
            bots: filteredBots,
            userId,
        });
        await updateUserInInsforge(userId, { balance: balance - actualCost });
    }

    // Start actual bot signaling in the background (non-blocking)
    (async () => {
        try {
            const startTime = Date.now();
            console.log(`[Indexing] Starting process for ${actualUrls.length} URLs, ${filteredBots.length} bots`);

            let apiStatus = 'NONE';
            let apiResults = [];

            // 1. PRIORITY: If Google is selected and user has API config, use Google Indexing API FIRST
            if (filteredBots.includes('google') && user.googleIndexingConfig) {
                try {
                    const { batchGoogleIndexing } = await import('./googleIndexing');
                    const creds = JSON.parse(user.googleIndexingConfig);
                    console.log(`[Diagnostic] Using Project: ${creds.project_id}`);
                    console.log(`[Diagnostic] Service Account: ${creds.client_email}`);

                    apiResults = await batchGoogleIndexing(actualUrls, user.googleIndexingConfig);
                    apiStatus = 'API_SUCCESS';
                    console.log(`[Google API Success] Count: ${apiResults.filter(r => r.success).length}/${actualUrls.length}`);
                } catch (apiErr) {
                    apiStatus = 'API_FAILED';
                    console.error('[Google API Error] Details:', apiErr.message);
                }
            }

            // 2. Perform traditional bot signaling
            const { results: signalResults, stats, summary } = await sendBotSignals(filteredBots, actualUrls, {
                concurrency: 5,
                maxRetries: 2,
                progressCallback: (progress) => {
                    if (progress.type === 'progress') {
                        console.log(`[Indexing] Progress: ${progress.completed}/${progress.total} signals completed`);
                    }
                },
            });

            const endTime = Date.now();
            console.log(`[Indexing] Completed in ${endTime - startTime}ms: ${summary}`);

            // 3. Update database with results
            try {
                for (const record of createdRecords) {
                    const urlResults = signalResults.filter(r => r.url === record.url);
                    const successCount = urlResults.filter(r => r.success).length;
                    const totalCount = urlResults.length;

                    await updateIndexingResultInInsforge(record.id, {
                        signalingResults: JSON.stringify({
                            successCount,
                            totalCount,
                            successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
                            lastUpdated: new Date(),
                            apiUsed: !!user.googleIndexingConfig && filteredBots.includes('google'),
                            apiStatus: apiStatus
                        }),
                    });
                }
                console.log(`[Indexing] Updated ${createdRecords.length} records in DB`);
            } catch (dbError) {
                console.error('[Indexing] DB Update Error:', dbError);
            }
        } catch (err) {
            console.error('[Indexing] Fatal Background Error:', err);
        }
    })();

    return {
        status: 200,
        payload: {
            success: true,
            count: actualUrls.length,
            botsUsed: filteredBots,
            skippedUrls,
            message: `Discovery submitted. ${actualUrls.length} URLs will be processed with ${filteredBots.length} bots.`,
        },
    };
}
