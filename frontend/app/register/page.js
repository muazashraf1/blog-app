'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user edits
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateClientSide = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required.';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      errors.username = 'Username can only contain letters, numbers, and underscores.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email.trim(),
        formData.username.trim(),
        formData.password,
        formData.passwordConfirm
      );

      toast.success('Account created successfully! Logging you in...');

      // Auto-login upon successful registration
      try {
        await login(formData.email.trim(), formData.password);
        router.push('/');
      } catch {
        // Fallback to manual login screen if auto-login fails
        router.push('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const resData = err.response?.data;

      if (resData && typeof resData === 'object') {
        const backendErrors = {};
        let message = '';

        Object.keys(resData).forEach((key) => {
          if (Array.isArray(resData[key])) {
            backendErrors[key] = resData[key].join(' ');
          } else if (typeof resData[key] === 'string') {
            if (key === 'detail' || key === 'message') {
              message = resData[key];
            } else {
              backendErrors[key] = resData[key];
            }
          }
        });

        setFieldErrors(backendErrors);
        if (message) {
          setGeneralError(message);
        } else if (Object.keys(backendErrors).length === 0) {
          setGeneralError('Registration failed. Please check your credentials.');
        }
      } else {
        setGeneralError('Unable to connect to backend service. Please ensure the API is running.');
      }
      toast.error('Registration failed. Please review the errors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2.25rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon-gradient" style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', borderRadius: '14px' }}>
            <BookOpen size={22} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Create an Account
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Join DevScribe as a reader, comment on stories, or get promoted to author.
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

        <form onSubmit={handleSubmit} id="register-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-email"
                name="email"
                type="email"
                className="form-input"
                style={{
                  paddingLeft: '2.6rem',
                  borderColor: fieldErrors.email ? '#f43f5e' : undefined,
                }}
                placeholder="developer@example.com"
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
            {fieldErrors.email && (
              <span style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.2rem' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Username Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-username">
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-username"
                name="username"
                type="text"
                className="form-input"
                style={{
                  paddingLeft: '2.6rem',
                  borderColor: fieldErrors.username ? '#f43f5e' : undefined,
                }}
                placeholder="tech_author"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
              <User 
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
            {fieldErrors.username && (
              <span style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.2rem' }}>
                {fieldErrors.username}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{
                  paddingLeft: '2.6rem',
                  paddingRight: '2.6rem',
                  borderColor: fieldErrors.password ? '#f43f5e' : undefined,
                }}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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
            {fieldErrors.password && (
              <span style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.2rem' }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          {/* Password Confirm Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password-confirm">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password-confirm"
                name="passwordConfirm"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{
                  paddingLeft: '2.6rem',
                  borderColor: fieldErrors.passwordConfirm ? '#f43f5e' : undefined,
                }}
                placeholder="Repeat password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                autoComplete="new-password"
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
            </div>
            {fieldErrors.passwordConfirm && (
              <span style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.2rem' }}>
                {fieldErrors.passwordConfirm}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            id="register-submit-btn"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem 1rem' }}
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer info & link */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <span>Already registered? </span>
          <Link href="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'underline' }}>
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
}
