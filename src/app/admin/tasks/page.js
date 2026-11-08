'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Search, CheckCircle, XCircle } from 'lucide-react';

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', reward: 10, type: 'general', link: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/tasks');
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

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskForm)
            });
            if (res.ok) {
                setShowTaskModal(false);
                setTaskForm({ title: '', description: '', reward: 10, type: 'general', link: '' });
                fetchTasks();
            } else {
                alert("Failed to create task");
            }
        } catch (error) {
            console.error("Task creation failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproval = async (submissionId, status, adminNote = "") => {
        try {
            const res = await fetch('/api/admin/tasks/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, status, adminNote })
            });
            if (res.ok) {
                fetchTasks();
            } else {
                alert("Failed to process approval");
            }
        } catch (error) {
            console.error("Approval failed", error);
        }
    };

    return (
        <div className="manage-users">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Tasks & Rewards Hub</h1>
                    <p className="text-muted">Manage community tasks and verify user submissions.</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowTaskModal(true)}>
                    <Plus size={18} /> Add New Task
                </button>
            </div>

            <div className="admin-card mb-8">
                <h3 style={{ marginBottom: '20px' }}>Active Tasks & Submissions</h3>
                {isLoading ? (
                    <p style={{ color: 'var(--text-light)' }}>Loading tasks...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', background: 'var(--bg-light)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>
                                            {task.title}
                                            <span style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '12px', background: 'var(--admin-primary)', color: 'white' }}>
                                                {task.type.toUpperCase()}
                                            </span>
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>{task.description}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{task.reward} URLs</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Reward</div>
                                    </div>
                                </div>

                                <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                    <table className="admin-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Proof Info</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {task.submissions && task.submissions.length > 0 ? task.submissions.map(sub => (
                                                <tr key={sub.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{sub.user?.name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{sub.user?.email || ''}</div>
                                                    </td>
                                                    <td>
                                                        {sub.proofText && <div style={{ fontSize: '0.8rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.proofText}</div>}
                                                        {sub.proofImage && <a href={sub.proofImage} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View Image</a>}
                                                    </td>
                                                    <td>
                                                        <span className={`admin-badge`} style={{ 
                                                            background: sub.status === 'pending' ? '#fef3c7' : sub.status === 'approved' ? '#dcfce7' : '#fee2e2',
                                                            color: sub.status === 'pending' ? '#d97706' : sub.status === 'approved' ? '#16a34a' : '#dc2626'
                                                        }}>
                                                            {sub.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {sub.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={() => handleApproval(sub.id, 'approved')} className="admin-btn" style={{ padding: '6px', color: '#16a34a', background: '#dcfce7' }} title="Approve">
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button onClick={() => handleApproval(sub.id, 'rejected')} className="admin-btn" style={{ padding: '6px', color: '#dc2626', background: '#fee2e2' }} title="Reject">
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-light)' }}>No submissions yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && <p>No tasks found. Create one above.</p>}
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            <AnimatePresence>
                {showTaskModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-card" style={{ width: '100%', maxWidth: '500px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3>Create New Task</h3>
                                <button onClick={() => setShowTaskModal(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateTask}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Task Title</label>
                                    <input type="text" className="input" required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} style={{ width: '100%', border: '1px solid var(--border-color)' }} />
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Description</label>
                                    <textarea className="input" required value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} style={{ width: '100%', border: '1px solid var(--border-color)', height: '80px' }} />
                                </div>
                                <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Reward (URL Credits)</label>
                                        <input type="number" className="input" required value={taskForm.reward} onChange={e => setTaskForm({...taskForm, reward: e.target.value})} style={{ width: '100%', border: '1px solid var(--border-color)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Task Type</label>
                                        <select className="input" value={taskForm.type} onChange={e => setTaskForm({...taskForm, type: e.target.value})} style={{ width: '100%', border: '1px solid var(--border-color)' }}>
                                            <option value="general">General</option>
                                            <option value="gmb">GMB Review</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Target Link (Optional)</label>
                                    <input type="url" className="input" value={taskForm.link} onChange={e => setTaskForm({...taskForm, link: e.target.value})} placeholder="https://..." style={{ width: '100%', border: '1px solid var(--border-color)' }} />
                                </div>
                                <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
