import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, canAddLinks } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { canAddLinks: canAddLinks }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating links permission:', error);
        return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
    }
}
