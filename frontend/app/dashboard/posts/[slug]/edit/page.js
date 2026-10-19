'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import PostEditor from '@/components/PostEditor';
import toast from 'react-hot-toast';

function EditPostContent() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    postsAPI
      .getPostBySlug(slug)
      .then((res) => {
        setPost(res.data);
      })
      .catch((err) => {
        console.error('Failed to load post for editing:', err);
        toast.error('Could not load post for editing.');
        router.push('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="app-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading article data into studio...</p>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return <PostEditor isEditing={true} slug={slug} initialData={post} />;
}

export default function EditPostPage() {
  return (
    <ProtectedRoute allowedRoles={['author', 'admin']}>
      <Suspense
        fallback={
          <div className="app-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading article editor...</p>
          </div>
        }
      >
        <EditPostContent />
      </Suspense>
    </ProtectedRoute>
  );
}
