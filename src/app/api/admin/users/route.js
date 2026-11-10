import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readUsersFromInsforge, withPrismaFallback } from "@/lib/adminData";

export async function GET() {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await withPrismaFallback("Admin users",
            readUsersFromInsforge,
            () => prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    plan: true,
                    allowedBots: true,
                    canAddLinks: true,
                    balance: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            })
        );

        return NextResponse.json(users);
    } catch (error) {
        console.error("Admin users error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId, amount } = await req.json();

        const parsedAmount = Number(amount);
        if (!userId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ error: "Invalid request: amount must be a positive number" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                balance: {
                    increment: Math.trunc(parsedAmount),
                },
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 });
    }
}
