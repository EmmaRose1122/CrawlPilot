'use client';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Send,
    Mail,
    HelpCircle,
    Clock,
    ShieldCheck,
    LifeBuoy
} from 'lucide-react';

export default function SupportPanelPage() {
    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className="support-panel">
            <div className="panel-page-header">
                <h1 className="panel-page-title">Customer Success</h1>
                <p className="panel-page-subtitle">Expert technical support for your indexing and discovery needs.</p>
            </div>

            <div className="grid grid-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="panel-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <LifeBuoy size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Open Support Case</h2>
                    </div>

                    <div style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--warning-light)', borderRadius: '12px', border: '1px solid var(--warning)', fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 600 }}>
                        The online case form is not live yet — please email <a href="mailto:support@crawlpilot.io" style={{ color: 'var(--primary)', fontWeight: 700 }}>support@crawlpilot.io</a> and we&apos;ll reply within ~4 hours.
                    </div>

                    <form onSubmit={handleSubmit}>
                        <fieldset disabled style={{ border: 'none', margin: 0, padding: 0, opacity: 0.55 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Category</label>
                                    <select className="input" style={{ width: '100%', appearance: 'auto' }}>
                                        <option>Indexing Issue</option>
                                        <option>API & Integration</option>
                                        <option>Billing & Payments</option>
                                        <option>Technical Question</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Criticality</label>
                                    <select className="input" style={{ width: '100%', appearance: 'auto' }}>
                                        <option>Low - Questionable</option>
                                        <option>Medium - General</option>
                                        <option>High - Breaking Integration</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Issue Description</label>
                                    <textarea
                                        className="input"
                                        rows={6}
                                        placeholder="Describe the URL(s) and symptoms in detail..."
                                        style={{ width: '100%' }}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block">
                                    Submit Support Case <Send size={16} style={{ marginLeft: '8px' }} />
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </motion.div>

                <div>
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="panel-card mb-4"
                    >
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Support Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Clock size={18} color="var(--primary)" />
                                <div style={{ fontSize: '0.9rem' }}>
                                    <strong>Avg Response Time:</strong> <span className="text-muted">~4 Hours</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ShieldCheck size={18} color="var(--success)" />
                                <div style={{ fontSize: '0.9rem' }}>
                                    <strong>Engineer Status:</strong> <span className="text-success font-bold">Online</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Mail size={18} color="var(--primary)" />
                                <div style={{ fontSize: '0.9rem' }}>
                                    <strong>Contact Email:</strong> <span className="text-muted">support@crawlpilot.io</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="panel-card"
                        style={{ background: 'var(--bg-light)' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <HelpCircle size={24} color="var(--primary)" />
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Instant Help</h3>
                        </div>
                        <p className="text-xs text-muted mb-4">Check our knowledge base for instant answers to technical questions about GoogleBot and discovery signaling.</p>
                        <a href="/faq" target="_blank" className="btn btn-ghost btn-block btn-sm">
                            Visit Knowledge Base
                        </a>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
