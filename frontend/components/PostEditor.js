'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { postsAPI, categoriesAPI } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  Code, 
  List, 
  Quote, 
  Link as LinkIcon, 
  Eye, 
  Edit3, 
  Columns, 
  Save, 
  Send, 
  ArrowLeft,
  Sparkles,
  Tag
} from 'lucide-react';

export default function PostEditor({ initialData = null, isEditing = false, slug = null }) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [categoryId, setCategoryId] = useState(initialData?.category?.id || initialData?.category_id || '');
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'write', 'preview'
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const textareaRef = useRef(null);

  // Fetch categories for dropdown
  useEffect(() => {
    categoriesAPI
      .getCategories()
      .then((res) => {
        const cats = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setCategories(cats);
      })
      .catch((err) => console.error('Failed to load categories in editor:', err));
  }, []);

  // Sync initialData if provided asynchronously
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.body) setBody(initialData.body);
      if (initialData.category?.id) setCategoryId(initialData.category.id);
    }
  }, [initialData]);

  // Generate live slug preview
  const slugPreview = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100) || 'your-post-slug';

  // Toolbar snippet injector
  const insertSnippet = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  const handleSave = async (shouldPublish = false) => {
    if (!title.trim()) {
      toast.error('Please enter a post title.');
      return;
    }
    if (!body.trim()) {
      toast.error('Post body cannot be empty.');
      return;
    }

    if (shouldPublish) {
      setPublishing(true);
    } else {
      setSaving(true);
    }

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        category_id: categoryId ? parseInt(categoryId, 10) : null,
      };

      let postSlug = slug;

      if (isEditing) {
        const updateRes = await postsAPI.updatePost(slug, payload);
        postSlug = updateRes.data.slug || slug;
        toast.success('Post changes saved successfully!');
      } else {
        const createRes = await postsAPI.createPost(payload);
        postSlug = createRes.data.slug;
        toast.success('Draft post created!');
      }

      // If user wants to publish immediately
      if (shouldPublish) {
        await postsAPI.publishPost(postSlug);
        toast.success('Post published to public feed!');
        router.push(`/posts/${postSlug}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Save/Publish post error:', err);
      const resData = err.response?.data;
      if (resData?.title) {
        toast.error(`Title error: ${resData.title.join(' ')}`);
      } else if (resData?.body) {
        toast.error(`Body error: ${resData.body.join(' ')}`);
      } else if (resData?.detail) {
        toast.error(resData.detail);
      } else {
        toast.error('Failed to save post. Please check fields.');
      }
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1280px', paddingBottom: '4rem' }}>
      {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="btn btn-sm btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={15} /> Back to Studio
        </button>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setViewMode('write')}
            style={{
              background: viewMode === 'write' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'write' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: viewMode === 'write' ? 'var(--shadow-sm)' : 'none',
              padding: '0.35rem 0.75rem',
            }}
          >
            <Edit3 size={14} /> Write
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setViewMode('split')}
            style={{
              background: viewMode === 'split' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'split' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: viewMode === 'split' ? 'var(--shadow-sm)' : 'none',
              padding: '0.35rem 0.75rem',
            }}
          >
            <Columns size={14} /> Split View
          </button>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setViewMode('preview')}
            style={{
              background: viewMode === 'preview' ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === 'preview' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: viewMode === 'preview' ? 'var(--shadow-sm)' : 'none',
              padding: '0.35rem 0.75rem',
            }}
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        {/* Save & Publish Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSave(false)}
            disabled={saving || publishing}
            id="editor-save-draft-btn"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSave(true)}
            disabled={saving || publishing}
            id="editor-publish-btn"
          >
            <Send size={15} />
            <span>{publishing ? 'Publishing...' : 'Publish Article'}</span>
          </button>
        </div>
      </div>

      {/* Post Metadata Card */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          
          {/* Post Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="post-title-input">
              Article Title <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              id="post-title-input"
              type="text"
              className="form-input"
              placeholder="e.g. Architecting Scalable APIs with Django & PostgreSQL"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ fontSize: '1.05rem', fontWeight: 600 }}
            />
            {/* Slug Live Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Auto-slug:</span>
              <code style={{ color: '#818cf8', background: 'rgba(255,255,255,0.04)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                /posts/{slugPreview}
              </code>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="post-category-select">
              Category / Topic
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="post-category-select"
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              >
                <option value="">Select a category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Tag size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

        </div>
      </div>

      {/* Split Markdown Editor & Live Preview */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr', 
          gap: '1.5rem',
          minHeight: '600px'
        }}
      >
        {/* Left Pane: Markdown Writing Canvas */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Markdown Toolbar */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                padding: '0.75rem 1rem', 
                background: 'rgba(255,255,255,0.03)', 
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap'
              }}
            >
              <button 
                type="button" 
                onClick={() => insertSnippet('**', '**')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Bold (**text**)"
              >
                <Bold size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('*', '*')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Italic (*text*)"
              >
                <Italic size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('## ')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Heading 2 (## Title)"
              >
                <Heading2 size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('### ')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Heading 3 (### Title)"
              >
                <Heading3 size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('```javascript\n', '\n```')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Code Block (```code```)"
              >
                <Code size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('- ')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Bullet List (- Item)"
              >
                <List size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('> ')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Quote (> Blockquote)"
              >
                <Quote size={14} />
              </button>
              <button 
                type="button" 
                onClick={() => insertSnippet('[', '](https://example.com)')} 
                className="btn btn-sm btn-outline" 
                style={{ padding: '0.3rem 0.5rem' }} 
                title="Link ([title](url))"
              >
                <LinkIcon size={14} />
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {body.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            {/* Textarea Canvas */}
            <textarea
              ref={textareaRef}
              id="post-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your article in rich Markdown format... 

# Section Title
Use headings, bullet points, and code blocks:

```python
def publish_story():
    return 'Live on DevScribe!'
```"
              style={{
                width: '100%',
                flex: 1,
                minHeight: '520px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '1.25rem',
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                resize: 'none',
              }}
            />
          </div>
        )}

        {/* Right Pane: Live Rendered Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div 
            className="glass-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 0, 
              overflow: 'hidden',
              background: 'rgba(15, 23, 42, 0.9)'
            }}
          >
            {/* Preview Banner */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem 1.25rem', 
                background: 'rgba(255,255,255,0.03)', 
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Eye size={14} color="#8b5cf6" />
                <span>Live Markdown Preview</span>
              </div>
              <span className="badge badge-published" style={{ fontSize: '0.7rem' }}>
                WYSIWYG Synchronized
              </span>
            </div>

            {/* Rendered Container */}
            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, maxHeight: '600px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.25rem', color: '#ffffff' }}>
                {title || 'Untitled Post Title'}
              </h1>

              <div className="markdown-content" id="editor-live-preview">
                {body.trim() ? (
                  <ReactMarkdown>{body}</ReactMarkdown>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Article preview will dynamically render here as you type in the editor...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
