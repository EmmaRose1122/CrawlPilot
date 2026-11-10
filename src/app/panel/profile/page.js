'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Lock,
    Shield,
    Save,
    HardDrive,
    Loader2,
    Code,
    Copy,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';

export default function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [googleIndexingConfig, setGoogleIndexingConfig] = useState('');
    const [savingConfig, setSavingConfig] = useState(false);
    const [copied, setCopied] = useState(false);
    const [nameValue, setNameValue] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [identityMsg, setIdentityMsg] = useState({ type: '', text: '' });
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [isSavingIdentity, setIsSavingIdentity] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [gscProperties, setGscProperties] = useState(null);
    const [gscError, setGscError] = useState('');
    const [isCheckingGsc, setIsCheckingGsc] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                const data = await res.json();
                if (!data.error) {
                    setProfile(data);
                    setNameValue(data.name || '');
                    setGoogleIndexingConfig(data.googleIndexingConfig || '');
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveIdentity = async (e) => {
        e.preventDefault();
        setIsSavingIdentity(true);
        setIdentityMsg({ type: '', text: '' });
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameValue })
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(prev => ({ ...prev, name: nameValue }));
                setIdentityMsg({ type: 'success', text: 'Profile updated.' });
            } else {
                setIdentityMsg({ type: 'error', text: data.error || 'Failed to update profile.' });
            }
        } catch {
            setIdentityMsg({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setIsSavingIdentity(false);
        }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setIsSavingPassword(true);
        setPasswordMsg({ type: '', text: '' });
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setCurrentPassword('');
                setNewPassword('');
                setPasswordMsg({ type: 'success', text: 'Password updated.' });
            } else {
                setPasswordMsg({ type: 'error', text: data.error || 'Failed to update password.' });
            }
        } catch {
            setPasswordMsg({ type: 'error', text: 'Failed to update password.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleSaveIndexingConfig = async () => {
        setSavingConfig(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleIndexingConfig })
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else alert('Google Indexing Configuration saved successfully.');
        } catch (err) {
            alert('Failed to save configuration.');
        } finally {
            setSavingConfig(false);
        }
    };

    const checkSearchConsole = async () => {
        setIsCheckingGsc(true);
        setGscError('');
        setGscProperties(null);
        try {
            const res = await fetch('/api/indexing/google/properties');
            const data = await res.json();
            if (res.ok) {
                setGscProperties(data.properties || []);
            } else {
                setGscError(data.message || data.error || 'Failed to load Search Console properties');
            }
        } catch {
            setGscError('Failed to load Search Console properties');
        } finally {
            setIsCheckingGsc(false);
        }
    };

    const getServiceAccountEmail = () => {
        if (!googleIndexingConfig) return null;
        try {
            const parsed = JSON.parse(googleIndexingConfig);
            return parsed.client_email || null;
        } catch {
            return null;
        }
    };

    const copyEmail = () => {
        const email = getServiceAccountEmail();
        if (email) {
            navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const serviceAccountEmail = getServiceAccountEmail();

    if (isLoading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="profile-panel">
            <div className="panel-page-header">
                <h1 className="panel-page-title">Identity & Security</h1>
                <p className="panel-page-subtitle">Manage your account credentials and security preferences.</p>
            </div>

            <div className="grid grid-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="panel-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Basic Information</h2>
                    </div>

                    <form onSubmit={handleSaveIdentity}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" className="input" value={nameValue} onChange={(e) => setNameValue(e.target.value)} style={{ paddingLeft: '40px', width: '100%' }} />
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Account Email</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="email" className="input" defaultValue={profile?.email || ""} readOnly style={{ paddingLeft: '40px', background: 'var(--bg-light)', width: '100%' }} />
                                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-light)' }} />
                                </div>
                                <p className="text-xs text-muted mt-2">To change your email, contact engineering support.</p>
                            </div>
                            {identityMsg.text && (
                                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: identityMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: identityMsg.type === 'success' ? '#16a34a' : '#dc2626' }}>
                                    {identityMsg.text}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" disabled={isSavingIdentity}>
                                {isSavingIdentity ? 'Saving...' : <><Save size={16} /> Save Identity Changes</>}
                            </button>
                        </div>
                    </form>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="panel-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#fff3e0', color: '#ff9800', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Security & Password</h2>
                    </div>

                    <form onSubmit={handleSavePassword}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Current Password</label>
                                <input type="password" className="input" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}>New Password (min 8 characters)</label>
                                <input type="password" className="input" placeholder="New strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            {passwordMsg.text && (
                                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: passwordMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: passwordMsg.type === 'success' ? '#16a34a' : '#dc2626' }}>
                                    {passwordMsg.text}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary btn-outline" disabled={isSavingPassword || !newPassword}>
                                {isSavingPassword ? 'Updating...' : <><Shield size={16} /> Update Security Key</>}
                            </button>
                        </div>
                    </form>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="panel-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <HardDrive size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Data & Privacy</h3>
                    </div>
                    <p className="text-sm text-muted mb-4">Self-service data export and account deletion are not available. Open a support ticket to request help; submitting a ticket does not delete your account.</p>
                    <a href="/panel/support" className="btn btn-outline">Contact support</a>
                </motion.div>
            </div>

            <div className="grid grid-1 gap-4 mt-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="panel-card"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Code size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Google Indexing API</h2>
                            <p className="text-sm text-light">Provide your Google Service Account JSON key to use your own indexing quota.</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
                            Service Account JSON Key
                        </label>
                        <textarea
                            className="input"
                            rows={8}
                            placeholder='{"type": "service_account", "project_id": "...", "client_email": "...@....iam.gserviceaccount.com", ...}'
                            value={googleIndexingConfig}
                            onChange={(e) => setGoogleIndexingConfig(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: '0.8rem', width: '100%' }}
                        />

                        {serviceAccountEmail && (
                            <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(66, 133, 244, 0.06)', borderRadius: '12px', border: '1px solid rgba(66, 133, 244, 0.2)' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                                    ✅ Valid JSON — Service Account Email Detected
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <code style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700, color: '#4285F4', wordBreak: 'break-all', background: 'rgba(66,133,244,0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                                        {serviceAccountEmail}
                                    </code>
                                    <button
                                        onClick={copyEmail}
                                        className="btn btn-sm"
                                        style={{ background: copied ? 'var(--success)' : '#4285F4', color: 'white', border: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy Email</>}
                                    </button>
                                </div>
                                <div style={{ marginTop: '10px', padding: '10px 14px', background: '#fff3e0', borderRadius: '8px', fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                                    ⚠️ <strong>Important:</strong> Copy this email and add it as <strong>&quot;Owner&quot;</strong> in{' '}
                                    <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', textDecoration: 'underline' }}>
                                        Google Search Console → Settings → Users & Permissions
                                    </a>. Without this step, Google will ignore all indexing requests.
                                </div>
                            </div>
                        )}

                        {googleIndexingConfig && !serviceAccountEmail && (
                            <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fee2e2', borderRadius: '8px', fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                                ❌ Invalid JSON — Please paste the complete contents of your Google Service Account JSON file.
                            </div>
                        )}

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '12px' }}>
                            Need a key?{' '}
                            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                Google Cloud Console → APIs & Services → Credentials
                            </a>{' '}→ Create Service Account → Download JSON.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={handleSaveIndexingConfig}
                        disabled={savingConfig}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {savingConfig ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Google API Config</>}
                    </button>

                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-outline" onClick={checkSearchConsole} disabled={isCheckingGsc || savingConfig || !googleIndexingConfig}>
                                {isCheckingGsc ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                <span style={{ marginLeft: '6px' }}>{isCheckingGsc ? 'Checking...' : 'Check Search Console access'}</span>
                            </button>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                Required for sitemap submission and URL Inspection.
                            </span>
                        </div>

                        {gscError && (
                            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                {gscError}
                            </div>
                        )}

                        {gscProperties && (
                            gscProperties.length > 0 ? (
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>Properties:</span>
                                    {gscProperties.map((property) => (
                                        <span key={property.siteUrl} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                                            {property.siteUrl} · {property.permissionLevel}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', color: '#92400e', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    No Search Console properties found. Add <strong>{serviceAccountEmail || 'the service account'}</strong> as an Owner in Search Console → Settings → Users &amp; Permissions.
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
