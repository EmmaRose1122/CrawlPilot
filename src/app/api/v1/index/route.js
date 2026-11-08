import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiAuth";
import { submitDiscovery } from "@/lib/submitDiscovery";

// GET /api/v1/index?url=...&bots=google,bing
export async function GET(req) {
    const user = await authenticateApiRequest(req);
    if (!user) return NextResponse.json({ error: "Invalid or missing API token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const botsParam = searchParams.get("bots") || "google";

    if (!url) {
        return NextResponse.json({ error: "The 'url' query parameter is required" }, { status: 400 });
    }

    const bots = botsParam.split(",").map((b) => b.trim()).filter(Boolean);

    try {
        const result = await submitDiscovery({
            userId: user.id,
            rawUrls: [url],
            requestedBots: bots,
        });
        return NextResponse.json(result.payload, { status: result.status });
    } catch (error) {
        console.error("API v1 index error:", error);
        return NextResponse.json({ error: "Indexing request failed" }, { status: 500 });
    }
}
