import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { verifyIndexNowKey } from "@/lib/engines/indexnow";

function normalizeHost(input) {
    let value = String(input || '').trim().toLowerCase();
    if (!value) return null;
    if (!/^https?:\/\//.test(value)) value = `https://${value}`;
    try {
        return new URL(value).hostname.toLowerCase();
    } catch {
        return null;
    }
}

// POST /api/user/indexnow/verify  { domain: "example.com" }
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json().catch(() => ({}));
        const host = normalizeHost(body.domain);

        if (!host) {
            return NextResponse.json({ error: "A valid domain is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { indexNowKey: true },
        });

        if (!user?.indexNowKey) {
            return NextResponse.json({ error: "Generate an IndexNow key first" }, { status: 400 });
        }

        const result = await verifyIndexNowKey(host, user.indexNowKey);

        return NextResponse.json({
            domain: host,
            verified: result.ok,
            keyLocation: result.keyLocation,
            httpStatus: result.httpStatus,
            reason: result.reason,
        });
    } catch (error) {
        console.error("IndexNow verify error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}
