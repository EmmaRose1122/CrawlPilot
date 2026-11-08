'use client';
import { motion } from 'framer-motion';
import {
    Code,
    Terminal,
    Copy,
    Check,
    Zap,
    Globe,
    Activity,
    Key
} from 'lucide-react';
import { useState } from 'react';

const apiBase = () => (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '/api/v1');

const endpoints = [
    {
        name: "Check Balance",
        method: "GET",
        url: () => `${apiBase()}/balance`,
        desc: "Retrieve your remaining URL quota.",
        example: () => `curl -X GET "${apiBase()}/balance?token=YOUR_TOKEN"`
    },
    {
        name: "Index Single URL",
        method: "GET",
        url: () => `${apiBase()}/index`,
        desc: "Submit a single URL for instant discovery signaling.",
        example: () => `curl -X GET "${apiBase()}/index?url=https%3A%2F%2Fexample.com&token=YOUR_TOKEN"`
    },
    {
        name: "Bulk Submission",
        method: "POST",
        url: () => `${apiBase()}/index/bulk`,
        desc: "Submit up to 1,000 URLs in a single request.",
        example: () => `curl -X POST "${apiBase()}/index/bulk?token=YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "urls": [\n      "https://example1.com",\n      "https://example2.com"\n    ]\n  }'`
    },
    {
        name: "Crawl Status",
        method: "GET",
        url: () => `${apiBase()}/index/status`,
        desc: "Check if a URL has been crawled by our nodes.",
        example: () => `curl -X GET "${apiBase()}/index/status?url=https%3A%2F%2Fexample.com&token=YOUR_TOKEN"`
    }
];

export default function APIDocsPage() {
    const [copied, setCopied] = useState(null);

    const copyToClipboard = (text, i) => {
        navigator.clipboard.writeText(text);
        setCopied(i);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="api-docs-page">
            <section className="section bg-alt" style={{ padding: '100px 0 60px' }}>
                <div className="container text-center">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <h1 style={{ fontSize: '3rem', letterSpacing: '-1.5px', marginBottom: '16px' }}>Engineer-First <span>API</span></h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', maxWidth: '700px', margin: '0 auto' }}>
                            Integrate Crawl Pilot into your CMS or automation workflow in minutes.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <div className="grid grid-2 gap-4 mb-4">
                        <div className="panel-card">
                            <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Key size={32} /></div>
                            <h3>Authentication</h3>
                            <p className="text-sm">Authorize every request using your unique API token found in the dashboard. Use the <code className="code">token</code> query parameter.</p>
                        </div>
                        <div className="panel-card">
                            <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Activity size={32} /></div>
                            <h3>Rate Limits</h3>
                            <p className="text-sm">Standard accounts include 10 requests/sec. Enterprise accounts scale to 1000+ requests/sec with custom discovery limits.</p>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '2rem', margin: '60px 0 32px' }}>REST Endpoints</h2>

                    <div className="endpoint-list">
                        {endpoints.map((e, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="panel-card mb-4"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <span style={{
                                            background: e.method === 'GET' ? 'var(--success-light)' : 'var(--primary-light)',
                                            color: e.method === 'GET' ? 'var(--success)' : 'var(--primary)',
                                            padding: '4px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            marginRight: '12px'
                                        }}>{e.method}</span>
                                        <h3 style={{ display: 'inline', fontSize: '1.2rem' }}>{e.name}</h3>
                                    </div>
                                    <code style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{e.url()}</code>
                                </div>

                                <p className="text-sm mb-4">{e.desc}</p>

                                <div className="code-block" style={{
                                    background: 'var(--console-bg)',
                                    padding: '20px',
                                    borderRadius: 'var(--radius-md)',
                                    position: 'relative',
                                    overflowX: 'auto'
                                }}>
                                    <pre style={{ margin: 0, color: 'var(--console-text)', fontSize: '0.85rem' }}>{e.example()}</pre>
                                    <button
                                        onClick={() => copyToClipboard(e.example(), i)}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {copied === i ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
