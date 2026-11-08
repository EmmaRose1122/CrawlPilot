import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { name, email, password, ref } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const trimmedName = String(name).trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
        }

        if (!trimmedName) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        if (String(password).length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(String(password), 10);
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const user = await prisma.user.create({
            data: {
                name: trimmedName,
                email: normalizedEmail,
                password: hashedPassword,
                role: "USER",
                referralCode,
                balance: ref ? 200 : 100, // Default signup bonus, more if referred
                referredBy: ref || null
            },
        });

        if (ref) {
            try {
                // Give 100 URL credits to the referrer
                await prisma.user.update({
                    where: { referralCode: ref },
                    data: { balance: { increment: 100 } }
                });
            } catch (err) {
                console.log("Referral update failed - code may be invalid");
            }
        }

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error("Signup error details:", error);
        return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
    }
}
