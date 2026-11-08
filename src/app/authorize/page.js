'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';
import './authorize.css';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getFreshSession() {
    for (let attempt = 0; attempt < 5; attempt++) {
        const session = await getSession();
        if (session?.user) return session;
        await wait(250);
    }
    return null;
}

export default function AuthorizePage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: email.trim(),
                password,
                redirect: false,
            });

            if (!result || result.error || !result.ok) {
                setError('Invalid credentials or database connection failed.');
                return;
            }

            const session = await getFreshSession();
            if (!session?.user) {
                setError('Signed in, but the session was not ready. Please try again.');
                return;
            }

            if (session.user.role === 'ADMIN') {
                router.replace('/admin');
            } else {
                router.replace('/panel/overview');
            }
            router.refresh();
        } catch (error) {
            console.error('Login failed:', error);
            setError('Login failed. Please check the database connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="auth-section">
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="auth-card" style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                    <h1 className="auth-title" style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 800 }}>Welcome back</h1>
                    <p className="auth-subtitle" style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '32px' }}>
                        Crawl Pilot Project ID: <code>6b7bce2e...</code>
                    </p>

                    {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-light)' }}>Email Address</label>
                            <input
                                type="email"
                                className="input auth-input"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-light)' }}>Password</label>
                            <input
                                type="password"
                                className="input auth-input"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading} style={{ width: '100%', height: '54px', fontSize: '1rem', borderRadius: '12px', fontWeight: 700 }}>
                            {isLoading ? 'Authenticating...' : 'Sign In'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 800 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        </div>

                        <button
                            type="button"
                            onClick={() => signIn('google', { callbackUrl: '/panel/overview' })}
                            className="btn btn-outline"
                            style={{
                                width: '100%',
                                height: '54px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                borderRadius: '12px',
                                background: 'white',
                                color: '#1f2937',
                                border: '1px solid var(--border-color)',
                                fontWeight: 700
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        Don&apos;t have an account? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign Up Free</Link>
                    </div>

                </div>
            </div>
        </section>
    );
}
