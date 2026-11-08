import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
    const session = await auth();

    // Check if user is admin
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { userId, allowedBots } = await req.json();

        if (!userId || !Array.isArray(allowedBots)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        // Update user's allowed bots
        await prisma.user.update({
            where: { id: userId },
            data: {
                allowedBots: JSON.stringify(allowedBots)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update bot access:", error);
        return NextResponse.json({ error: "Failed to update bot access" }, { status: 500 });
    }
}
