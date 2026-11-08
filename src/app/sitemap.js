import { prisma } from "@/lib/prisma";

export default async function sitemap() {
    const baseUrl = (process.env.NEXTAUTH_URL || process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://crawl-pilot.vercel.app').replace(/\/$/, '');
    const lastModified = new Date();

    const publicPages = [
        '', '/pricing', '/api-docs', '/faq', '/blog', '/referral', '/support',
        '/understanding-bots/google', '/understanding-bots/bing', '/understanding-bots/openai',
        '/privacy-policy', '/terms-of-service',
    ].map((page) => ({
        url: `${baseUrl}${page}`,
        lastModified,
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
    }));

    // Add dynamic blog posts when the database is reachable.
    let blogs = [];
    try {
        const posts = await prisma.blog.findMany({
            select: { slug: true, updatedAt: true }
        });
        blogs = posts.map(post => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updatedAt,
            changeFrequency: 'monthly',
            priority: 0.6,
        }));
    } catch (error) {
        console.warn("Skipping dynamic blog sitemap entries because the database is unavailable.");
    }

    return [...publicPages, ...blogs];
}
