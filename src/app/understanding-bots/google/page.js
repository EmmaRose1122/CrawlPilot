'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Globe,
    Search,
    Zap,
    Activity,
    LineChart,
    ShieldCheck,
    ExternalLink
} from 'lucide-react';
import CTABanner from '@/components/CTABanner';

export default function GoogleBotPage() {
    return (
        <>
            <section style={{ padding: '100px 0 60px', background: 'linear-gradient(180deg, var(--primary-light) 0%, #FFFFFF 100%)', textAlign: 'center' }}>
                <div className="container">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '3rem', letterSpacing: '-1.5px', marginBottom: '16px' }}>Mastering <span>GoogleBot</span></h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-body)', maxWidth: '700px', margin: '0 auto 32px' }}>
                            Why content discovery is the vital first step toward search engine dominance.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <Link href="/authorize" className="btn btn-primary btn-lg">Start Free Trial</Link>
                            <Link href="/pricing" className="btn btn-outline btn-lg">View Plans</Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '900px' }}>
                    <div className="grid grid-2 gap-4 mb-4">
                        <motion.div whileHover={{ scale: 1.02 }} className="panel-card">
                            <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Activity size={32} /></div>
                            <h3>What is GoogleBot?</h3>
                            <p className="text-sm">Google's automated library crawler that indexes billions of pages across the web to build the Google Search catalog.</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} className="panel-card">
                            <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Zap size={32} /></div>
                            <h3>How Crawl Pilot Works</h3>
                            <p className="text-sm">We signal Google's edge delivery nodes to discover your URLs instantly, bypassing the 'dormant' queue of new content.</p>
                        </motion.div>
                    </div>

                    <article style={{ lineHeight: 1.8 }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>The <span>Crawl Pulse</span> Advantage</h2>
                        <p>Traditional SEO relies on secondary discovery—waiting for GoogleBot to find your backlinks or internal links organically. Crawl Pilot flips the script. Our infrastructure actively delivers GoogleBot to your pages by creating immediate, high-authority signals that trigger discovery.</p>

                        <div style={{ background: 'var(--bg-light)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', margin: '40px 0' }}>
                            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><LineChart size={20} color="var(--primary)" /> Why Indexing is NOT Ranking</h4>
                            <p className="text-sm">It's a common misconception: being crawled is the invitation; being indexed is the seat at the table. Once Crawl Pilot delivers GoogleBot, the bot ingests your content. Google's algorithms then decide where you rank based on quality and relevance. We ensure you're at the table, fast.</p>
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Who Benefits from Instant Indexing?</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {[
                                "News Publishers",
                                "E-commerce Catalogs",
                                "SEO Agencies",
                                "Affiliate Marketers",
                                "New Domain Startups",
                                "Backlink Portfolio Managers"
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                    <ShieldCheck size={18} color="var(--primary)" />
                                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                </div>
            </section>

            <CTABanner />
        </>
    );
}
