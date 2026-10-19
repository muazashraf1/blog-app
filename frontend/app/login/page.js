'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  BookOpen,
  KeyRound,
  ShieldCheck,
  PenSquare,
  UserCheck
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleQuickFill = (email, password) => {
    setFormData({ email, password });
    if (generalError) {
      setGeneralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!formData.email.trim() || !formData.password) {
      setGeneralError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login(formData.email.trim(), formData.password);
      toast.success(`Welcome back, ${loggedUser.username}!`);

      // Intelligent Role-based Redirect
      if (redirectPath) {
        router.push(redirectPath);
      } else if (loggedUser.role === 'author' || loggedUser.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      const resData = err.response?.data;

      if (resData?.detail) {
        setGeneralError(resData.detail);
      } else if (resData?.non_field_errors) {
        setGeneralError(resData.non_field_errors.join(' '));
      } else {
        setGeneralError('Invalid email or password. Please try again.');
      }
      toast.error('Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem 2.25rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="logo-icon-gradient" style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', borderRadius: '14px' }}>
          <BookOpen size={22} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
          Sign In
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Enter your credentials to access your studio, feed, or comments.
        </p>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem', 
            padding: '0.85rem 1rem', 
            background: 'rgba(244, 63, 94, 0.12)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            borderRadius: 'var(--radius-md)', 
            color: '#f87171', 
            fontSize: '0.875rem', 
            marginBottom: '1.5rem' 
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="login-form">
        {/* Email Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email Address
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-input"
              style={{ paddingLeft: '2.6rem' }}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
            <Mail 
              size={17} 
              style={{ 
                position: 'absolute', 
                left: '0.9rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
            <Lock 
              size={17} 
              style={{ 
                position: 'absolute', 
                left: '0.9rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }} 
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ 
                position: 'absolute', 
                right: '0.9rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)' 
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary"
          id="login-submit-btn"
          disabled={loading}
          style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem 1rem' }}
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In to Platform</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Demo Credentials Helper Box for Testing / Interview Loom */}
      <div 
        style={{ 
          marginTop: '1.75rem', 
          padding: '1rem', 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px dashed var(--border-subtle)', 
          borderRadius: 'var(--radius-md)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
          <KeyRound size={13} color="#8b5cf6" />
          <span>Quick-Fill Demo Credentials:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.725rem', padding: '0.35rem 0.4rem' }}
            onClick={() => handleQuickFill('admin@example.com', 'adminpass123')}
          >
            <ShieldCheck size={11} color="#fbbf24" /> Admin
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.725rem', padding: '0.35rem 0.4rem' }}
            onClick={() => handleQuickFill('author@example.com', 'authorpass123')}
          >
            <PenSquare size={11} color="#c084fc" /> Author
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.725rem', padding: '0.35rem 0.4rem' }}
            onClick={() => handleQuickFill('reader@example.com', 'readerpass123')}
          >
            <UserCheck size={11} color="#38bdf8" /> Reader
          </button>
        </div>
      </div>

      {/* Footer link */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <span>Don't have an account? </span>
        <Link href="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'underline' }}>
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="app-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <Suspense fallback={<div style={{ color: 'var(--text-secondary)' }}>Loading sign-in form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
