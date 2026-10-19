'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, 
  PenSquare, 
  ShieldCheck, 
  LogOut, 
  User, 
  ChevronDown, 
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, loading, isReader, isAuthor, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const renderRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="badge badge-admin">
          <ShieldCheck size={12} />
          Admin
        </span>
      );
    }
    if (role === 'author') {
      return (
        <span className="badge badge-author">
          <PenSquare size={12} />
          Author
        </span>
      );
    }
    return (
      <span className="badge badge-reader">
        <User size={12} />
        Reader
      </span>
    );
  };

  return (
    <header className="navbar">
      <div className="app-container navbar-inner">
        {/* Brand Logo */}
        <NextLink href="/" className="navbar-logo" id="nav-brand-logo">
          <div className="logo-icon-gradient">
            <BookOpen size={18} strokeWidth={2.5} />
          </div>
          <span>DevScribe<span style={{ color: 'var(--secondary)' }}>.</span></span>
        </NextLink>

        {/* Navigation Items */}
        <nav className="navbar-nav">
          <NextLink href="/" className="nav-link" id="nav-home-link">
            Feed
          </NextLink>

          {/* Quick links for Authors / Admins */}
          {isAuthenticated && (isAuthor || isAdmin) && (
            <NextLink href="/dashboard" className="nav-link" id="nav-dashboard-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <LayoutDashboard size={15} />
              <span>Studio</span>
            </NextLink>
          )}

          {isAuthenticated && isAdmin && (
            <NextLink href="/admin" className="nav-link" id="nav-admin-link" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--role-admin-text)' }}>
              <ShieldCheck size={15} />
              <span>Admin</span>
            </NextLink>
          )}

          {/* Auth State Actions */}
          {loading ? (
            <div style={{ width: '80px', height: '32px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-default)' }} />
          ) : !isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <NextLink href="/login" className="btn btn-sm btn-outline" id="nav-login-btn">
                Sign In
              </NextLink>
              <NextLink href="/register" className="btn btn-sm btn-primary" id="nav-register-btn">
                <Sparkles size={14} />
                Get Started
              </NextLink>
            </div>
          ) : (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                id="user-menu-button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
              >
                <div className="user-avatar">
                  {getInitials(user?.username)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.username}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <div className="user-dropdown" id="user-dropdown-menu">
                  <div className="dropdown-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{user?.username}</span>
                      {renderRoleBadge(user?.role)}
                    </div>
                    <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user?.email}</span>
                  </div>

                  {(isAuthor || isAdmin) && (
                    <NextLink
                      href="/dashboard"
                      className="dropdown-item"
                      id="dropdown-dashboard-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard size={15} />
                      Author Studio
                    </NextLink>
                  )}

                  {isAdmin && (
                    <NextLink
                      href="/admin"
                      className="dropdown-item"
                      id="dropdown-admin-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <ShieldCheck size={15} color="var(--role-admin-text)" />
                      Admin Control Center
                    </NextLink>
                  )}

                  <button
                    className="dropdown-item dropdown-item-danger"
                    id="dropdown-logout-button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout(true);
                    }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
