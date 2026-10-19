'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { postsAPI, categoriesAPI } from '@/lib/api';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FilterX
} from 'lucide-react';

export default function HomeFeedPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories once on mount
  useEffect(() => {
    categoriesAPI
      .getCategories()
      .then((res) => {
        // Backend might return array or paginated results
        const cats = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setCategories(cats);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Fetch published posts with live search & category filter
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const res = await postsAPI.getPosts(params);
      const data = res.data;

      if (data && Array.isArray(data.results)) {
        setPosts(data.results);
        setTotalCount(data.count || data.results.length);
        const pageSize = 10;
        setTotalPages(Math.ceil((data.count || data.results.length) / pageSize) || 1);
      } else if (Array.isArray(data)) {
        setPosts(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setPosts([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedCategory]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  const handleCategoryClick = (slug) => {
    setSelectedCategory(slug === selectedCategory ? '' : slug);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const calculateReadTime = (text) => {
    if (!text) return '2 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min read`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="app-container">
      {/* Hero Discovery Banner */}
      <section style={{ textAlign: 'center', paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.35rem 1rem', background: 'var(--accent-badge-bg)', border: '1px solid var(--border-default)', borderRadius: '9999px', fontSize: '0.85rem', color: 'var(--accent-badge-text)', fontWeight: 600 }}>
          <Sparkles size={14} />
          <span>Curated Tech Perspectives & Architecture Deep Dives</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
          Explore, Learn & <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Share Engineering Insights</span>
        </h1>

        <p style={{ maxWidth: '640px', margin: '0 auto 2.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Discover production-grade articles, system design patterns, and engineering stories powered by PostgreSQL full-text search.
        </p>

        {/* Live Search Bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              id="feed-search-input"
              type="text"
              className="form-input"
              placeholder="Search posts by title or markdown body content..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                paddingLeft: '3rem',
                paddingRight: '2rem',
                height: '3.4rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-md)',
              }}
            />
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '1.2rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1.2rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter Pills Bar */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
          <button
            type="button"
            className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => handleCategoryClick('')}
          >
            All Topics
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              type="button"
              className={`category-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.name}
            </button>
          ))}

          {(selectedCategory || searchQuery) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-sm btn-outline"
              style={{ marginLeft: 'auto', fontSize: '0.775rem', gap: '0.35rem' }}
            >
              <FilterX size={14} /> Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Articles Feed Section */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>
            {selectedCategory 
              ? `Category: ${categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}`
              : searchQuery 
                ? `Search Results for "${searchQuery}"`
                : 'Latest Publications'}
          </h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Showing {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="post-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="glass-card" style={{ height: '240px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ width: '30%', height: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px' }} />
                <div style={{ width: '85%', height: '26px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }} />
                <div style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
                <div style={{ marginTop: 'auto', width: '60%', height: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', margin: '0 auto 1.25rem' }}>
              <BookOpen size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No articles found</h3>
            <p style={{ maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
              {searchQuery || selectedCategory
                ? 'No published posts match your current search criteria or category filter.'
                : 'No published posts are available yet. Authors can publish articles from their studio.'}
            </p>
            {(searchQuery || selectedCategory) && (
              <button onClick={handleClearFilters} className="btn btn-secondary" style={{ display: 'inline-flex' }}>
                Reset Search & Filters
              </button>
            )}
          </div>
        ) : (
          /* Cards Grid */
          <div className="post-grid">
            {posts.map((post) => (
              <Link 
                key={post.id || post.slug} 
                href={`/posts/${post.slug}`} 
                className="post-card"
                id={`post-card-${post.slug}`}
              >
                {/* Category & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  {post.category ? (
                    <span className="badge badge-category">
                      {post.category.name}
                    </span>
                  ) : (
                    <span className="badge badge-category" style={{ opacity: 0.6 }}>General</span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    {calculateReadTime(post.excerpt || post.body)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="post-card-title">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="post-card-excerpt">
                  {post.excerpt || 'Read the full markdown article, explore engineering code examples, and join the discussion...'}
                </p>

                {/* Footer Metadata */}
                <div className="post-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="user-avatar" style={{ width: '1.65rem', height: '1.65rem', fontSize: '0.75rem' }}>
                      {post.author?.username?.slice(0, 2).toUpperCase() || 'AU'}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {post.author?.username || 'Author'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              className="btn btn-sm btn-secondary"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
