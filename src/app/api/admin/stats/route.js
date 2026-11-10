import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readStatsFromInsforge, withPrismaFallback } from "@/lib/adminData";

export async function GET() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await withPrismaFallback("Admin stats",
            readStatsFromInsforge,
            async () => {
                const userCount = await prisma.user.count();
                const blogCount = await prisma.blog.count();
                const discoveryCount = await prisma.indexingResult.count();

                return {
                    userCount,
                    blogCount,
                    discoveryCount,
                    totalRevenue: 0
                };
            }
        );

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
