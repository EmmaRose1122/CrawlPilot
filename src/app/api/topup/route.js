import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const MAX_AMOUNT = 1000000;
const MAX_PENDING = 5;

function normalizeAmount(value) {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
}

// GET: the user's top-up requests.
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const requests = await prisma.topupRequest.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Top-up list error:", error);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }
}

// POST: create a manual top-up request (admin approves and credits the balance).
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = (await req.json().catch(() => null)) || {};
        const amount = normalizeAmount(body.amount);

        if (!amount || amount > MAX_AMOUNT) {
            return NextResponse.json({ error: `Amount must be between 1 and ${MAX_AMOUNT.toLocaleString()} credits` }, { status: 400 });
        }

        if (body.note != null && (typeof body.note !== 'string' || body.note.length > 1000)) {
            return NextResponse.json({ error: 'Note must be at most 1,000 characters' }, { status: 400 });
        }
        const note = typeof body.note === 'string' ? body.note.trim() : null;

        // Concurrent creates queue on the user row lock, so the timeout must cover
        // the whole queue rather than a single transaction's work.
        const request = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
            const pendingCount = await tx.topupRequest.count({
                where: { userId: session.user.id, status: 'pending' },
            });
            if (pendingCount >= MAX_PENDING) return null;
            return tx.topupRequest.create({
                data: { userId: session.user.id, amount, note },
            });
        }, { maxWait: 15000, timeout: 15000 });

        if (!request) {
            return NextResponse.json({ error: "You already have several pending requests. Wait for an admin to review them." }, { status: 429 });
        }
        return NextResponse.json({ success: true, request });
    } catch (error) {
        console.error("Top-up request error:", error);
        return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }
}
