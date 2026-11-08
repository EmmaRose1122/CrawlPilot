'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Search,
  BarChart3,
  ShieldCheck,
  Clock,
  Database,
  ArrowRight,
  ChevronDown,
  Globe,
  PlusCircle,
  Cpu,
  CheckCircle2,
  Bot
} from 'lucide-react';
import FAQAccordion from '@/components/FAQAccordion';
import CTABanner from '@/components/CTABanner';
import HomeClient from './HomeClient';
import './home.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const faqs = [
  { question: "How does Crawl Pilot submit my URLs?", answer: "We use the submission interfaces engines actually provide: URL submission APIs where available, sitemap submission, and HTTP verification of each URL. Every engine response is stored per URL, so you see exactly what was accepted and what was rejected — no fabricated delivery reports." },
  { question: "Is this service safe for my website?", answer: "We only use documented, official submission interfaces and standard HTTP requests. No cloaking, no fake traffic, and nothing that violates engine guidelines. Submission does not guarantee indexing — the search engine still decides." },
  { question: "Can I use Crawl Pilot for bulk submissions?", answer: "Yes. Submit URLs in bulk through the dashboard or the REST API (up to 1,000 URLs per API request). Each URL is tracked separately with its own acceptance status." },
  { question: "What engines do you support?", answer: "We support the engines that expose submission interfaces: Google (Indexing API for eligible content types, plus sitemap submission) and Bing (IndexNow — which also feeds DuckDuckGo and other IndexNow participants). Other engines have no public submission API, so we do not pretend to submit to them." }
];

export default function HomePage() {
  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="hero-content"
          >
            <motion.div variants={itemVariants} className="hero-badge">
              <span className="badge-pulsar" />
              URL Submission &amp; Status Tracking
            </motion.div>
            <motion.h1 variants={itemVariants}>
              Submit Your Content <span>Smarter</span> with Crawl Pilot
            </motion.h1>
            <motion.p variants={itemVariants}>
              Submit URLs through the interfaces engines actually support — IndexNow, the Google Indexing API, and sitemap submission — then track every engine response per URL in real time.
            </motion.p>
            <motion.div variants={itemVariants} className="hero-btns">
              <Link href="/authorize" className="btn btn-primary btn-lg">
                Get Started for Free <ArrowRight size={18} />
              </Link>
              <Link href="/pricing" className="btn btn-outline btn-lg">View Pricing</Link>
            </motion.div>
            <motion.div variants={itemVariants} className="hero-metrics">
              <div className="metric">
                <strong>Per-URL</strong>
                <span>Status Tracking</span>
              </div>
              <div className="metric">
                <strong>Real</strong>
                <span>Engine Responses</span>
              </div>
              <div className="metric">
                <strong>API v1</strong>
                <span>Developer Access</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hero-graphic"
          >
            <div className="graphic-mockup">
              <div className="mockup-header">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
              <div className="mockup-content">
                <div className="console-line">Queued 12 URLs across 2 engines...</div>
                <div className="console-line active">✓ BING: HTTP 200 accepted</div>
                <div className="console-line">✓ GOOGLE: HTTP 200 accepted</div>
                <div className="console-line success">✓ Status stored per URL</div>
              </div>
            </div>
            <div className="graphic-decoration deco-1"><Zap fill="var(--primary)" size={48} /></div>
            <div className="graphic-decoration deco-2"><Search color="var(--primary)" size={48} /></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features section">
        <div className="container">
          <div className="section-header">
            <h2>Why Professional SEOs Choose <span>Crawl Pilot</span></h2>
            <p>Honest submission tooling: real engine responses, per-URL status, and no fabricated metrics.</p>
          </div>

          <div className="features-grid">
            {[
              { icon: <Clock size={32} />, title: "API-First Submission", desc: "Submit through documented interfaces (IndexNow, Google Indexing API, sitemaps) instead of waiting for a crawl cycle." },
              { icon: <Database size={32} />, title: "Bulk Management", desc: "Submit and track thousands of URLs from the dashboard or the REST API, with a separate record for each URL." },
              { icon: <Globe size={32} />, title: "Supported Engines Only", desc: "Google and Bing — the engines that expose submission interfaces. We don't claim signals we cannot send." },
              { icon: <BarChart3 size={32} />, title: "Real Response Tracking", desc: "Every engine response (HTTP status, timing, error) is stored and shown per URL — no simulated logs." },
              { icon: <Cpu size={32} />, title: "Smart Automation", desc: "Connect the API to your CMS to queue submissions automatically whenever you publish." },
              { icon: <ShieldCheck size={32} />, title: "Guideline-Safe", desc: "Only documented, white-hat submission interfaces. Submission is a request — the engine still decides what to index." }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, boxShadow: 'var(--shadow-xl)' }}
                className="feature-card"
              >
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow section bg-alt">
        <div className="container">
          <div className="workflow-layout">
            <div className="workflow-content">
              <h2>How Crawl Pilot <span>Accelerates</span> Your Growth</h2>
              <div className="workflow-steps">
                {[
                  { title: "Submit Your URLs", desc: "Upload individual links or parse a complete sitemap — each URL gets its own record." },
                  { title: "Engine Submission", desc: "URLs are sent through the official submission interfaces (IndexNow, Google Indexing API, sitemaps)." },
                  { title: "Response Capture", desc: "Every engine response — HTTP status, timing and errors — is stored per URL." },
                  { title: "Status Tracking", desc: "Monitor accepted, partial and failed submissions from the dashboard or the API." }
                ].map((s, i) => (
                  <div key={i} className="workflow-step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-text">
                      <h4>{s.title}</h4>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="workflow-visual">
              <div className="visual-circle">
                <div className="center-node"><Bot size={48} /></div>
                <div className="orbit-node node-1"><Zap size={24} /></div>
                <div className="orbit-node node-2"><Search size={24} /></div>
                <div className="orbit-node node-3"><Globe size={24} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeClient />

      <section className="faq section">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our submission and tracking technology.</p>
          </div>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <CTABanner
        title="Ready to Scale Your SEO?"
        subtitle="Start your free trial today with 100 free URLs. Experience the power of Crawl Pilot."
      />

      <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap' }}>
        <form role="search" action="/search" method="get">
            <input type="search" name="q" placeholder="Search..." />
            <button type="submit">Search</button>
        </form>
        <button id="scrollToTop" type="button" onClick={() => window.scrollTo(0,0)}>Back to Top</button>
        
        <section id="our-story">
            <h2>Our Story</h2>
            <p>Crawl Pilot was founded with a singular mission: to make web discovery fast and transparent. We built a submission platform around the interfaces search engines actually provide — IndexNow, the Google Indexing API and sitemap submission — with real per-engine response tracking.</p>
        </section>

        <section id="who-we-are">
            <h2>Who We Are</h2>
            <p>We are a highly dedicated team of SEO engineers, distributed systems experts, and AI enthusiasts. Our operations span the globe, with teams united by a passion for technical excellence and search engine transparency.</p>
        </section>

        <section id="what-we-do">
            <h2>What We Do</h2>
            <p>We build extremely optimized APIs and dashboards that broadcast URL availability directly to GoogleBot, BingBot, and AI ingestors, dramatically compressing indexing lifecycles.</p>
        </section>

        <section id="team-photos">
            <h2>Team Photos in Workspace</h2>
            <img src="/crawlpilot-workspace-team-photo.jpg" alt="Our amazing team working in our modern workspace" />
        </section>
      </div>
    </div>
  );
}
