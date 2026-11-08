export const metadata = {
  title: "Support & Help Center",
  description: "Need help with URL indexing? Contact the Crawl Pilot support team for assistance with your account, API integration, or technical SEO questions.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "Support & Help Center",
    description: "Need help with URL indexing? Contact the Crawl Pilot support team for assistance with your account, API integration, or technical SEO questions.",
    url: "https://crawl-pilot.vercel.app/support",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
