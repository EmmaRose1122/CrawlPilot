export const metadata = {
  title: "Account Settings - Manage Your Profile",
  description: "Manage your Crawl Pilot account settings, update your profile details, and configure your notification preferences for indexing completion.",
  alternates: {
    canonical: "/panel/profile",
  },
  openGraph: {
    title: "Account Settings - Manage Your Profile",
    description: "Manage your Crawl Pilot account settings, update your profile details, and configure your notification preferences for indexing completion.",
    url: "https://crawl-pilot-psi.vercel.app/panel/profile",
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
      <h1 className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>Profile Settings</h1>
      {children}
    </>
  );
}
