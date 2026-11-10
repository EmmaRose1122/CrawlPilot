'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/components/operations.module.css';

const categories = ['Indexing Issue', 'API & Integration', 'Billing & Payments', 'Technical Question'];
const statusLabels = { open: 'Open', answered: 'Answered', closed: 'Closed' };
const latestTickets = (tickets) => [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

function Timestamp({ value }) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return <span>Not available</span>;
    return <time dateTime={date.toISOString()}>{date.toLocaleString()}</time>;
}

export default function SupportPanelPage() {
    const [category, setCategory] = useState(categories[0]);
    const [message, setMessage] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState('');
    const submittingRef = useRef(false);
    const controllerRef = useRef(null);

    const loadTickets = useCallback(async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);
        setLoadError('');
        try {
            const res = await fetch('/api/support', { cache: 'no-store', signal: controller.signal });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not load support tickets.');
            if (!Array.isArray(data.tickets)) throw new Error('Support history returned an invalid response.');
            if (!controller.signal.aborted) setTickets(latestTickets(data.tickets));
        } catch (err) {
            if (!controller.signal.aborted) setLoadError(err.message || 'Could not load support tickets.');
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
        return () => controllerRef.current?.abort();
    }, [loadTickets]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;
        setSubmitError('');
        setSuccess('');
        const trimmedMessage = message.trim();
        if (!categories.includes(category)) {
            setSubmitError('Choose one of the available support categories.');
            return;
        }
        if (trimmedMessage.length < 5 || trimmedMessage.length > 5000) {
            setSubmitError('Enter a message with 5 to 5,000 characters, excluding leading and trailing spaces.');
            return;
        }
        submittingRef.current = true;
        setSubmitting(true);
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, message: trimmedMessage }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not submit your support ticket.');
            if (!data.success || !data.ticket?.id) throw new Error('The server did not confirm the support ticket.');
            // Prevent an older history response from replacing the newly confirmed ticket.
            controllerRef.current?.abort();
            setTickets((current) => latestTickets([data.ticket, ...current.filter((ticket) => ticket.id !== data.ticket.id)]));
            void loadTickets();
            setMessage('');
            setSuccess('Support ticket submitted. Admin replies will appear in your ticket history; refresh to check for updates.');
        } catch (err) {
            setSubmitError(`${err.message || 'Could not confirm your ticket.'} Your draft is preserved. Refresh history before retrying to check whether it was received.`);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <div className={`${styles.scope} ${styles.stack}`} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <div className="panel-page-header">
                <h1 className="panel-page-title">Support</h1>
                <p className="panel-page-subtitle">Submit a question and follow admin replies here in your dashboard.</p>
            </div>

            <div className={styles.columns}>
                <section className={`panel-card ${styles.stack}`} aria-labelledby="support-form-heading" style={{ minWidth: 0 }}>
                    <h2 id="support-form-heading">Open a support ticket</h2>
                    <p className={styles.notice}>Tickets are reviewed manually. Replies appear here in the app; submitting this form does not send an email.</p>
                    <form onSubmit={handleSubmit} className={styles.stack} aria-busy={submitting}>
                        <div className={styles.field}>
                            <label htmlFor="support-category">Category (required)</label>
                            <select id="support-category" name="category" className="input" required value={category}
                                onChange={(event) => setCategory(event.target.value)} disabled={submitting}>
                                {categories.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="support-message">Message (required)</label>
                            <textarea id="support-message" name="message" className="input" rows={7} required minLength={5} maxLength={5000}
                                value={message} onChange={(event) => setMessage(event.target.value)} disabled={submitting} aria-describedby="support-message-help" />
                            <p id="support-message-help" className={styles.meta}>5–5,000 characters, excluding leading and trailing spaces. Do not include passwords, API keys or card details.</p>
                        </div>
                        {submitError && <p className={`${styles.notice} ${styles.error}`} role="alert">{submitError}</p>}
                        {success && <p className={`${styles.notice} ${styles.success}`} role="status">{success}</p>}
                        <div className={styles.actions}>
                            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'normal', maxWidth: '100%' }} disabled={submitting}>
                                {submitting ? 'Submitting ticket…' : 'Submit support ticket'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className={`panel-card ${styles.stack}`} aria-labelledby="support-history-heading" style={{ minWidth: 0 }}>
                    <div className={styles.heading}>
                        <h2 id="support-history-heading">Ticket history</h2>
                        <button type="button" className="btn btn-outline" style={{ whiteSpace: 'normal', maxWidth: '100%' }} onClick={loadTickets} disabled={loading}>
                            {loading ? 'Refreshing…' : loadError ? 'Retry refresh' : 'Refresh tickets'}
                        </button>
                    </div>
                    <p className={styles.meta}>Latest 20 tickets. Refresh to see status changes and the latest admin reply.</p>
                    {loading && <p role="status">Loading support tickets…</p>}
                    {loadError && (
                        <p className={`${styles.notice} ${styles.error}`} role="alert">
                            {loadError} Use the refresh button to retry. Any tickets shown may be out of date.
                        </p>
                    )}
                    {!loading && !loadError && tickets.length === 0 && <p>No support tickets yet. Use the form to open your first ticket.</p>}
                    {tickets.length > 0 && (
                        <ul className={styles.stack} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {tickets.map((ticket) => (
                                <li key={ticket.id} className={styles.item}>
                                    <div className={styles.heading}>
                                        <h3>{ticket.category}</h3>
                                        <span className={styles.status}>{statusLabels[ticket.status] || ticket.status}</span>
                                    </div>
                                    <p className={styles.reference}>Ticket: {ticket.id}</p>
                                    <p className={styles.meta}>Created: <Timestamp value={ticket.createdAt} /></p>
                                    <p><strong>Your message</strong></p>
                                    <p className={styles.prewrap}>{ticket.message}</p>
                                    <p><strong>Latest admin reply</strong></p>
                                    <p className={styles.prewrap}>{ticket.adminReply || 'No admin reply yet.'}</p>
                                    {ticket.answeredAt && <p className={styles.meta}>Answered: <Timestamp value={ticket.answeredAt} /></p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
