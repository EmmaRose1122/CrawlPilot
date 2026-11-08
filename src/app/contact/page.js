export default function ContactPage() {
    return (
        <div className="container" style={{ padding: '120px 24px', minHeight: '80vh', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Contact Us</h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-body)', marginBottom: '2.5rem' }}>
                We'd love to hear from you. Please reach out if you have any questions about indexing, enterprise plans, or API integrations.
            </p>
            <div style={{ padding: '32px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Contact Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', width: '80px' }}>Email:</span>
                        <a href="mailto:support@crawlpilot.io" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>support@crawlpilot.io</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', width: '80px' }}>Phone:</span>
                        <span style={{ color: 'var(--text-body)' }}>+1 (555) 123-4567</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', width: '80px' }}>Address:</span>
                        <span style={{ color: 'var(--text-body)', lineHeight: '1.5' }}>400 Harbour Pl Dr<br/>Tampa, FL 33602<br/>United States</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
