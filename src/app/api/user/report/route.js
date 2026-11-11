import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;

function parseSignalResults(raw) {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed?.engines) ? parsed.engines : [];
    } catch {
        return [];
    }
}

// GET: the signed-in user's indexing activity for the last 24 hours and week.
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = Date.now();
    const since24h = new Date(now - DAY_MS);
    const since7d = new Date(now - WINDOW_DAYS * DAY_MS);

    try {
        const [user, records, jobs] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: { balance: true },
            }),
            prisma.indexingResult.findMany({
                where: { userId: session.user.id, createdAt: { gte: since7d } },
                select: { id: true, url: true, status: true, signalingResults: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 500,
            }),
            prisma.submissionJob.findMany({
                where: { userId: session.user.id, createdAt: { gte: since7d } },
                select: { status: true, attempts: true, lastError: true, createdAt: true },
            }),
        ]);

        const recentRecords = records.filter((record) => record.createdAt >= since24h);
        const statusCounts = { submitted: 0, partial: 0, failed: 0, queued: 0, processing: 0 };
        const engineCounts = new Map();
        const errorCounts = new Map();

        for (const record of recentRecords) {
            if (statusCounts[record.status] !== undefined) statusCounts[record.status] += 1;
            for (const entry of parseSignalResults(record.signalingResults)) {
                if (!entry?.engine) continue;
                const current = engineCounts.get(entry.engine) || { engine: entry.engine, ok: 0, failed: 0 };
                if (entry.ok) current.ok += 1; else current.failed += 1;
                engineCounts.set(entry.engine, current);
                if (!entry.ok && entry.error) {
                    const key = String(entry.error).slice(0, 140);
                    errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
                }
            }
        }

        const queue = { pending: 0, processing: 0, dead: 0, retrying: 0 };
        for (const job of jobs) {
            if (job.status === 'pending') {
                queue.pending += 1;
                if (job.attempts > 0) queue.retrying += 1;
            } else if (job.status === 'processing') {
                queue.processing += 1;
            } else if (job.status === 'dead') {
                queue.dead += 1;
            }
        }

        const daily = [];
        for (let offset = WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
            const start = new Date(now - (offset + 1) * DAY_MS);
            const end = new Date(now - offset * DAY_MS);
            const bucket = records.filter((record) => record.createdAt >= start && record.createdAt < end);
            const day = { date: start.toISOString().slice(0, 10), total: bucket.length, submitted: 0, failed: 0 };
            for (const record of bucket) {
                if (record.status === 'submitted' || record.status === 'partial') day.submitted += 1;
                if (record.status === 'failed') day.failed += 1;
            }
            daily.push(day);
        }

        const recent = recentRecords.slice(0, 10).map((record) => ({
            id: record.id,
            url: record.url,
            status: record.status,
            createdAt: record.createdAt,
            engines: parseSignalResults(record.signalingResults).map((entry) => ({
                engine: entry.engine,
                ok: Boolean(entry.ok),
                error: entry.ok ? null : (entry.error || null),
            })),
        }));

        return NextResponse.json({
            window: '24h',
            balance: user?.balance ?? null,
            totals: {
                records: recentRecords.length,
                accepted: statusCounts.submitted + statusCounts.partial,
                ...statusCounts,
            },
            engines: [...engineCounts.values()].sort((a, b) => (b.ok + b.failed) - (a.ok + a.failed)),
            queue,
            daily,
            topErrors: [...errorCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([message, count]) => ({ message, count })),
            recent,
        });
    } catch (error) {
        console.error("User report error:", error);
        return NextResponse.json({ error: "Failed to build the report" }, { status: 500 });
    }
}
