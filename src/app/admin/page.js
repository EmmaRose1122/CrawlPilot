'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signOutToLogin } from '@/lib/clientSignOut';
import styles from '@/components/operations.module.css';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Users,
    Zap,
    TrendingUp,
    FileText,
    Activity,
    Gift
} from 'lucide-react';

export default function AdminOverview() {
    const reduceMotion = useReducedMotion();
    const [statsData, setStatsData] = useState({
        userCount: 0,
        blogCount: 0,
        discoveryCount: 0,
        totalRevenue: 0
    });
    const [users, setUsers] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [dashboardError, setDashboardError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activityData, setActivityData] = useState(null);
    const [activityError, setActivityError] = useState('');
    const [activityLoading, setActivityLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);

    const refreshActivity = useCallback(async () => {
        setActivityLoading(true);
        setActivityError('');
        try {
            const response = await fetch('/api/admin/activity', { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load activity');
            setActivityData(data);
        } catch (error) {
            setActivityError(error.message || 'Failed to load activity');
        } finally {
            setActivityLoading(false);
        }
    }, []);

    useEffect(() => { refreshActivity(); }, [refreshActivity]);

    const loadDashboard = useCallback(async () => {
        const readAdminResponse = async (response) => {
            const data = await response.json().catch(() => null);
            if (!response.ok || data?.error) {
                const error = new Error(data?.error || `Request failed with status ${response.status}`);
                error.status = response.status;
                throw error;
            }
            return data;
        };

        setIsLoading(true);
        setDashboardError('');
        setSessionExpired(false);

        const [statsResult, usersResult, blogsResult, tasksResult] = await Promise.allSettled([
            fetch('/api/admin/stats', { cache: 'no-store' }).then(readAdminResponse),
            fetch('/api/admin/users', { cache: 'no-store' }).then(readAdminResponse),
            fetch('/api/admin/blogs', { cache: 'no-store' }).then(readAdminResponse),
            fetch('/api/admin/tasks', { cache: 'no-store' }).then(readAdminResponse),
        ]);

        if (statsResult.status === 'fulfilled') setStatsData(statsResult.value);
        if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value)) setUsers(usersResult.value);
        if (blogsResult.status === 'fulfilled' && Array.isArray(blogsResult.value)) setBlogs(blogsResult.value);
        if (tasksResult.status === 'fulfilled' && Array.isArray(tasksResult.value)) setTasks(tasksResult.value);

        const errors = [statsResult, usersResult, blogsResult, tasksResult]
            .filter((result) => result.status === 'rejected')
            .map((result) => result.reason?.message)
            .filter(Boolean);

        if (errors.length) {
            setDashboardError(errors[0]);
            setSessionExpired([statsResult, usersResult, blogsResult, tasksResult].some(
                (result) => result.status === 'rejected' && result.reason?.status === 401
            ));
        }

        setIsLoading(false);
    }, []);

    useEffect(() => { loadDashboard(); }, [loadDashboard]);

    const stats = [
        { label: 'Total Users', value: isLoading ? '…' : statsData.userCount.toString(), icon: <Users size={24} /> },
        { label: 'URL Submissions', value: isLoading ? '…' : statsData.discoveryCount.toString(), icon: <Zap size={24} /> },
        { label: 'Approved Top-up Credits', value: activityError ? 'Unavailable' : activityData?.summary.approvedCredits.toLocaleString() ?? '…', icon: <TrendingUp size={24} /> },
        { label: 'Blog Posts', value: isLoading ? '…' : statsData.blogCount.toString(), icon: <FileText size={24} /> },
    ];
    const recentUsers = users.slice(0, 5);
    const recentBlogs = blogs.slice(0, 5);
    const recentTasks = tasks.slice(0, 5);

    return (
        <div className="admin-overview">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Admin Dashboard</h1>
                <p className="text-muted">Welcome back, Super Admin. Tracking system health and performance.</p>
            </div>

            <div className="admin-stat-grid">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduceMotion ? 0 : i * 0.1, duration: reduceMotion ? 0 : 0.3 }}
                        className="admin-card"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--bg-light)', color: 'var(--admin-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stat.value}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {dashboardError && (
                <div className="admin-card" style={{ marginBottom: '24px', borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>
                    <p style={{ marginBottom: '12px' }}>
                        {sessionExpired ? 'Your admin session has expired or is not authorized.' : `Admin data could not load: ${dashboardError}.`} Any values shown may be out of date.
                    </p>
                    {sessionExpired ? (
                        <button type="button" className="admin-btn" onClick={signOutToLogin}>
                            Sign in again
                        </button>
                    ) : (
                        <button type="button" className="admin-btn" onClick={loadDashboard} disabled={isLoading}>
                            {isLoading ? 'Retrying...' : 'Retry dashboard data'}
                        </button>
                    )}
                </div>
            )}

            <div className="admin-recent-grid">
                <div className="admin-card">
                    <h3 style={{ marginBottom: '18px', fontSize: '1.1rem', display: 'flex', gap: '8px', alignItems: 'center' }}><Users size={18} /> Recent Users</h3>
                    {isLoading ? (
                        <p className="text-sm text-muted">Loading users...</p>
                    ) : recentUsers.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {recentUsers.map((user) => (
                                <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'No name'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                                    </div>
                                    <div style={{ fontWeight: 800 }}>{user.balance?.toLocaleString?.() || 0}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted">No users found.</p>
                    )}
                </div>

                <div className="admin-card">
                    <h3 style={{ marginBottom: '18px', fontSize: '1.1rem', display: 'flex', gap: '8px', alignItems: 'center' }}><FileText size={18} /> Blog Posts</h3>
                    {isLoading ? (
                        <p className="text-sm text-muted">Loading blogs...</p>
                    ) : recentBlogs.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {recentBlogs.map((blog) => (
                                <div key={blog.id}>
                                    <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{blog.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{blog.category} · {blog.views || 0} views</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted">No blog posts found.</p>
                    )}
                </div>

                <div className="admin-card">
                    <h3 style={{ marginBottom: '18px', fontSize: '1.1rem', display: 'flex', gap: '8px', alignItems: 'center' }}><Gift size={18} /> Tasks</h3>
                    {isLoading ? (
                        <p className="text-sm text-muted">Loading tasks...</p>
                    ) : recentTasks.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {recentTasks.map((task) => (
                                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{task.submissions?.length || 0} submissions</div>
                                    </div>
                                    <div style={{ fontWeight: 800 }}>{task.reward}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted">No tasks found.</p>
                    )}
                </div>
            </div>

            <div className={`${styles.scope} ${styles.columns}`}>
                <section className={`admin-card ${styles.stack}`} aria-labelledby="activity-heading">
                    <div className={styles.heading}>
                        <h2 id="activity-heading"><Activity size={20} /> Recent Platform Activity</h2>
                        <button type="button" className="admin-btn" disabled={activityLoading} onClick={refreshActivity}>
                            {activityLoading ? 'Refreshing...' : 'Refresh activity'}
                        </button>
                    </div>
                    <p className={styles.meta}>Latest stored state of the 20 most recently created or updated records, not a complete audit log.</p>
                    {activityError && <p className={styles.error} role="alert">{activityError}. Use Refresh activity to retry.</p>}
                    {activityLoading && <p role="status">Loading activity...</p>}
                    {!activityLoading && !activityError && activityData?.activity.length === 0 && <p>No activity yet.</p>}
                    {activityData?.activity.map(item => (
                        <article key={item.id} className={styles.item}>
                            <h3>{item.href ? <Link href={item.href}>{item.title}</Link> : item.title}</h3>
                            <p className={styles.prewrap}>{item.detail}</p>
                            <time className={styles.meta} dateTime={item.at}>{new Date(item.at).toLocaleString()}</time>
                        </article>
                    ))}
                </section>
                <section className={`admin-card ${styles.stack}`} aria-labelledby="review-heading">
                    <h2 id="review-heading">Awaiting review</h2>
                    <p>Pending top-ups: <strong>{activityError ? 'Unavailable' : activityData?.summary.pendingTopups ?? '…'}</strong></p>
                    <p>Unanswered support tickets: <strong>{activityError ? 'Unavailable' : activityData?.summary.openTickets ?? '…'}</strong></p>
                    <p className={styles.meta}>Approved credits are not payment revenue. No online payment processor is connected.</p>
                    <Link href="/admin/requests" className="btn btn-outline">Manage requests</Link>
                </section>
            </div>
        </div>
    );
}
