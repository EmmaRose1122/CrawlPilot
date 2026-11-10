import Link from 'next/link';
import { TopupHistoryPanel } from '@/components/TopupHistory';
import styles from '@/components/operations.module.css';

export const metadata = { title: 'Top-up History | Dashboard' };

export default function PaymentsPage() {
    return (
        <div className={`${styles.scope} ${styles.stack}`} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <div className="panel-page-header">
                <h1 className="panel-page-title">Top-up History</h1>
                <p className="panel-page-subtitle">Track manual credit requests and admin review decisions.</p>
            </div>
            <div className={styles.actions}>
                <Link href="/panel/billing" className="btn btn-primary" style={{ whiteSpace: 'normal', maxWidth: '100%' }}>Request credits in Billing</Link>
            </div>
            <p className={styles.notice}>No online payments are processed here. This is a history of manual credit requests, not payment receipts or invoices.</p>
            <TopupHistoryPanel />
        </div>
    );
}
