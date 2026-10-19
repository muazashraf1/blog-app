import React from 'react';
import { BookOpen, Terminal, Database, Shield, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="app-container footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="logo-icon-gradient" style={{ width: '1.85rem', height: '1.85rem' }}>
            <BookOpen size={15} />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
            DevScribe<span style={{ color: 'var(--secondary)' }}>.</span>
          </span>
        </div>

        <p style={{ maxWidth: '640px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          A high-performance publication platform engineered with clean architecture, role-based access control (RBAC), and PostgreSQL full-text search.
        </p>

        {/* Tech Stack Highlights */}
        <div className="footer-tech-badges">
          <span className="tech-pill">
            <Cpu size={12} color="var(--primary)" /> Next.js 16 App Router
          </span>
          <span className="tech-pill">
            <Terminal size={12} color="var(--color-success)" /> Django REST Framework
          </span>
          <span className="tech-pill">
            <Database size={12} color="var(--secondary)" /> PostgreSQL + GIN Search
          </span>
          <span className="tech-pill">
            <Shield size={12} color="var(--role-admin-text)" /> JWT & RBAC
          </span>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-subtle)', margin: '0.5rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '1rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <span>© 2026 DevScribe. FalconXoft Weekend Assessment — Project 1.</span>
          <span>Engineered with Precision & Best Practices</span>
        </div>
      </div>
    </footer>
  );
}
