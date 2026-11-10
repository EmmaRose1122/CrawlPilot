export const metadata = {
  title: "Dashboard Overview - Crawl Pilot Activity",
  description: "View your real-time URL indexing activity, track bot signals, monitor remaining credits, and see successful indexing deliveries on Crawl Pilot.",
  alternates: {
    canonical: "/panel/overview",
  },
  openGraph: {
    title: "Dashboard Overview - Crawl Pilot Activity",
    description: "View your real-time URL indexing activity, track bot signals, monitor remaining credits, and see successful indexing deliveries on Crawl Pilot.",
    url: "https://crawl-pilot-psi.vercel.app/panel/overview",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function Layout({ children }) {
  return (
    <>
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>Dashboard Overview</h1>
      {children}
    </>
  );
}
