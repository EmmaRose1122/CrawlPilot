import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generateApiToken, hashToken } from "@/lib/apiAuth";

// Returns the user's API token, creating one on first use.
// The raw token is only returned once at creation — afterwards only a hash
// is stored in the DB.
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const existing = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { apiToken: true },
        });

        if (existing?.apiToken) {
            return NextResponse.json({ hasToken: true, masked: maskToken(existing.apiToken) });
        }

        const raw = generateApiToken();
        await prisma.user.update({
            where: { id: session.user.id },
            data: { apiToken: hashToken(raw) },
        });

        return NextResponse.json({ hasToken: true, token: raw, masked: maskToken(raw) });
    } catch (error) {
        console.error("API token fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch API token" }, { status: 500 });
    }
}

// Rotates the token: old one stops working immediately.
export async function POST() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const raw = generateApiToken();
        await prisma.user.update({
            where: { id: session.user.id },
            data: { apiToken: hashToken(raw) },
        });

        return NextResponse.json({ token: raw, masked: maskToken(raw) });
    } catch (error) {
        console.error("API token rotation error:", error);
        return NextResponse.json({ error: "Failed to rotate API token" }, { status: 500 });
    }
}

function maskToken(token) {
    return token.length > 10 ? `${token.slice(0, 6)}...${token.slice(-4)}` : "••••";
}
