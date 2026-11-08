'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap,
    Check,
    ArrowRight,
    Shield,
    BarChart3,
    Search,
    History,
    Info
} from 'lucide-react';
import CTABanner from '@/components/CTABanner';
import './pricing.css';

const plans = [
    {
        name: "100 URLs",
        label: "Start FREE Trial",
        sublabel: "Perfect for testing",
        price: "Free",
        features: ["100 URLs per submission", "Crawl log tracking", "Real-Time Monitoring", "API access", "Standard support"],
        btn: "Get Started",
        href: "/authorize",
        featured: false,
        color: "var(--text-light)"
    },
    {
        name: "10,000 URLs",
        label: "SaaS Professional",
        sublabel: "Special 15% Discount",
        price: "$15",
        oldPrice: "$20",
        features: ["10,000 URLs total", "One-Time Purchase", "Google + Bing Submission", "Submission status tracking", "Priority Monitoring", "API access", "Priority Support"],
        btn: "Scale Now",
        href: "/authorize",
        featured: true,
        badge: "Most Popular",
        color: "var(--primary)"
    },
    {
        name: "100,000 URLs",
        label: "Agency Scale",
        sublabel: "Heavy Volume (25% off)",
        price: "$25",
        oldPrice: "$40",
        features: ["100,000 URLs total", "One-Time Purchase", "Full API Integration", "Advanced crawl logs", "Real-Time Monitoring", "Dedicated Support"],
        btn: "Get Agency Plan",
        href: "/authorize",
        featured: false,
        color: "var(--accent)"
    },
    {
        name: "1,000,000 URLs",
        label: "Enterprise Prime",
        sublabel: "Volume Leader (50% off)",
        price: "$35",
        oldPrice: "$60",
        features: ["1,000,000 URLs total", "Everything in Agency", "Custom Submission Limits", "API Rate Limit Plus", "Direct Account Manager"],
        btn: "Go Enterprise",
        href: "/authorize",
        featured: false,
        badge: "Best Value",
        color: "var(--text-dark)"
    },
];

export default function PricingPage() {
    return (
        <div className="pricing-page">
            <section className="pricing-hero section">
                <div className="container text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="hero-title">Simple <span>Transparent</span> Pricing</h1>
                        <p className="hero-subtitle">No monthly subscriptions. No hidden fees. Just pay for the URLs you need to index.</p>
                    </motion.div>
                </div>
            </section>

            <section className="pricing-grid-section section">
                <div className="container">
                    <div className="pricing-grid">
                        {plans.map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`pricing-card ${p.featured ? 'featured' : ''}`}
                            >
                                {p.badge && <div className="pricing-badge">{p.badge}</div>}
                                <div className="card-header">
                                    <h3 className="plan-name">{p.name}</h3>
                                    <p className="plan-label">{p.label}</p>
                                </div>

                                <div className="price-box">
                                    <span className="currency">$</span>
                                    <span className="amount">{p.price.replace('$', '')}</span>
                                    {p.oldPrice && <span className="old-price"><s>{p.oldPrice}</s></span>}
                                </div>
                                <p className="sublabel">{p.sublabel}</p>

                                <ul className="plan-features">
                                    {p.features.map((f, j) => (
                                        <li key={j}><Check size={16} className="check-icon" /> {f}</li>
                                    ))}
                                </ul>

                                <Link href={p.href} className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} btn-block btn-lg`}>
                                    {p.btn} <Zap size={16} style={{ marginLeft: '8px' }} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="included-section section bg-alt">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Included in <span>Every</span> Plan</h2>
                        <p>Enterprise features available to everyone, including free trials.</p>
                    </div>

                    <div className="features-sub-grid">
                        {[
                            { icon: <Search size={24} />, title: "API Submission", desc: "Send URLs through IndexNow and the Google Indexing API, with the real engine response stored per URL." },
                            { icon: <BarChart3 size={24} />, title: "Submission Analytics", desc: "Track per-URL acceptance status, HTTP responses and timestamps from one dashboard." },
                            { icon: <Shield size={24} />, title: "Safety First", desc: "100% white-hat methods compliant with search engine guidelines." },
                            { icon: <History size={24} />, title: "Submission History", desc: "Keep track of every URL submitted and its indexing progress over time." }
                        ].map((f, i) => (
                            <div key={i} className="feature-item">
                                <div className="feature-item-icon">{f.icon}</div>
                                <div>
                                    <h4>{f.title}</h4>
                                    <p>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <CTABanner
                title="Need a Custom Discovery Solution?"
                subtitle="Contact our architecture team for high-volume enterprise needs or custom API integrations."
                btnText="Contact Sales"
                btnHref="/support"
            />
        </div>
    );
}
