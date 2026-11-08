export default function manifest() {
    return {
        name: 'Crawl Pilot',
        short_name: 'CrawlPilot',
        description: 'Fast URL indexing service for Google, Bing, and ChatGPT',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
