import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readTasksFromInsforge, withInsforgeFallback } from "@/lib/adminData";

export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Prisma-first: submissions/approvals are written to Prisma, so the
        // task list must read from the same source to stay consistent.
        const tasksWithStatus = await withInsforgeFallback("User tasks",
            async () => {
                const tasks = await prisma.task.findMany({
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' }
                });

                const submissions = await prisma.taskSubmission.findMany({
                    where: { userId: session.user.id }
                });

                return tasks.map(task => {
                    const sub = submissions.find(s => s.taskId === task.id);
                    return {
                        ...task,
                        status: sub ? sub.status : 'available',
                        submissionId: sub ? sub.id : null
                    };
                });
            },
            async () => {
                const tasks = await readTasksFromInsforge();
                return tasks
                    .filter(task => task.isActive)
                    .map(task => {
                        const sub = task.submissions?.find(s => s.userId === session.user.id);
                        return {
                            ...task,
                            status: sub ? sub.status : 'available',
                            submissionId: sub ? sub.id : null
                        };
                    });
            }
        );

        return NextResponse.json(tasksWithStatus);
    } catch (error) {
        console.error("Fetch tasks error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}
