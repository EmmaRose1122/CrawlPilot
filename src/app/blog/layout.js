export const metadata = {
  title: "Blog - Expert SEO & Indexing Insights",
  description: "Read the latest insights on technical SEO, bot discovery, and how to get your content indexed faster on Google, Bing, and AI search engines.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog - Expert SEO & Indexing Insights",
    description: "Read the latest insights on technical SEO, bot discovery, and how to get your content indexed faster on Google, Bing, and AI search engines.",
    url: "https://crawl-pilot-psi.vercel.app/blog",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
