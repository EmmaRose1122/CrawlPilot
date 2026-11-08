'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Zap,
    TrendingUp,
    FileText,
    Activity,
    ArrowUpRight,
    Search,
    Shield,
    Gift
} from 'lucide-react';

export default function AdminOverview() {
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

    useEffect(() => {
        const readAdminResponse = async (response) => {
            const data = await response.json().catch(() => null);
            if (!response.ok || data?.error) {
                throw new Error(data?.error || `Request failed with status ${response.status}`);
            }
            return data;
        };

        const fetchDashboard = async () => {
            setIsLoading(true);
            setDashboardError('');

            const [statsResult, usersResult, blogsResult, tasksResult] = await Promise.allSettled([
                fetch('/api/admin/stats').then(readAdminResponse),
                fetch('/api/admin/users').then(readAdminResponse),
                fetch('/api/admin/blogs').then(readAdminResponse),
                fetch('/api/admin/tasks').then(readAdminResponse),
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
            }

            setIsLoading(false);
        };

        fetchDashboard();
    }, []);

    const stats = [
        { label: 'Total Users', value: statsData.userCount.toString(), icon: <Users size={24} />, trend: '0%', isUp: true },
        { label: 'Active Discoveries', value: statsData.discoveryCount.toString(), icon: <Zap size={24} />, trend: '0%', isUp: true },
        { label: 'Total Revenue', value: `$${statsData.totalRevenue}`, icon: <TrendingUp size={24} />, trend: '0%', isUp: true },
        { label: 'Blog Posts', value: statsData.blogCount.toString(), icon: <FileText size={24} />, trend: '0%', isUp: true },
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="admin-card"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--bg-light)', color: 'var(--admin-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#10b981',
                                background: '#dcfce7',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                height: 'fit-content'
                            }}>
                                <ArrowUpRight size={14} /> {stat.trend}
                            </div>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stat.value}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {dashboardError && (
                <div className="admin-card" style={{ marginBottom: '24px', borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>
                    Admin data could not load: {dashboardError}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', marginBottom: '24px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="admin-card">
                    <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Recent Platform Activity</h3>
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <Activity size={40} color="var(--border-color)" className="mb-2" style={{ margin: '0 auto' }} />
                        <p className="text-sm text-muted">Awaiting initial user logs and transactions...</p>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Engine Acceptance</h3>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <Shield size={32} color="var(--border-color)" className="mb-2" style={{ margin: '0 auto' }} />
                        <p className="text-xs text-muted">No submissions recorded yet.</p>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-light)', borderRadius: '4px', marginTop: '16px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
