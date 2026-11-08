'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Clock,
    XCircle,
    X,
    UploadCloud,
    Star
} from 'lucide-react';

export default function EarnPage() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submittingTask, setSubmittingTask] = useState(null); // The task currently being submitted
    const [proofForm, setProofForm] = useState({ proofText: '', proofImage: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tasks');
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/tasks/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: submittingTask.id,
                    proofText: proofForm.proofText,
                    proofImage: proofForm.proofImage
                })
            });
            if (res.ok) {
                setSubmittingTask(null);
                setProofForm({ proofText: '', proofImage: '' });
                fetchTasks();
            } else {
                const err = await res.json();
                alert(`Submission failed: ${err.error}`);
            }
        } catch (error) {
            console.error("Task submission failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const gmbTasks = tasks.filter(t => t.type === 'gmb');
    const generalTasks = tasks.filter(t => t.type === 'general');

    const renderTaskCard = (task, index) => {
        const isCompleted = task.status === 'approved';
        const isPending = task.status === 'pending';
        const isRejected = task.status === 'rejected';
        const isAvailable = task.status === 'available';

        return (
            <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="panel-card mb-3"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px',
                    opacity: isCompleted ? 0.7 : 1,
                    border: isCompleted ? '1px solid var(--success)' : isPending ? '1px solid #f59e0b' : '1px solid var(--border-color)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: task.type === 'gmb' ? 'rgba(66, 133, 244, 0.1)' : 'var(--bg-light)',
                        color: task.type === 'gmb' ? '#4285F4' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-color)'
                    }}>
                        {task.type === 'gmb' ? <Star size={24} /> : <Gift size={24} />}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>
                            {task.title}
                            {task.type === 'gmb' && <span style={{ marginLeft: '10px', fontSize: '0.65rem', padding: '2px 6px', background: '#4285F4', color: 'white', borderRadius: '4px' }}>GMB REVIEW</span>}
                        </h3>
                        <p className="text-xs text-muted" style={{ margin: 0 }}>{task.description}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>+{task.reward}</span>
                        <span className="text-xs text-muted">CREDITS</span>
                    </div>
                    
                    {isAvailable || isRejected ? (
                        <button 
                            className="btn btn-primary btn-sm" 
                            onClick={() => {
                                if(task.link) window.open(task.link, '_blank');
                                setSubmittingTask(task);
                            }}
                        >
                            {isRejected ? 'Retry Task' : 'Start Task'} <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                        </button>
                    ) : isPending ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', padding: '8px 16px', background: '#fffbeb', borderRadius: '8px' }}>
                            <Clock size={16} /> Pending Review
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600, fontSize: '0.85rem', padding: '8px 16px', background: '#dcfce7', borderRadius: '8px' }}>
                            <CheckCircle2 size={16} /> Completed
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="earn-panel">
            <div className="panel-page-header">
                <h1 className="panel-page-title">Rewards Hub</h1>
                <p className="panel-page-subtitle">Boost your indexing power by completing simple community tasks.</p>
            </div>

            {/* GMB Tasks Section */}
            {isLoading ? (
                <p>Loading tasks...</p>
            ) : (
                <>
                    {gmbTasks.length > 0 && (
                        <div className="mb-8">
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Star color="#4285F4" fill="#4285F4" size={20} /> 
                                Google Business Profile (GMB) Reviews
                            </h2>
                            <div className="task-list">
                                {gmbTasks.map((t, i) => renderTaskCard(t, i))}
                            </div>
                        </div>
                    )}

                    {/* General Tasks Section */}
                    {generalTasks.length > 0 && (
                        <div className="mb-4">
                            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Gift color="var(--primary)" size={20} /> 
                                General Community Tasks
                            </h2>
                            <div className="task-list">
                                {generalTasks.map((t, i) => renderTaskCard(t, i))}
                            </div>
                        </div>
                    )}

                    {tasks.length === 0 && (
                        <div className="panel-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                            <Gift size={40} style={{ margin: '0 auto 16px' }} />
                            <p>No active tasks available right now. Check back later!</p>
                        </div>
                    )}
                </>
            )}

            {/* Submission Modal */}
            <AnimatePresence>
                {submittingTask && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justify: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="panel-card" style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3>Submit Task Proof</h3>
                                <button onClick={() => setSubmittingTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            
                            <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 8px' }}>{submittingTask.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>{submittingTask.description}</p>
                                {submittingTask.link && (
                                    <a href={submittingTask.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        Open Task Link ↗
                                    </a>
                                )}
                            </div>

                            <form onSubmit={handleSubmitProof}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Proof Details / Link</label>
                                    <textarea 
                                        className="input" 
                                        placeholder="Paste your review text, post URL, or any relevant details..."
                                        value={proofForm.proofText} 
                                        onChange={e => setProofForm({...proofForm, proofText: e.target.value})} 
                                        style={{ width: '100%', border: '1px solid var(--border-color)', height: '80px', padding: '12px', borderRadius: '8px' }} 
                                    />
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Screenshot URL (Optional)</label>
                                    <input 
                                        type="url" 
                                        className="input" 
                                        placeholder="https://imgur.com/..."
                                        value={proofForm.proofImage} 
                                        onChange={e => setProofForm({...proofForm, proofImage: e.target.value})} 
                                        style={{ width: '100%', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }} 
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} disabled={isSubmitting || (!proofForm.proofText && !proofForm.proofImage)}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Review Proof'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
