export const metadata = {
  title: "Googlebot Guide - Fast SEO Indexing",
  description: "Learn how Googlebot crawls, renders, and indexes your URLs. Discover strategies for maximizing crawl budget and improving Google search visibility.",
  alternates: {
    canonical: "/understanding-bots/google",
  },
  openGraph: {
    title: "Googlebot Guide - Fast SEO Indexing",
    description: "Learn how Googlebot crawls, renders, and indexes your URLs. Discover strategies for maximizing crawl budget and improving Google search visibility.",
    url: "https://crawl-pilot.vercel.app/understanding-bots/google",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
