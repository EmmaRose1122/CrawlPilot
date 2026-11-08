import { prisma } from "./prisma";
import { runSubmissionBatch } from "./engines/runSubmissionBatch";
import { updateIndexingResultInInsforge } from "./adminData";

const DEFAULT_LIMIT = 20;
const STALE_LOCK_MINUTES = 10;
const MAX_BACKOFF_MS = 30 * 60 * 1000;

export async function enqueueSubmissionJob(tx, { userId, records, engines }) {
    const payload = JSON.stringify({
        records: records.map((record) => ({ id: record.id, url: record.url })),
        engines,
    });

    return tx.submissionJob.create({
        data: { userId, payload },
    });
}

async function claimNextJob() {
    const now = new Date();

    const candidate = await prisma.submissionJob.findFirst({
        where: { status: 'pending', availableAt: { lte: now } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, userId: true, payload: true, attempts: true, maxAttempts: true },
    });

    if (!candidate) return null;

    // Atomic claim: only one worker wins the transition pending -> processing.
    const claimed = await prisma.submissionJob.updateMany({
        where: { id: candidate.id, status: 'pending' },
        data: { status: 'processing', lockedAt: now },
    });

    return claimed.count === 1 ? candidate : null;
}

/**
 * Dead-letter handling: mark the job's records failed (only those that never
 * reached a final state) and refund their credits exactly once.
 */
async function failJobRecords(job, reason) {
    let parsed;
    try {
        parsed = JSON.parse(job.payload);
    } catch {
        return;
    }

    const records = parsed.records || [];
    const engines = parsed.engines || [];
    if (records.length === 0) return;

    const refundable = [];
    for (const record of records) {
        try {
            const current = await prisma.indexingResult.findUnique({
                where: { id: record.id },
                select: { status: true },
            });
            if (current && (current.status === 'queued' || current.status === 'processing')) {
                refundable.push(record.id);
            }
        } catch (error) {
            console.error('[Queue] Could not read record', record.id, error.message);
        }
    }

    for (const id of refundable) {
        try {
            await updateIndexingResultInInsforge(id, {
                status: 'failed',
                signalingResults: JSON.stringify({
                    successCount: 0,
                    totalCount: engines.length,
                    successRate: 0,
                    engines: engines.map((engineId) => ({
                        engine: engineId,
                        method: 'unknown',
                        ok: false,
                        httpStatus: null,
                        responseTime: null,
                        error: reason,
                    })),
                    lastUpdated: new Date().toISOString(),
                    apiStatus: 'NONE',
                }),
            });
        } catch (error) {
            console.error('[Queue] Could not mark record failed', id, error.message);
        }
    }

    if (refundable.length > 0) {
        const refundCredits = refundable.length * engines.length;
        try {
            await prisma.user.update({
                where: { id: job.userId },
                data: { balance: { increment: refundCredits } },
            });
            console.log(`[Queue] Refunded ${refundCredits} credits after dead-letter`);
        } catch (error) {
            console.error('[Queue] Dead-letter refund failed:', error.message);
        }
    }
}

/**
 * Processes pending jobs. Safe to call concurrently: claims are atomic.
 */
export async function processPendingJobs({ limit = DEFAULT_LIMIT } = {}) {
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < limit; i++) {
        let job;
        try {
            job = await claimNextJob();
        } catch (error) {
            console.error('[Queue] Claim failed:', error.message);
            break;
        }

        if (!job) break;

        try {
            const payload = JSON.parse(job.payload);
            await runSubmissionBatch({
                userId: job.userId,
                records: payload.records || [],
                engines: payload.engines || [],
            });

            await prisma.submissionJob.update({
                where: { id: job.id },
                data: { status: 'done', lockedAt: null, lastError: null },
            });
            processed++;
        } catch (error) {
            const attempts = job.attempts + 1;
            const isDead = attempts >= job.maxAttempts;
            const backoffMs = Math.min(60000 * Math.pow(2, attempts), MAX_BACKOFF_MS);

            try {
                await prisma.submissionJob.update({
                    where: { id: job.id },
                    data: {
                        status: isDead ? 'dead' : 'pending',
                        attempts,
                        lockedAt: null,
                        lastError: String(error?.message || error).slice(0, 1000),
                        availableAt: new Date(Date.now() + backoffMs),
                    },
                });
            } catch (updateError) {
                console.error('[Queue] Could not update failed job:', updateError.message);
            }

            if (isDead) {
                await failJobRecords(job, `Retries exhausted: ${error?.message || error}`);
            }

            failed++;
            console.error('[Queue] Job failed:', job.id, error.message);
        }
    }

    return { processed, failed };
}

/**
 * Recovers jobs stuck in "processing" (worker crashed / function was frozen).
 * Requeues them, or dead-letters them when retries are exhausted.
 */
export async function requeueStaleJobs({ olderThanMinutes = STALE_LOCK_MINUTES } = {}) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    const stale = await prisma.submissionJob.findMany({
        where: { status: 'processing', lockedAt: { lt: cutoff } },
        select: { id: true, userId: true, payload: true, attempts: true, maxAttempts: true },
    });

    let requeued = 0;
    let dead = 0;

    for (const job of stale) {
        const attempts = job.attempts + 1;
        const isDead = attempts >= job.maxAttempts;

        try {
            await prisma.submissionJob.update({
                where: { id: job.id },
                data: {
                    status: isDead ? 'dead' : 'pending',
                    attempts,
                    lockedAt: null,
                    lastError: 'Worker timeout — job requeued',
                    availableAt: new Date(),
                },
            });
        } catch (error) {
            console.error('[Queue] Could not requeue job', job.id, error.message);
            continue;
        }

        if (isDead) {
            await failJobRecords(job, 'Worker timeout — retries exhausted');
            dead++;
        } else {
            requeued++;
        }
    }

    return { requeued, dead };
}
