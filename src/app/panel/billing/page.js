'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import TopupHistory, { useTopupRequests } from '@/components/TopupHistory';
import styles from '@/components/operations.module.css';

export default function BillingPage() {
    const [balance, setBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [balanceError, setBalanceError] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState('');
    const submittingRef = useRef(false);
    const balanceControllerRef = useRef(null);
    const { requests, loading, error, reload, prependRequest } = useTopupRequests();
    const pendingLimitReached = requests.filter((request) => request.status === 'pending').length >= 5;

    const loadBalance = useCallback(async () => {
        balanceControllerRef.current?.abort();
        const controller = new AbortController();
        balanceControllerRef.current = controller;
        setBalanceLoading(true);
        setBalanceError('');
        try {
            const res = await fetch('/api/user/profile', { cache: 'no-store', signal: controller.signal });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not load your credit balance.');
            if (typeof data.balance !== 'number' || !Number.isFinite(data.balance)) {
                throw new Error('The credit balance returned an invalid response.');
            }
            if (!controller.signal.aborted) setBalance(data.balance);
        } catch (err) {
            if (!controller.signal.aborted) setBalanceError(err.message || 'Could not load your credit balance.');
        } finally {
            if (!controller.signal.aborted) setBalanceLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBalance();
        return () => balanceControllerRef.current?.abort();
    }, [loadBalance]);

    const refresh = () => {
        void loadBalance();
        void reload();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submittingRef.current) return;
        setSubmitError('');
        setSuccess('');
        const credits = Number(amount);
        if (!Number.isInteger(credits) || credits < 1 || credits > 1000000) {
            setSubmitError('Enter a whole number between 1 and 1,000,000 credits.');
            return;
        }
        if (note.length > 1000) {
            setSubmitError('Your note must be 1,000 characters or fewer.');
            return;
        }
        if (pendingLimitReached) {
            setSubmitError('You have five pending requests. Wait for manual review, then refresh before submitting another.');
            return;
        }

        submittingRef.current = true;
        setSubmitting(true);
        try {
            const res = await fetch('/api/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: credits, note: note.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not submit your top-up request.');
            if (!data.success || !data.request?.id) {
                throw new Error('The server did not confirm the top-up request.');
            }
            prependRequest(data.request);
            setAmount('');
            setNote('');
            setSuccess('Top-up request submitted for manual review. Submission does not automatically change your balance.');
        } catch (err) {
            setSubmitError(`${err.message || 'Could not confirm your request.'} Your draft is preserved. Refresh history before retrying to check whether it was received.`);
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <div className={`${styles.scope} ${styles.stack}`} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <div className="panel-page-header">
                <h1 className="panel-page-title">Billing</h1>
                <p className="panel-page-subtitle">View your credit balance and request a manual top-up.</p>
            </div>

            <section className={`panel-card ${styles.stack}`} aria-labelledby="balance-heading">
                <h2 id="balance-heading">Current credit balance</h2>
                {balance !== null && (
                    <p><span className="panel-stat-value">{balance.toLocaleString()}</span> credits</p>
                )}
                {balanceLoading && <p role="status">Loading credit balance…</p>}
                {balanceError && (
                    <div className={styles.stack}>
                        <p className={`${styles.notice} ${styles.error}`} role="alert">
                            {balanceError} {balance !== null ? 'The displayed balance may be out of date.' : 'Your balance is unavailable.'}
                        </p>
                        <div className={styles.actions}>
                            <button type="button" className="btn btn-outline" style={{ whiteSpace: 'normal', maxWidth: '100%' }} onClick={loadBalance} disabled={balanceLoading}>Retry balance</button>
                        </div>
                    </div>
                )}
                <p className={styles.meta}>Balances are measured in credits, not URLs. Refresh balance and history below to check for reviewed requests.</p>
            </section>

            <section className={`panel-card ${styles.stack}`} aria-labelledby="request-heading">
                <h2 id="request-heading">Request credits</h2>
                <p className={styles.notice}>
                    Every request is reviewed manually by an admin. This form does not process online card payments or any other online payment, and submitting it does not automatically add credits.
                </p>
                <form onSubmit={handleSubmit} className={styles.stack} aria-busy={submitting}>
                    <div className={styles.field}>
                        <label htmlFor="topup-amount">Credits requested (required)</label>
                        <input id="topup-amount" name="amount" className="input" type="number" inputMode="numeric" required min={1} max={1000000} step={1}
                            value={amount} onChange={(event) => setAmount(event.target.value)} disabled={submitting} aria-describedby="topup-amount-help" />
                        <p id="topup-amount-help" className={styles.meta}>Enter a whole number from 1 to 1,000,000 credits. Up to five requests may be pending at a time.</p>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="topup-note">Note (optional)</label>
                        <textarea id="topup-note" name="note" className="input" rows={4} maxLength={1000} value={note}
                            onChange={(event) => setNote(event.target.value)} disabled={submitting} aria-describedby="topup-note-help" />
                        <p id="topup-note-help" className={styles.meta}>Maximum 1,000 characters. Do not include passwords or card details.</p>
                    </div>
                    {pendingLimitReached && <p className={styles.notice}>Five requests are pending. Wait for admin review and refresh the history to check their status.</p>}
                    {submitError && <p className={`${styles.notice} ${styles.error}`} role="alert">{submitError}</p>}
                    {success && <p className={`${styles.notice} ${styles.success}`} role="status">{success}</p>}
                    <div className={styles.actions}>
                        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'normal', maxWidth: '100%' }} disabled={submitting || pendingLimitReached}>
                            {submitting ? 'Submitting request…' : 'Submit top-up request'}
                        </button>
                        <Link href="/panel/payments" className="btn btn-outline" style={{ whiteSpace: 'normal', maxWidth: '100%' }}>View top-up history</Link>
                    </div>
                </form>
            </section>

            <TopupHistory requests={requests} loading={loading} error={error} onRefresh={refresh}
                refreshDisabled={balanceLoading} refreshLabel="Refresh balance and history" />
        </div>
    );
}
