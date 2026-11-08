import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { submissionId, status, adminNote } = body; // status can be 'approved' or 'rejected'

        if (!submissionId || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: "Invalid status. Use 'approved' or 'rejected'." }, { status: 400 });
        }

        const submission = await prisma.taskSubmission.findUnique({
            where: { id: submissionId },
            include: { task: true }
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Atomic approval: reward is granted exactly once, only when this
        // request performs the pending -> approved transition.
        const updated = await prisma.$transaction(async (tx) => {
            if (status === 'approved') {
                const claimed = await tx.taskSubmission.updateMany({
                    where: { id: submissionId, status: 'pending' },
                    data: { status: 'approved', adminNote: adminNote || "" }
                });

                if (claimed.count > 0) {
                    await tx.user.update({
                        where: { id: submission.userId },
                        data: {
                            balance: { increment: submission.task.reward }
                        }
                    });
                }

                return tx.taskSubmission.findUnique({ where: { id: submissionId } });
            }

            return tx.taskSubmission.update({
                where: { id: submissionId },
                data: { status: 'rejected', adminNote: adminNote || "" }
            });
        });

        return NextResponse.json({ success: true, updated });
    } catch (error) {
        console.error("Admin approve task error:", error);
        return NextResponse.json({ error: "Failed to process approval" }, { status: 500 });
    }
}
