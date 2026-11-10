export const metadata = {
  title: "Sign In - Dashboard Access",
  description: "Log in to your Crawl Pilot account to manage your indexing campaigns, track bot activity in real-time, and view your URL indexing history.",
  alternates: {
    canonical: "/authorize",
  },
  openGraph: {
    title: "Sign In - Dashboard Access",
    description: "Log in to your Crawl Pilot account to manage your indexing campaigns, track bot activity in real-time, and view your URL indexing history.",
    url: "https://crawl-pilot-psi.vercel.app/authorize",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
