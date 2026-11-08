import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { auditUrls } from "@/lib/engines/siteAudit";

// POST /api/audit  { urls: string[] }  — real server-side page audit (1-20 URLs).
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json().catch(() => ({}));
        const result = await auditUrls(body.urls);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ results: result.results });
    } catch (error) {
        console.error("Site audit error:", error);
        return NextResponse.json({ error: "Audit failed" }, { status: 500 });
    }
}
