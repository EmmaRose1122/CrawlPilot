'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Plus,
    X,
    TrendingUp,
    Zap,
    History,
    Bot,
    CheckCircle2,
    ExternalLink
} from 'lucide-react';

const botOptions = [
    { id: 'google', name: 'Google', color: '#4285F4' },
    { id: 'google-indexing', name: 'Google Indexing API', color: '#0F9D58' },
    { id: 'google-sitemap', name: 'Google Sitemap', color: '#34A853' },
    { id: 'indexnow', name: 'IndexNow (all partners)', color: '#7C3AED' },
    { id: 'bing', name: 'Bing', color: '#00A4EF' },
    { id: 'yandex', name: 'Yandex', color: '#FC3F1D' },
    { id: 'seznam', name: 'Seznam', color: '#CC0000' },
    { id: 'naver', name: 'Naver', color: '#03C75A' },
    { id: 'yep', name: 'Yep', color: '#E0A800' },
    { id: 'internetarchive', name: 'Internet Archive', color: '#4A4A4A' },
    { id: 'amazonbot', name: 'Amazonbot', color: '#FF9900' }
];

export default function ManageUsersPage() {
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [showBotAccessModal, setShowBotAccessModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedBotsForUser, setSelectedBotsForUser] = useState([]);
    const [canAddLinksForUser, setCanAddLinksForUser] = useState(false);
    const [topupAmount, setTopupAmount] = useState('1000');
    const [isProcessing, setIsProcessing] = useState(false);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
            (user.name || '').toLowerCase().includes(term) ||
            (user.email || '').toLowerCase().includes(term)
        );
    });

    const handleTopup = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, amount: topupAmount })
            });

            if (res.ok) {
                await fetchUsers(); // Refresh the list
                setShowTopupModal(false);
            } else {
                alert('Top-up failed');
            }
        } catch (error) {
            console.error('Top-up failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const openBotAccessModal = (user) => {
        setSelectedUser(user);
        let allowedBots = [];
        try {
            allowedBots = JSON.parse(user.allowedBots || '["google"]');
        } catch (e) {
            allowedBots = ['google'];
        }
        setSelectedBotsForUser(allowedBots);
        setCanAddLinksForUser(user.canAddLinks || false);
        setShowBotAccessModal(true);
    };

    const toggleBotForUser = (botId) => {
        if (selectedBotsForUser.includes(botId)) {
            setSelectedBotsForUser(selectedBotsForUser.filter(b => b !== botId));
        } else {
            setSelectedBotsForUser([...selectedBotsForUser, botId]);
        }
    };

    const handleSaveBotAccess = async () => {
        setIsProcessing(true);
        try {
            // Save bot access
            const resBots = await fetch('/api/admin/users/bots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: selectedUser.id, 
                    allowedBots: selectedBotsForUser 
                })
            });

            // Save canAddLinks permission
            const resLinks = await fetch('/api/admin/users/links-permission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: selectedUser.id, 
                    canAddLinks: canAddLinksForUser 
                })
            });

            if (resBots.ok && resLinks.ok) {
                await fetchUsers();
                setShowBotAccessModal(false);
            } else {
                alert('Failed to update permissions');
            }
        } catch (error) {
            console.error('Failed to update permissions:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="manage-users">
            <div className="admin-page-header">
                <h1 className="admin-page-title">User Management</h1>
                <p className="text-muted">Monitor user activity and manage credit top-ups.</p>
            </div>

            <div className="admin-card mb-8">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', width: '320px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Find user by email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Plan</th>
                                <th>Balance</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', background: 'var(--bg-light)', color: 'var(--admin-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {user.name ? user.name.split(' ').map(n => n[0]).join('') : user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{user.name || 'Set Name'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${user.plan === 'Free' ? 'badge-success' : 'badge-primary'}`} style={{
                                                background: user.plan === 'Enterprise' ? '#f5f3ff' : '',
                                                color: user.plan === 'Enterprise' ? '#7c3aed' : ''
                                            }}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: user.balance < 0 ? '#dc2626' : 'inherit' }}>
                                                {user.balance < 0 ? '⚠️ ' : ''}{user.balance.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: user.balance < 0 ? '#dc2626' : 'var(--text-light)' }}>
                                                {user.balance < 0 ? 'Debt – needs top-up' : 'URLs available'}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                : (user.joined || '—')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="admin-btn admin-btn-primary"
                                                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowTopupModal(true);
                                                    }}
                                                >
                                                    <Plus size={14} /> Top-up
                                                </button>
                                                <button
                                                    className="admin-btn"
                                                    style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--bg-light)' }}
                                                    onClick={() => openBotAccessModal(user)}
                                                >
                                                    <Bot size={14} /> Bot Access
                                                </button>
                                                <button className="admin-btn" style={{ background: 'var(--bg-light)', padding: '6px' }}>
                                                    <History size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
                                        <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                        <p>No users found in the database.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top-up Modal */}
            <AnimatePresence>
                {showTopupModal && selectedUser && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justify: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="admin-card"
                            style={{ width: '100%', maxWidth: '400px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0 }}>Add URL Credits</h3>
                                <button onClick={() => setShowTopupModal(false)}><X size={20} /></button>
                            </div>

                            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--admin-primary-light)', borderRadius: '12px', border: '1px solid var(--admin-primary)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Target Account</div>
                                <div style={{ fontWeight: 700 }}>{selectedUser.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{selectedUser.email}</div>
                            </div>

                            <form onSubmit={handleTopup}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>URL Amount</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={topupAmount}
                                        onChange={(e) => setTopupAmount(e.target.value)}
                                        style={{ width: '100%', border: '1px solid var(--border-color)' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                    {['100', '1000', '10000', '100000'].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            className="admin-btn"
                                            onClick={() => setTopupAmount(amt)}
                                            style={{
                                                fontSize: '0.75rem',
                                                background: topupAmount === amt ? 'var(--admin-primary)' : 'var(--bg-light)',
                                                color: topupAmount === amt ? 'white' : 'var(--text-dark)'
                                            }}
                                        >
                                            +{parseInt(amt).toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} disabled={isProcessing}>
                                    {isProcessing ? 'Processing Transaction...' : 'Confirm Top-up'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bot Access Modal */}
            <AnimatePresence>
                {showBotAccessModal && selectedUser && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="admin-card"
                            style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Bot size={20} />
                                    Manage Bot Access
                                </h3>
                                <button onClick={() => setShowBotAccessModal(false)}><X size={20} /></button>
                            </div>

                            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--admin-primary-light)', borderRadius: '12px', border: '1px solid var(--admin-primary)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--admin-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Target Account</div>
                                <div style={{ fontWeight: 700 }}>{selectedUser.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{selectedUser.email}</div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>Allowed Bots</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {botOptions.map(bot => (
                                        <div
                                            key={bot.id}
                                            onClick={() => toggleBotForUser(bot.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: `1.5px solid ${selectedBotsForUser.includes(bot.id) ? bot.color : 'var(--border-color)'}`,
                                                background: selectedBotsForUser.includes(bot.id) ? `${bot.color}15` : 'white',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                background: bot.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {selectedBotsForUser.includes(bot.id) && <CheckCircle2 size={14} color="white" />}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{bot.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add Links Permission Toggle */}
                            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ExternalLink size={18} color="var(--primary)" />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Add Links Permission</span>
                                    </div>
                                    <button
                                        onClick={() => setCanAddLinksForUser(!canAddLinksForUser)}
                                        style={{
                                            width: '48px',
                                            height: '26px',
                                            borderRadius: '13px',
                                            border: 'none',
                                            background: canAddLinksForUser ? 'var(--primary)' : '#ccc',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: 'white',
                                            position: 'absolute',
                                            top: '3px',
                                            left: canAddLinksForUser ? '25px' : '3px',
                                            transition: 'left 0.2s'
                                        }} />
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>
                                    Allow user to add links to indexed URLs. Free plan users cannot add links.
                                </p>
                            </div>

                            <button
                                onClick={handleSaveBotAccess}
                                className="admin-btn admin-btn-primary"
                                style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Saving...' : 'Save Bot Access'}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
