import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readUserByIdFromInsforge, updateUserInInsforge, withPrismaFallback } from "@/lib/adminData";

export async function GET() {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await withPrismaFallback("User profile",
            () => readUserByIdFromInsforge(session.user.id),
            () => prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    balance: true,
                    role: true,
                    image: true,
                    plan: true,
                    allowedBots: true,
                    canAddLinks: true,
                    googleIndexingConfig: true
                }
            })
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, googleIndexingConfig, currentPassword, newPassword } = body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (googleIndexingConfig !== undefined) updateData.googleIndexingConfig = googleIndexingConfig;

        // Password change: verify the current password before storing a new hash.
        if (newPassword !== undefined && String(newPassword).length > 0) {
            if (String(newPassword).length < 8) {
                return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
            }

            const existing = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { password: true }
            });

            if (!existing?.password) {
                return NextResponse.json(
                    { error: "This account signs in with Google and has no password" },
                    { status: 400 }
                );
            }

            const isCorrect = await bcrypt.compare(String(currentPassword || ""), existing.password);
            if (!isCorrect) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }

            updateData.password = await bcrypt.hash(String(newPassword), 10);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }

        const updatedUser = await withPrismaFallback("User profile update",
            () => updateUserInInsforge(session.user.id, updateData, "id,name,email,googleIndexingConfig"),
            () => prisma.user.update({
                where: { id: session.user.id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    googleIndexingConfig: true
                }
            })
        );

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
