export const metadata = {
  title: "My Referrals - Track Your Bonus Credits",
  description: "Track your Crawl Pilot referral performance. Monitor how many users signed up with your link and see your accumulated free indexing credits.",
  alternates: {
    canonical: "/panel/referral",
  },
  openGraph: {
    title: "My Referrals - Track Your Bonus Credits",
    description: "Track your Crawl Pilot referral performance. Monitor how many users signed up with your link and see your accumulated free indexing credits.",
    url: "https://crawl-pilot-psi.vercel.app/panel/referral",
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
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>Referral Program</h1>
      {children}
    </>
  );
}
