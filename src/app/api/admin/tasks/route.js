import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readTasksFromInsforge, withInsforgeFallback } from "@/lib/adminData";

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Prisma-first: submissions/approvals are written to Prisma, so the
        // admin view must read from the same source to stay consistent.
        const tasks = await withInsforgeFallback("Admin tasks",
            () => prisma.task.findMany({
                include: {
                    submissions: {
                        include: { user: { select: { name: true, email: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            readTasksFromInsforge
        );

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Admin fetch tasks error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, reward, type, link, isActive } = body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                reward: parseInt(reward) || 0,
                type: type || "general",
                link,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        return NextResponse.json({ success: true, task });
    } catch (error) {
        console.error("Admin create task error:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
