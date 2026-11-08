'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';

function SignupForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const refCode = searchParams.get('ref');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, ref: refCode }),
            });

            if (res.ok) {
                // Auto sign in using the NEXT_AUTH signIn
                const signResult = await signIn('credentials', {
                    email,
                    password,
                    redirect: true,
                    callbackUrl: '/panel/overview',
                });

                if (signResult?.error) {
                    setError(signResult.error === 'CredentialsSignin' ? 'Invalid credentials' : signResult.error);
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="auth-section">
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="auth-card" style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
                    <h1 className="auth-title" style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 800 }}>Create Account</h1>
                    <p className="auth-subtitle" style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '32px' }}>
                        Join Crawl Pilot for faster search rankings.
                    </p>

                    {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-light)' }}>Full Name</label>
                            <input
                                type="text"
                                className="input auth-input"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                                required
                            />
                        </div>
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading} style={{ width: '100%', height: '54px', fontSize: '1rem', borderRadius: '12px', fontWeight: 700 }}>
                            {isLoading ? 'Creating Account...' : 'Get Started'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        Already have an account? <Link href="/authorize" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>Loading...</div>}>
            <SignupForm />
        </Suspense>
    );
}
