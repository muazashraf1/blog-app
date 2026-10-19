'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { postsAPI, commentsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Send, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ShieldAlert,
  Sparkles,
  Share2,
  PenTool
} from 'lucide-react';

function PostDetailContent() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // New comment state
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Load post details
  const loadPost = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await postsAPI.getPostBySlug(slug);
      setPost(res.data);
    } catch (err) {
      console.error('Failed to load post:', err);
      toast.error('Article not found or unavailable.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Load post comments
  const loadComments = useCallback(async () => {
    if (!slug) return;
    setCommentsLoading(true);
    try {
      const res = await commentsAPI.getPostComments(slug);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  // Submit new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentBody.trim()) {
      toast.error('Comment cannot be blank.');
      return;
    }
    if (newCommentBody.length > 1000) {
      toast.error('Comment cannot exceed 1000 characters.');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await commentsAPI.addComment(slug, { body: newCommentBody.trim() });
      toast.success('Comment posted successfully!');
      setNewCommentBody('');
      // Prepend or refresh comments
      setComments((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error('Failed to post comment:', err);
      const msg = err.response?.data?.body?.[0] || 'Failed to post comment.';
      toast.error(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Start editing a comment
  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentBody(comment.body);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentBody('');
  };

  // Save edited comment
  const handleSaveEditComment = async (commentId) => {
    if (!editCommentBody.trim()) {
      toast.error('Comment cannot be blank.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await commentsAPI.updateComment(commentId, { body: editCommentBody.trim() });
      toast.success('Comment updated!');
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: res.data.body } : c))
      );
      setEditingCommentId(null);
      setEditCommentBody('');
    } catch (err) {
      console.error('Failed to edit comment:', err);
      toast.error('Failed to update comment.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete comment (Owner or Admin)
  const handleDeleteComment = async (commentId, asAdmin = false) => {
    const confirmMessage = asAdmin
      ? 'Moderator Action: Are you sure you want to permanently remove this comment?'
      : 'Are you sure you want to delete your comment?';

    if (!window.confirm(confirmMessage)) return;

    try {
      await commentsAPI.deleteComment(commentId);
      toast.success(asAdmin ? 'Comment removed by Moderator.' : 'Comment deleted.');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      toast.error('Could not delete comment.');
    }
  };

  const calculateReadTime = (text) => {
    if (!text) return '3 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min read`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(99, 102, 241, 0.2)', 
              borderTopColor: '#6366f1', 
              borderRadius: '50%', 
              animation: 'spin 0.8s linear infinite', 
              margin: '0 auto 1rem' 
            }} 
          />
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: 'var(--text-secondary)' }}>Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="app-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Article Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          The requested article may have been unpublished or removed.
        </p>
        <Link href="/" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Feed
        </Link>
      </div>
    );
  }

  const isAuthorOwner = user && (user.id === post.author?.id || isAdmin);

  return (
    <div className="app-container" style={{ maxWidth: '860px', paddingBottom: '4rem' }}>
      {/* Top Back Link & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <Link 
          href="/" 
          className="btn btn-sm btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          id="post-back-btn"
        >
          <ArrowLeft size={15} />
          <span>Back to Feed</span>
        </Link>

        {isAuthorOwner && (
          <Link 
            href="/dashboard" 
            className="btn btn-sm btn-outline" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}
          >
            <PenTool size={14} />
            <span>Manage in Studio</span>
          </Link>
        )}
      </div>

      {/* Article Header */}
      <article className="glass-card" style={{ padding: '2.5rem 2rem', marginBottom: '2rem' }}>
        {/* Category Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {post.category ? (
            <span className="badge badge-category">
              {post.category.name}
            </span>
          ) : (
            <span className="badge badge-category" style={{ opacity: 0.6 }}>General</span>
          )}

          {post.status === 'draft' && (
            <span className="badge badge-draft">Draft Preview</span>
          )}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '1.5rem', color: '#ffffff' }}>
          {post.title}
        </h1>

        {/* Author & Publication Details */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="user-avatar" style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.95rem' }}>
              {post.author?.username?.slice(0, 2).toUpperCase() || 'AU'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {post.author?.username || 'Author'}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Published Author
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} />
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} />
              {calculateReadTime(post.body)}
            </span>
          </div>
        </div>

        {/* Markdown Rendered Content */}
        <div className="markdown-content" id="article-markdown-body">
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
      </article>

      {/* Comments Section */}
      <section className="comments-container" id="comments-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={22} color="#818cf8" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Discussion ({comments.length})
          </h2>
        </div>

        {/* New Comment Submission Box */}
        {isAuthenticated ? (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <form onSubmit={handleAddComment} id="add-comment-form">
              <label 
                htmlFor="new-comment-textarea"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}
              >
                Join the conversation as <strong>{user?.username}</strong> ({user?.role})
              </label>
              <textarea
                id="new-comment-textarea"
                className="form-textarea"
                rows={3}
                placeholder="Share your technical perspective, ask a question, or leave constructive feedback..."
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                maxLength={1000}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: newCommentBody.length > 900 ? '#f43f5e' : 'var(--text-muted)' }}>
                  {newCommentBody.length} / 1000 characters
                </span>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  id="post-comment-btn"
                  disabled={submittingComment || !newCommentBody.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={14} />
                  <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>
              Want to join the discussion? Sign in with your reader or author account.
            </p>
            <Link href="/login" className="btn btn-sm btn-primary" id="comment-signin-btn">
              Sign In to Comment
            </Link>
          </div>
        )}

        {/* Comments Feed List */}
        {commentsLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No comments on this article yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {comments.map((comment) => {
              const isOwner = user && (comment.user?.id === user.id || comment.is_owner);
              const isEditing = editingCommentId === comment.id;

              return (
                <div key={comment.id} className="comment-card" id={`comment-${comment.id}`}>
                  {/* Comment Author Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="user-avatar" style={{ width: '1.85rem', height: '1.85rem', fontSize: '0.75rem' }}>
                        {comment.user?.username?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', marginRight: '0.5rem' }}>
                          {comment.user?.username || 'Reader'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Edit/Delete for Owner, Delete for Admin */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {isOwner && !isEditing && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => startEditComment(comment)}
                            title="Edit Comment"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteComment(comment.id, false)}
                            title="Delete Comment"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}

                      {/* Admin Moderator Delete Badge */}
                      {isAdmin && !isOwner && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={() => handleDeleteComment(comment.id, true)}
                          title="Admin Moderator Action"
                        >
                          <ShieldAlert size={13} />
                          <span>Moderate Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comment Body / Inline Edit Mode */}
                  {isEditing ? (
                    <div>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={editCommentBody}
                        onChange={(e) => setEditCommentBody(e.target.value)}
                        maxLength={1000}
                        style={{ marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={cancelEditComment}
                          disabled={savingEdit}
                        >
                          <X size={13} /> Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSaveEditComment(comment.id)}
                          disabled={savingEdit}
                        >
                          <Check size={13} /> {savingEdit ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.925rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {comment.body}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={
      <div className="app-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading article...</p>
      </div>
    }>
      <PostDetailContent />
    </Suspense>
  );
}
