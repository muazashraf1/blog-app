'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PostEditor from '@/components/PostEditor';

export default function NewPostPage() {
  return (
    <ProtectedRoute allowedRoles={['author', 'admin']}>
      <PostEditor isEditing={false} />
    </ProtectedRoute>
  );
}
