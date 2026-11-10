export const metadata = {
  title: "AI Bots Guide - ChatGPT Indexing",
  description: "Prepare your content for the AI era. Learn how OpenAI bots and ChatGPT crawl websites and how to ensure your data is included in AI responses.",
  alternates: {
    canonical: "/understanding-bots/openai",
  },
  openGraph: {
    title: "AI Bots Guide - ChatGPT Indexing",
    description: "Prepare your content for the AI era. Learn how OpenAI bots and ChatGPT crawl websites and how to ensure your data is included in AI responses.",
    url: "https://crawl-pilot-psi.vercel.app/understanding-bots/openai",
    type: "website",
    siteName: "Crawl Pilot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }]
  }
};

export default function Layout({ children }) {
  return <>{children}</>;
}
