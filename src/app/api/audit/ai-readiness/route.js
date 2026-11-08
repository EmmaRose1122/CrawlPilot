import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { checkAiReadiness } from "@/lib/engines/siteAudit";

// POST /api/audit/ai-readiness  { domain }  — real robots.txt analysis for AI crawlers.
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json().catch(() => ({}));
        const result = await checkAiReadiness(body.domain);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("AI readiness error:", error);
        return NextResponse.json({ error: "Readiness check failed" }, { status: 500 });
    }
}
