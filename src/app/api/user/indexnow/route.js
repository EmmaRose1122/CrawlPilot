import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generateIndexNowKey } from "@/lib/engines/indexnow";

// Returns the user's IndexNow key (creating one on first use) plus the domains
// they have submitted URLs for, so the UI can guide key-file hosting.
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { indexNowKey: true },
        });

        let key = user?.indexNowKey;

        if (!key) {
            key = generateIndexNowKey();
            await prisma.user.update({
                where: { id: session.user.id },
                data: { indexNowKey: key },
            });
        }

        const recentResults = await prisma.indexingResult.findMany({
            where: { userId: session.user.id },
            select: { url: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        const domains = [...new Set(recentResults.map((r) => {
            try {
                return new URL(r.url).hostname.toLowerCase();
            } catch {
                return null;
            }
        }).filter(Boolean))].slice(0, 10);

        return NextResponse.json({
            key,
            keyFileName: `${key}.txt`,
            keyLocationTemplate: `https://<your-domain>/${key}.txt`,
            domains,
        });
    } catch (error) {
        console.error("IndexNow key fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch IndexNow key" }, { status: 500 });
    }
}

// Rotates the key. The user must re-host the new key file before submitting.
export async function POST() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const key = generateIndexNowKey();
        await prisma.user.update({
            where: { id: session.user.id },
            data: { indexNowKey: key },
        });

        return NextResponse.json({
            key,
            keyFileName: `${key}.txt`,
            keyLocationTemplate: `https://<your-domain>/${key}.txt`,
        });
    } catch (error) {
        console.error("IndexNow key rotation error:", error);
        return NextResponse.json({ error: "Failed to rotate IndexNow key" }, { status: 500 });
    }
}
