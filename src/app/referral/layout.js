export const metadata = {
  title: "Crawl Pilot Referral Program - Earn Credits",
  description: "Join the Crawl Pilot referral program and earn free indexing credits. Invite friends to get their backlinks indexed faster and get rewarded.",
  alternates: {
    canonical: "/referral",
  },
  openGraph: {
    title: "Crawl Pilot Referral Program - Earn Credits",
    description: "Join the Crawl Pilot referral program and earn free indexing credits. Invite friends to get their backlinks indexed faster and get rewarded.",
    url: "https://crawl-pilot.vercel.app/referral",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
