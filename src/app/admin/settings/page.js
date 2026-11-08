'use client';
import { motion } from 'framer-motion';
import { Settings, Shield, Server, Globe, Bell, Save } from 'lucide-react';

export default function AdminSettingsPage() {
    return (
        <div className="admin-settings">
            <div className="admin-page-header">
                <h1 className="admin-page-title">System Settings</h1>
                <p className="text-muted">Configure platform-wide discovery parameters and security.</p>
            </div>

            <div className="admin-card" style={{ marginBottom: '24px', borderColor: '#fde68a', background: '#fffbeb', color: '#92400e' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                    Settings on this page are read-only in this release — they are not saved to the database yet.
                </p>
            </div>

            <div className="grid grid-2 gap-8">
                <fieldset disabled style={{ border: 'none', margin: 0, padding: 0, opacity: 0.6 }}>
                <div className="admin-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Globe size={20} color="var(--admin-primary)" />
                        <h3 style={{ margin: 0 }}>Discovery Node Config</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Global Crawl Rate (signals/min)</label>
                            <input type="number" className="input" defaultValue="5000" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Node Rotation Policy</label>
                            <select className="input" style={{ width: '100%' }}>
                                <option>Aggressive (Every 5 mins)</option>
                                <option>Balanced (Every 30 mins)</option>
                                <option>Stable (Every 4 hours)</option>
                            </select>
                        </div>
                        <button className="admin-btn admin-btn-primary" style={{ width: 'fit-content' }}>
                            <Save size={16} /> Save Node Config
                        </button>
                    </div>
                </div>

                <div className="admin-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Shield size={20} color="var(--admin-primary)" />
                        <h3 style={{ margin: 0 }}>Security & API</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>Enable API V2</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Allow users to use the new REST endpoints</div>
                            </div>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>Bot Impersonation Detection</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Filter out fake scrapers from analytics</div>
                            </div>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>Maintenance Mode</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Disable all indexing submissions</div>
                            </div>
                            <input type="checkbox" />
                        </div>
                    </div>
                </div>
                </fieldset>
            </div>
        </div>
    );
}
