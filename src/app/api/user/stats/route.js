import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readIndexingResultsByUserFromInsforge, readUserByIdFromInsforge, withPrismaFallback } from "@/lib/adminData";

function parseBots(bots) {
    try {
        const parsed = typeof bots === "string" ? JSON.parse(bots) : bots;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function countSignals(results) {
    return results.reduce((total, result) => total + parseBots(result.bots).length, 0);
}

function percentChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
}

export async function GET(request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'daily'; // daily (14 days), weekly (8 weeks), monthly (6 months)

    try {
        const [allResults, user] = await withPrismaFallback("User stats",
            async () => {
                const results = await readIndexingResultsByUserFromInsforge(session.user.id);
                const currentUser = await readUserByIdFromInsforge(session.user.id, "balance");
                return [results, currentUser];
            },
            async () => {
                const results = await prisma.indexingResult.findMany({
                    where: { userId: session.user.id },
                    select: { status: true, bots: true, createdAt: true }
                });
                const currentUser = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { balance: true }
                });
                return [results, currentUser];
            }
        );

        const totalUrlsResult = allResults.length;
        // Real outcome counts — statuses are set from actual engine responses.
        const submittedCount = allResults.filter(result => result.status === "submitted").length;
        const partialCount = allResults.filter(result => result.status === "partial").length;
        const failedCount = allResults.filter(result => result.status === "failed").length;
        const pendingCount = allResults.filter(result => result.status === "queued" || result.status === "processing").length;
        const acceptedCount = submittedCount + partialCount;

        let totalBotSignals = 0;
        let totalPrimarySignals = 0;
        let totalAISignals = 0;

        allResults.forEach(result => {
            const botsArray = parseBots(result.bots);
            totalBotSignals += botsArray.length;
            botsArray.forEach(bot => {
                const b = bot.toLowerCase();
                if (b.includes('openai') || b.includes('anthropic') || b.includes('gpt') || b.includes('common')) {
                    totalAISignals += 1;
                } else {
                    totalPrimarySignals += 1;
                }
            });
        });

        // 4. Activity Stats with Filters
        let daysToFetch = 14;
        if (range === 'weekly') daysToFetch = 60; // ~2 months
        if (range === 'monthly') daysToFetch = 180; // ~6 months

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - daysToFetch);

        const recentResults = allResults
            .filter(result => new Date(result.createdAt) >= startDate)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - daysToFetch);

        const previousResults = allResults.filter(result => {
            const createdAt = new Date(result.createdAt);
            return createdAt >= previousStartDate && createdAt < startDate;
        });

        // Grouping logic based on range
        const activityStatsMap = {};
        
        if (range === 'daily') {
            for(let i=13; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                activityStatsMap[key] = { label: d.toLocaleDateString('en-US', { weekday: 'short' }), date: key, primary: 0, ai: 0, count: 0 };
            }
        } else if (range === 'weekly') {
            for(let i=7; i>=0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - (i * 7));
                const key = `Week ${8-i}`;
                activityStatsMap[key] = { label: key, primary: 0, ai: 0, count: 0 };
            }
        } else if (range === 'monthly') {
            for(let i=5; i>=0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleDateString('en-US', { month: 'short' });
                activityStatsMap[key] = { label: key, primary: 0, ai: 0, count: 0 };
            }
        }

        recentResults.forEach(result => {
            let key;
            const d = new Date(result.createdAt);
            
            if (range === 'daily') {
                key = d.toISOString().split('T')[0];
            } else if (range === 'weekly') {
                const weekNum = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24 * 7));
                if (weekNum >= 0 && weekNum < 8) key = `Week ${8-weekNum}`;
            } else {
                key = d.toLocaleDateString('en-US', { month: 'short' });
            }

            if (activityStatsMap[key]) {
                const botsArray = parseBots(result.bots);
                botsArray.forEach(bot => {
                    const b = bot.toLowerCase();
                    if (b.includes('openai') || b.includes('anthropic') || b.includes('gpt') || b.includes('common')) {
                        activityStatsMap[key].ai += 1;
                    } else {
                        activityStatsMap[key].primary += 1;
                    }
                });
                activityStatsMap[key].count += botsArray.length;
            }
        });

        const activityStats = Object.values(activityStatsMap);
        if (range === 'daily') activityStats.sort((a,b) => a.date.localeCompare(b.date));

        const recentSignalCount = countSignals(recentResults);
        const previousSignalCount = countSignals(previousResults);

        // Durable queue depth (jobs not yet completed).
        let queuedJobs = 0;
        try {
            queuedJobs = await prisma.submissionJob.count({
                where: { userId: session.user.id, status: { in: ['pending', 'processing'] } },
            });
        } catch {
            queuedJobs = 0;
        }

        return NextResponse.json({
            balance: user?.balance || 0,
            totalUrls: totalUrlsResult,
            accepted: acceptedCount,
            submitted: submittedCount,
            partial: partialCount,
            failed: failedCount,
            pending: pendingCount,
            queuedJobs,
            successRate: totalUrlsResult > 0 ? Math.round((submittedCount / totalUrlsResult) * 100) : 0,
            totalBotSignals,
            totalPrimarySignals,
            totalAISignals,
            urlChangePercent: percentChange(recentResults.length, previousResults.length),
            signalChangePercent: percentChange(recentSignalCount, previousSignalCount),
            dailyStats: activityStats // Renamed to dailyStats to maintain frontend compatibility
        });
    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
