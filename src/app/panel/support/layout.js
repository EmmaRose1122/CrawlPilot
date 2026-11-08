export const metadata = {
  title: "Get Support - Account Help and Guidance",
  description: "Access the Crawl Pilot support center from your dashboard. Open a ticket with our team for personalized assistance with indexing and account issues.",
  alternates: {
    canonical: "/panel/support",
  },
  openGraph: {
    title: "Get Support - Account Help and Guidance",
    description: "Access the Crawl Pilot support center from your dashboard. Open a ticket with our team for personalized assistance with indexing and account issues.",
    url: "https://crawl-pilot.vercel.app/panel/support",
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
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>Get Support</h1>
      {children}
    </>
  );
}
