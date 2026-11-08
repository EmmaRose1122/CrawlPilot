'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import {
    Menu,
    X,
    ChevronDown,
    Search,
    Zap,
    Globe,
    MessageSquare,
    ExternalLink,
    LogOut
} from 'lucide-react';
import './Header.css';

export default function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const pathname = usePathname();
    const { data: session, status } = useSession();

    if (pathname.startsWith('/panel')) return null;

    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="logo">
                    <Zap className="logo-icon" size={28} fill="currentColor" />
                    Crawl <span>Pilot</span>
                </Link>

                <nav className="desktop-nav">
                    <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>

                    <div
                        className="dropdown"
                        onMouseEnter={() => setDropdownOpen('bots')}
                        onMouseLeave={() => setDropdownOpen(null)}
                    >
                        <span className="dropdown-trigger">
                            Bots <ChevronDown size={14} />
                        </span>
                        <AnimatePresence>
                            {dropdownOpen === 'bots' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="dropdown-menu"
                                >
                                    <Link href="/understanding-bots/google">
                                        <Globe size={16} /> Google Bot
                                    </Link>
                                    <Link href="/understanding-bots/bing">
                                        <Search size={16} /> Bing Bot
                                    </Link>
                                    <Link href="/understanding-bots/openai">
                                        <MessageSquare size={16} /> OpenAI Bot
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Link href="/pricing" className={pathname === '/pricing' ? 'active' : ''}>Pricing</Link>
                    <Link href="/api-docs" className={pathname === '/api-docs' ? 'active' : ''}>API</Link>
                    <Link href="/faq" className={pathname === '/faq' ? 'active' : ''}>FAQ</Link>
                    <Link href="/blog" className={pathname === '/blog' ? 'active' : ''}>Blog</Link>

                    <div
                        className="dropdown"
                        onMouseEnter={() => setDropdownOpen('more')}
                        onMouseLeave={() => setDropdownOpen(null)}
                    >
                        <span className="dropdown-trigger">
                            More <ChevronDown size={14} />
                        </span>
                        <AnimatePresence>
                            {dropdownOpen === 'more' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="dropdown-menu"
                                >
                                    <Link href="/referral">Referral Program</Link>
                                    <Link href="/support">Support</Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>

                <div className="header-actions">
                    {status === 'unauthenticated' ? (
                        <>
                            <Link href="/authorize" className="btn btn-ghost">Login</Link>
                            <Link href="/signup" className="btn btn-primary">Get Started</Link>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => signOut()}
                                className="btn btn-ghost"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                            <Link href={session?.user?.role === 'ADMIN' ? '/admin' : '/panel/overview'} className="btn btn-primary">
                                {session?.user?.role === 'ADMIN' ? 'Admin' : 'Dashboard'}
                            </Link>
                        </>
                    )}

                    <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mobile-menu"
                    >
                        <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
                        <Link href="/pricing" onClick={() => setMobileOpen(false)}>Pricing</Link>
                        <Link href="/api-docs" onClick={() => setMobileOpen(false)}>API Docs</Link>
                        <Link href="/faq" onClick={() => setMobileOpen(false)}>FAQ</Link>
                        <Link href="/blog" onClick={() => setMobileOpen(false)}>Blog</Link>
                        <div className="mobile-divider" />
                        {status === 'unauthenticated' ? (
                            <Link href="/signup" className="btn btn-primary btn-block" onClick={() => setMobileOpen(false)}>Login / Sign Up</Link>
                        ) : (
                            <>
                                <Link
                                    href={session?.user?.role === 'ADMIN' ? '/admin' : '/panel/overview'}
                                    className="btn btn-primary btn-block"
                                    onClick={() => setMobileOpen(false)}
                                    style={{ marginBottom: '12px' }}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => { signOut(); setMobileOpen(false); }}
                                    className="btn btn-ghost btn-block"
                                >
                                    Sign Out
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
