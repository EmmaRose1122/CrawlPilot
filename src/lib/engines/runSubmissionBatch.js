import { prisma } from "../prisma";
import { sendBotSignals } from "../botSignals";
import { readUserByIdFromInsforge, updateIndexingResultInInsforge } from "../adminData";
import { submitIndexNowHost, verifyIndexNowKey } from "./indexnow";

/**
 * Executes one submission batch: sends URLs through the real engine interfaces
 * (Google Indexing API / IndexNow / HTTP check), stores per-engine outcomes, and
 * refunds credits when no engine accepted anything.
 *
 * Called by the durable queue worker and by the InsForge fallback path.
 */
export async function runSubmissionBatch({ userId, records, engines }) {
    const startTime = Date.now();
    console.log(`[Batch] Starting ${records.length} URL(s), engines: ${engines.join(', ')}`);

    const user = await readUserByIdFromInsforge(
        userId,
        "id,googleIndexingConfig,indexNowKey,plan,allowedBots,balance"
    );

    if (!user) {
        throw new Error(`User ${userId} not found`);
    }

    const urls = records.map((record) => record.url);

    // Mark records as processing so the UI can distinguish queued work.
    await Promise.all(records.map((record) =>
        updateIndexingResultInInsforge(record.id, { status: "processing" })
            .catch((err) => console.warn(`[Batch] Could not mark ${record.id} processing:`, err.message))
    ));

    const engineResults = new Map(); // url -> Map(engineId -> entry)
    const setResult = (url, engine, entry) => {
        if (!engineResults.has(url)) engineResults.set(url, new Map());
        engineResults.get(url).set(engine, entry);
    };

    let apiStatus = 'NONE';

    // ---- Google: real Indexing API when configured, otherwise an honest HTTP reachability check ----
    if (engines.includes('google') && user.googleIndexingConfig) {
        try {
            const { batchGoogleIndexing } = await import('../googleIndexing');
            const apiResults = await batchGoogleIndexing(urls, user.googleIndexingConfig);
            apiStatus = 'API_SUCCESS';
            const byUrl = new Map(apiResults.map((result) => [result.url, result]));

            for (const url of urls) {
                const result = byUrl.get(url);
                setResult(url, 'google', {
                    engine: 'google',
                    method: 'google-indexing-api',
                    ok: !!result?.success,
                    httpStatus: result?.status ?? null,
                    responseTime: null,
                    error: result?.success ? null : (result?.error || 'Google Indexing API returned no result for this URL'),
                });
            }
            console.log(`[Batch] Google API: ${apiResults.filter((result) => result.success).length}/${urls.length} accepted`);
        } catch (apiErr) {
            apiStatus = 'API_FAILED';
            console.error('[Batch] Google API error:', apiErr.message);
            for (const url of urls) {
                setResult(url, 'google', {
                    engine: 'google',
                    method: 'google-indexing-api',
                    ok: false,
                    httpStatus: null,
                    responseTime: null,
                    error: `Google Indexing API error: ${apiErr.message}`,
                });
            }
        }
    } else if (engines.includes('google')) {
        const { results: httpResults, summary } = await sendBotSignals(['google'], urls, {
            concurrency: 5,
            maxRetries: 2,
        });
        for (const result of httpResults) {
            setResult(result.url, 'google', {
                engine: 'google',
                method: 'http-check',
                ok: !!result.success,
                httpStatus: result.status ?? null,
                responseTime: result.responseTime ?? null,
                error: result.error || null,
            });
        }
        console.log(`[Batch] HTTP check: ${summary}`);
    }

    // ---- Bing: real IndexNow submission, grouped by host ----
    if (engines.includes('bing')) {
        const urlsByHost = new Map();
        for (const url of urls) {
            try {
                const host = new URL(url).hostname.toLowerCase();
                if (!urlsByHost.has(host)) urlsByHost.set(host, []);
                urlsByHost.get(host).push(url);
            } catch {
                // URLs were validated before enqueueing; ignore unparsable leftovers.
            }
        }

        if (!user.indexNowKey) {
            for (const url of urls) {
                setResult(url, 'bing', {
                    engine: 'bing',
                    method: 'indexnow',
                    ok: false,
                    httpStatus: null,
                    responseTime: null,
                    error: 'IndexNow key not configured — generate one in API Integration and host the key file.',
                });
            }
        } else {
            for (const [host, hostUrls] of urlsByHost) {
                const verification = await verifyIndexNowKey(host, user.indexNowKey);

                if (!verification.ok) {
                    for (const url of hostUrls) {
                        setResult(url, 'bing', {
                            engine: 'bing',
                            method: 'indexnow',
                            ok: false,
                            httpStatus: verification.httpStatus,
                            responseTime: null,
                            error: `${verification.reason} — host ${verification.keyLocation}`,
                        });
                    }
                    continue;
                }

                const submission = await submitIndexNowHost({
                    host,
                    key: user.indexNowKey,
                    urls: hostUrls,
                });

                for (const url of hostUrls) {
                    setResult(url, 'bing', {
                        engine: 'bing',
                        method: 'indexnow',
                        ok: submission.ok,
                        httpStatus: submission.httpStatus,
                        responseTime: null,
                        error: submission.ok ? null : `${submission.error} — ${submission.keyLocation}`,
                    });
                }
                console.log(`[Batch] IndexNow ${host}: ${submission.ok ? 'accepted' : submission.error} (${hostUrls.length} URLs)`);
            }
        }
    }

    // Legacy engine ids are no longer supported — record them honestly.
    for (const url of urls) {
        for (const engineId of engines) {
            if (engineId === 'google' || engineId === 'bing') continue;
            setResult(url, engineId, {
                engine: engineId,
                method: 'unsupported',
                ok: false,
                httpStatus: null,
                responseTime: null,
                error: 'Engine no longer supported',
            });
        }
    }

    // ---- Persist outcomes; refund credits when no engine accepted anything ----
    let refundCredits = 0;
    for (const record of records) {
        const perEngine = engineResults.get(record.url) || new Map();
        const recordEngines = engines.map((engineId) => perEngine.get(engineId) || {
            engine: engineId,
            method: 'unknown',
            ok: false,
            httpStatus: null,
            responseTime: null,
            error: 'No result recorded',
        });
        const successCount = recordEngines.filter((entry) => entry.ok).length;
        const totalCount = recordEngines.length;

        let status = "failed";
        if (successCount > 0) {
            status = successCount === totalCount ? "submitted" : "partial";
        }
        if (status === "failed") {
            refundCredits += totalCount;
        }

        await updateIndexingResultInInsforge(record.id, {
            status,
            signalingResults: JSON.stringify({
                successCount,
                totalCount,
                successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
                engines: recordEngines,
                lastUpdated: new Date().toISOString(),
                apiUsed: !!user.googleIndexingConfig && engines.includes('google'),
                apiStatus,
            }),
        });
    }

    if (refundCredits > 0) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { balance: { increment: refundCredits } },
            });
            console.log(`[Batch] Refunded ${refundCredits} credits for failed submission`);
        } catch (refundError) {
            console.error('[Batch] Refund failed:', refundError.message);
        }
    }

    console.log(`[Batch] Completed ${records.length} record(s) in ${Date.now() - startTime}ms`);
    return { refundCredits };
}
