'use client';
import PolicyLayout from '../legal-layout.js';
import { FileText, ShieldAlert, Zap, Edit3, Scale, Trash2 } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <PolicyLayout
            title="Terms of Service"
            subtitle="The governing guidelines for high-performance discovery signaling."
        >
            <article style={{ lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Zap size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Service Provision</h2>
                </div>
                <p>Crawl Pilot provides URL discovery signaling services designed to accelerate search engine bot discovery. Our network notifies major search indexers (including Google and Bing) of your content's presence. While we ensure the successful delivery of discovery signals, final indexing and ranking remain at the sole discretion of the search engine algorithms.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <ShieldAlert size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Intellectual Engineering</h2>
                </div>
                <p>The Crawl Pilot platform, including its proprietary signaling logic, discovery console, and API architecture, is the intellectual property of Crawl Pilot. You are granted a limited, non-transferable license to utilize these tools for legitimate SEO and marketing operations.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Edit3 size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Service Iteration</h2>
                </div>
                <p>We continuously optimize our signaling nodes. We reserve the right to modify, evolve, or temporarily suspend specific discovery features as required by changes in search engine crawler behaviors or network requirements.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Scale size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Limitation of Liability</h2>
                </div>
                <p>Crawl Pilot is a discovery tool. We are not liable for changes in search rankings, crawl budget penalties, or indirect business losses resulting from the use of our discovery signaling. Usage of our API constitutes acceptance of these performance boundaries.</p>

                <div className="card" style={{ marginTop: '40px', borderColor: 'var(--primary-light)', borderWidth: '2px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--primary)', fontWeight: 800, marginBottom: '8px' }}>
                        <FileText size={20} /> LEGAL COMPLIANCE
                    </div>
                    <p className="text-sm">These terms constitute the entire agreement between the user and Crawl Pilot. Continued use of the discovery engine after policy updates signifies acceptance of the revised governing terms.</p>
                </div>
            </article>
        </PolicyLayout>
    );
}
