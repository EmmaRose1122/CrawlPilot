'use client';
import Link from 'next/link';

export default function SupportPage() {
    return (
        <>
            <section style={{ padding: '80px 0', background: 'linear-gradient(180deg, #F0F7FF 0%, #FFFFFF 100%)', textAlign: 'center' }}>
                <div className="container">
                    <h1>Support</h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-body)', marginTop: '12px' }}>Hi! How can we help you today?</p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-light)', marginTop: '8px' }}>We are ready to assist you with any of your queries</p>
                </div>
            </section>

            <section className="section">
                <div className="container" style={{ maxWidth: '700px' }}>
                    <div className="card" style={{ padding: '40px' }}>
                        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Contact Support</h2>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Email</label>
                                <input type="email" className="input" placeholder="your@email.com" />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Subject</label>
                                <input type="text" className="input" placeholder="How can we help?" />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Message</label>
                                <textarea className="input" placeholder="Describe your issue or question..." rows={5}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send Message</button>
                        </form>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
                        <Link href="/faq" className="card" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            <h4 style={{ marginBottom: '8px' }}>📋 FAQ</h4>
                            <p style={{ fontSize: '0.85rem', margin: 0 }}>Browse common questions</p>
                        </Link>
                        <Link href="/api-docs" className="card" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            <h4 style={{ marginBottom: '8px' }}>📖 API Docs</h4>
                            <p style={{ fontSize: '0.85rem', margin: 0 }}>Technical documentation</p>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
