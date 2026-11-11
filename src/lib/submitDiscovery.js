import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { validatePublicHttpUrl } from "./urlSafety";
import { enqueueSubmissionJob, processPendingJobs } from "./jobQueue";
import { runSubmissionBatch } from "./engines/runSubmissionBatch";
import {
    createIndexingResultsInInsforge,
    readUserByIdFromInsforge,
    updateUserInInsforge,
} from "./adminData";

export const INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS";

// Small jobs finish inside one serverless invocation, so a large batch cannot
// monopolise the worker or time out in the middle of a host group.
const URLS_PER_JOB = 10;

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
        "id,plan,allowedBots,googleIndexingConfig,indexNowKey,balance"
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
            status: "queued",
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

            // Durable jobs: the cron worker (or the immediate kick below) runs
            // them, so a serverless timeout can no longer lose the submission.
            for (let index = 0; index < records.length; index += URLS_PER_JOB) {
                await enqueueSubmissionJob(tx, {
                    userId,
                    records: records
                        .slice(index, index + URLS_PER_JOB)
                        .map((record) => ({ id: record.id, url: record.url })),
                    engines: filteredBots,
                });
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

        // No job table without Prisma — process inline as a degraded fallback.
        runSubmissionBatch({
            userId,
            records: createdRecords.map((record) => ({ id: record.id, url: record.url })),
            engines: filteredBots,
        }).catch((inlineError) => console.error('[Indexing] Inline processing failed:', inlineError.message));
    }

    // Kick the durable queue immediately for low latency; the cron worker is
    // the reliability backstop if the function is frozen before it finishes.
    processPendingJobs({ limit: 2 }).catch((err) => console.error('[Indexing] Queue kick failed:', err.message));

    return {
        status: 200,
        payload: {
            success: true,
            count: actualUrls.length,
            botsUsed: filteredBots,
            skippedUrls,
            message: `Queued ${actualUrls.length} URL(s) across ${filteredBots.length} engine(s). Processing in the background.`,
        },
    };
}
