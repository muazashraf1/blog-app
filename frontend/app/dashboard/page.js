'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { postsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { 
  PenTool, 
  PlusCircle, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  Upload, 
  RotateCcw,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'draft'
  const [actionInProgress, setActionInProgress] = useState(null);

  // Fetch author's posts from /api/v1/me/posts/
  const loadAuthorPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await postsAPI.getMyPosts();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setPosts(data);
    } catch (err) {
      console.error('Failed to load author posts:', err);
      toast.error('Unable to fetch your posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthorPosts();
  }, [loadAuthorPosts]);

  const publishedPosts = posts.filter((p) => p.status === 'published');
  const draftPosts = posts.filter((p) => p.status === 'draft');

  // Toggle Publish Action
  const handlePublish = async (slug) => {
    setActionInProgress(slug);
    try {
      await postsAPI.publishPost(slug);
      toast.success('Post published to live feed!');
      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.slug === slug ? { ...p, status: 'published', published_at: new Date().toISOString() } : p
        )
      );
    } catch (err) {
      console.error('Publish error:', err);
      toast.error('Failed to publish post.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle Unpublish Action
  const handleUnpublish = async (slug) => {
    setActionInProgress(slug);
    try {
      await postsAPI.unpublishPost(slug);
      toast.success('Post unpublished back to draft.');
      // Update local state
      setPosts((prev) =>
        prev.map((p) =>
          p.slug === slug ? { ...p, status: 'draft', published_at: null } : p
        )
      );
    } catch (err) {
      console.error('Unpublish error:', err);
      toast.error('Failed to unpublish post.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Delete Post Action
  const handleDelete = async (slug, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    setActionInProgress(slug);
    try {
      await postsAPI.deletePost(slug);
      toast.success('Post deleted successfully.');
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Failed to delete post.');
    } finally {
      setActionInProgress(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Draft';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Draft';
    }
  };

  const displayedPosts = activeTab === 'published' ? publishedPosts : draftPosts;

  return (
    <div className="app-container" style={{ maxWidth: '1100px', paddingBottom: '4rem' }}>
      {/* Studio Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <PenTool size={15} />
            <span>Author Studio</span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Welcome, {user?.username}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage your articles, draft new tech perspectives, and publish to the community.
          </p>
        </div>

        <Link href="/dashboard/posts/new" className="btn btn-primary" id="dashboard-new-post-btn">
          <PlusCircle size={17} />
          <span>Write New Article</span>
        </Link>
      </div>

      {/* Metrics Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Articles</span>
            <Layers size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{posts.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Published Articles</span>
            <CheckCircle size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{publishedPosts.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Draft Articles</span>
            <FileText size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#94a3b8' }}>{draftPosts.length}</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.75rem', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('published')}
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: activeTab === 'published' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'published' ? '2px solid #6366f1' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
          id="tab-published-posts"
        >
          <span>Published Articles</span>
          <span className="badge badge-published" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
            {publishedPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('draft')}
          style={{
            padding: '0.65rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: activeTab === 'draft' ? '#ffffff' : 'var(--text-muted)',
            borderBottom: activeTab === 'draft' ? '2px solid #6366f1' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
          id="tab-draft-posts"
        >
          <span>Drafts Workspace</span>
          <span className="badge badge-draft" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
            {draftPosts.length}
          </span>
        </button>
      </div>

      {/* Post Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading studio posts...
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', margin: '0 auto 1.25rem' }}>
            <FileText size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {activeTab === 'published' ? 'No published articles yet' : 'No drafts currently'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '440px', margin: '0 auto 1.75rem' }}>
            {activeTab === 'published'
              ? 'Publish one of your drafts to make it discoverable on the public reader feed.'
              : 'Write a new article with split-screen Markdown preview and save it as a draft.'}
          </p>
          <Link href="/dashboard/posts/new" className="btn btn-primary">
            <PlusCircle size={16} /> Create Article
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedPosts.map((post) => {
            const isBusy = actionInProgress === post.slug;

            return (
              <div 
                key={post.id || post.slug} 
                className="glass-card" 
                style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}
                id={`dashboard-post-${post.slug}`}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                    {post.category ? (
                      <span className="badge badge-category">
                        {post.category.name}
                      </span>
                    ) : (
                      <span className="badge badge-category" style={{ opacity: 0.6 }}>General</span>
                    )}

                    <span className={post.status === 'published' ? 'badge badge-published' : 'badge badge-draft'}>
                      {post.status}
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {post.title}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.excerpt || 'Markdown article draft...'}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* View Live (if published) */}
                  {post.status === 'published' && (
                    <Link
                      href={`/posts/${post.slug}`}
                      className="btn btn-sm btn-outline"
                      title="View Published Article"
                    >
                      <Eye size={14} /> View
                    </Link>
                  )}

                  {/* Edit Article */}
                  <Link
                    href={`/dashboard/posts/${post.slug}/edit`}
                    className="btn btn-sm btn-secondary"
                    title="Edit Markdown Content"
                  >
                    <Edit3 size={14} /> Edit
                  </Link>

                  {/* Publish / Unpublish Toggle Action */}
                  {post.status === 'draft' ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handlePublish(post.slug)}
                      disabled={isBusy}
                      title="Publish to Feed"
                    >
                      <Upload size={14} />
                      <span>{isBusy ? 'Publishing...' : 'Publish'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleUnpublish(post.slug)}
                      disabled={isBusy}
                      title="Unpublish back to draft"
                    >
                      <RotateCcw size={14} />
                      <span>{isBusy ? 'Reverting...' : 'Unpublish'}</span>
                    </button>
                  )}

                  {/* Delete Article */}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(post.slug, post.title)}
                    disabled={isBusy}
                    title="Delete Article"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['author', 'admin']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
