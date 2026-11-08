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
    { question: "What is Crawl Pilot?", answer: "Crawl Pilot is an advanced bot signaling platform designed to accelerate search engine discovery. We route GoogleBot and BingBot directly to your content through our high-authority delivery network." },
    { question: "How does Crawl Pilot work?", answer: "We create high-priority discovery signals across the global bot edge network. When you submit a URL, we notify search engine crawlers in real-time, effectively moving your content to the front of the crawl queue." },
    { question: "Is it safe for my SEO?", answer: "Absolutely. Crawl Pilot uses 100% white-hat, compliant methods. We don't use 'black-hat' indexing tricks; we simply ensure your site is discovered by the official bots faster." },
];

const technicalFaqs = [
    { question: "How fast is discovery?", answer: "Typically, discovery happens within minutes. Indexing (the process of appearing in search) depends on your content quality and usually takes a few hours to a couple of days." },
    { question: "Can I use the API?", answer: "Yes, Crawl Pilot is built with an API-first architecture. You can integrate our discovery signaling into your CMS or automation workflows with ease." },
    { question: "Do you support all search engines?", answer: "We focus on the 'Big Three': Google, Bing, and GPTBot (OpenAI). Our signaling network ensures broad coverage across the modern search and AI ecosystem." },
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
