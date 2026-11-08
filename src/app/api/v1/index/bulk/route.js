import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiAuth";
import { submitDiscovery } from "@/lib/submitDiscovery";

const MAX_BULK_URLS = 1000;

// POST /api/v1/index/bulk  { "urls": [...], "bots": [...] }
export async function POST(req) {
    const user = await authenticateApiRequest(req);
    if (!user) return NextResponse.json({ error: "Invalid or missing API token" }, { status: 401 });

    try {
        const body = await req.json();
        const urls = Array.isArray(body.urls) ? body.urls : [];
        const bots = Array.isArray(body.bots) && body.bots.length > 0 ? body.bots : ["google"];

        if (urls.length === 0) {
            return NextResponse.json({ error: "The 'urls' array is required" }, { status: 400 });
        }

        if (urls.length > MAX_BULK_URLS) {
            return NextResponse.json(
                { error: `Bulk submissions are limited to ${MAX_BULK_URLS} URLs per request` },
                { status: 400 }
            );
        }

        const result = await submitDiscovery({
            userId: user.id,
            rawUrls: urls,
            requestedBots: bots,
        });

        return NextResponse.json(result.payload, { status: result.status });
    } catch (error) {
        console.error("API v1 bulk index error:", error);
        return NextResponse.json({ error: "Bulk indexing request failed" }, { status: 500 });
    }
}
