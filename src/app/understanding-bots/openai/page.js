'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Bot,
    MessageSquare,
    Zap,
    Search,
    Cpu,
    Activity,
    LineChart
} from 'lucide-react';
import CTABanner from '@/components/CTABanner';

export default function OpenAIBotPage() {
    return (
        <>
            <section style={{ padding: '100px 0 60px', background: 'linear-gradient(135deg, rgba(16, 163, 127, 0.05) 0%, #FFFFFF 100%)', textAlign: 'center' }}>
                <div className="container">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <h1 style={{ fontSize: '3rem', letterSpacing: '-1.5px', marginBottom: '16px' }}>Mastering <span>GPTBot</span></h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-body)', maxWidth: '800px', margin: '0 auto 32px' }}>
                            How to ensure your content is indexed for real-time AI research and ChatGPT discovery.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <Link href="/authorize" className="btn btn-primary btn-lg">Start Free Trial</Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '900px' }}>
                    <div className="grid grid-2 gap-4 mb-4">
                        <motion.div whileHover={{ scale: 1.02 }} className="panel-card">
                            <div style={{ color: '#10A37F', marginBottom: '16px' }}><Cpu size={32} /></div>
                            <h3>What is GPTBot?</h3>
                            <p className="text-sm">OpenAI's crawler that fetches web data for training models and real-time browsing in ChatGPT.</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} className="panel-card">
                            <div style={{ color: '#10A37F', marginBottom: '16px' }}><MessageSquare size={32} /></div>
                            <h3>AI Discovery Engine</h3>
                            <p className="text-sm">When users ask ChatGPT for real-time data, GPTBot is the primary mechanism for finding and citing your content.</p>
                        </motion.div>
                    </div>

                    <article style={{ lineHeight: 1.8 }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Crawl Pilot's <span>AI-First</span> Indexing</h2>
                        <p>Traditional SEO is no longer enough. To be visible in 2026, you must be accessible to AI agents. Crawl Pilot uses AI-specific signaling to Ensure GPTBot discovers your newest content instantly. This is the difference between Being cited by ChatGPT or Being invisible to millions of AI users.</p>

                        <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: '32px', borderRadius: 'var(--radius-xl)', margin: '40px 0' }}>
                            <h4 style={{ marginBottom: '16px', color: '#10A37F', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} /> The New Search Paradigm</h4>
                            <p className="text-sm" style={{ color: '#2d3748' }}>Users are increasingly using ChatGPT as their primary research tool. Crawl Pilot actively routes GPTBot to your newly published content, ensuring your brand, products, and insights are available for AI citation within minutes of publication. Don't let your data become legacy before it's even discovered.</p>
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Why Fast Indexing for AI Matters</h2>
                        <div className="grid grid-2 gap-4">
                            {[
                                { title: "ChatGPT Citation", desc: "Be the source for real-time AI answers" },
                                { title: "Large Model Training", desc: "Get into the next update of GPT-X" },
                                { title: "Real-Time Browsing", desc: "Enable ChatGPT's Browsing tool to find you" },
                                { title: "AI Search Dominance", desc: "The future of SEO is AI discovery" }
                            ].map((item, i) => (
                                <div key={i} className="panel-card" style={{ background: 'white' }}>
                                    <h4 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>{item.title}</h4>
                                    <p className="text-sm" style={{ margin: 0 }}>{item.desc}</p>
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
