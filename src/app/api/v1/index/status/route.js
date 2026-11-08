import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiAuth";
import { validatePublicHttpUrl } from "@/lib/urlSafety";

// GET /api/v1/index/status?url=...
export async function GET(req) {
    const user = await authenticateApiRequest(req);
    if (!user) return NextResponse.json({ error: "Invalid or missing API token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "The 'url' query parameter is required" }, { status: 400 });
    }

    try {
        const check = await validatePublicHttpUrl(url);
        if (!check.ok) {
            return NextResponse.json({ error: `URL is not allowed: ${check.reason}` }, { status: 400 });
        }

        const record = await prisma.indexingResult.findFirst({
            where: { userId: user.id, url: check.url },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                url: true,
                status: true,
                signalingResults: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!record) {
            return NextResponse.json({ error: "No indexing record found for this URL" }, { status: 404 });
        }

        let signaling = null;
        try {
            signaling = record.signalingResults ? JSON.parse(record.signalingResults) : null;
        } catch {
            signaling = null;
        }

        return NextResponse.json({
            url: record.url,
            status: record.status,
            signaling,
            submittedAt: record.createdAt,
            lastUpdated: record.updatedAt,
        });
    } catch (error) {
        console.error("API v1 status error:", error);
        return NextResponse.json({ error: "Status lookup failed" }, { status: 500 });
    }
}
