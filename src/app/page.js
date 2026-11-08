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
  { question: "How does Crawl Pilot achieve fast indexing?", answer: "We leverage a proprietary network of high-authority discovery nodes that signal search engine crawlers (GoogleBot, BingBot, etc.) to visit your URLs immediately. This bypasses the traditional 'waiting queue' and places your content on the priority crawl list." },
  { question: "Is this service safe for my website?", answer: "Absolutely. Crawl Pilot uses legitimate API protocols and standard crawler behavior. We don't use 'black hat' techniques or anything that violates search engine guidelines. We simply facilitate discovery." },
  { question: "Can I use Crawl Pilot for mass link indexing?", answer: "Yes, our platform is designed for scale. Whether you have 100 or 1,000,000 URLs, our infrastructure can handle mass submissions through our dashboard or REST API." },
  { question: "What search engines do you support?", answer: "We primarily target Google and Bing, but our signaling also impacts other engines like DuckDuckGo, Yahoo, and modern AI engines like OpenAI's ChatGPT browsing bot." }
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
              Next-Gen Indexing Protocol
            </motion.div>
            <motion.h1 variants={itemVariants}>
              Index Your Content <span>Instantly</span> with Crawl Pilot
            </motion.h1>
            <motion.p variants={itemVariants}>
              Don't wait weeks for search engines to find your pages. Our lightning-fast indexing technology delivers GoogleBot and BingBot to your doorstep in real-time.
            </motion.p>
            <motion.div variants={itemVariants} className="hero-btns">
              <Link href="/authorize" className="btn btn-primary btn-lg">
                Get Started for Free <ArrowRight size={18} />
              </Link>
              <Link href="/pricing" className="btn btn-outline btn-lg">View Pricing</Link>
            </motion.div>
            <motion.div variants={itemVariants} className="hero-metrics">
              <div className="metric">
                <strong>1M+</strong>
                <span>URLs Indexed</span>
              </div>
              <div className="metric">
                <strong>99.9%</strong>
                <span>Bot Delivery</span>
              </div>
              <div className="metric">
                <strong>24/7</strong>
                <span>Monitoring</span>
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
                <div className="console-line">Processing URL discovery...</div>
                <div className="console-line active">✓ Signaling GoogleBot (66.249.79.12x)</div>
                <div className="console-line">✓ Content ingested by ChatGPT Bot</div>
                <div className="console-line success">✓ 100% Indexing Efficiency Achieved</div>
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
            <p>Our infrastructure is built for speed, transparency, and results.</p>
          </div>

          <div className="features-grid">
            {[
              { icon: <Clock size={32} />, title: "Instant Discovery", desc: "Why wait weeks? We signal search engine crawlers to visit your new URLs within minutes of submission." },
              { icon: <Database size={32} />, title: "Bulk Management", desc: "Easily submit and track millions of URLs simultaneously using our intuitive dashboard or powerful API." },
              { icon: <Globe size={32} />, title: "Multi-Engine Support", desc: "One platform for all. We optimize discovery for Google, Bing, and AI-powered search engines." },
              { icon: <BarChart3 size={32} />, title: "Live Bot Tracking", desc: "See exactly when search bots visit your site with our real-time crawl logs and visit analytics." },
              { icon: <Cpu size={32} />, title: "Smart Automation", desc: "Integrate our API with your CMS to automatically trigger indexing every time you publish." },
              { icon: <ShieldCheck size={32} />, title: "Risk-Free Results", desc: "We use standard white-hat signaling protocols that are 100% safe for your domain's health." }
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
                  { title: "Submit Your URLs", desc: "Upload individual links or a complete sitemap directly to our cloud engine." },
                  { title: "Discovery Signaling", desc: "Our network creates immediate pathways for search engine bots to find your content." },
                  { title: "Bot Delivery", desc: "Watch in real-time as GoogleBot and BingBot arrive to crawl your pages." },
                  { title: "Search Indexing", desc: "Search engines process your content and integrate it into their primary index." }
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
            <p>Everything you need to know about our indexing technology.</p>
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
            <p>Crawl Pilot was founded with a singular mission: to make web discovery fast and equitable. By bypassing antiquated queues, we created a revolutionary signaling pipeline to help content creators everywhere receive instantaneous recognition from major search bots.</p>
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
