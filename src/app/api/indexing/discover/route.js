import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { submitDiscovery } from "@/lib/submitDiscovery";
import {
    readIndexingResultsByUserFromInsforge,
    withPrismaFallback
} from "@/lib/adminData";

export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const results = await withPrismaFallback("User indexing results",
            () => readIndexingResultsByUserFromInsforge(session.user.id, { take: 50 }),
            () => prisma.indexingResult.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                take: 50
            })
        );

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { urls, bots } = body;

        const result = await submitDiscovery({
            userId: session.user.id,
            rawUrls: urls,
            requestedBots: bots,
        });

        return NextResponse.json(result.payload, { status: result.status });
    } catch (error) {
        console.error("Discovery API Error:", error);
        return NextResponse.json({
            error: "Failed to process discovery",
            details: error.message
        }, { status: 500 });
    }
}
