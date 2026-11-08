import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import './CTABanner.css';

export default function CTABanner({ title = "Ready to Index Faster?", subtitle = "Start your free trial today with 100 URLs. No credit card required.", btnText = "Start FREE Trial", btnHref = "/authorize" }) {
    return (
        <section className="cta-banner">
            <div className="container">
                <div className="cta-inner">
                    <div className="cta-icon">
                        <Zap size={48} fill="currentColor" color="white" />
                    </div>
                    <div className="cta-content">
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                        <Link href={btnHref} className="btn btn-white btn-lg">
                            {btnText} <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
