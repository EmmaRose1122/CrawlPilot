import { Noto_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionWrapper from '@/components/SessionWrapper';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-noto',
});

export const metadata = {
  title: {
    default: "Crawl Pilot - #1 Backlink Indexer & Fast URL Indexing Service",
    template: "%s | Crawl Pilot",
  },
  description: "Crawl Pilot accelerates Google, Bing, and ChatGPT indexing with live crawl monitoring and detailed bot logs. Get your content discovered instantly.",
  keywords: ["backlink indexer", "fast indexing", "Google indexing", "Bing indexing", "SEO", "URL indexer", "crawl monitoring", "backlink indexing service", "instant indexing", "SEO automation", "AEO", "GEO"],
  authors: [{ name: "Crawl Pilot", url: "https://crawlpilot.io" }],
  metadataBase: new URL('https://crawl-pilot.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://crawl-pilot.vercel.app",
    siteName: "Crawl Pilot",
    title: "Crawl Pilot - #1 Backlink Indexer & Fast URL Indexing Service",
    description: "Crawl Pilot accelerates Google, Bing, and ChatGPT indexing with real-time crawl monitoring and detailed bot logs.",
    images: [
      {
        url: "/og-image.png", // We should create or provide this
        width: 1200,
        height: 630,
        alt: "Crawl Pilot - Instant Search Engine Indexing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crawl Pilot - #1 Backlink Indexer",
    description: "Crawl Pilot accelerates your indexing with real-time crawl monitoring.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "krhojpmmBI7crq1rvyGST27wZME_h2xocbZwE17wXVM",
  },
  category: 'SEO Tool',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={notoSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Crawl Pilot",
                "operatingSystem": "All",
                "applicationCategory": "SEOApplication",
                "description": "Fast URL indexing service for Google, Bing, and ChatGPT",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "URL Indexing Service",
                "serviceType": "SEO Optimization",
                "provider": {
                  "@type": "Organization",
                  "name": "Crawl Pilot"
                },
                "description": "Accelerates search engine crawling and indexing for URLs and backlinks.",
                "offers": {
                  "@type": "Offer",
                  "price": "0.00",
                  "priceCurrency": "USD",
                  "description": "Start with 100 free URL indexing credits"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Crawl Pilot",
                "url": "https://crawl-pilot.vercel.app",
                "logo": "https://crawl-pilot.vercel.app/logo.png",
                "description": "Fast URL indexing service for Google, Bing, and ChatGPT",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "400 Harbour Pl Dr",
                  "addressLocality": "Tampa",
                  "addressRegion": "FL",
                  "postalCode": "33602",
                  "addressCountry": "US",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Crawl Pilot",
                "url": "https://crawl-pilot.vercel.app",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://crawl-pilot.vercel.app/blog?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "itemListElement": [
                  { "@type": "SiteNavigationElement", "position": 1, "name": "Pricing", "url": "https://crawl-pilot.vercel.app/pricing" },
                  { "@type": "SiteNavigationElement", "position": 2, "name": "API Docs", "url": "https://crawl-pilot.vercel.app/api-docs" },
                  { "@type": "SiteNavigationElement", "position": 3, "name": "FAQ", "url": "https://crawl-pilot.vercel.app/faq" },
                  { "@type": "SiteNavigationElement", "position": 4, "name": "Blog", "url": "https://crawl-pilot.vercel.app/blog" }
                ]
              }
            ]),
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-noto)' }} suppressHydrationWarning>
        <SessionWrapper>
          <Header />
          <main>{children}</main>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
