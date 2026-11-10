export const metadata = {
  title: "Sign Up - Start Indexing URLs Faster Today",
  description: "Create your Crawl Pilot account today to start indexing your backlinks and pages faster with Google, Bing, and other search engines.",
  alternates: {
    canonical: "/signup",
  },
  openGraph: {
    title: "Sign Up - Start Indexing URLs Faster Today",
    description: "Create your Crawl Pilot account today to start indexing your backlinks and pages faster with Google, Bing, and other search engines.",
    url: "https://crawl-pilot-psi.vercel.app/signup",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return (
    <>
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>Sign Up for Crawl Pilot</h1>
      {children}
    </>
  );
}
