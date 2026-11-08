'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Key,
    Copy,
    Check,
    RefreshCw,
    AlertTriangle,
    Terminal,
    ExternalLink,
    Loader2,
    Eye,
    EyeOff,
    Globe,
    ShieldCheck,
    XCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ApiPanelPage() {
    const [token, setToken] = useState('');
    const [masked, setMasked] = useState('');
    const [hasToken, setHasToken] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [error, setError] = useState('');

    const [indexNow, setIndexNow] = useState(null);
    const [keyRevealed, setKeyRevealed] = useState(false);
    const [keyCopied, setKeyCopied] = useState(false);
    const [isRotatingKey, setIsRotatingKey] = useState(false);
    const [verifyDomain, setVerifyDomain] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const fetchToken = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/user/apitoken');
            const data = await res.json();
            if (res.ok) {
                setHasToken(data.hasToken);
                setMasked(data.masked || '');
                if (data.token) {
                    setToken(data.token);
                    setRevealed(true);
                }
            } else {
                setError(data.error || 'Failed to load API token');
            }
        } catch {
            setError('Failed to load API token');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchIndexNow = async () => {
        try {
            const res = await fetch('/api/user/indexnow');
            const data = await res.json();
            if (res.ok) setIndexNow(data);
        } catch {
            // Non-blocking: the IndexNow card simply stays empty.
        }
    };

    useEffect(() => {
        fetchToken();
        fetchIndexNow();
    }, []);

    const copyToken = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyIndexNowKey = () => {
        navigator.clipboard.writeText(indexNow?.key || '');
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
    };

    const rotateToken = async () => {
        if (!confirm('Rotate API token? Existing integrations will stop working immediately.')) return;
        setIsRotating(true);
        setError('');
        try {
            const res = await fetch('/api/user/apitoken', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
                setMasked(data.masked);
                setHasToken(true);
                setRevealed(true);
            } else {
                setError(data.error || 'Failed to rotate token');
            }
        } catch {
            setError('Failed to rotate token');
        } finally {
            setIsRotating(false);
        }
    };

    const rotateIndexNowKey = async () => {
        if (!confirm('Rotate IndexNow key? You must re-host the new key file on your domains before submitting.')) return;
        setIsRotatingKey(true);
        setVerifyResult(null);
        try {
            const res = await fetch('/api/user/indexnow', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setIndexNow((prev) => ({ ...(prev || {}), ...data }));
                setKeyRevealed(true);
            }
        } finally {
            setIsRotatingKey(false);
        }
    };

    const verifyDomainKey = async () => {
        if (!verifyDomain.trim()) return;
        setIsVerifying(true);
        setVerifyResult(null);
        try {
            const res = await fetch('/api/user/indexnow/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: verifyDomain }),
            });
            const data = await res.json();
            setVerifyResult(res.ok ? data : { verified: false, reason: data.error || 'Verification failed' });
        } catch {
            setVerifyResult({ verified: false, reason: 'Verification failed' });
        } finally {
            setIsVerifying(false);
        }
    };

    const apiBase = typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1';

    const endpoints = [
        { method: 'GET', endpoint: '/balance', desc: 'Retrieve your current URL quota and submission limits.' },
        { method: 'GET', endpoint: '/index?url=...&bots=google,bing', desc: 'Submit a single URL to the configured engines and get the real response status.' },
        { method: 'POST', endpoint: '/index/bulk', desc: 'Submit up to 1,000 URLs in one request and track each URL separately.' },
        { method: 'GET', endpoint: '/index/status?url=...', desc: 'Query the stored submission status and per-engine results for a URL.' },
    ];

    return (
        <div className="api-panel">
            <div className="panel-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="panel-page-title">Developer Access</h1>
                        <p className="panel-page-subtitle">Integrate Crawl Pilot submission engine into your stack.</p>
                    </div>
                    <Link href="/api-docs" target="_blank" className="btn btn-outline btn-sm">
                        Full Docs <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                    </Link>
                </div>
            </div>

            <div className="panel-card mb-4">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Key size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Core API Authentication</h3>
                        <p className="text-sm text-light">Include this token as a <code className="code">token</code> query parameter (or <code className="code">Authorization: Bearer</code> header) in every request.</p>
                    </div>
                </div>

                {error && (
                    <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <div className="token-display-box" style={{ background: 'var(--bg-light)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '1.1rem', letterSpacing: '1px', color: 'var(--text-dark)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : !hasToken ? (
                            'No API token yet'
                        ) : revealed && token ? (
                            token
                        ) : (
                            masked || '••••••••••••••••••••••'
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setRevealed(!revealed)}
                            disabled={isLoading || !hasToken}
                            title={revealed ? 'Hide token' : 'Reveal token'}
                        >
                            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button className="btn btn-primary" onClick={copyToken} disabled={isLoading || !hasToken || !token}>
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button className="btn btn-outline" onClick={rotateToken} disabled={isLoading || isRotating} title="Reset Token (Warning: This will break existing integrations)">
                            {isRotating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--warning-light)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <AlertTriangle size={20} color="var(--warning)" />
                    <p className="text-xs" style={{ margin: 0, color: 'var(--text-body)' }}>
                        <strong>Security Alert:</strong> This token grants access to your URL balance. Keep it secure. It is stored hashed — if you lose it, rotate it.
                    </p>
                </div>
            </div>

            {/* ===== IndexNow (Bing / Yandex / Seznam / Naver) ===== */}
            <div className="panel-card mb-4">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,164,239,0.1)', color: '#00A4EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Globe size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>IndexNow (Bing, Yandex, Seznam, Naver)</h3>
                            <p className="text-sm text-light" style={{ margin: '4px 0 0' }}>Real instant-submission protocol. Your key file must be hosted on your own domain.</p>
                        </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={rotateIndexNowKey} disabled={isRotatingKey || !indexNow}>
                        {isRotatingKey ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        <span style={{ marginLeft: '6px' }}>Rotate key</span>
                    </button>
                </div>

                <div style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '8px' }}>Your IndexNow key</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <code style={{ flex: 1, minWidth: '240px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem', wordBreak: 'break-all' }}>
                            {!indexNow ? <Loader2 size={16} className="animate-spin" /> : keyRevealed ? indexNow.key : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <button className="btn btn-outline btn-sm" onClick={() => setKeyRevealed(!keyRevealed)} disabled={!indexNow}>
                            {keyRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={copyIndexNowKey} disabled={!indexNow}>
                            {keyCopied ? <Check size={16} /> : <Copy size={16} />}
                            <span style={{ marginLeft: '6px' }}>{keyCopied ? 'Copied' : 'Copy key'}</span>
                        </button>
                    </div>

                    <ol style={{ margin: '16px 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
                        <li>Create a file named <code>{indexNow?.keyFileName || '<key>.txt'}</code> containing exactly your key.</li>
                        <li>Host it at <code>{indexNow?.keyLocationTemplate || 'https://<your-domain>/<key>.txt'}</code> (site root).</li>
                        <li>Verify the domain below, then select <strong>Bing</strong> when submitting URLs.</li>
                    </ol>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="your-domain.com"
                        value={verifyDomain}
                        onChange={(e) => setVerifyDomain(e.target.value)}
                        style={{ flex: 1, minWidth: '220px', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '10px' }}
                    />
                    <button className="btn btn-primary" onClick={verifyDomainKey} disabled={isVerifying || !verifyDomain.trim() || !indexNow}>
                        {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                        <span style={{ marginLeft: '6px' }}>{isVerifying ? 'Checking...' : 'Verify key file'}</span>
                    </button>
                </div>

                {indexNow?.domains?.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>Your domains:</span>
                        {indexNow.domains.map((domain) => (
                            <button
                                key={domain}
                                onClick={() => setVerifyDomain(domain)}
                                style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {domain}
                            </button>
                        ))}
                    </div>
                )}

                {verifyResult && (
                    <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start', background: verifyResult.verified ? '#dcfce7' : '#fef2f2', color: verifyResult.verified ? '#166534' : '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
                        {verifyResult.verified ? <ShieldCheck size={18} style={{ flexShrink: 0 }} /> : <XCircle size={18} style={{ flexShrink: 0 }} />}
                        <span>
                            {verifyResult.verified
                                ? `Verified — key file found at ${verifyResult.keyLocation}. You can submit with Bing now.`
                                : `${verifyResult.reason || 'Verification failed'}${verifyResult.keyLocation ? ` (checked ${verifyResult.keyLocation})` : ''}`}
                        </span>
                    </div>
                )}
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Fast Integration</h2>

            <div className="grid grid-2 gap-4">
                {endpoints.map((ep, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="panel-card"
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: ep.method === 'GET' ? 'var(--success-light)' : 'var(--primary-light)',
                                color: ep.method === 'GET' ? 'var(--success)' : 'var(--primary)'
                            }}>
                                {ep.method}
                            </span>
                            <code style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>{ep.endpoint}</code>
                        </div>
                        <p className="text-sm" style={{ marginBottom: 0, minHeight: '40px' }}>{ep.desc}</p>
                    </motion.div>
                ))}
            </div>

            <div className="panel-card mt-4" style={{ background: 'var(--console-bg)', color: 'white', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Terminal size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Quick cURL Test</span>
                </div>
                <pre style={{ margin: 0, padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--success)', overflowX: 'auto' }}>
                    {`curl -X GET "${apiBase}/balance?token=YOUR_TOKEN"`}
                </pre>
            </div>
        </div>
    );
}
