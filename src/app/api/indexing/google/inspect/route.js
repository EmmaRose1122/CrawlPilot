import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readUserByIdFromInsforge, withPrismaFallback } from "@/lib/adminData";
import { inspectUrl, mapGoogleError } from "@/lib/engines/googleSearchConsole";

// POST /api/indexing/google/inspect  { resultId }
// Runs Google's URL Inspection API and caches the result on the record.
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { resultId } = body;

        if (!resultId) {
            return NextResponse.json({ error: "resultId is required" }, { status: 400 });
        }

        const record = await prisma.indexingResult.findFirst({
            where: { id: resultId, userId: session.user.id },
            select: { id: true, url: true },
        });

        if (!record) {
            return NextResponse.json({ error: "Result not found" }, { status: 404 });
        }

        const user = await withPrismaFallback("Google config",
            () => readUserByIdFromInsforge(session.user.id, "id,googleIndexingConfig"),
            () => prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, googleIndexingConfig: true },
            })
        );

        if (!user?.googleIndexingConfig) {
            return NextResponse.json(
                { error: "GOOGLE_CONFIG_MISSING", message: "Add your Google service account JSON in My profile first." },
                { status: 400 }
            );
        }

        const inspection = await inspectUrl(user.googleIndexingConfig, { url: record.url });

        if (!inspection.ok) {
            return NextResponse.json({ error: inspection.error }, { status: 400 });
        }

        const checkedAt = new Date();
        await prisma.indexingResult.updateMany({
            where: { id: record.id, userId: session.user.id },
            data: {
                indexStatus: JSON.stringify({
                    siteUrl: inspection.siteUrl,
                    result: inspection.result,
                    checkedAt: checkedAt.toISOString(),
                }),
                indexStatusCheckedAt: checkedAt,
            },
        });

        return NextResponse.json({
            checkedAt,
            siteUrl: inspection.siteUrl,
            result: inspection.result,
        });
    } catch (error) {
        const mapped = mapGoogleError(error);
        console.error("URL Inspection error:", mapped.message);
        return NextResponse.json({ error: mapped.message, httpStatus: mapped.httpStatus }, { status: 502 });
    }
}
