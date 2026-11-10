import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// GET: top-up requests with user info (admin).
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const requests = await prisma.topupRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { id: true, name: true, email: true, balance: true } } },
        });

        return NextResponse.json({ requests });
    } catch (error) {
        console.error("Admin topup list error:", error);
        return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }
}

// POST: approve (credits the balance exactly once) or reject a request.
export async function POST(req) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json().catch(() => null)) || {};
        const { id, action, adminNote } = body;

        if (typeof id !== 'string' || !id.trim() || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: "id and action (approve|reject) are required" }, { status: 400 });
        }

        const request = await prisma.topupRequest.findUnique({ where: { id } });
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (adminNote != null && (typeof adminNote !== 'string' || adminNote.length > 1000)) {
            return NextResponse.json({ error: 'Admin note must be at most 1,000 characters' }, { status: 400 });
        }
        const note = typeof adminNote === 'string' ? adminNote.trim() : null;

        if (action === 'approve') {
            const result = await prisma.$transaction(async (tx) => {
                const claimed = await tx.topupRequest.updateMany({
                    where: { id, status: 'pending' },
                    data: { status: 'approved', adminNote: note, reviewedAt: new Date() },
                });

                if (claimed.count === 0) {
                    return { credited: false, alreadyProcessed: true };
                }

                await tx.user.update({
                    where: { id: request.userId },
                    data: { balance: { increment: request.amount } },
                });

                return { credited: true, alreadyProcessed: false };
            });

            if (result.alreadyProcessed) {
                return NextResponse.json({ error: "Request already processed" }, { status: 400 });
            }

            return NextResponse.json({ success: true, credited: result.credited });
        }

        const rejected = await prisma.topupRequest.updateMany({
            where: { id, status: 'pending' },
            data: { status: 'rejected', adminNote: note, reviewedAt: new Date() },
        });

        if (rejected.count === 0) {
            return NextResponse.json({ error: "Request already processed" }, { status: 400 });
        }

        return NextResponse.json({ success: true, credited: false });
    } catch (error) {
        console.error("Admin topup action error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
