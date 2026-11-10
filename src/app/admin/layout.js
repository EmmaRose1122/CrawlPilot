'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    Inbox,
    LogOut,
    Zap,
    ArrowLeft,
    Gift
} from 'lucide-react';
import { signOut } from "next-auth/react";
import './admin.css';

const adminNavItems = [
    { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { href: '/admin/users', label: 'Manage Users', icon: <Users size={20} /> },
    { href: '/admin/blogs', label: 'Manage Blogs', icon: <FileText size={20} /> },
    { href: '/admin/tasks', label: 'Manage Tasks', icon: <Gift size={20} /> },
    { href: '/admin/requests', label: 'Requests', icon: <Inbox size={20} /> },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
            router.push("/authorize");
        }
    }, [status, session, router]);

    if (status === "loading") {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    if (!session || session.user.role !== "ADMIN") return null;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div style={{ padding: '32px 24px' }}>
                    <Link href="/" className="logo">
                        <Zap className="logo-icon" size={24} fill="currentColor" style={{ color: 'var(--admin-primary)' }} />
                        Crawl <span style={{ color: 'var(--admin-primary)' }}>Admin</span>
                    </Link>
                </div>

                <nav className="admin-nav">
                    <div className="text-xs font-bold text-muted uppercase mb-4 px-4 letter-spacing-1">Management</div>
                    {adminNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="text-xs font-bold text-muted uppercase mt-8 mb-4 px-4 letter-spacing-1">System</div>
                    <Link href="/admin/settings" className="admin-nav-item">
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => signOut({ callbackUrl: '/authorize' })}
                        className="admin-nav-item"
                        style={{ width: '100%', textAlign: 'left', background: 'none' }}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                    <Link href="/panel/overview" className="admin-nav-item">
                        <ArrowLeft size={20} style={{ transform: 'rotate(0deg)' }} />
                        <span>User View</span>
                    </Link>
                </div>
            </aside>

            <main className="admin-main">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div></div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{session.user.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{session.user.email}</div>
                            </div>
                            <div style={{ width: '40px', height: '40px', background: 'var(--admin-primary)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                {session.user.name?.split(' ').map(n => n[0]).join('') || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <motion.div
                    key={pathname}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
