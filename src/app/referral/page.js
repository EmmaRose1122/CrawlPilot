'use client';
import { motion } from 'framer-motion';
import {
    Users,
    Share2,
    UserPlus,
    Zap,
    TrendingUp,
    Globe,
    ShieldCheck,
    Gift,
    ArrowRight
} from 'lucide-react';
import FAQAccordion from '@/components/FAQAccordion';
import CTABanner from '@/components/CTABanner';
import './referral.css';

const referralFaqs = [
    { question: "How many friends can I invite?", answer: "There is no limit! You can refer as many friends as you like and earn 100 URL credits for each successful conversion." },
    { question: "When do I get my credits?", answer: "Credits are added to your balance instantly as soon as your referral confirms their email and begins their first crawl." },
    { question: "Do referral credits expire?", answer: "No. Your earned URL credits remain in your account until you use them for indexing tasks." },
];

export default function ReferralPage() {
    return (
        <div className="referral-page">
            <section className="referral-hero section bg-alt">
                <div className="container text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="badge badge-primary mb-3">Community Rewards</div>
                        <h1 className="hero-title">Grow with <span>Crawl Pilot</span></h1>
                        <p className="hero-subtitle">Help your network achieve faster discovery and earn 100 URL credits for every successful referral.</p>
                        <div className="mt-4 flex-center gap-2">
                            <a href="/panel/referral" className="btn btn-primary btn-lg">Start Sharing <ArrowRight size={18} /></a>
                            <a href="#how-it-works" className="btn btn-outline btn-lg">View Logic</a>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section id="how-it-works" className="section">
                <div className="container">
                    <h2 className="section-title">The Referral Engine</h2>
                    <p className="section-subtitle">How we track and reward your contributions to the Crawl Pilot network.</p>

                    <div className="referral-steps grid grid-4">
                        {[
                            { title: "Get Link", icon: <UserPlus />, desc: "Access your unique referral key in the dashboard." },
                            { title: "Share Access", icon: <Share2 />, desc: "Send your key to friends via X, Slack, or email." },
                            { title: "They Activate", icon: <Users />, desc: "Your peer creates an account and starts a trial." },
                            { title: "Earn Fuel", icon: <Zap />, desc: "100 Credits are instantly injected into your pool." }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="referral-step-card panel-card"
                            >
                                <div className="step-icon-box">{step.icon}</div>
                                <div className="step-number">0{i + 1}</div>
                                <h3>{step.title}</h3>
                                <p className="text-sm text-muted">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section bg-alt">
                <div className="container">
                    <div className="grid grid-2 gap-4 align-center">
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <h2 className="text-left mb-3">Why Partner with Us?</h2>
                            <p className="mb-4">Crawl Pilot isn't just an indexing tool; it's a high-performance discovery engine built for modern SEO. When you share our platform, you're giving your network early access to the big data tools used by top performance agencies.</p>

                            <div className="benefit-row mb-3">
                                <ShieldCheck size={24} color="var(--primary)" />
                                <div>
                                    <h4 className="mb-1">Verified Rewards</h4>
                                    <p className="text-xs text-muted">A transparent tracking system ensures every successful referral is credited to your balance instantly.</p>
                                </div>
                            </div>
                            <div className="benefit-row">
                                <Globe size={24} color="var(--primary)" />
                                <div>
                                    <h4 className="mb-1">Global Impact</h4>
                                    <p className="text-xs text-muted">Help websites from any region accelerate their indexing in Google and Bing nodes.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="panel-card bg-primary text-white"
                            style={{ padding: '48px', border: 'none' }}
                        >
                            <Gift size={48} color="white" style={{ marginBottom: '24px', opacity: 0.5 }} />
                            <h3 style={{ color: 'white' }}>Unlimited Growth</h3>
                            <p className="mb-4" style={{ opacity: 0.8 }}>There is no cap on earning. Top community members have earned over 500,000 URL credits via our referral engine.</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 800 }}>100</span>
                                <span style={{ fontWeight: 700, opacity: 0.9 }}>Credits Per Referral</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 className="section-title">Common Questions</h2>
                    <FAQAccordion items={referralFaqs} />
                </div>
            </section>

            <CTABanner />
        </div>
    );
}
