'use client';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Eye, Trash2, Key, Info } from 'lucide-react';
import Link from 'next/link';

export default function PolicyLayout({ children, title, subtitle }) {
    return (
        <div className="policy-page">
            <section className="section bg-alt" style={{ padding: '100px 0 60px' }}>
                <div className="container text-center">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '16px' }}>
                            <ShieldCheck size={20} /> Legal Center
                        </div>
                        <h1 style={{ fontSize: '3rem', letterSpacing: '-1.5px', marginBottom: '16px' }}>{title}</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', maxWidth: '700px', margin: '0 auto' }}>{subtitle}</p>
                    </motion.div>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div className="card mb-4" style={{ borderLeft: '4px solid var(--primary)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Info size={24} color="var(--primary)" />
                            <p className="text-sm" style={{ margin: 0 }}>Last updated: November 2024. This policy governs how Crawl Pilot manages user telemetry and authentication data.</p>
                        </div>
                    </div>
                    {children}
                </div>
            </section>
        </div>
    );
}
