export const metadata = {
  title: "About Us",
  description: "Learn about Crawl Pilot, our mission to democratize fast indexing, and the team building modern SEO technology for search engines.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us",
    description: "Learn about Crawl Pilot, our mission to democratize fast indexing, and the team building modern SEO technology for search engines.",
    url: "https://crawl-pilot-psi.vercel.app/about",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
