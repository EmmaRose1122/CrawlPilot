'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Zap,
    Github,
    Twitter,
    Linkedin,
    Mail,
    ChevronRight,
    Heart
} from 'lucide-react';
import './Footer.css';

export default function Footer() {
    const pathname = usePathname();
    if (pathname.startsWith('/panel')) return null;

    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link href="/" className="logo footer-logo">
                            <Zap className="logo-icon" size={24} fill="currentColor" />
                            Crawl <span>Pilot</span>
                        </Link>
                        <p className="footer-tagline">
                            Empowering search visibility through lightning-fast indexing and real-time crawl intelligence.
                        </p>
                        <div className="social-links">
                            <a href="https://twitter.com/crawlpilot" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><Twitter size={20} /></a>
                            <a href="https://linkedin.com/company/crawlpilot" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>
                            <a href="https://github.com/crawlpilot" aria-label="GitHub" target="_blank" rel="noopener noreferrer"><Github size={20} /></a>
                            <a href="https://facebook.com/crawlpilot" aria-label="Facebook" target="_blank" rel="noopener noreferrer" style={{display: 'none'}}>Facebook</a>
                            <a href="https://youtube.com/crawlpilot" aria-label="YouTube" target="_blank" rel="noopener noreferrer" style={{display: 'none'}}>YT</a>
                            <a href="https://instagram.com/crawlpilot" aria-label="Instagram" target="_blank" rel="noopener noreferrer" style={{display: 'none'}}>IG</a>
                            <a href="https://pinterest.com/crawlpilot" aria-label="Pinterest" target="_blank" rel="noopener noreferrer" style={{display: 'none'}}>Pin</a>
                            <a href="https://tiktok.com/@crawlpilot" aria-label="TikTok" target="_blank" rel="noopener noreferrer" style={{display: 'none'}}>TikTok</a>
                            <a href="/feed.xml" aria-label="RSS Feed" target="_blank" rel="noopener noreferrer" style={{display: 'none'}}>RSS</a>
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                            <p>Email: <a href="mailto:support@crawlpilot.io" style={{ color: 'inherit' }}>support@crawlpilot.io</a></p>
                            <p>Phone: +1 (555) 123-4567</p>
                            <p>
                                <a href="https://www.dmca.com/Protection/Status.aspx" target="_blank" rel="noopener noreferrer">
                                    <img src="https://images.dmca.com/Badges/dmca-badge-w100-5x1-01.png" alt="DMCA.com Protection Status" style={{ marginTop: '8px' }} />
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="footer-links">
                        <h4>Solutions</h4>
                        <ul>
                            <li><Link href="/understanding-bots/google"><ChevronRight size={14} /> Google Indexing</Link></li>
                            <li><Link href="/understanding-bots/bing"><ChevronRight size={14} /> Bing Indexing</Link></li>
                            <li><Link href="/understanding-bots/openai"><ChevronRight size={14} /> AI Engine Bots</Link></li>
                            <li><Link href="/api-docs"><ChevronRight size={14} /> API Access</Link></li>
                            <li><Link href="/about"><ChevronRight size={14} /> About Us</Link></li>
                            <li><Link href="/contact"><ChevronRight size={14} /> Contact Us</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Support</h4>
                        <ul>
                            <li><Link href="/faq"><ChevronRight size={14} /> Help Center</Link></li>
                            <li><Link href="/support"><ChevronRight size={14} /> Contact Support</Link></li>
                            <li><Link href="/blog"><ChevronRight size={14} /> Engineering Blog</Link></li>
                            <li><Link href="/referral"><ChevronRight size={14} /> Referral Matrix</Link></li>
                            <li><Link href="/sitemap.xml"><ChevronRight size={14} /> Sitemap</Link></li>
                        </ul>
                    </div>

                    <div className="footer-links">
                        <h4>Legal</h4>
                        <ul>
                            <li><Link href="/privacy-policy"><ChevronRight size={14} /> Privacy Policy</Link></li>
                            <li><Link href="/terms-of-service"><ChevronRight size={14} /> Terms of Service</Link></li>
                            <li><Link href="/faq#safety"><ChevronRight size={14} /> Data Integrity</Link></li>
                        </ul>
                    </div>

                    <div className="footer-newsletter">
                        <h4>Newsletter</h4>
                        <p>Get latest SEO updates.</p>
                        <div className="newsletter-form">
                            <input type="email" placeholder="Email address" className="input" />
                            <button className="btn btn-primary btn-icon"><Mail size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} Crawl Pilot. All rights reserved.</p>
                    <div className="made-with">
                        Built with <Heart size={14} fill="#EF4444" color="#EF4444" /> for SEO Engineers worldwide.
                    </div>
                </div>
            </div>
        </footer>
    );
}
