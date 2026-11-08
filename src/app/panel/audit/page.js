'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileSearch,
    Play,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Globe,
    Bot,
    Link2,
    Clock,
    ShieldCheck
} from 'lucide-react';

function StatusChip({ status }) {
    const ok = status && status >= 200 && status < 300;
    const redirect = status && status >= 300 && status < 400;
    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.7rem',
            fontWeight: 800,
            background: ok ? '#dcfce7' : redirect ? '#fef3c7' : '#fee2e2',
            color: ok ? '#166534' : redirect ? '#92400e' : '#991b1b',
        }}>
            {status || 'ERR'}
        </span>
    );
}

function CheckRow({ label, value, state }) {
    const color = state === 'good' ? '#166534' : state === 'bad' ? '#991b1b' : state === 'warn' ? '#92400e' : 'var(--text-body)';
    const bg = state === 'good' ? '#dcfce7' : state === 'bad' ? '#fee2e2' : state === 'warn' ? '#fef3c7' : 'var(--bg-light)';
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', padding: '8px 12px', background: bg, borderRadius: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color, minWidth: '120px' }}>{label}</span>
            <span style={{ fontSize: '0.82rem', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}

export default function SiteAuditPage() {
    const [urlsText, setUrlsText] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    const [results, setResults] = useState(null);
    const [auditError, setAuditError] = useState('');

    const [domain, setDomain] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [readiness, setReadiness] = useState(null);
    const [readinessError, setReadinessError] = useState('');

    const runAudit = async () => {
        const urls = urlsText.split('\n').map((value) => value.trim()).filter(Boolean).slice(0, 20);
        if (urls.length === 0) return;

        setIsAuditing(true);
        setAuditError('');
        setResults(null);

        try {
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls }),
            });
            const data = await res.json();
            if (res.ok) setResults(data.results || []);
            else setAuditError(data.error || 'Audit failed');
        } catch {
            setAuditError('Audit failed');
        } finally {
            setIsAuditing(false);
        }
    };

    const checkReadiness = async () => {
        if (!domain.trim()) return;

        setIsChecking(true);
        setReadinessError('');
        setReadiness(null);

        try {
            const res = await fetch('/api/audit/ai-readiness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain }),
            });
            const data = await res.json();
            if (res.ok) setReadiness(data);
            else setReadinessError(data.error || 'Readiness check failed');
        } catch {
            setReadinessError('Readiness check failed');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="audit-panel">
            <div className="panel-page-header">
                <h1 className="panel-page-title">Site Audit</h1>
                <p className="panel-page-subtitle">Real server-side checks — HTTP status, redirects, on-page SEO signals and AI crawler access.</p>
            </div>

            {/* URL audit */}
            <div className="panel-card mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSearch size={22} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Page Audit</h3>
                        <p className="text-sm text-light" style={{ margin: 0 }}>Fetch each URL and report the real response (max 20 per run).</p>
                    </div>
                </div>

                <textarea
                    className="input"
                    rows={5}
                    placeholder={'https://example.com\nhttps://example.com/about'}
                    value={urlsText}
                    onChange={(e) => setUrlsText(e.target.value)}
                    style={{ width: '100%', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                />

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={runAudit} disabled={isAuditing || !urlsText.trim()}>
                        {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        <span style={{ marginLeft: '6px' }}>{isAuditing ? 'Auditing...' : 'Run audit'}</span>
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Read-only checks. Nothing is submitted or indexed.</span>
                </div>

                {auditError && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {auditError}
                    </div>
                )}

                <AnimatePresence>
                    {results && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {results.map((result, index) => (
                                <div key={index} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                            <StatusChip status={result.status} />
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', wordBreak: 'break-all' }}>{result.finalUrl || result.url}</span>
                                        </div>
                                        {result.responseTime !== undefined && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} /> {result.responseTime}ms
                                            </span>
                                        )}
                                    </div>

                                    {result.error && (
                                        <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                                            {result.error}
                                        </div>
                                    )}

                                    {!result.error && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <CheckRow label="Title" value={result.title || '— missing —'} state={result.title ? 'good' : 'bad'} />
                                            <CheckRow label="Meta description" value={result.metaDescription || '— missing —'} state={result.metaDescription ? 'good' : 'warn'} />
                                            <CheckRow
                                                label="Canonical"
                                                value={result.canonical ? `${result.canonical} ${result.canonicalMatches === false ? '(does not match final URL)' : result.canonicalMatches ? '(matches)' : ''}` : '— not set —'}
                                                state={result.canonical ? (result.canonicalMatches === false ? 'warn' : 'good') : 'warn'}
                                            />
                                            <CheckRow
                                                label="Robots"
                                                value={result.robots?.raw ? `${result.robots.raw}${result.robots.noindex ? ' — page will NOT be indexed' : ''}` : 'indexable (no noindex directives)'}
                                                state={result.robots?.noindex ? 'bad' : 'good'}
                                            />
                                            <CheckRow label="H1" value={result.h1Count === 1 ? '1 heading' : `${result.h1Count} headings`} state={result.h1Count === 1 ? 'good' : result.h1Count === 0 ? 'bad' : 'warn'} />
                                            <CheckRow label="Lang / viewport" value={`lang=${result.lang || '—'} · viewport=${result.hasViewport ? 'yes' : 'no'}`} state={result.lang && result.hasViewport ? 'good' : 'warn'} />
                                            {result.redirects?.length > 0 && (
                                                <CheckRow label="Redirects" value={result.redirects.map((hop) => `${hop.status} → ${hop.to}`).join('  |  ')} state="warn" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI readiness */}
            <div className="panel-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={22} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>AI Crawler Readiness</h3>
                        <p className="text-sm text-light" style={{ margin: 0 }}>Parses your real robots.txt — no simulated crawler traffic.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="your-domain.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        style={{ flex: 1, minWidth: '220px', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '10px' }}
                    />
                    <button className="btn btn-primary" onClick={checkReadiness} disabled={isChecking || !domain.trim()}>
                        {isChecking ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                        <span style={{ marginLeft: '6px' }}>{isChecking ? 'Checking...' : 'Check readiness'}</span>
                    </button>
                </div>

                {readinessError && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {readinessError}
                    </div>
                )}

                {readiness && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'var(--bg-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                                robots.txt: {readiness.robots.found ? 'found' : 'not found'}
                            </span>
                            <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'var(--bg-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                                homepage: {readiness.homepage?.ok ? `HTTP ${readiness.homepage.status}` : (readiness.homepage?.error || 'unreachable')}
                            </span>
                            {readiness.robots.sitemapUrls.length > 0 && (
                                <span style={{ padding: '4px 10px', borderRadius: '999px', background: 'var(--bg-light)', fontSize: '0.75rem', fontWeight: 700 }}>
                                    sitemaps: {readiness.robots.sitemapUrls.length}
                                </span>
                            )}
                        </div>

                        {readiness.robots.sitemapUrls.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {readiness.robots.sitemapUrls.map((sitemapUrl) => (
                                    <div key={sitemapUrl} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                                        <Link2 size={14} /> {sitemapUrl}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                            {readiness.bots.map((bot) => (
                                <div
                                    key={bot.bot}
                                    title={bot.matched}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: bot.allowed ? '#f0fdf4' : '#fef2f2',
                                    }}
                                >
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{bot.bot}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 800, color: bot.allowed ? '#166534' : '#991b1b' }}>
                                        {bot.allowed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        {bot.allowed ? 'Allowed' : 'Blocked'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {readiness.robots.blockingBots.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: '#fffbeb', color: '#92400e', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                <span>
                                    {readiness.robots.blockingBots.join(', ')} blocked hain — in crawlers ko robots.txt me allow karna hoga agar AI search visibility chahiye.
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
