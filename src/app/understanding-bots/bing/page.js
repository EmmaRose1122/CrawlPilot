'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Search,
    Zap,
    Globe,
    Bot,
    Activity,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import CTABanner from '@/components/CTABanner';

export default function BingBotPage() {
    return (
        <>
            <section style={{ padding: '100px 0 60px', background: 'linear-gradient(180deg, var(--bg-section) 0%, #FFFFFF 100%)', textAlign: 'center' }}>
                <div className="container">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <h1 style={{ fontSize: '3rem', letterSpacing: '-1.5px', marginBottom: '16px' }}>Getting Indexed by <span>BingBot</span></h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-body)', maxWidth: '750px', margin: '0 auto 32px' }}>
                            Why Bing indexing is the foundation for Microsoft, Yahoo, DuckDuckGo, and now ChatGPT.
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
                            <div style={{ color: '#00A1F1', marginBottom: '16px' }}><Search size={32} /></div>
                            <h3>What is BingBot?</h3>
                            <p className="text-sm">Microsoft's crawler that powers Bing Search and a massive ecosystem of 3rd party engines and AI integrations.</p>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} className="panel-card">
                            <div style={{ color: '#00A1F1', marginBottom: '16px' }}><Bot size={32} /></div>
                            <h3>The AI Factor</h3>
                            <p className="text-sm">BingBot's index is the primary data source for ChatGPT's 'Search with Bing' feature, making indexing here critical for AI visibility.</p>
                        </motion.div>
                    </div>

                    <article style={{ lineHeight: 1.8 }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>How <span>Crawl Pilot</span> Delivers BingBot</h2>
                        <p>BingBot is often slower to discover new pages than Google. Crawl Pilot solves this by actively signaling Microsoft's bot nodes. We leverage our high-trust network to route BingBot directly to your content, ensuring you're seen across the entire Microsoft ecosystem within hours, not weeks.</p>

                        <div style={{ background: 'var(--bg-light)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', margin: '40px 0' }}>
                            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={20} color="#00A1F1" /> Why BingBot Matters Now</h4>
                            <p className="text-sm">With the rise of Microsoft Copilot and AI-driven search, BingBot has become more essential than ever. If your content isn't in Bing's index, it's effectively invisible to millions of AI assistant users. We get your content into that index fast.</p>
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>A Wider Impact Across Search</h2>
                        <div className="grid grid-2 gap-4">
                            {[
                                { title: "Microsoft Bing", desc: "The world's #2 search engine" },
                                { title: "Yahoo Search", desc: "Powered by Bing architecture" },
                                { title: "DuckDuckGo", desc: "Uses Bing's crawler for discovery" },
                                { title: "ChatGPT / Copilot", desc: "Real-time AI research data source" }
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
