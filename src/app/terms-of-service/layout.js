export const metadata = {
  title: "Terms of Service - Crawl Pilot User Agreement",
  description: "View the Terms of Service for Crawl Pilot. Our agreement covers usage rules, api limits, and overall guidelines for the indexing platform.",
  alternates: {
    canonical: "/terms-of-service",
  },
  openGraph: {
    title: "Terms of Service - Crawl Pilot User Agreement",
    description: "View the Terms of Service for Crawl Pilot. Our agreement covers usage rules, api limits, and overall guidelines for the indexing platform.",
    url: "https://crawl-pilot-psi.vercel.app/terms-of-service",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
