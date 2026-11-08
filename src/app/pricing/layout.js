export const metadata = {
  title: "Pricing Plans - Flexible Indexing",
  description: "Choose the perfect indexing plan for your needs. Crawl Pilot offers transparent pricing with no hidden fees for fast URL and backlink indexing.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing Plans - Flexible Indexing",
    description: "Choose the perfect indexing plan for your needs. Crawl Pilot offers transparent pricing with no hidden fees for fast URL and backlink indexing.",
    url: "https://crawl-pilot.vercel.app/pricing",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
