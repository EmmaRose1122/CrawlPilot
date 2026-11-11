import { NextResponse } from "next/server";
import { processPendingJobs, requeueStaleJobs, splitOversizedJobs } from "@/lib/jobQueue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req) {
    const secret = process.env.CRON_SECRET;
    const authorization = req.headers.get("authorization") || "";
    const customHeader = req.headers.get("x-cron-secret") || "";

    if (secret) {
        return authorization === `Bearer ${secret}` || customHeader === secret;
    }

    // No secret configured: allow Vercel's scheduler and local development only.
    if (req.headers.get("x-vercel-cron")) return true;
    return process.env.NODE_ENV !== "production";
}

async function handle(req) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stale = await requeueStaleJobs();
        const split = await splitOversizedJobs();
        const result = await processPendingJobs({ limit: 20, timeBudgetMs: 45000 });

        return NextResponse.json({
            ok: true,
            requeued: stale.requeued,
            deadLettered: stale.dead,
            split: split.split,
            splitJobs: split.created,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Cron process-jobs error:", error);
        return NextResponse.json({ error: "Worker failed" }, { status: 500 });
    }
}

export async function GET(req) {
    return handle(req);
}

export async function POST(req) {
    return handle(req);
}
