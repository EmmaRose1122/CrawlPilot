export const metadata = {
  title: "FAQ - Fast Indexing & Bot Discovery",
  description: "Got questions about URL indexing? Our FAQ covers everything from Googlebot discovery, index rates, and how Crawl Pilot accelerates your technical SEO.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "FAQ - Fast Indexing & Bot Discovery",
    description: "Got questions about URL indexing? Our FAQ covers everything from Googlebot discovery, index rates, and how Crawl Pilot accelerates your technical SEO.",
    url: "https://crawl-pilot.vercel.app/faq",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
