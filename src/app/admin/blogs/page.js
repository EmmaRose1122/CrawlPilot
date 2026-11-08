'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Plus,
    Search,
    Edit3,
    Trash2,
    Eye,
    X,
    Filter,
    Check,
    Loader2,
    AlertCircle
} from 'lucide-react';

export default function ManageBlogsPage() {
    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: 'Insights',
        excerpt: '',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        views: '0'
    });

    const fetchPosts = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/blogs');
            const data = await res.json();
            if (Array.isArray(data)) setPosts(data);
        } catch (error) {
            console.error('Failed to fetch blogs:', error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (id) => {
        if (confirm("Permanently delete this article? This cannot be undone.")) {
            setIsSaving(true);
            try {
                const res = await fetch(`/api/admin/blogs?id=${id}`, { method: 'DELETE' });
                if (res.ok) await fetchPosts();
            } catch (error) {
                console.error('Delete failed:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleOpenAdd = () => {
        setEditingPost(null);
        setFormData({
            title: '',
            slug: '',
            category: 'Insights',
            excerpt: '',
            content: '',
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            views: '0'
        });
        setShowModal(true);
    };

    const handleOpenEdit = (post) => {
        setEditingPost(post);
        setFormData(post);
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const method = editingPost ? 'PUT' : 'POST';
            const res = await fetch('/api/admin/blogs', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, id: editingPost?.id })
            });

            if (res.ok) {
                await fetchPosts();
                setShowModal(false);
            } else {
                const error = await res.json();
                alert(`Save failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPosts = posts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="manage-blogs">
            <div className="admin-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="admin-page-title">Blog Management</h1>
                        <p className="text-muted">Dynamic content engine for your project blog.</p>
                    </div>
                    <button className="admin-btn admin-btn-primary" onClick={handleOpenAdd}>
                        <Plus size={18} /> Add New Article
                    </button>
                </div>
            </div>

            <div className="admin-card">
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {posts.length > 0 ? (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Article</th>
                                    <th>Category</th>
                                    <th>Stats</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map((post) => (
                                    <tr key={post.id}>
                                        <td style={{ maxWidth: '400px' }}>
                                            <div style={{ fontWeight: 700 }}>{post.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-primary)', fontFamily: 'var(--font-mono)' }}>/{post.slug}</div>
                                        </td>
                                        <td>
                                            <span className="admin-badge" style={{ background: 'var(--bg-light)', color: 'var(--text-light)' }}>{post.category}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                                <Eye size={14} /> {post.views} views
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="admin-btn" style={{ padding: '6px' }} onClick={() => handleOpenEdit(post)}>
                                                    <Edit3 size={16} color="var(--primary)" />
                                                </button>
                                                <button className="admin-btn admin-btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(post.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center" style={{ padding: '40px' }}>
                            <FileText size={40} color="var(--border-color)" className="mb-2" />
                            <p className="text-muted">No articles found. Click "Add New Article" to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justify: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                <h3 style={{ margin: 0 }}>{editingPost ? 'Edit Article' : 'Compose New Article'}</h3>
                                <button onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleFormSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label className="text-xs font-bold uppercase mb-2 block">Article Title</label>
                                        <input
                                            type="text"
                                            className="input"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            style={{ width: '100%', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label className="text-xs font-bold uppercase mb-2 block">Slug URL</label>
                                            <input
                                                type="text"
                                                className="input"
                                                required
                                                placeholder="e.g. youtube-seo-guide"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                style={{ width: '100%', border: '1px solid var(--border-color)' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase mb-2 block">Category</label>
                                            <select
                                                className="input"
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                style={{ width: '100%', border: '1px solid var(--border-color)' }}
                                            >
                                                <option>Insights</option>
                                                <option>YouTube SEO</option>
                                                <option>Case Study</option>
                                                <option>Engineering</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase mb-2 block">Excerpt / Summary</label>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            required
                                            value={formData.excerpt}
                                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                            style={{ width: '100%', border: '1px solid var(--border-color)' }}
                                        />
                                    </div>

                                    <div style={{ padding: '16px', background: 'var(--bg-light)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                        <p className="text-xs text-muted" style={{ margin: 0 }}>
                                            <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                            Content editor is currently in beta. Markdown support enabled.
                                        </p>
                                    </div>

                                    <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '14px', justifyContent: 'center' }} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin" /> : editingPost ? 'Update Article' : 'Publish Article'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
