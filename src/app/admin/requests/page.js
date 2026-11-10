'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import styles from '@/components/operations.module.css';

const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    open: 'Open',
    answered: 'Answered',
    closed: 'Closed',
};

async function readResponse(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.error || data?.success === false) {
        const error = new Error(
            typeof data?.error === 'string'
                ? data.error
                : `Request failed (${response.status}). Please try again.`
        );
        error.status = response.status;
        throw error;
    }
    if (data === null && response.status !== 204) {
        throw new Error('Unable to read the server response. Refresh to check the current status.');
    }
    return data;
}

function useAdminQueue(endpoint, collectionKey) {
    const [items, setItems] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [unauthorized, setUnauthorized] = useState(false);
    const [pending, setPending] = useState(null);
    const [actionError, setActionError] = useState('');
    const [success, setSuccess] = useState('');
    const controller = useRef(null);
    const mutationLock = useRef(false);
    const mounted = useRef(false);

    const refresh = useCallback(async () => {
        controller.current?.abort();
        const request = new AbortController();
        controller.current = request;
        setLoading(true);
        setLoadError('');
        setUnauthorized(false);
        try {
            const response = await fetch(endpoint, { cache: 'no-store', signal: request.signal });
            const data = await readResponse(response);
            if (!Array.isArray(data?.[collectionKey])) {
                throw new Error('Unexpected response. Please retry loading this section.');
            }
            if (request.signal.aborted || !mounted.current) return false;
            setItems(data[collectionKey]);
            return true;
        } catch (error) {
            if (!request.signal.aborted && mounted.current) {
                if (error.status === 401) {
                    setUnauthorized(true);
                    setLoadError('Your admin session has expired or is not authorized.');
                } else {
                    setLoadError(error.message || 'Unable to load this section. Please retry.');
                }
            }
            return false;
        } finally {
            if (!request.signal.aborted && mounted.current) setLoading(false);
        }
    }, [endpoint, collectionKey]);

    useEffect(() => {
        mounted.current = true;
        refresh();
        return () => {
            mounted.current = false;
            controller.current?.abort();
        };
    }, [refresh]);

    const mutate = async (body, successMessage) => {
        if (mutationLock.current || loading || loadError) return false;
        mutationLock.current = true;
        setPending({ id: body.id, action: body.action });
        setActionError('');
        setSuccess('');
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            await readResponse(response);
            if (!mounted.current) return false;
            setSuccess(successMessage);
            // Refresh failures are load errors, not failures of a completed action.
            return await refresh();
        } catch (error) {
            if (mounted.current) {
                setActionError(
                    `Request ${body.id}: ${error.message || 'Unable to complete this action.'} ` +
                    'Your draft is kept. Refresh to check the current status before retrying.'
                );
            }
            return false;
        } finally {
            mutationLock.current = false;
            if (mounted.current) setPending(null);
        }
    };

    return {
        items, loading, loadError, unauthorized, pending, actionError, success, refresh, mutate,
        disabled: loading || Boolean(loadError) || Boolean(pending),
    };
}

function Timestamp({ label, value }) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return <p className={styles.meta}>{label}: <time dateTime={date.toISOString()}>{date.toLocaleString()}</time></p>;
}

function UserDetails({ user, showBalance = false }) {
    return (
        <div className={styles.meta}>
            <p>{user?.name || 'Unnamed user'}</p>
            <p className={styles.reference}>{user?.email || 'Email unavailable'}</p>
            {user?.id && <p className={styles.reference}>User ID: {user.id}</p>}
            {showBalance && <p>Balance: {user?.balance ?? 'Unavailable'} credits</p>}
        </div>
    );
}

function QueueSection({ id, title, description, statuses, queue, children }) {
    const [filter, setFilter] = useState('all');
    const visibleItems = queue.items?.filter(item => filter === 'all' || item.status === filter) ?? [];

    return (
        <section className={`admin-card ${styles.stack}`} aria-labelledby={`${id}-heading`} style={{ minWidth: 0 }}>
            <div className={styles.heading}>
                <div>
                    <h2 id={`${id}-heading`}>{title}</h2>
                    <p className={styles.meta}>{description}</p>
                </div>
            </div>
            <div className={styles.field}>
                <label htmlFor={`${id}-filter`}>{title} status</label>
                <select id={`${id}-filter`} value={filter} onChange={event => setFilter(event.target.value)} disabled={Boolean(queue.pending)}>
                    <option value="all">All statuses</option>
                    {statuses.map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                </select>
            </div>
            <div role="status" aria-live="polite" aria-atomic="true">
                {queue.loading && <p className={styles.notice}>{queue.items === null ? `Loading ${title.toLowerCase()}...` : `Refreshing ${title.toLowerCase()}...`}</p>}
                {queue.pending && <p className={styles.notice}>Updating request. Please wait...</p>}
                {queue.success && <p className={styles.success}>{queue.success}</p>}
            </div>
            {queue.actionError && <p className={styles.error} role="alert">{queue.actionError}</p>}
            {queue.loadError && (
                <div className={`${styles.error} ${styles.stack}`} role="alert">
                    <p>Could not load {title.toLowerCase()}: {queue.loadError}</p>
                    {queue.unauthorized ? (
                        <>
                            <p>Sign in again to continue. Retrying will not restore an expired session.</p>
                            <div className={styles.actions}>
                                <button type="button" className="admin-btn" onClick={() => signOut({ callbackUrl: '/authorize' })}>
                                    Sign in again
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>{queue.items !== null ? 'Previously loaded records are shown. ' : ''}Actions are unavailable until this section reloads successfully.</p>
                            <div className={styles.actions}>
                                <button type="button" className="admin-btn" onClick={queue.refresh} disabled={queue.loading || Boolean(queue.pending)}>
                                    Retry {title.toLowerCase()}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
            {queue.items !== null && (
                <>
                    <p className={styles.meta} role="status" aria-live="polite">
                        Showing {visibleItems.length} of {queue.items.length} {queue.loadError || queue.loading ? 'previously ' : ''}loaded records. Each section loads only its newest 50 records; filters apply to those records.
                    </p>
                    <div className={styles.stack}>
                        {visibleItems.map(item => children(item))}
                        {visibleItems.length === 0 && (
                            <p className={styles.notice}>
                                {queue.items.length === 0 ? `No ${title.toLowerCase()} in the loaded records.` : `No loaded records with status ${STATUS_LABELS[filter]?.toLowerCase()}.`}
                            </p>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

function TopupCard({ request, queue, draft, onDraftChange }) {
    const noteId = `topup-note-${request.id}`;
    const busy = queue.pending?.id === request.id;

    const review = async action => {
        if (queue.disabled) return;
        if (action === 'approve' && !window.confirm(
            `Approve ${request.amount} credits for ${request.user?.email || 'this user (email unavailable)'}?\n\n` +
            'Verify the offline arrangement first. Approval adds credits to this user’s balance.'
        )) return;
        const refreshed = await queue.mutate(
            { id: request.id, action, adminNote: draft },
            action === 'approve'
                ? `Approved ${request.amount} credits for ${request.user?.email || request.id}.`
                : `Top-up request ${request.id} rejected.`
        );
        if (refreshed) onDraftChange('');
    };

    return (
        <article className={`${styles.item} ${styles.stack}`} aria-labelledby={`topup-heading-${request.id}`}>
            <div className={styles.heading}>
                <h3 id={`topup-heading-${request.id}`}>{request.amount} credits</h3>
                <span className={styles.status}>Status: {STATUS_LABELS[request.status] || request.status}</span>
            </div>
            <UserDetails user={request.user} showBalance />
            <p className={styles.reference}>Request ID: {request.id}</p>
            <Timestamp label="Created" value={request.createdAt} />
            <div>
                <p><strong>User note</strong></p>
                <p className={styles.prewrap}>{request.note || 'No note provided.'}</p>
            </div>
            {request.adminNote && (
                <div>
                    <p><strong>Admin note</strong></p>
                    <p className={styles.prewrap}>{request.adminNote}</p>
                </div>
            )}
            <Timestamp label="Reviewed" value={request.reviewedAt} />
            {request.status === 'pending' && (
                <div className={styles.stack}>
                    <div className={styles.field}>
                        <label htmlFor={noteId}>Admin note (optional)</label>
                        <textarea
                            id={noteId}
                            rows={3}
                            maxLength={1000}
                            value={draft}
                            onChange={event => onDraftChange(event.target.value)}
                            disabled={busy}
                            aria-describedby={`${noteId}-hint`}
                        />
                        <p id={`${noteId}-hint`} className={styles.meta}>Up to 1,000 characters. Verify the offline arrangement before approving credits.</p>
                    </div>
                    <div className={styles.actions}>
                        <button type="button" className="admin-btn admin-btn-primary" disabled={queue.disabled} onClick={() => review('approve')}>
                            {busy && queue.pending.action === 'approve' ? 'Approving credits...' : 'Approve credits'}
                        </button>
                        <button type="button" className="admin-btn admin-btn-danger" disabled={queue.disabled} onClick={() => review('reject')}>
                            {busy && queue.pending.action === 'reject' ? 'Rejecting...' : 'Reject'}
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}

function SupportCard({ ticket, queue, draft, onDraftChange }) {
    const [validationError, setValidationError] = useState('');
    const replyId = `support-reply-${ticket.id}`;
    const busy = queue.pending?.id === ticket.id;

    const sendReply = async event => {
        event.preventDefault();
        if (queue.disabled) return;
        const reply = draft.trim();
        if (reply.length < 2 || reply.length > 5000) {
            setValidationError('Enter a reply between 2 and 5,000 characters after trimming whitespace.');
            return;
        }
        setValidationError('');
        const refreshed = await queue.mutate(
            { id: ticket.id, action: 'reply', reply },
            `Reply saved for ticket ${ticket.id}.`
        );
        if (refreshed) onDraftChange('');
    };

    const closeTicket = async () => {
        if (queue.disabled || !window.confirm(
            `Close ticket ${ticket.id} for ${ticket.user?.email || 'this user'}?\n\n` +
            'You will no longer be able to reply to this ticket. Any unsent draft will not be sent.'
        )) return;
        const refreshed = await queue.mutate(
            { id: ticket.id, action: 'close' },
            `Ticket ${ticket.id} closed.`
        );
        if (refreshed) onDraftChange('');
    };

    return (
        <article className={`${styles.item} ${styles.stack}`} aria-labelledby={`support-heading-${ticket.id}`}>
            <div className={styles.heading}>
                <h3 id={`support-heading-${ticket.id}`}>{ticket.category || 'Support request'}</h3>
                <span className={styles.status}>Status: {STATUS_LABELS[ticket.status] || ticket.status}</span>
            </div>
            <UserDetails user={ticket.user} />
            <p className={styles.reference}>Ticket ID: {ticket.id}</p>
            <Timestamp label="Created" value={ticket.createdAt} />
            <div>
                <p><strong>User message</strong></p>
                <p className={styles.prewrap}>{ticket.message}</p>
            </div>
            <div>
                <p><strong>Latest admin response</strong></p>
                <p className={styles.prewrap}>{ticket.adminReply || 'No response yet.'}</p>
                <Timestamp label="Answered" value={ticket.answeredAt} />
            </div>
            {(ticket.status === 'open' || ticket.status === 'answered') && (
                <form className={styles.stack} onSubmit={sendReply}>
                    <div className={styles.field}>
                        <label htmlFor={replyId}>Admin reply (required to send)</label>
                        <textarea
                            id={replyId}
                            rows={4}
                            required
                            minLength={2}
                            maxLength={5000}
                            value={draft}
                            onChange={event => {
                                onDraftChange(event.target.value);
                                setValidationError('');
                            }}
                            disabled={busy}
                            aria-invalid={Boolean(validationError)}
                            aria-describedby={`${replyId}-hint${validationError ? ` ${replyId}-error` : ''}`}
                        />
                        <p id={`${replyId}-hint`} className={styles.meta}>2–5,000 characters after trimming whitespace. Sending a reply replaces the latest response; this is not a conversation thread.</p>
                        {validationError && <p id={`${replyId}-error`} className={styles.error} role="alert">{validationError}</p>}
                    </div>
                    <div className={styles.actions}>
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={queue.disabled}>
                            {busy && queue.pending.action === 'reply' ? 'Sending reply...' : 'Send reply'}
                        </button>
                        <button type="button" className="admin-btn" disabled={queue.disabled} onClick={closeTicket}>
                            {busy && queue.pending.action === 'close' ? 'Closing ticket...' : 'Close ticket'}
                        </button>
                    </div>
                </form>
            )}
        </article>
    );
}

export default function AdminRequestsPage() {
    const topups = useAdminQueue('/api/admin/topups', 'requests');
    const support = useAdminQueue('/api/admin/support', 'tickets');
    const [notes, setNotes] = useState({});
    const [replies, setReplies] = useState({});
    const refreshing = topups.loading || support.loading;
    const mutating = Boolean(topups.pending || support.pending);

    return (
        <div className={`${styles.scope} ${styles.stack}`} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <header className={`admin-page-header ${styles.heading}`}>
                <div>
                    <h1 className="admin-page-title">Requests</h1>
                    <p className={styles.meta}>Review credit top-ups and respond to support tickets.</p>
                </div>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className="admin-btn"
                        disabled={refreshing || mutating}
                        onClick={() => { topups.refresh(); support.refresh(); }}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </header>
            <div className={styles.columns}>
                <QueueSection id="topups" title="Top-up requests" description="Approve or reject requested credits after reviewing the offline arrangement." statuses={['pending', 'approved', 'rejected']} queue={topups}>
                    {request => (
                        <TopupCard
                            key={request.id}
                            request={request}
                            queue={topups}
                            draft={notes[request.id] ?? ''}
                            onDraftChange={value => setNotes(previous => ({ ...previous, [request.id]: value }))}
                        />
                    )}
                </QueueSection>
                <QueueSection id="support" title="Support tickets" description="Review each user's message and manage the latest admin response." statuses={['open', 'answered', 'closed']} queue={support}>
                    {ticket => (
                        <SupportCard
                            key={ticket.id}
                            ticket={ticket}
                            queue={support}
                            draft={replies[ticket.id] ?? ''}
                            onDraftChange={value => setReplies(previous => ({ ...previous, [ticket.id]: value }))}
                        />
                    )}
                </QueueSection>
            </div>
        </div>
    );
}
