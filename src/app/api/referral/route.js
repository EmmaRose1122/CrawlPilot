import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        let user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referralCode: true }
        });

        if (!user.referralCode) {
            const code = crypto.randomBytes(4).toString('hex');
            user = await prisma.user.update({
                where: { id: session.user.id },
                data: { referralCode: code },
                select: { referralCode: true }
            });
        }

        // Fetch referred users
        const referredUsers = await prisma.user.findMany({
            where: { referredBy: user.referralCode },
            select: { id: true, name: true, createdAt: true }
        });

        return NextResponse.json({
            referralCode: user.referralCode,
            totalReferrals: referredUsers.length,
            urlsEarned: referredUsers.length * 100, // Fixed 100 per referral
            recentReferrals: referredUsers.slice(0, 10).map(u => ({ name: u.name, date: u.createdAt }))
        });

    } catch (error) {
        console.error("Referral fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
    }
}
