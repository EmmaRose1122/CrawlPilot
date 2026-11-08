'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './FAQAccordion.css';

export default function FAQAccordion({ items }) {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": items.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };

    return (
        <div className="faq-list">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            {items.map((item, i) => (
                <div key={i} className={`faq-item panel-card ${openIndex === i ? 'is-open' : ''}`} style={{ marginBottom: '12px', padding: 0, overflow: 'hidden' }}>
                    <button
                        className="faq-question"
                        onClick={() => toggle(i)}
                        aria-expanded={openIndex === i}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, flex: 1, color: openIndex === i ? 'var(--primary)' : 'var(--text-dark)' }}>{item.question}</span>
                        <motion.div
                            animate={{ rotate: openIndex === i ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            style={{ color: openIndex === i ? 'var(--primary)' : 'var(--text-light)' }}
                        >
                            <ChevronDown size={20} />
                        </motion.div>
                    </button>

                    <AnimatePresence>
                        {openIndex === i && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="faq-answer" style={{ padding: '0 24px 24px', fontSize: '0.95rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
                                    <p>{item.answer}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
