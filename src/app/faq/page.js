'use client';
import { motion } from 'framer-motion';
import {
    HelpCircle,
    Search,
    Zap,
    ShieldCheck,
    Bot,
    Terminal,
    Activity,
    ChevronRight
} from 'lucide-react';
import FAQAccordion from '@/components/FAQAccordion';
import CTABanner from '@/components/CTABanner';

const generalFaqs = [
    { question: "What is Crawl Pilot?", answer: "Crawl Pilot is a URL submission and tracking platform. You submit URLs, we send them through the official submission interfaces engines actually provide (IndexNow for Bing and partners, the Google Indexing API for eligible content, and sitemap submission), and we record every engine response per URL." },
    { question: "How does Crawl Pilot work?", answer: "When you submit URLs, each one is queued, sent through the supported engine interfaces, and given a real status — submitted, partial, failed or queued — based on the actual HTTP/API responses. Nothing is simulated; if an engine rejects a URL, you see why." },
    { question: "Is it safe for my SEO?", answer: "Yes. We only use documented, white-hat submission interfaces and standard HTTP requests. We do not send fake crawler traffic, and we never claim guaranteed indexing — the search engine always decides what to index." },
];

const technicalFaqs = [
    { question: "How fast is discovery?", answer: "Submission requests are sent within seconds. How quickly an engine crawls and indexes afterwards depends on the engine, your content and your site's health — no third party can guarantee that timing." },
    { question: "Can I use the API?", answer: "Yes. Every account gets an API token and can submit URLs programmatically through /api/v1 (single, bulk up to 1,000 URLs, balance and per-URL status)." },
    { question: "Which engines do you support?", answer: "Google and Bing — the engines that expose submission interfaces (Bing's IndexNow also feeds participating engines such as Yandex). Engines without a public submission API are not offered, because we do not claim signals we cannot send." },
];

export default function FAQPage() {
    return (
        <div className="faq-page">
            <section className="section bg-alt" style={{ padding: '100px 0 60px' }}>
                <div className="container text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '16px' }}>
                            <HelpCircle size={20} /> Support Center
                        </div>
                        <h1 style={{ fontSize: '3rem', letterSpacing: '-1.5px', marginBottom: '16px' }}>Common <span>Questions</span></h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', maxWidth: '700px', margin: '0 auto' }}>
                            Everything you need to know about modern indexing and discovery.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container" style={{ maxWidth: '900px', padding: '80px 0' }}>
                <div className="faq-section mb-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <Bot size={28} color="var(--primary)" />
                        <h2 style={{ margin: 0 }}>General Optimization</h2>
                    </div>
                    <FAQAccordion items={generalFaqs} />
                </div>

                <div className="faq-section" style={{ marginTop: '80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <Terminal size={28} color="var(--primary)" />
                        <h2 style={{ margin: 0 }}>Technical discovery</h2>
                    </div>
                    <FAQAccordion items={technicalFaqs} />
                </div>

                <div className="panel-card bg-primary" style={{ marginTop: '100px', color: 'white', padding: '48px', border: 'none', textAlign: 'center' }}>
                    <Activity size={48} color="white" style={{ marginBottom: '24px', opacity: 0.5 }} />
                    <h2 style={{ color: 'white' }}>Still have questions?</h2>
                    <p className="mb-4" style={{ opacity: 0.8 }}>Our engineering team is ready to help you optimize your crawl budget and discovery strategy.</p>
                    <a href="/support" className="btn btn-white btn-lg">Contact Technical Support</a>
                </div>
            </div>

            <CTABanner />
        </div>
    );
}
