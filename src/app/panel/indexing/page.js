'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from "next-auth/react";
import {
    Plus,
    Search,
    Filter,
    Activity,
    Terminal,
    Zap,
    CheckCircle2,
    Globe,
    AlertCircle,
    X,
    FileDown,
    RefreshCw,
    Gift,
    MoreVertical,
    ChevronRight,
    ExternalLink,
    Loader2,
    Send,
    Code2,
    Copy,
    Check,
    Radio,
    ZapOff,
    Settings,
    ShieldAlert,
    Network,
    FileCode,
    ScrollText,
    Bot,
    BarChart3
} from 'lucide-react';
import { RealTimeManager } from '@/lib/realtime';

const botOptions = [
    { id: 'google', name: 'Google', desc: 'Indexing API / HTTP check', color: '#4285F4' },
    { id: 'bing', name: 'Bing', desc: 'IndexNow submission', color: '#00A4EF' }
];

export default function IndexingPanel() {
    const { data: session, status } = useSession();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBotLogModal, setShowBotLogModal] = useState(false);
    const [selectedBotLogs, setSelectedBotLogs] = useState(null);
    const [selectedBotForLogs, setSelectedBotForLogs] = useState(null);
    const [modalTab, setModalTab] = useState('List'); // 'List' or 'Sitemap'
    const [inputText, setInputText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [logFilterUrl, setLogFilterUrl] = useState('all');
    const [realTimeLogs, setRealTimeLogs] = useState([]);
    const [activeResults, setActiveResults] = useState([]);
    const consoleRef = useRef(null);
    const [selectedBots, setSelectedBots] = useState(['google']); // Default to google for free plan
    const [isLiveFeedActive, setIsLiveFeedActive] = useState(true);
    const [realTimeManager, setRealTimeManager] = useState(null);

    // User plan and bot access
    const [userPlan, setUserPlan] = useState('free');
    const [allowedBots, setAllowedBots] = useState(['google']);
    const [canAddLinks, setCanAddLinks] = useState(false);
    const [showAddLinksModal, setShowAddLinksModal] = useState(false);
    const [selectedResultForLinks, setSelectedResultForLinks] = useState(null);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [showCreditsPopup, setShowCreditsPopup] = useState(false);
    const [hasGoogleConfig, setHasGoogleConfig] = useState(false);
    const [inspectingId, setInspectingId] = useState(null);
    const [isSubmittingSitemap, setIsSubmittingSitemap] = useState(false);
    const [gscSitemapResult, setGscSitemapResult] = useState(null);

    const [userBalance, setUserBalance] = useState(0);

    const [totalSignals, setTotalSignals] = useState(0);
    const [totalUrls, setTotalUrls] = useState(0);
    const [acceptedUrls, setAcceptedUrls] = useState(0);
    const [queuedJobs, setQueuedJobs] = useState(0);
    const [dailyStats, setDailyStats] = useState([]);

    // Filter logs based on selected URL
    const filteredLogs = useMemo(() => {
        if (logFilterUrl === 'all') return realTimeLogs;
        return realTimeLogs.filter(log => {
            const text = typeof log === 'string' ? log : log?.message || '';
            return text.includes(logFilterUrl);
        });
    }, [realTimeLogs, logFilterUrl]);

    // Builds log lines strictly from stored engine outcomes — no fabricated data.
    const buildLogsFromRecord = (record) => {
        const ts = new Date(record.createdAt).toLocaleTimeString();
        const logs = [];
        logs.push(`[${ts}] --- QUEUED --- ${record.url}`);

        const engines = Array.isArray(record.signalingResults?.engines) ? record.signalingResults.engines : [];

        if (engines.length > 0) {
            engines.forEach((engine) => {
                const methodLabel = engine.method && engine.method !== 'unknown' ? ` (${String(engine.method).toUpperCase()})` : '';
                if (engine.ok) {
                    logs.push(`[${ts}] --- RESULT --- ${String(engine.engine).toUpperCase()}${methodLabel}: HTTP ${engine.httpStatus} OK (${engine.responseTime ?? '?'}ms)`);
                } else {
                    const reason = engine.httpStatus ? `HTTP ${engine.httpStatus}` : (engine.error || 'request failed');
                    logs.push(`[${ts}] --- RESULT --- ${String(engine.engine).toUpperCase()}${methodLabel}: ${reason}`);
                }
            });
            const { successCount = 0, totalCount = 0 } = record.signalingResults;
            if (record.status === 'submitted') {
                logs.push(`[${ts}] --- STATUS --- Submitted: ${successCount}/${totalCount} engine requests accepted`);
            } else if (record.status === 'partial') {
                logs.push(`[${ts}] --- STATUS --- Partial: ${successCount}/${totalCount} engine requests accepted`);
            } else if (record.status === 'failed') {
                logs.push(`[${ts}] --- STATUS --- Failed: ${successCount}/${totalCount} engine requests accepted`);
            }
            if (record.signalingResults.apiUsed) {
                logs.push(`[${ts}] --- GOOGLE API --- ${record.signalingResults.apiStatus || 'NONE'}`);
            }
        } else if (record.status === 'queued' || record.status === 'processing') {
            logs.push(`[${ts}] --- STATUS --- ${String(record.status).toUpperCase()} — waiting for engine responses`);
        } else if (record.status === 'failed') {
            logs.push(`[${ts}] --- STATUS --- FAILED — no engine response recorded`);
        } else if (record.status === 'submitted' || record.status === 'partial') {
            logs.push(`[${ts}] --- STATUS --- ${String(record.status).toUpperCase()}`);
        }

        return logs;
    };

    const fetchInitialData = async () => {
        try {
            const resResults = await fetch('/api/indexing/discover');
            const dataResults = await resResults.json();
            if (Array.isArray(dataResults)) {
                const parsed = dataResults.map(r => {
                    let bots = [];
                    let signalingResults = {};
                    let indexStatus = null;
                    try {
                        bots = typeof r.bots === 'string' ? JSON.parse(r.bots) : r.bots;
                        if (!Array.isArray(bots)) bots = [];
                    } catch (e) {
                        bots = [];
                    }
                    try {
                        signalingResults = typeof r.signalingResults === 'string' ? JSON.parse(r.signalingResults) : r.signalingResults || {};
                    } catch (e) {
                        signalingResults = {};
                    }
                    try {
                        indexStatus = typeof r.indexStatus === 'string' ? JSON.parse(r.indexStatus) : r.indexStatus || null;
                    } catch (e) {
                        indexStatus = null;
                    }
                    return { ...r, bots, signalingResults, indexStatus };
                });
                setActiveResults(parsed);

                // Rebuild live feed from DB records — persists across page refreshes
                const allLogs = parsed.flatMap(r => buildLogsFromRecord(r));
                setRealTimeLogs(allLogs.slice(0, 300));

                // Total signals count
                const total = parsed.reduce((acc, curr) => acc + curr.bots.length, 0);
                setTotalSignals(total);
            }
            
            // Fetch profile with cache-busting
            const resProfile = await fetch(`/api/user/profile?t=${Date.now()}`);
            const userProfile = await resProfile.json();
            
            if (userProfile?.balance !== undefined) setUserBalance(userProfile.balance);
            
            // Handle plan and allowedBots
            if (userProfile?.plan) {
                setUserPlan(userProfile.plan);
            }
            
            // Parse allowedBots - handle both string and array formats
            let bots = ['google']; // Default
            if (userProfile?.allowedBots) {
                try {
                    if (typeof userProfile.allowedBots === 'string') {
                        bots = JSON.parse(userProfile.allowedBots);
                    } else if (Array.isArray(userProfile.allowedBots)) {
                        bots = userProfile.allowedBots;
                    }
                } catch (e) {
                    console.error('Error parsing allowedBots:', e);
                    bots = ['google'];
                }
            }
            
            console.log('Fetched allowedBots:', bots); // Debug log
            setAllowedBots(bots);
            setSelectedBots(bots);
            
            // Handle canAddLinks permission
            if (userProfile?.canAddLinks !== undefined) {
                setCanAddLinks(userProfile.canAddLinks);
            }

            // Search Console tools need a saved Google service account config.
            setHasGoogleConfig(!!userProfile?.googleIndexingConfig);

            // Fetch stats for day-wise data
            const resStats = await fetch('/api/user/stats');
            if (resStats.ok) {
                const statsData = await resStats.json();
                setTotalUrls(statsData.totalUrls || 0);
                setAcceptedUrls(statsData.accepted || 0);
                setQueuedJobs(statsData.queuedJobs || 0);
                setDailyStats(statsData.dailyStats || []);
                setTotalSignals(statsData.totalBotSignals || 0);
            }
            
        } catch (error) {
            console.error('Failed to sync data:', error);
        }
    };

    // Load real data from DB on mount (logs rebuilt from DB, not localStorage)
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Set up real-time subscriptions when session is available and live feed is active
    useEffect(() => {
        if (!session?.user?.id || !isLiveFeedActive) {
            if (realTimeManager) {
                realTimeManager.stop();
                setRealTimeManager(null);
            }
            return;
        }

        // Initialize real-time manager
        const manager = new RealTimeManager(session.user.id);
        
        // Define real-time callbacks
        const callbacks = {
            onIndexingUpdate: (payload) => {
                console.log('Real-time indexing update:', payload);
                // Refresh data when new indexing results arrive
                fetchInitialData();
                
                // Add to real-time logs for visual feedback
                if (payload.eventType === 'INSERT') {
                    const newResult = payload.new;
                    setRealTimeLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] --- SYSTEM --- New URL indexed: ${newResult.url}`
                    ]);
                }
            },
            onSignalingProgress: (payload) => {
                console.log('Real-time signaling progress:', payload);
                // Update specific result with signaling progress
                if (payload.new.signalingResults) {
                    let signalingData = { successCount: 0, totalCount: 0 };
                    try {
                        signalingData = JSON.parse(payload.new.signalingResults);
                    } catch (e) {
                        console.error('Error parsing signalingResults:', e);
                    }
                    setActiveResults(prev =>
                        prev.map(result =>
                            result.id === payload.new.id
                                ? { ...result, signalingResults: signalingData }
                                : result
                        )
                    );
                    
                    // Add to real-time logs
                    setRealTimeLogs(prev => [
                        ...prev,
                        `[${new Date().toLocaleTimeString()}] --- SYSTEM --- Signaling progress: ${signalingData.successCount}/${signalingData.totalCount} successful for ${payload.new.url}`
                    ]);
                }
            },
            onDailyStatsUpdate: (stats) => {
                console.log('Real-time daily stats update:', stats);
                // Update daily stats in state
                // This will be handled by fetchInitialData which includes stats
                fetchInitialData();
            }
        };

        // Start real-time manager — guarded so an SDK mismatch or connection
        // error can never crash the whole panel; polling keeps data fresh.
        try {
            manager.start(callbacks);
            setRealTimeManager(manager);
        } catch (error) {
            console.warn('Real-time manager failed to start, falling back to polling:', error);
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            if (manager) {
                manager.stop();
            }
        };
    }, [session?.user?.id, isLiveFeedActive]);

    // Fallback polling — runs whenever the live feed is active, and skips a
    // cycle only when the real-time manager reports a live connection.
    useEffect(() => {
        if (!isLiveFeedActive || !session?.user?.id) return;

        const pollingInterval = setInterval(() => {
            const isLive = (() => {
                try {
                    return realTimeManager?.isConnected?.() === true;
                } catch {
                    return false;
                }
            })();

            if (!isLive) {
                console.log('Using fallback polling for updates');
                fetchInitialData();
            }
        }, 30000); // Poll every 30 seconds as backup

        return () => clearInterval(pollingInterval);
    }, [isLiveFeedActive, session?.user?.id, realTimeManager]);

    const toggleBot = (botId) => {
        // Prevent toggling if bot is not allowed
        if (!allowedBots.includes(botId)) return;
        
        if (selectedBots.includes(botId)) {
            setSelectedBots(selectedBots.filter(b => b !== botId));
        } else {
            setSelectedBots([...selectedBots, botId]);
        }
    };

    const openBotLogs = (result, botId) => {
        setSelectedBotLogs(result);
        setSelectedBotForLogs(botId);
        setShowBotLogModal(true);
    };

    // Builds this engine's log strictly from the stored per-engine outcome.
    const generateBotLogs = (result, botId) => {
        const ts = new Date(result.createdAt).toLocaleTimeString();
        const bot = botOptions.find(b => b.id === botId);
        const signaling = result.signalingResults || {};
        const engines = Array.isArray(signaling.engines) ? signaling.engines : [];
        const outcome = engines.find(e => e.engine === botId);
        const logs = [];

        logs.push(`[${ts}] --- ENGINE --- ${bot?.name || botId}`);
        logs.push(`[${ts}] --- TARGET --- ${result.url}`);

        if (outcome) {
            const methodLabel = outcome.method ? String(outcome.method).toUpperCase() : 'REQUEST';
            if (outcome.ok) {
                logs.push(`[${ts}] --- ${methodLabel} --- HTTP ${outcome.httpStatus} accepted${outcome.responseTime ? ` in ${outcome.responseTime}ms` : ''}`);
            } else {
                logs.push(`[${ts}] --- ${methodLabel} --- ${outcome.httpStatus ? `HTTP ${outcome.httpStatus}` : (outcome.error || 'request failed')}`);
                if (outcome.error && outcome.httpStatus) {
                    logs.push(`[${ts}] --- REASON --- ${outcome.error}`);
                }
            }
        } else if (result.status === 'queued' || result.status === 'processing') {
            logs.push(`[${ts}] --- STATUS --- Queued — waiting for engine response`);
        } else {
            logs.push(`[${ts}] --- STATUS --- No response recorded for this engine`);
        }

        if (signaling.apiUsed) {
            logs.push(`[${ts}] --- GOOGLE API --- ${signaling.apiStatus === 'API_SUCCESS' ? 'SUCCESS' : signaling.apiStatus === 'API_FAILED' ? 'FAILED' : 'NOT USED'}`);
        }

        logs.push(`[${ts}] --- FINAL --- ${String(result.status || 'queued').toUpperCase()}`);

        return logs;
    };

    const [autoSync, setAutoSync] = useState(false);
    const syncTimerRef = useRef(null);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        let urls = [];
        const timestamp = new Date().toLocaleTimeString();

        if (modalTab === 'Sitemap') {
            const sitemapUrl = inputText.trim();
            if (!sitemapUrl) return;

            setIsSubmitting(true);

            try {
                const res = await fetch('/api/indexing/sitemap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sitemapUrl })
                });
                const data = await res.json();

                if (data.urls && data.urls.length > 0) {
                    urls = data.urls;
                    const sitemapLogs = [
                        `[${timestamp}] --- SITEMAP --- Detected: ${sitemapUrl}`,
                        `[${timestamp}] --- SITEMAP --- Parsed ${data.total} URL(s)`,
                        `[${timestamp}] --- SITEMAP --- Queueing ${data.count} URL(s) for submission`
                    ];
                    setRealTimeLogs(prev => [...sitemapLogs, ...prev]);

                    const submitResponse = await fetch('/api/indexing/discover', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ urls, bots: selectedBots })
                    });

                    if (!submitResponse.ok) {
                        const error = await submitResponse.json().catch(() => ({}));
                        throw new Error(error.message || error.error || "Failed to process discovery");
                    }

                    const submitData = await submitResponse.json();
                    setRealTimeLogs(prev => [
                        `[${new Date().toLocaleTimeString()}] --- QUEUED --- ${submitData.count ?? urls.length} sitemap URL(s) across ${submitData.botsUsed?.length ?? selectedBots.length} engine(s). Waiting for responses...`,
                        ...prev
                    ].slice(0, 400));
                    await fetchInitialData();
                    await pollForOutcomes();

                    // Setup Auto-Sync if enabled
                    if (autoSync) {
                        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
                        syncTimerRef.current = setTimeout(() => {
                            setRealTimeLogs(prev => [`[${new Date().toLocaleTimeString()}] --- AUTO-SYNC --- Re-scanning sitemap...`, ...prev]);
                            handleSubmit();
                        }, 300000); // 5 minutes
                    }

                    // Close modal after successful sitemap processing
                    setShowAddModal(false);
                    if (!autoSync) setInputText('');
                } else {
                    alert(data.error || "No URLs found in the sitemap.");
                }
            } catch (err) {
                alert(err.message || "Failed to fetch sitemap. Check URL and try again.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            urls = inputText.split('\n').map(u => u.trim()).filter(u => u !== '');
            if (urls.length === 0) return;
            setIsSubmitting(true);
            await processUrls(urls);
        }
    };

    // Submits URLs and waits for real engine outcomes via polling.
    const processUrls = async (urls) => {
        try {
            const res = await fetch('/api/indexing/discover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls, bots: selectedBots })
            });

            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                setShowAddModal(false);
                setInputText('');

                const skipped = Array.isArray(data.skippedUrls) ? data.skippedUrls : [];
                setRealTimeLogs(prev => [
                    `[${new Date().toLocaleTimeString()}] --- QUEUED --- ${data.count ?? urls.length} URL(s) across ${selectedBots.length} engine(s). Waiting for responses...`,
                    ...skipped.map(item => `[${new Date().toLocaleTimeString()}] --- SKIPPED --- ${item.url} (${item.reason})`),
                    ...prev
                ].slice(0, 400));

                await fetchInitialData();
                await pollForOutcomes();
            } else {
                const error = await res.json();
                if (res.status === 402 || error.error === 'INSUFFICIENT_CREDITS') {
                    setShowCreditsPopup(true);
                } else {
                    alert(`Submission failed: ${error.error || 'Unknown error'}`);
                }
            }
        } catch (err) {
            console.error('Submission error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Polls stored results until background processing finishes, then shows the
    // real per-engine outcomes instead of simulated progress logs.
    const pollForOutcomes = async () => {
        for (let attempt = 0; attempt < 15; attempt++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const res = await fetch('/api/indexing/discover');
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                if (!Array.isArray(data)) return;

                const pending = data.filter(r => r.status === 'queued' || r.status === 'processing');
                if (pending.length === 0) {
                    const parsed = data.map(r => {
                        let signalingResults = {};
                        try {
                            signalingResults = typeof r.signalingResults === 'string' ? JSON.parse(r.signalingResults) : r.signalingResults || {};
                        } catch {
                            signalingResults = {};
                        }
                        return { ...r, signalingResults };
                    });
                    setRealTimeLogs(parsed.flatMap(r => buildLogsFromRecord(r)).slice(0, 300));
                    await fetchInitialData();
                    return;
                }
            } catch (err) {
                console.warn('Outcome polling failed:', err);
                return;
            }
        }
    };

    useEffect(() => {
        if (consoleRef.current) consoleRef.current.scrollTop = 0;
    }, [realTimeLogs]);

    // Add Links functionality
    const openAddLinksModal = (result) => {
        if (!canAddLinks) {
            alert('Upgrade to Pro plan to add links!');
            return;
        }
        setSelectedResultForLinks(result);
        setNewLinkUrl('');
        setShowAddLinksModal(true);
    };

    const handleAddLink = async () => {
        if (!newLinkUrl.trim()) return;
        
        try {
            const res = await fetch('/api/indexing/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    resultId: selectedResultForLinks.id, 
                    url: newLinkUrl 
                })
            });

            if (res.ok) {
                setNewLinkUrl('');
                setShowAddLinksModal(false);
                await fetchInitialData();
            } else {
                alert('Failed to add link');
            }
        } catch (error) {
            console.error('Failed to add link:', error);
            alert('Failed to add link');
        }
    };

    // Runs Google's URL Inspection API for a stored record.
    const checkIndexStatus = async (resultId) => {
        setInspectingId(resultId);
        try {
            const res = await fetch('/api/indexing/google/inspect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultId }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || data.error || 'URL inspection failed');
                return;
            }
            await fetchInitialData();
        } catch {
            alert('URL inspection failed');
        } finally {
            setInspectingId(null);
        }
    };

    // Submits the sitemap to Google Search Console for the matching property.
    const submitSitemapToGoogle = async () => {
        const sitemapUrl = inputText.trim();
        if (!sitemapUrl) return;

        setIsSubmittingSitemap(true);
        setGscSitemapResult(null);
        try {
            const res = await fetch('/api/indexing/google/sitemap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sitemapUrl }),
            });
            const data = await res.json();

            if (res.ok) {
                const lastSubmitted = data.status?.lastSubmitted
                    ? ` · last submitted ${new Date(data.status.lastSubmitted).toLocaleString()}`
                    : '';
                const pending = data.status?.isPending ? ' · Google re-processing (pending)' : '';
                setGscSitemapResult({ ok: true, text: `Submitted to ${data.siteUrl}${lastSubmitted}${pending}` });
            } else {
                setGscSitemapResult({ ok: false, text: data.message || data.error || 'Sitemap submission failed' });
            }
        } catch {
            setGscSitemapResult({ ok: false, text: 'Sitemap submission failed' });
        } finally {
            setIsSubmittingSitemap(false);
        }
    };

    // Maps a stored submission status to honest badge styling.
    const statusMeta = (status) => {
        switch (status) {
            case 'submitted':
                return { label: 'SUBMITTED', bg: 'rgba(16,185,129,0.1)', color: 'var(--success)' };
            case 'partial':
                return { label: 'PARTIAL', bg: 'rgba(245,158,11,0.12)', color: '#b45309' };
            case 'failed':
                return { label: 'FAILED', bg: 'rgba(239,68,68,0.1)', color: '#dc2626' };
            case 'processing':
                return { label: 'PROCESSING', bg: 'rgba(59,130,246,0.1)', color: 'var(--primary)' };
            default:
                return { label: 'QUEUED', bg: 'rgba(100,116,139,0.12)', color: '#475569' };
        }
    };

    if (status === "loading") {
        return (
            <div className="indexing-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p style={{ marginTop: '16px', color: 'var(--text-light)' }}>Loading Discovery Console...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="indexing-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <ShieldAlert size={32} className="text-error" />
                    <p style={{ marginTop: '16px', color: 'var(--text-light)' }}>Please sign in to access the Discovery Console.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="indexing-panel" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="panel-page-header" style={{ maxWidth: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="panel-page-title">Submission Console</h1>
                        <p className="panel-page-subtitle">Submit URLs to the engines that support programmatic indexing, then track real per-engine acceptance.</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="panel-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--primary-light)', background: 'var(--primary-light)08' }}>
                            <Radio size={16} className="text-primary animate-pulse" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>ENGINE REQUESTS: <span className="text-primary">{totalSignals.toLocaleString()}</span></span>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                            <Plus size={18} /> New Submission
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-4 gap-4 mb-4" style={{ '--grid-cols': 4 }}>
                <div className="panel-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', color: 'var(--primary)' }}>
                        <Search size={18} /> <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>SELECTED ENGINES</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedBots.length} of {botOptions.length}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 700 }}>for next submission</span>
                    </div>
                </div>
                <div className="panel-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', color: 'var(--primary)' }}>
                        <Globe size={18} /> <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>AVAILABLE ENGINES</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{allowedBots.length} Allowed</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 700 }}>by your plan</span>
                    </div>
                </div>
                <div className="panel-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', color: 'var(--primary)' }}>
                        <Activity size={18} /> <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>IN PROGRESS</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                            {activeResults.filter(r => r.status === 'queued' || r.status === 'processing').length} Queued
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 700 }}>
                            {queuedJobs} job{queuedJobs === 1 ? '' : 's'} · syncing
                        </span>
                    </div>
                </div>
                <div className="panel-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', color: 'var(--primary)' }}>
                        <BarChart3 size={18} /> <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>DAILY ACTIVITY</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                            {(() => {
                                const todayKey = new Date().toISOString().split('T')[0];
                                const today = dailyStats.find(s => s.date === todayKey);
                                return today ? today.count : totalUrls;
                            })()} URLs
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>Today</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '8px' }}>
                        {(() => {
                            const todayKey = new Date().toISOString().split('T')[0];
                            const today = dailyStats.find(s => s.date === todayKey);
                            if (today) {
                                const signals = (today.primary || 0) + (today.ai || 0);
                                return `${today.count} submitted · ${signals} engine requests`;
                            }
                            return acceptedUrls > 0 ? `${acceptedUrls} accepted · ${totalSignals} engine requests` : 'No activity today';
                        })()}
                    </div>
                </div>
            </div>

            {/* ===== CREDITS EXHAUSTED POPUP ===== */}
            <AnimatePresence>
                {showCreditsPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(15,23,42,0.85)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            style={{
                                background: 'white',
                                borderRadius: '24px',
                                padding: '40px',
                                maxWidth: '460px',
                                width: '100%',
                                textAlign: 'center',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: '72px', height: '72px',
                                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <ZapOff size={32} color="#dc2626" />
                            </div>

                            {/* Title */}
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                                Credits Exhausted
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '28px', lineHeight: 1.6 }}>
                                Your URL credit balance has run out. Please top up to continue signaling search engines and indexing your URLs.
                            </p>

                            {/* Contact Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                <a
                                    href="https://wa.me/923004531248?text=Hi!%20I%20need%20to%20top%20up%20my%20Crawl%20Pilot%20credits."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        padding: '14px 20px',
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.570-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    WhatsApp Top-Up · +92 300 4531248
                                </a>

                                <a
                                    href="mailto:mateenali1122@gmail.com?subject=Crawl%20Pilot%20Credit%20Top-Up&body=Hi%20Mateen%2C%20I%20need%20to%20top%20up%20my%20Crawl%20Pilot%20credits.%20Please%20let%20me%20know%20the%20process."
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        padding: '14px 20px',
                                        background: '#f1f5f9',
                                        color: '#334155',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        textDecoration: 'none',
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    Email · mateenali1122@gmail.com
                                </a>
                            </div>

                            <button
                                onClick={() => setShowCreditsPopup(false)}
                                style={{
                                    background: 'none', border: 'none',
                                    color: '#94a3b8', fontSize: '0.85rem',
                                    cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Dismiss for now
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Responsive CSS */}
            <style jsx>{`
                @media (max-width: 1024px) {
                    .grid-4 {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 768px) {
                    .grid-4 {
                        grid-template-columns: 1fr !important;
                    }
                    .indexing-filters {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    .filter-group {
                        max-width: 100% !important;
                    }
                    .panel-page-header > div {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .header-actions {
                        width: 100%;
                        flex-direction: column;
                    }
                    .header-actions button {
                        width: 100%;
                    }
                    .console {
                        height: 200px !important;
                    }
                    .url-result-card {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .result-meta {
                        width: 100% !important;
                        align-items: flex-start !important;
                    }
                    .result-meta .badge {
                        width: auto !important;
                    }
                }
                @media (max-width: 480px) {
                    .panel-page-title {
                        font-size: 1.25rem;
                    }
                    .panel-card {
                        padding: 16px !important;
                    }
                }
            `}</style>

            <div className="indexing-filters">
                <div className="filter-group">
                    <Search size={18} />
                    <input type="text" placeholder="Search URL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="filter-group" style={{ maxWidth: '200px' }}>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ fontWeight: 600 }}>
                        <option value="All Status">All Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="partial">Partial</option>
                        <option value="failed">Failed</option>
                        <option value="queued">Queued</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>New Submission</button>
            </div>

            <div className="panel-card mb-4" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="indexing-console-header">
                    <div className="real-time-indicator"><div className="indicator-dot"></div> Submission Log</div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Source: stored results</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>● SYNC: AUTO (30s)</div>
                        <select
                            value={logFilterUrl}
                            onChange={(e) => setLogFilterUrl(e.target.value)}
                            style={{
                                fontSize: '0.65rem',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.8)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                padding: '2px 8px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">All Logs</option>
                            {[...new Set(activeResults.map(r => r.url))].map(url => (
                                <option key={url} value={url}>{url}</option>
                            ))}
                        </select>
                        {filteredLogs.length > 0 && (
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                                {filteredLogs.length} LOG ENTRIES
                            </div>
                        )}
                    </div>
                </div>
                <div className="console" ref={consoleRef} style={{ height: '240px', overflowY: 'auto', background: 'var(--console-bg)', padding: '20px', fontFamily: 'monospace' }}>
                    {filteredLogs.map((log, i) => {
                        const text = typeof log === 'string' ? log : log?.message || '';
                        return (
                            <div key={i} style={{
                                marginBottom: '6px',
                                fontSize: '0.72rem',
                                lineHeight: '1.5',
                                color: text.includes('SUBMITTED') ? '#64ffda'
                                    : text.includes('RESULT') ? '#00e676'
                                        : text.includes('SKIPPED') || text.includes('FAILED') ? '#ff8a80'
                                            : text.includes('QUEUED') || text.includes('STATUS') ? '#ffab00'
                                                : text.includes('GOOGLE API') ? '#ffd740'
                                                    : '#fff'
                            }}>
                                {text}
                            </div>
                        );
                    })}
                    {!filteredLogs.length && (
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                            — No submissions yet. Stored engine results will appear here. —
                        </div>
                    )}
                </div>
                <div style={{ padding: '8px 20px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                        {filteredLogs.length} entries · {totalSignals.toLocaleString()} engine requests recorded
                    </span>
                    {realTimeLogs.length > 0 && (
                        <button
                            onClick={() => { setRealTimeLogs([]); localStorage.removeItem('cp_logs'); }}
                            style={{ fontSize: '0.65rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}
                        >
                            CLEAR LOGS
                        </button>
                    )}
                </div>
            </div>

            <div className="url-result-list">
                {activeResults
                    .filter(r => r.url.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(r => statusFilter === 'All Status' || r.status === statusFilter)
                    .map((res) => (
                    <motion.div key={res.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel-card url-result-card">
                        <div className="result-main">
                            <div className="result-url">
                                <span className="truncate" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{res.url}</span>
                            </div>
                            <div className="bot-tag-list" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '100%' }}>
                                {res.bots.slice(0, 4).map(bot => (
                                    <div key={bot} className="bot-tag" style={{ background: botOptions.find(b => b.id === bot)?.color + '15', color: botOptions.find(b => b.id === bot)?.color }}>
                                        {botOptions.find(b => b.id === bot)?.name || bot}
                                    </div>
                                ))}
                                {res.bots.length > 4 && <div className="bot-tag">+{res.bots.length - 4} more</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                {res.bots.map(bot => {
                                    const botInfo = botOptions.find(b => b.id === bot);
                                    return (
                                        <button
                                            key={bot}
                                            onClick={() => openBotLogs(res, bot)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-color)',
                                                background: 'white',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <img src={`https://www.google.com/s2/favicons?domain=${bot}.com`} width="14" height="14" alt="" style={{ borderRadius: '2px' }} onError={(e) => e.target.style.display='none'} />
                                            {botInfo?.name || bot} Bot Log
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => canAddLinks ? openAddLinksModal(res) : alert('Upgrade to add links!')}
                                    disabled={!canAddLinks}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: canAddLinks ? 'var(--primary)' : '#ccc',
                                        color: 'white',
                                        cursor: canAddLinks ? 'pointer' : 'not-allowed',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        opacity: canAddLinks ? 1 : 0.6,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <ExternalLink size={14} />
                                    Add Links
                                    {!canAddLinks && <span style={{ fontSize: '0.6rem', marginLeft: '4px' }}>🔒</span>}
                                </button>
                                {hasGoogleConfig && (
                                    <button
                                        onClick={() => checkIndexStatus(res.id)}
                                        disabled={inspectingId === res.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'white',
                                            cursor: inspectingId === res.id ? 'wait' : 'pointer',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            opacity: inspectingId === res.id ? 0.7 : 1
                                        }}
                                    >
                                        {inspectingId === res.id ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                                        {inspectingId === res.id ? 'Checking...' : 'Google index status'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="result-meta" style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                            {(() => {
                                const meta = statusMeta(res.status);
                                return (
                                    <div className="badge" style={{ padding: '8px 16px', width: '100%', justifyContent: 'center', background: meta.bg, color: meta.color, fontWeight: 800, fontSize: '0.7rem' }}>
                                        {res.status === 'submitted' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />} {meta.label}
                                    </div>
                                );
                            })()}
                            {res.indexStatus?.result && (() => {
                                const verdict = res.indexStatus.result.verdict || 'UNKNOWN';
                                const verdictMap = {
                                    PASS: { label: 'INDEXED', bg: 'rgba(16,185,129,0.1)', color: 'var(--success)' },
                                    PARTIAL: { label: 'PARTIAL', bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
                                    FAIL: { label: 'NOT INDEXED', bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
                                    NEUTRAL: { label: 'NEUTRAL', bg: 'rgba(245,158,11,0.12)', color: '#b45309' }
                                };
                                const meta = verdictMap[verdict] || { label: verdict, bg: 'rgba(100,116,139,0.12)', color: '#475569' };
                                return (
                                    <div
                                        className="badge"
                                        title={res.indexStatus.result.coverageState || ''}
                                        style={{ padding: '6px 12px', width: '100%', justifyContent: 'center', background: meta.bg, color: meta.color, fontWeight: 800, fontSize: '0.65rem' }}
                                    >
                                        GOOGLE INDEX: {meta.label}
                                    </div>
                                );
                            })()}
                            {res.signalingResults?.apiStatus === 'API_SUCCESS' && (
                                <div className="badge" style={{ 
                                    padding: '8px 16px', 
                                    width: '100%', 
                                    justifyContent: 'center', 
                                    background: 'rgba(66, 133, 244, 0.1)', 
                                    color: '#4285F4',
                                    border: '1px solid rgba(66, 133, 244, 0.2)',
                                    fontWeight: 800,
                                    fontSize: '0.7rem'
                                }}>
                                    <Globe size={14} style={{ marginRight: '6px' }} /> GOOGLE API: SUCCESS
                                </div>
                            )}
                            {res.signalingResults?.apiStatus === 'API_FAILED' && (
                                <div className="badge" style={{ 
                                    padding: '8px 16px', 
                                    width: '100%', 
                                    justifyContent: 'center', 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    fontWeight: 800,
                                    fontSize: '0.7rem'
                                }}>
                                    <AlertCircle size={14} style={{ marginRight: '6px' }} /> GOOGLE API: FAILED
                                </div>
                            )}
                            <span className="text-xs text-muted" style={{ fontWeight: 800 }}>{new Date(res.createdAt).toLocaleString()}</span>
                        </div>
                    </motion.div>
                ))}
                {!activeResults.length && (
                    <div className="panel-card" style={{ padding: '60px', textAlign: 'center', opacity: 0.6 }}>
                        <Network size={40} style={{ margin: '0 auto 16px' }} />
                        <p>No URLs in discovery queue. Submit your first URLs or Sitemap.</p>
                    </div>
                )}
            </div>

            {/* Advanced Discovery Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 110, display: 'flex', alignItems: 'center', justify: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="panel-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                                <h2 style={{ fontSize: '1.4rem' }}>New Submission</h2>
                                <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
                            </div>

                            <div style={{ padding: '32px' }}>
                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
                                        {['List', 'Sitemap'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setModalTab(tab)}
                                                style={{
                                                    padding: '12px 12px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 800,
                                                    color: modalTab === tab ? 'var(--primary)' : 'var(--text-light)',
                                                    borderBottom: `2px solid ${modalTab === tab ? 'var(--primary)' : 'transparent'}`,
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {tab === 'List' ? <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} /> : <FileCode size={16} style={{ display: 'inline', marginRight: '6px' }} />}
                                                {tab} Input
                                            </button>
                                        ))}
                                    </div>

                                    <label className="text-xs font-bold uppercase mb-3 block text-primary">
                                        {modalTab === 'List' ? 'Target URLs' : 'Sitemap URL'}
                                    </label>
                                    <textarea
                                        className="input"
                                        rows={modalTab === 'List' ? 6 : 2}
                                        placeholder={modalTab === 'List' ? "e.g. https://site.com/page-1\nhttps://site.com/page-2" : "e.g. https://yoursite.com/sitemap.xml"}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        style={{ width: '100%', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '16px' }}
                                    />
                                    {modalTab === 'Sitemap' && (
                                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>
                                                <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                                We will crawl this sitemap and automatically extract all internal links for submission.
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-light)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                                                        <RefreshCw size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary)' }} />
                                                        Auto-Sync Mode
                                                    </div>
                                                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-light)' }}>Re-crawl the sitemap every 5 minutes automatically.</p>
                                                </div>
                                                <div
                                                    onClick={() => setAutoSync(!autoSync)}
                                                    style={{ width: '44px', height: '24px', background: autoSync ? 'var(--primary)' : 'var(--border-color)', borderRadius: '20px', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                                                >
                                                    <motion.div animate={{ x: autoSync ? 22 : 2 }} style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    onClick={submitSitemapToGoogle}
                                                    disabled={!hasGoogleConfig || isSubmittingSitemap || !inputText.trim()}
                                                    title={!hasGoogleConfig ? 'Add your Google service account in My profile first' : ''}
                                                >
                                                    {isSubmittingSitemap ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                                                    <span style={{ marginLeft: '6px' }}>{isSubmittingSitemap ? 'Submitting...' : 'Submit sitemap to Google'}</span>
                                                </button>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                                    {hasGoogleConfig
                                                        ? 'Submits via Search Console for the matching property.'
                                                        : 'Needs a Google service account (My profile → Google Indexing API).'}
                                                </span>
                                            </div>

                                            {gscSitemapResult && (
                                                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: gscSitemapResult.ok ? '#dcfce7' : '#fef2f2', color: gscSitemapResult.ok ? '#166534' : '#991b1b' }}>
                                                    {gscSitemapResult.text}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <label className="text-xs font-bold uppercase block text-primary">Engine Selection</label>
                                        {userPlan === 'free' && (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', background: 'var(--bg-light)', padding: '4px 8px', borderRadius: '6px' }}>
                                                Free Plan: GoogleBot Only
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                        {botOptions.map(bot => {
                                            const isAllowed = allowedBots.includes(bot.id);
                                            const isSelected = selectedBots.includes(bot.id);
                                            return (
                                                <div
                                                    key={bot.id}
                                                    onClick={() => toggleBot(bot.id)}
                                                    style={{
                                                        padding: '16px',
                                                        borderRadius: '16px',
                                                        border: `1.5px solid ${isSelected ? bot.color : isAllowed ? 'var(--border-color)' : '#e0e0e0'}`,
                                                        background: isSelected ? `${bot.color}08` : isAllowed ? 'white' : '#f5f5f5',
                                                        cursor: isAllowed ? 'pointer' : 'not-allowed',
                                                        transition: 'all 0.2s',
                                                        opacity: isAllowed ? 1 : 0.6,
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {!isAllowed && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '8px',
                                                            right: '8px',
                                                            background: '#ff9800',
                                                            color: 'white',
                                                            fontSize: '0.6rem',
                                                            fontWeight: 800,
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            Locked
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div style={{ 
                                                            width: '32px', 
                                                            height: '32px', 
                                                            background: isAllowed ? bot.color : '#9e9e9e', 
                                                            borderRadius: '8px', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            color: 'white',
                                                            opacity: isAllowed ? 1 : 0.5
                                                        }}>
                                                            <Search size={16} />
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={18} color={bot.color} />}
                                                        {!isAllowed && (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2">
                                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isAllowed ? 'inherit' : '#9e9e9e' }}>{bot.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: isAllowed ? 'var(--text-light)' : '#bdbdbd' }}>{bot.desc}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-block btn-lg mt-8"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !inputText.trim() || selectedBots.length === 0}
                                    style={{ height: '64px', borderRadius: '16px', fontSize: '1.1rem' }}
                                >
                                    {isSubmitting
                                        ? <><Loader2 size={24} className="animate-spin" style={{ marginRight: '12px' }} /> Submitting to {selectedBots.length} Engine(s)...</>
                                        : <>Submit to {selectedBots.length} Engine(s) <Send size={24} style={{ marginLeft: '12px' }} /></>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bot Log Modal */}
            <AnimatePresence>
                {showBotLogModal && selectedBotLogs && selectedBotForLogs && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="panel-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{botOptions.find(b => b.id === selectedBotForLogs)?.name || selectedBotForLogs} Bot Log</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>Detailed signal logs for {selectedBotLogs.url}</p>
                                </div>
                                <button onClick={() => setShowBotLogModal(false)}><X size={24} /></button>
                            </div>
                            <div style={{ background: '#121212', borderRadius: '12px', padding: '24px', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5', maxHeight: '400px', overflowY: 'auto' }}>
                                {generateBotLogs(selectedBotLogs, selectedBotForLogs).map((log, i) => (
                                    <div key={i} style={{
                                        marginBottom: '8px',
                                        color: log.includes('COMPLETED') ? '#64ffda'
                                            : log.includes('SIGNAL') ? '#00e676'
                                            : log.includes('SYSTEM') ? '#ffab00'
                                            : log.includes('REQUEST') ? '#ffd740'
                                            : log.includes('USER-AGENT') || log.includes('HEADER') ? 'rgba(255,255,255,0.6)'
                                            : log.includes('RESPONSE') ? '#4fc3f7'
                                            : '#fff'
                                    }}>
                                        {log}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowBotLogModal(false)}
                                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Links Modal */}
            <AnimatePresence>
                {showAddLinksModal && selectedResultForLinks && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="panel-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0 }}>Add Link to {selectedResultForLinks.url.substring(0, 30)}...</h3>
                                <button onClick={() => setShowAddLinksModal(false)}><X size={24} /></button>
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>Link URL</label>
                                <input
                                    type="url"
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    placeholder="https://example.com/page"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setShowAddLinksModal(false)}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddLink}
                                    disabled={!newLinkUrl.trim()}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: newLinkUrl.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, opacity: newLinkUrl.trim() ? 1 : 0.6 }}
                                >
                                    Add Link
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
