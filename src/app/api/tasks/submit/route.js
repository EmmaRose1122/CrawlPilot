import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { taskId, proofText, proofImage } = body;

        if (!taskId) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        if (!proofText && !proofImage) return NextResponse.json({ error: "Proof is required" }, { status: 400 });

        // Check if already submitted
        const existing = await prisma.taskSubmission.findFirst({
            where: { taskId, userId: session.user.id }
        });

        if (existing) {
            return NextResponse.json({ error: "You have already submitted proof for this task" }, { status: 400 });
        }

        const submission = await prisma.taskSubmission.create({
            data: {
                taskId,
                userId: session.user.id,
                proofText,
                proofImage,
                status: 'pending'
            }
        });

        return NextResponse.json({ success: true, submission });
    } catch (error) {
        console.error("Task submission error:", error);
        return NextResponse.json({ error: "Failed to submit task proof" }, { status: 500 });
    }
}
