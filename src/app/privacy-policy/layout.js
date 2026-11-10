export const metadata = {
  title: "Privacy Policy - Crawl Pilot Data Protection",
  description: "Read the Crawl Pilot Privacy Policy to learn how we protect your data, handle your information, and ensure your absolute security.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy - Crawl Pilot Data Protection",
    description: "Read the Crawl Pilot Privacy Policy to learn how we protect your data, handle your information, and ensure your absolute security.",
    url: "https://crawl-pilot-psi.vercel.app/privacy-policy",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
