import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// GET: support tickets with user info (admin).
export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tickets = await prisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("Admin support list error:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// POST: reply to (or close) a ticket.
export async function POST(req) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = (await req.json().catch(() => null)) || {};
        const { id, action, reply } = body;

        if (typeof id !== 'string' || !id.trim() || !['reply', 'close'].includes(action)) {
            return NextResponse.json({ error: "id and action (reply|close) are required" }, { status: 400 });
        }

        if (action === 'reply') {
            const text = typeof reply === 'string' ? reply.trim() : '';
            if (text.length < 2 || text.length > 5000) {
                return NextResponse.json({ error: "Reply must be between 2 and 5,000 characters" }, { status: 400 });
            }

            const updated = await prisma.supportTicket.updateMany({
                where: { id, status: { in: ['open', 'answered'] } },
                data: { status: 'answered', adminReply: text, answeredAt: new Date() },
            });

            if (updated.count === 0) {
                return NextResponse.json({ error: "Ticket not found or closed" }, { status: 400 });
            }

            return NextResponse.json({ success: true });
        }

        const closed = await prisma.supportTicket.updateMany({
            where: { id, status: { in: ['open', 'answered'] } },
            data: { status: 'closed' },
        });

        if (closed.count === 0) {
            return NextResponse.json({ error: "Ticket not found or already closed" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin support action error:", error);
        return NextResponse.json({ error: "Failed to process ticket" }, { status: 500 });
    }
}
