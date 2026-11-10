'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Copy,
    Check,
    Zap,
    Trophy,
    ArrowRight,
    Link as LinkIcon,
    Gift
} from 'lucide-react';

export default function ReferralPanelPage() {
    const [referralData, setReferralData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    
    // Get the base URL for the referral link
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const res = await fetch('/api/referral');
            if (res.ok) {
                const data = await res.json();
                setReferralData(data);
            }
        } catch (error) {
            console.error("Failed to fetch referral data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const link = referralData?.referralCode ? `${baseUrl}/signup?ref=${referralData.referralCode}` : '';

    const copyLink = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const referralStats = [
        { label: "Total Referrals", value: referralData?.totalReferrals || 0, icon: <Users size={20} />, delay: 0.1 },
        { label: "URLs Earned", value: `+${referralData?.urlsEarned || 0}`, icon: <Zap size={20} />, delay: 0.2 },
        { label: "Rewards Tier", value: referralData?.totalReferrals >= 10 ? "Gold" : referralData?.totalReferrals >= 5 ? "Silver" : "Bronze", icon: <Trophy size={20} />, delay: 0.3 }
    ];

    if (isLoading) {
        return (
            <div className="referral-dashboard" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <p>Loading referral program data...</p>
            </div>
        );
    }

    return (
        <div className="referral-dashboard">
            <div className="panel-page-header">
                <h1 className="panel-page-title">Referral Program</h1>
                <p className="panel-page-subtitle">Help others discover faster and earn URL credits.</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel-card mb-4"
                style={{ border: '2px dashed var(--primary-light)', background: 'rgba(99, 102, 241, 0.02)' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                        <LinkIcon size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Your Unique Referral Link</h3>
                        <p className="text-sm text-muted">Earn 100 URL credits and grant 100 bonus URLs to your friend when they sign up.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, background: 'var(--bg-light)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dark)', wordBreak: 'break-all' }}>
                        {link}
                    </div>
                    <button className="btn btn-primary" style={{ minWidth: '140px' }} onClick={copyLink}>
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                        {copied ? 'Copied' : 'Copy Link'}
                    </button>
                </div>
            </motion.div>

            <div className="panel-stat-grid w-full mb-4">
                {referralStats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: stat.delay }}
                        className="panel-stat-card"
                    >
                        <div className="stat-card-header">
                            <div className="stat-card-icon">{stat.icon}</div>
                        </div>
                        <div className="panel-stat-value">{stat.value}</div>
                        <div className="panel-stat-label">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                <div className="panel-card">
                    <h3 className="mb-3">How it works</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        {[
                            { title: "Share Your Link", desc: "Send your unique promotional link to friends or share it on your groups." },
                            { title: "They Join", desc: "When they create an account, they get an exclusive starting balance." },
                            { title: "Get Rewarded", desc: "100 URLs are instantly added to your balance for every successful signup." }
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                                <div style={{ minWidth: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 800, fontSize: '0.8rem' }}>{i + 1}</div>
                                <div>
                                    <h4 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>{step.title}</h4>
                                    <p className="text-xs text-muted" style={{ margin: 0 }}>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="panel-card">
                    <h3 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Gift size={20} color="var(--primary)" /> Recent Referrals</h3>
                    {referralData?.recentReferrals?.length > 0 ? (
                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {referralData.recentReferrals.map((ref, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                            {ref.name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ref.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(ref.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        +100 URLs
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed var(--border-color)', borderRadius: '12px', marginTop: '24px' }}>
                            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>You haven&apos;t referred anyone yet.</p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Share your link to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
