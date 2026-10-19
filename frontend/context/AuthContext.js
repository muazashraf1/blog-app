'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Logout handler
  const logout = useCallback((redirectToLogin = true) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    setUser(null);
    setAccessToken(null);

    if (redirectToLogin && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [router]);

  // Synchronize profile with backend /auth/me/
  const refreshUserProfile = useCallback(async () => {
    try {
      const response = await authAPI.getMe();
      const updatedUser = response.data;
      setUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (err) {
      console.error('Failed to sync profile with /auth/me/:', err);
      return null;
    }
  }, []);

  // Initial token & user hydration on mount
  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('access_token');
          const storedUserStr = localStorage.getItem('user');

          if (storedToken) {
            setAccessToken(storedToken);
            if (storedUserStr) {
              try {
                setUser(JSON.parse(storedUserStr));
              } catch {
                // Malformed JSON fallback
              }
            }
            // Background profile refresh to catch any role promotion by Admin
            await refreshUserProfile();
          }
        }
      } catch (err) {
        console.error('Auth hydration error:', err);
      } finally {
        setLoading(false);
      }
    };

    hydrateAuth();

    // Listen for custom logout event emitted by api.js when token refresh fails
    const handleAuthLogout = () => {
      logout(true);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [logout, refreshUserProfile]);

  // Login action
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access, refresh, user: loggedUser } = response.data;

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(loggedUser));
    }

    setAccessToken(access);
    setUser(loggedUser);
    return loggedUser;
  };

  // Register action
  const register = async (email, username, password, passwordConfirm) => {
    const response = await authAPI.register({
      email,
      username,
      password,
      password_confirm: passwordConfirm,
    });
    return response.data;
  };

  // Role helper booleans
  const isReader = user?.role === 'reader';
  const isAuthor = user?.role === 'author';
  const isAdmin = user?.role === 'admin';
  const canCreatePost = isAuthor || isAdmin;
  const isAuthenticated = !!user;

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated,
    isReader,
    isAuthor,
    isAdmin,
    canCreatePost,
    login,
    register,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
