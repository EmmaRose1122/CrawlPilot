'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Search,
    ArrowRight,
    Calendar,
    Clock,
    User,
    ChevronRight,
    Sparkles,
    FileQuestion
} from 'lucide-react';
import CTABanner from '@/components/CTABanner';
import './blog.css';

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await fetch('/api/admin/blogs');
                const data = await res.json();
                if (Array.isArray(data)) setPosts(data);
            } catch (error) {
                console.error('Failed to items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="blog-page">
            <section className="blog-hero section">
                <div className="container text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="hero-title">Engineering <span>Insights</span></h1>
                        <p className="hero-subtitle">The latest strategies in SEO, indexing, and digital marketing from the Crawl Pilot engineering team.</p>
                    </motion.div>
                </div>
            </section>

            <section className="blog-content section">
                <div className="container">
                    {posts.length > 0 ? (
                        <div className="blog-grid">
                            {posts.map((post, i) => (
                                <motion.article
                                    key={post.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="blog-card panel-card"
                                >
                                    <div className="blog-card-thumb">
                                        <div className="blog-category-badge">{post.category}</div>
                                        <Sparkles size={48} color="var(--primary-light)" style={{ opacity: 0.3 }} />
                                    </div>
                                    <div className="blog-card-body">
                                        <div className="blog-meta">
                                            <span><Calendar size={14} /> {post.date || 'Just now'}</span>
                                            <span><Clock size={14} /> 5 min read</span>
                                        </div>
                                        <h3>{post.title}</h3>
                                        <p>{post.excerpt}</p>
                                        <Link href={`/blog/${post.slug}`} className="blog-read-more">
                                            Read Article <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    ) : !isLoading && (
                        <div className="text-center" style={{ padding: '80px 20px', background: 'var(--bg-light)', borderRadius: '24px' }}>
                            <FileQuestion size={64} color="var(--border-color)" style={{ margin: '0 auto 20px' }} />
                            <h2 style={{ marginBottom: '12px' }}>No Published Articles</h2>
                            <p className="text-muted">New engineering stories will be published here once added via the Admin Dashboard.</p>
                            <Link href="/admin/blogs" className="btn btn-primary mt-4">Manage Blogs</Link>
                        </div>
                    )}

                    {posts.length > 0 && (
                        <div className="blog-pagination">
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <span className="page-dots">...</span>
                            <button className="page-btn">Next <ChevronRight size={16} /></button>
                        </div>
                    )}
                </div>
            </section>

            <CTABanner />
        </div>
    );
}
