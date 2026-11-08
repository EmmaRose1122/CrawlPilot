import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readBlogsFromInsforge, withPrismaFallback } from "@/lib/adminData";

export async function GET() {
    try {
        const blogs = await withPrismaFallback("Admin blogs",
            readBlogsFromInsforge,
            () => prisma.blog.findMany({
                include: {
                    author: {
                        select: { name: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            })
        );
        return NextResponse.json(blogs);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, slug, category, excerpt, content } = await req.json();

        const blog = await prisma.blog.create({
            data: {
                title,
                slug,
                category,
                excerpt,
                content,
                authorId: session.user.id
            }
        });

        return NextResponse.json(blog);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
    }
}

export async function PUT(req) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, title, slug, category, excerpt, content } = await req.json();

        const blog = await prisma.blog.update({
            where: { id },
            data: {
                title,
                slug,
                category,
                excerpt,
                content
            }
        });

        return NextResponse.json(blog);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
    }
}

export async function DELETE(req) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        await prisma.blog.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
    }
}
