'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

const guides = [
    {
        title: "Search Engine Indexing Basics",
        text: "For better organic online visibility, it's crucial to get your website indexed by search engines like Google, Microsoft Bing, DuckDuckGo, Baidu or others. Search engine indexing is a process where a search engine includes your site's content into its catalog, allowing users to search for it globally. When you submit your site for indexing, a search engine's indexing software starts to crawl your site's pages. It examines the content and indexes them accordingly. Crawl Pilot's services help ensure that your website is indexed at the domain level, with all your web pages being crawled and indexed.",
    },
    {
        title: "The Art of Search Engine Crawling",
        text: "Search engine crawling is the activity where a search engine's bots browse through web pages and categorize them according to their content into an index. It is an essential step in the process of making your website visible in the organic SERPs. You can make a request to Google to crawl your site immediately through Crawl Pilot. Services such as Crawl Pilot that allow test crawling of websites will aid in simulating the action and finding potential barriers to effective crawling.",
    },
    {
        title: "Global Submission Strategies",
        text: "To make your content easily visible globally, submitting your website to Google and other search engines is essential, especially for new websites. This involves adding your website to Google's index queue. You can submit your site through Crawl Pilot by submitting your entire domain or specific URLs. Bulk link indexers allow multiple sites indexed at once, saving time and effort. Crawl Pilot is a must-have tool for any SEO manager to stay on top of indexation status.",
    },
];

export default function HomeClient() {
    const [expanded, setExpanded] = useState({});

    const toggle = (i) => {
        setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
    };

    return (
        <section className="guide-section section bg-alt" id="search-guide">
            <div className="container" style={{ maxWidth: '1000px' }}>
                <div className="section-header">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '12px' }}>
                        <BookOpen size={20} /> Knowledge Base
                    </div>
                    <h2>Indexing <span>Deep Dive</span></h2>
                    <p>Master the mechanics of search engine discovery.</p>
                </div>

                <div className="guide-grid">
                    {guides.map((g, i) => (
                        <motion.article
                            key={i}
                            layout
                            className={`panel-card guide-article ${expanded[i] ? 'is-expanded' : ''}`}
                            style={{ marginBottom: '16px', cursor: 'pointer' }}
                            onClick={() => toggle(i)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', flex: 1 }}>{g.title}</h4>
                                {expanded[i] ? <ChevronUp size={20} color="var(--primary)" /> : <ChevronDown size={20} color="var(--text-light)" />}
                            </div>

                            <AnimatePresence>
                                {expanded[i] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <p style={{ marginTop: '16px', marginBottom: 0, fontSize: '0.95rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
                                            {g.text}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
