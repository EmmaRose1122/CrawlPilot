export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the Crawl Pilot team. We are here to help you resolve your SEO indexing challenges.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us",
    description: "Get in touch with the Crawl Pilot team. We are here to help you resolve your SEO indexing challenges.",
    url: "https://crawl-pilot-psi.vercel.app/contact",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
