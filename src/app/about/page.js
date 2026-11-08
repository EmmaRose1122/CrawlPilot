export default function AboutPage() {
    return (
        <div className="container" style={{ padding: '120px 24px', minHeight: '80vh', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>About Us</h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-body)', marginBottom: '2rem' }}>
                Crawl Pilot was founded with a singular mission: to make web discovery fast and equitable. By bypassing antiquated queues, we created a revolutionary signaling pipeline to help content creators everywhere receive instantaneous recognition from major search bots.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-body)' }}>
                We are a highly dedicated team of SEO engineers, distributed systems experts, and AI enthusiasts. Our operations span the globe, with teams united by a passion for technical excellence and search engine transparency.
            </p>
            <div style={{ marginTop: '3rem' }}>
                <img src="/crawlpilot-workspace-team-photo.jpg" alt="Crawl Pilot Team" style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'block', backgroundColor: 'var(--surface)' }} />
            </div>
        </div>
    );
}
