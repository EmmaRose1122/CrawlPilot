'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/components/operations.module.css';

const statusLabels = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' };
const latestRequests = (requests) => [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

export function useTopupRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const controllerRef = useRef(null);

    const reload = useCallback(async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/topup', { cache: 'no-store', signal: controller.signal });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not load top-up history.');
            if (!Array.isArray(data.requests)) throw new Error('Top-up history returned an invalid response.');
            if (!controller.signal.aborted) setRequests(latestRequests(data.requests));
        } catch (err) {
            if (!controller.signal.aborted) setError(err.message || 'Could not load top-up history.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
        return () => controllerRef.current?.abort();
    }, [reload]);

    const prependRequest = (request) => {
        // Invalidate older reads, show the confirmed request, then reconcile the full history.
        controllerRef.current?.abort();
        setRequests((current) => latestRequests([request, ...current.filter((item) => item.id !== request.id)]));
        void reload();
    };

    return { requests, loading, error, reload, prependRequest };
}

function Timestamp({ value }) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return <span>Not available</span>;
    return <time dateTime={date.toISOString()}>{date.toLocaleString()}</time>;
}

export default function TopupHistory({ requests, loading, error, onRefresh, refreshDisabled = false, refreshLabel = 'Refresh history' }) {
    return (
        <section className={`panel-card ${styles.stack}`} aria-labelledby="topup-history-heading" style={{ minWidth: 0 }}>
            <div className={styles.heading}>
                <h2 id="topup-history-heading">Top-up History</h2>
                <button type="button" className="btn btn-outline" style={{ whiteSpace: 'normal', maxWidth: '100%' }} onClick={onRefresh} disabled={loading || refreshDisabled}>
                    {loading || refreshDisabled ? 'Refreshing…' : error ? 'Retry refresh' : refreshLabel}
                </button>
            </div>
            <p className={styles.meta}>Latest 20 manual credit requests. These are not payment receipts or invoices.</p>
            {loading && <p role="status">Loading top-up history…</p>}
            {error && (
                <p className={`${styles.notice} ${styles.error}`} role="alert">
                    {error} Use the refresh button to retry. Any requests shown may be out of date.
                </p>
            )}
            {!loading && !error && requests.length === 0 && (
                <p>No top-up requests yet. Submit a credit request from Billing to get started.</p>
            )}
            {requests.length > 0 && (
                <ul className={styles.stack} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {requests.map((request) => (
                        <li key={request.id} className={styles.item}>
                            <div className={styles.heading}>
                                <h3>{Number(request.amount).toLocaleString()} credits</h3>
                                <span className={styles.status}>{statusLabels[request.status] || request.status}</span>
                            </div>
                            <p className={styles.reference}>Request: {request.id}</p>
                            <p className={styles.meta}>Created: <Timestamp value={request.createdAt} /></p>
                            {request.reviewedAt && <p className={styles.meta}>Reviewed: <Timestamp value={request.reviewedAt} /></p>}
                            <p><strong>Your note</strong></p>
                            <p className={styles.prewrap}>{request.note || 'No note provided.'}</p>
                            {request.adminNote && (
                                <>
                                    <p><strong>Admin review note</strong></p>
                                    <p className={styles.prewrap}>{request.adminNote}</p>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function TopupHistoryPanel() {
    const { requests, loading, error, reload } = useTopupRequests();
    return <TopupHistory requests={requests} loading={loading} error={error} onRefresh={reload} />;
}
