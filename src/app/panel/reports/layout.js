export const metadata = {
  title: "Daily Indexing Report | Dashboard",
  description: "Review the last 24 hours of background indexing submissions, engine results, queue health and a seven-day trend.",
  alternates: {
    canonical: "/panel/reports",
  },
  robots: {
    index: false,
    follow: false,
  }
};

export default function Layout({ children }) {
  return children;
}
