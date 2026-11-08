export const metadata = {
  title: "API Docs - Automate Content Indexing",
  description: "Integrate Crawl Pilot's powerful indexing API directly into your workflow. Complete documentation, endpoints, and code examples for fast indexing.",
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "API Docs - Automate Content Indexing",
    description: "Integrate Crawl Pilot's powerful indexing API directly into your workflow. Complete documentation, endpoints, and code examples for fast indexing.",
    url: "https://crawl-pilot.vercel.app/api-docs",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
