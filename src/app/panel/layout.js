'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import {
    LayoutDashboard,
    Search,
    Code,
    CreditCard,
    History,
    User,
    Gift,
    Users,
    LifeBuoy,
    LogOut,
    ArrowLeft,
    Menu,
    X,
    Zap,
    FileSearch
} from 'lucide-react';
import './panel.css';

const navItems = [
    { href: '/panel/overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { href: '/panel/indexing', label: 'Indexing', icon: <Search size={20} /> },
    { href: '/panel/audit', label: 'Site Audit', icon: <FileSearch size={20} /> },
    { href: '/panel/api', label: 'API Integration', icon: <Code size={20} /> },
    { href: '/panel/billing', label: 'Balance Top-Up', icon: <CreditCard size={20} /> },
    { href: '/panel/payments', label: 'Top-up history', icon: <History size={20} /> },
    { href: '/panel/profile', label: 'My profile', icon: <User size={20} /> },
    { href: '/panel/earn', label: 'Rewards Hub', icon: <Gift size={20} />, badge: 'BONUS' },
    { href: '/panel/referral', label: 'Referral program', icon: <Users size={20} /> },
    { href: '/panel/support', label: 'Support', icon: <LifeBuoy size={20} /> },
];

export default function PanelLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/authorize");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>
                    {navItems.find(i => i.href === pathname)?.label || 'Dashboard'}
                </h1>
                Loading...
            </div>
        );
    }

    if (!session) {
        return (
            <div aria-hidden="true">
                <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>
                    {navItems.find(i => i.href === pathname)?.label || 'Dashboard'}
                </h1>
            </div>
        );
    }

    return (
        <div className="panel-layout">
            {/* Mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="panel-overlay"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`panel-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="panel-sidebar-header">
                    <Link href="/" className="logo sidebar-logo">
                        <Zap className="logo-icon" size={24} fill="currentColor" />
                        Crawl <span>Pilot</span>
                    </Link>
                    <button type="button" className="sidebar-close-btn" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="panel-nav">
                    <div className="nav-group-title">Discovery Engine</div>
                    {navItems.slice(0, 4).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            aria-current={pathname === item.href ? 'page' : undefined}
                            className={`panel-nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge && <span className="panel-nav-badge">{item.badge}</span>}
                        </Link>
                    ))}

                    <div className="nav-group-title">Organization</div>
                    {navItems.slice(4, 11).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            aria-current={pathname === item.href ? 'page' : undefined}
                            className={`panel-nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                            {item.badge && <span className="panel-nav-badge">{item.badge}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="panel-sidebar-footer">
                    <button
                        onClick={() => signOut({ callbackUrl: '/authorize' })}
                        className="panel-nav-item"
                        style={{ width: '100%', textAlign: 'left', background: 'none' }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                    <Link href="/" className="panel-nav-item back-btn">
                        <ArrowLeft size={20} />
                        <span>Back to Site</span>
                    </Link>
                </div>
            </aside>

            {/* Main Container */}
            <main className="panel-main">
                <header className="panel-header">
                    <div className="header-left">
                        <button type="button" className="sidebar-toggle-btn" aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="panel-navigation" onClick={() => setSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="breadcrumb">
                            <span>Dashboard</span>
                            <span className="separator">/</span>
                            <span className="current-page">{navItems.find(i => i.href === pathname)?.label || 'Overview'}</span>
                        </div>
                    </div>

                    <div className="header-right">
                        {session?.user?.role === 'ADMIN' && (
                            <Link href="/admin" className="btn btn-ghost btn-sm mr-2" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                                Admin Center
                            </Link>
                        )}
                        <div className="panel-user-profile">
                            <div className="user-avatar">{session.user.name?.split(' ').map(n => n[0]).join('') || 'U'}</div>
                            <div className="user-info">
                                <span className="user-name">{session.user.name || 'User'}</span>
                                <span className="user-email">{session.user.email}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="panel-content-area">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
