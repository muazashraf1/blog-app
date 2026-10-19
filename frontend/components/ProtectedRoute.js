'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ProtectedRouteInner({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect unauthenticated visitors to login, preserving intended destination
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role authorization if restricted
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="app-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div 
            style={{ 
              width: '3.5rem', 
              height: '3.5rem', 
              borderRadius: '50%', 
              background: 'rgba(244, 63, 94, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.25rem',
              color: '#f87171' 
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>Access Denied (HTTP 403)</h2>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Your account role is currently <span className="badge badge-reader">{user?.role}</span>. This workspace requires an <strong>{allowedRoles.join(' or ')}</strong> role.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  return (
    <Suspense
      fallback={
        <div className="app-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Verifying credentials...</p>
        </div>
      }
    >
      <ProtectedRouteInner allowedRoles={allowedRoles}>
        {children}
      </ProtectedRouteInner>
    </Suspense>
  );
}
