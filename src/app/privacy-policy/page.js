'use client';
import PolicyLayout from '../legal-layout.js';
import { Eye, Lock, Shield, Database, Cookie, Globe } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <PolicyLayout
            title="Privacy Policy"
            subtitle="How we safeguard your data and privacy in the indexing era."
        >
            <article style={{ lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Database size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Data Collection</h2>
                </div>
                <p>When you register for a Crawl Pilot account, we collect personal telemetry such as your name, corporate email address, and API authentication logs. We also automatically capture technical discovery data including node IP addresses, crawler identifying strings, and endpoint latency. This data is essential for maintaining our high-authority discovery network.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Lock size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Usage of Data</h2>
                </div>
                <p>Your information is used strictly to optimize the routing of search engine bots to your submitted URLs. We analyze discovery patterns to prevent signaling fraud and to surface actionable indexing insights via your dashboard. We do not sell user telemetry to third-party data brokers.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Cookie size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Cookie Intelligence</h2>
                </div>
                <p>We use essential 'Intelligence Cookies' to maintain secure session states and API tokens. These are required for the basic operation of the Crawl Pilot platform. Optional analytics hooks may be used to improve the performance of our global signaling nodes.</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', marginTop: '40px' }}>
                    <Globe size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Third-Party Egress</h2>
                </div>
                <p>Our discovery signals are delivered to external search engine nodes (Google, Bing, OpenAI). Once a bot is signaled, the interaction between the crawler and your target URL is governed by your own site's privacy configuration and robots.txt rules.</p>

                <div className="card bg-alt" style={{ marginTop: '40px', padding: '32px' }}>
                    <h4 className="mb-2">Your Data Rights</h4>
                    <p className="text-sm mb-4">Under modern privacy frameworks, you have the right to export your crawl logs or request complete account erasure.</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <a href="/panel/profile" className="btn btn-outline btn-sm">Manage Identity</a>
                        <a href="/panel/support" className="btn btn-ghost btn-sm">Request Erasure</a>
                    </div>
                </div>
            </article>
        </PolicyLayout>
    );
}
