'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/components/operations.module.css';

const STATUS_LABELS = {
    submitted: 'Submitted',
    partial: 'Partial',
    failed: 'Failed',
    queued: 'Queued',
    processing: 'Processing',
};

function Timestamp({ value }) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return <span>Not available</span>;
    return <time dateTime={date.toISOString()}>{date.toLocaleString()}</time>;
}

export default function ReportsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const controllerRef = useRef(null);

    const load = useCallback(async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/user/report', { cache: 'no-store', signal: controller.signal });
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(body?.error || 'Could not load the report.');
            if (!controller.signal.aborted) setData(body);
        } catch (err) {
            if (!controller.signal.aborted) setError(err.message || 'Could not load the report.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        return () => controllerRef.current?.abort();
    }, [load]);

    const totals = data?.totals || { records: 0, accepted: 0, failed: 0, queued: 0, processing: 0 };
    const queue = data?.queue || { pending: 0, processing: 0, dead: 0, retrying: 0 };
    const daily = data?.daily || [];
    const maxDaily = Math.max(1, ...daily.map((day) => day.total));

    const cards = [
        { label: 'Credits balance', value: data?.balance == null ? 'Unavailable' : data.balance.toLocaleString() },
        { label: 'URLs submitted (24h)', value: totals.records.toLocaleString() },
        { label: 'Accepted (24h)', value: totals.accepted.toLocaleString() },
        { label: 'Failed (24h)', value: totals.failed.toLocaleString() },
        { label: 'Queued now', value: (queue.pending + queue.processing).toLocaleString() },
    ];

    return (
        <div className={`${styles.scope} ${styles.stack}`} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <div className="panel-page-header">
                <h1 className="panel-page-title">Daily report</h1>
                <p className="panel-page-subtitle">Background indexing activity for the last 24 hours, plus a 7-day trend.</p>
            </div>

            <div className={styles.actions}>
                <button type="button" className="btn btn-outline" onClick={load} disabled={loading}>
                    {loading ? 'Refreshing…' : error ? 'Retry report' : 'Refresh report'}
                </button>
            </div>

            {loading && <p role="status">Loading report…</p>}
            {error && (
                <p className={`${styles.notice} ${styles.error}`} role="alert">
                    {error} {data ? 'Values below may be out of date.' : ''}
                </p>
            )}

            {data && (
                <>
                    <section className={`panel-card ${styles.stack}`} aria-labelledby="report-summary">
                        <h2 id="report-summary">Summary</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                            {cards.map((card) => (
                                <div key={card.label} className={styles.item}>
                                    <p className={styles.meta}>{card.label}</p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{card.value}</p>
                                </div>
                            ))}
                        </div>
                        <p className={styles.meta}>
                            Accepted = fully or partially submitted. Failed records are refunded automatically.
                            Jobs run on the server, so closing the browser or signing out does not stop them.
                        </p>
                        {(queue.retrying > 0 || queue.dead > 0) && (
                            <p className={styles.notice}>
                                {queue.retrying > 0 ? `${queue.retrying} job(s) retrying. ` : ''}
                                {queue.dead > 0 ? `${queue.dead} job(s) exhausted their retries in the last 7 days and were refunded.` : ''}
                            </p>
                        )}
                    </section>

                    <div className={styles.columns}>
                        <section className={`panel-card ${styles.stack}`} aria-labelledby="engine-report">
                            <h2 id="engine-report">Engine results (24h)</h2>
                            {data.engines.length === 0 ? (
                                <p>No engine results in the last 24 hours.</p>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '8px 4px' }}>Engine</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px' }}>Accepted</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px' }}>Failed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.engines.map((engine) => (
                                            <tr key={engine.engine}>
                                                <td style={{ padding: '8px 4px' }}>{engine.engine}</td>
                                                <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 700 }}>{engine.ok}</td>
                                                <td style={{ textAlign: 'right', padding: '8px 4px' }}>{engine.failed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {data.topErrors.length > 0 && (
                                <div className={styles.stack}>
                                    <h3>Most common errors</h3>
                                    {data.topErrors.map((item) => (
                                        <p key={item.message} className={styles.prewrap}>{item.count}× {item.message}</p>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className={`panel-card ${styles.stack}`} aria-labelledby="trend-report">
                            <h2 id="trend-report">Last 7 days</h2>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px' }} role="img" aria-label="Daily submitted URL counts for the last seven days">
                                {daily.map((day) => (
                                    <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <div
                                            title={`${day.date}: ${day.total} URL(s), ${day.submitted} accepted, ${day.failed} failed`}
                                            style={{
                                                width: '100%',
                                                height: `${Math.max(4, (day.total / maxDaily) * 120)}px`,
                                                background: 'var(--primary)',
                                                borderRadius: '6px 6px 0 0',
                                            }}
                                        />
                                        <span className={styles.meta}>{day.date.slice(5)}</span>
                                    </div>
                                ))}
                            </div>
                            <p className={styles.meta}>Bar height = URLs submitted that day. Hover a bar for accepted/failed counts.</p>
                        </section>
                    </div>

                    <section className={`panel-card ${styles.stack}`} aria-labelledby="recent-report">
                        <h2 id="recent-report">Recent submissions (24h)</h2>
                        {data.recent.length === 0 ? (
                            <p>No submissions in the last 24 hours.</p>
                        ) : (
                            <ul className={styles.stack} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                {data.recent.map((record) => (
                                    <li key={record.id} className={styles.item}>
                                        <div className={styles.heading}>
                                            <p className={styles.reference} style={{ margin: 0 }}>{record.url}</p>
                                            <span className={styles.status}>{STATUS_LABELS[record.status] || record.status}</span>
                                        </div>
                                        <p className={styles.meta}>Created: <Timestamp value={record.createdAt} /></p>
                                        {record.engines.length > 0 && (
                                            <p className={styles.meta}>
                                                Engines: {record.engines.map((entry) => `${entry.engine} ${entry.ok ? '✓' : '✕'}`).join(' · ')}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
