import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [topups, tickets, users, submissions, pendingTopups, openTickets, approved] = await Promise.all([
            prisma.topupRequest.findMany({
                orderBy: { updatedAt: 'desc' }, take: 20,
                select: { id: true, amount: true, status: true, updatedAt: true, user: { select: { email: true } } },
            }),
            prisma.supportTicket.findMany({
                orderBy: { updatedAt: 'desc' }, take: 20,
                select: { id: true, category: true, status: true, updatedAt: true, user: { select: { email: true } } },
            }),
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' }, take: 20,
                select: { id: true, email: true, createdAt: true },
            }),
            prisma.indexingResult.findMany({
                orderBy: { updatedAt: 'desc' }, take: 20,
                select: { id: true, url: true, status: true, updatedAt: true },
            }),
            prisma.topupRequest.count({ where: { status: 'pending' } }),
            prisma.supportTicket.count({ where: { status: 'open' } }),
            prisma.topupRequest.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
        ]);

        const activity = [
            ...topups.map((item) => ({
                id: `topup-${item.id}`, title: `Top-up ${item.status}`,
                detail: `${item.user.email} · ${item.amount.toLocaleString()} credits`,
                at: item.updatedAt, href: '/admin/requests',
            })),
            ...tickets.map((item) => ({
                id: `support-${item.id}`, title: `Support ticket ${item.status}`,
                detail: `${item.user.email} · ${item.category}`,
                at: item.updatedAt, href: '/admin/requests',
            })),
            ...users.map((item) => ({
                id: `user-${item.id}`, title: 'Account created', detail: item.email,
                at: item.createdAt, href: '/admin/users',
            })),
            ...submissions.map((item) => ({
                id: `submission-${item.id}`, title: `Submission status: ${item.status}`,
                detail: item.url, at: item.updatedAt, href: null,
            })),
        ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 20);

        return NextResponse.json({
            activity,
            summary: { pendingTopups, openTickets, approvedCredits: approved._sum.amount || 0 },
        });
    } catch (error) {
        console.error('Admin activity error:', error);
        return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
    }
}
