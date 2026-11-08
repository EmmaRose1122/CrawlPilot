import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import CTABanner from '@/components/CTABanner';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const blog = await prisma.blog.findUnique({
        where: { slug }
    });

    if (!blog) return { title: 'Not Found' };

    return {
        title: blog.title,
        description: blog.excerpt,
        alternates: {
            canonical: `/blog/${slug}`,
        }
    };
}

export default async function BlogPostPage({ params }) {
    const { slug } = await params;
    const blog = await prisma.blog.findUnique({
        where: { slug },
        include: {
            author: { select: { name: true } }
        }
    });

    if (!blog) notFound();

    // Increment views (simple side effect in server component)
    try {
        await prisma.blog.update({
            where: { id: blog.id },
            data: { views: { increment: 1 } }
        });
    } catch (e) { }

    return (
        <>
            <section style={{ padding: '80px 0 40px', background: 'linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%)' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <Link href="/blog" style={{ fontSize: '0.9rem', marginBottom: '24px', display: 'inline-block', color: 'var(--primary)', fontWeight: 600 }}>← Back to Blog</Link>
                    <div style={{ marginBottom: '12px' }}>
                        <span style={{ padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>{blog.category}</span>
                    </div>
                    <h1 style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: '20px' }}>{blog.title}</h1>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-light)', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{blog.author?.name || 'Crawl Pilot Team'}</span>
                        <span>•</span>
                        <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{Math.ceil(blog.content.length / 500) || 5} min read</span>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <article style={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                        <div dangerouslySetInnerHTML={{ __html: blog.content }} />

                        <div className="card" style={{ marginTop: '40px', borderColor: 'var(--primary-light)', borderWidth: '2px', background: 'var(--bg-light)', borderRadius: '24px', padding: '32px' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '1.2rem' }}>💡 Pro Tip</h4>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>Use Crawl Pilot to accelerate the indexing of your new pages and backlinks. Our service ensures search engines discover your content quickly, giving you a competitive edge.</p>
                            <div style={{ marginTop: '24px' }}>
                                <Link href="/panel/indexing" className="btn btn-primary">Start Indexing Now</Link>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '60px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
                            <Link href="/blog" className="btn btn-outline">Explore More Articles</Link>
                        </div>
                    </article>
                </div>
            </section>

            <CTABanner />
        </>
    );
}
