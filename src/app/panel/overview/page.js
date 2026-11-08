'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Search,
    BarChart3,
    Bot,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    Activity
} from 'lucide-react';

function formatPercent(value) {
    const numericValue = Number(value || 0);
    const prefix = numericValue > 0 ? '+' : '';
    return `${prefix}${numericValue.toFixed(2)}%`;
}

export default function OverviewPage() {
    const [stats, setStats] = useState({
        balance: 0,
        used: 0,
        accepted: 0,
        botSignals: 0,
        successRate: 0,
        urlChangePercent: 0,
        signalChangePercent: 0
    });
    const [bars, setBars] = useState([]);
    const [labels, setLabels] = useState([]);
    const [range, setRange] = useState('daily');
    const [recentResults, setRecentResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch comprehensive stats with range filter
                const resStats = await fetch(`/api/user/stats?range=${range}`);
                const statsData = await resStats.json();

                // Fetch recent results for the list
                const resResults = await fetch('/api/indexing/discover');
                const results = await resResults.json();

                if (statsData && !statsData.error) {
                    setStats({
                        balance: statsData.balance || 0,
                        used: statsData.totalUrls || 0,
                        accepted: statsData.accepted || 0,
                        botSignals: statsData.totalBotSignals || 0,
                        successRate: statsData.successRate || 0,
                        urlChangePercent: statsData.urlChangePercent || 0,
                        signalChangePercent: statsData.signalChangePercent || 0
                    });

                    // Parse stats for the chart
                    if (statsData.dailyStats) {
                        const maxVal = Math.max(...statsData.dailyStats.map(s => s.count), 1);
                        
                        const newBars = statsData.dailyStats.map(stat => ({
                            height: Math.max(5, (stat.count / maxVal) * 85),
                            count: stat.count,
                            primary: stat.primary,
                            ai: stat.ai,
                            label: stat.label
                        }));
                        
                        setBars(newBars);
                        setLabels(statsData.dailyStats.map(s => s.label));
                    }
                }

                if (Array.isArray(results)) {
                    setRecentResults(results.slice(0, 3));
                }
            } catch (err) {
                console.error("Failed to load overview data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();

        // Set up polling for real-time updates
        const interval = setInterval(() => {
            fetchStats();
        }, 5000);

        return () => clearInterval(interval);
    }, [range]);

    return (
        <>
            <div className="panel-page-header">
                <h1 className="panel-page-title">Overview</h1>
                <p className="panel-page-subtitle">Your submission activity at a glance.</p>
            </div>

            <div className="panel-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel-stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon"><Zap size={20} /></div>
                        <span className="stat-card-trend" style={{ background: 'var(--bg-light)', color: 'var(--text-light)' }}>Live Balance</span>
                    </div>
                    <div className="panel-stat-value">{isLoading ? '...' : stats.balance.toLocaleString()}</div>
                    <div className="panel-stat-label">URLs Remaining</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel-stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon"><Search size={20} /></div>
                        <span className="stat-card-trend" style={{ background: 'var(--bg-light)', color: 'var(--text-light)' }}>{formatPercent(stats.urlChangePercent)}</span>
                    </div>
                    <div className="panel-stat-value">{isLoading ? '...' : stats.used.toLocaleString()}</div>
                    <div className="panel-stat-label">URLs Used</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel-stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon"><CheckCircle2 size={20} /></div>
                        <span className="stat-card-trend" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>{stats.successRate}% Full success</span>
                    </div>
                    <div className="panel-stat-value">{isLoading ? '...' : stats.accepted.toLocaleString()}</div>
                    <div className="panel-stat-label">Accepted</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="panel-stat-card">
                    <div className="stat-card-header">
                        <div className="stat-card-icon"><Bot size={20} /></div>
                        <span className="stat-card-trend" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>Live Signal</span>
                    </div>
                    <div className="panel-stat-value">{isLoading ? '...' : stats.botSignals.toLocaleString()}</div>
                    <div className="panel-stat-label">Engine Requests</div>
                </motion.div>
            </div>

            <div className="panel-card chart-card">
                <div className="chart-header">
                    <div className="chart-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0 }}>Discovery Activity</h3>
                            <div className="filter-tabs" style={{ display: 'flex', background: 'var(--bg-light)', padding: '2px', borderRadius: '8px' }}>
                                {['daily', 'weekly', 'monthly'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => {
                                            setRange(f);
                                            setIsLoading(true);
                                        }}
                                        style={{
                                            padding: '4px 12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            borderRadius: '6px',
                                            background: range === f ? 'white' : 'transparent',
                                            color: range === f ? 'var(--primary)' : 'var(--text-light)',
                                            boxShadow: range === f ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-muted">Real engine requests recorded from your submissions.</p>
                    </div>
                    <div className="chart-legend">
                        <div className="legend-item"><span className="dot dot-primary"></span> Primary</div>
                    </div>
                </div>

                <div className="chart-placeholder">
                    <div className="chart-bars">
                        {bars.map((bar, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${bar.height}%` }}
                                transition={{ duration: 1, delay: i * 0.05 }}
                                className="chart-bar"
                                style={{
                                    background: bar.count > 0 
                                        ? `linear-gradient(to top, var(--primary) ${Math.max(20, (bar.primary/bar.count)*100)}%, var(--accent) ${Math.max(20, (bar.ai/bar.count)*100)}%)`
                                        : 'var(--border-color)',
                                    position: 'relative',
                                    borderRadius: '4px 4px 0 0',
                                    cursor: bar.count > 0 ? 'pointer' : 'default'
                                }}
                                title={`${bar.label}: ${bar.count} signals (${bar.primary} Primary, ${bar.ai} AI)`}
                            >
                                {bar.count > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        color: 'var(--primary)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {bar.count}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {/* If all 0, show a subtle prompt */}
                        {!isLoading && bars.every(b => b.count === 0) && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-xs text-muted" style={{ background: 'white', padding: '4px 12px', borderRadius: '12px' }}>Awaiting initial discovery data...</p>
                            </div>
                        )}
                    </div>
                    <div className="chart-labels" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        {labels.map((day, i) => (
                            <span key={i} style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-light)' }}>{day}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid grid-2 gap-4">
                <div className="panel-card" style={{ background: '#0a0b10', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Recent Submissions</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Source: stored results</span>
                                <span style={{ width: '4px', height: '4px', background: '#334155', borderRadius: '50%' }}></span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 700 }}>● AUTO SYNC: 5s</span>
                            </div>
                        </div>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>LIVE</span>
                        </div>
                    </div>

                    <div className="log-scroll" style={{ height: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.75rem', padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        {recentResults.length > 0 ? recentResults.map((res, i) => (
                            <div key={i} style={{ marginBottom: '8px', display: 'flex', gap: '10px' }}>
                                <span style={{ color: '#475569' }}>[{new Date(res.createdAt).toLocaleTimeString()}]</span>
                                <span style={{ color: res.status === 'failed' ? '#f87171' : res.status === 'partial' ? '#fbbf24' : 'var(--primary)' }}>{String(res.status || 'queued').toUpperCase()}</span>
                                <span style={{ color: '#94a3b8' }}>➔</span>
                                <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{res.url}</span>
                            </div>
                        )) : (
                            <div className="text-muted" style={{ textAlign: 'center', marginTop: '60px' }}>No submissions yet.</div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>{recentResults.length} recent submissions</span>
                    </div>
                </div>

                <div className="panel-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Latest Submissions</h3>
                        <Activity size={18} color="var(--primary)" />
                    </div>
                    {recentResults.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentResults.map((res, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-light)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ wordBreak: 'break-all', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                                        {res.url.substring(0, 40)}{res.url.length > 40 ? '...' : ''}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="text-xs text-muted">{new Date(res.createdAt).toLocaleDateString()}</span>
                                        <div className="badge" style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 8px',
                                            background: res.status === 'submitted' ? 'rgba(16,185,129,0.1)' : res.status === 'partial' ? 'rgba(245,158,11,0.12)' : res.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.12)',
                                            color: res.status === 'submitted' ? 'var(--success)' : res.status === 'partial' ? '#b45309' : res.status === 'failed' ? '#dc2626' : '#475569',
                                            fontWeight: 800
                                        }}>
                                            {String(res.status || 'queued').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
                            <Activity size={32} color="var(--border-color)" className="mb-2" />
                            <p className="text-sm text-muted">No activity recorded for this period.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
