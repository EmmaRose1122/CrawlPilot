import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const CATEGORIES = ['Indexing Issue', 'API & Integration', 'Billing & Payments', 'Technical Question'];

// GET: the user's support tickets.
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const tickets = await prisma.supportTicket.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error("Support list error:", error);
        return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }
}

// POST: open a support ticket (answered in-app by an admin).
export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json().catch(() => ({}));
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        const category = CATEGORIES.includes(body.category) ? body.category : 'General';

        if (message.length < 5) {
            return NextResponse.json({ error: "Please describe the issue (at least 5 characters)" }, { status: 400 });
        }
        if (message.length > 5000) {
            return NextResponse.json({ error: "Message is too long (max 5,000 characters)" }, { status: 400 });
        }

        const ticket = await prisma.supportTicket.create({
            data: { userId: session.user.id, category, message },
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error("Support ticket error:", error);
        return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }
}
