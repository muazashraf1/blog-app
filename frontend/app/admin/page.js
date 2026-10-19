'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { adminAPI, categoriesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Users,
  Tag,
  UserCheck,
  UserX,
  PenSquare,
  TrendingUp,
  Trash2,
  Edit3,
  Plus,
  Check,
  X,
  Search,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';

/* ───────── Users Management Tab ───────── */
function UsersManagement() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setActionInProgress(`role-${userId}`);
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      toast.success(`User promoted to ${newRole}!`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error('Failed to update user role.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    setActionInProgress(`active-${userId}`);
    try {
      await adminAPI.updateUser(userId, { is_active: !currentActive });
      toast.success(currentActive ? 'Account deactivated.' : 'Account reactivated!');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
      );
    } catch (err) {
      toast.error('Failed to update account status.');
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    if (role === 'admin') return 'badge badge-admin';
    if (role === 'author') return 'badge badge-author';
    return 'badge badge-reader';
  };

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Users', value: users.length, color: '#818cf8' },
          { label: 'Readers', value: users.filter(u => u.role === 'reader').length, color: '#22d3ee' },
          { label: 'Authors', value: users.filter(u => u.role === 'author').length, color: '#c084fc' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#fbbf24' },
          { label: 'Inactive', value: users.filter(u => !u.is_active).length, color: '#f87171' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: '380px', marginBottom: '1.25rem' }}>
        <input
          id="admin-user-search"
          type="text"
          className="form-input"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
        <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      </div>

      {/* Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-sm btn-secondary" onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading users...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === currentAdmin?.id;
                return (
                  <tr
                    key={u.id}
                    id={`admin-user-row-${u.id}`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="user-avatar" style={{ width: '2rem', height: '2rem', fontSize: '0.8rem', flexShrink: 0 }}>
                          {u.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.username}</span>
                        {isSelf && <span style={{ fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>You</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={getRoleBadgeClass(u.role)}>{u.role}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: u.is_active ? '#34d399' : '#f87171', fontWeight: 600 }}>
                        {u.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {isSelf ? (
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* Promote to Author */}
                          {u.role === 'reader' && (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => handleRoleChange(u.id, 'author')}
                              disabled={actionInProgress === `role-${u.id}`}
                              id={`promote-author-${u.id}`}
                            >
                              <TrendingUp size={12} />
                              {actionInProgress === `role-${u.id}` ? '...' : 'Promote → Author'}
                            </button>
                          )}
                          {/* Demote to Reader */}
                          {u.role === 'author' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              onClick={() => handleRoleChange(u.id, 'reader')}
                              disabled={actionInProgress === `role-${u.id}`}
                              id={`demote-reader-${u.id}`}
                            >
                              ↩ Demote → Reader
                            </button>
                          )}
                          {/* Toggle Active */}
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            disabled={actionInProgress === `active-${u.id}`}
                            id={`toggle-active-${u.id}`}
                          >
                            {u.is_active ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              No users match the search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Categories Management Tab ───────── */
function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.getCategories();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error('Category name is required.'); return; }
    setSaving(true);
    try {
      const res = await categoriesAPI.createCategory({ name: formName.trim() });
      toast.success(`Category "${res.data.name}" created!`);
      setCategories((prev) => [...prev, res.data]);
      setFormName('');
      setShowForm(false);
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to create category.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) { toast.error('Category name cannot be blank.'); return; }
    setSaving(true);
    try {
      const res = await categoriesAPI.updateCategory(id, { name: editingName.trim() });
      toast.success('Category updated!');
      setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      const msg = err.response?.data?.name?.[0] || 'Failed to update category.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Posts in this category will become uncategorized.`)) return;
    try {
      await categoriesAPI.deleteCategory(id);
      toast.success('Category deleted.');
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error('Failed to delete category.');
    }
  };

  return (
    <div>
      {/* Add New Category Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} total
        </p>
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(!showForm); setFormName(''); }}
          id="admin-add-category-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            id="admin-category-name-input"
            type="text"
            className="form-input"
            placeholder="e.g. System Design, Web Performance..."
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={{ flex: '1 1 260px' }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving} id="admin-create-category-submit">
            <Check size={15} /> {saving ? 'Creating...' : 'Create'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
            <X size={15} /> Cancel
          </button>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No categories yet. Create the first one above!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card"
              id={`admin-category-${cat.id}`}
              style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}
            >
              {editingId === cat.id ? (
                <input
                  type="text"
                  className="form-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                  style={{ flex: '1 1 200px', maxWidth: '360px' }}
                  autoFocus
                />
              ) : (
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.975rem' }}>{cat.name}</span>
                  <span style={{ marginLeft: '0.65rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    /categories/{cat.slug}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingId === cat.id ? (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(cat.id)} disabled={saving}>
                      <Check size={13} /> {saving ? '...' : 'Save'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}>
                      <X size={13} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => { setEditingId(cat.id); setEditingName(cat.name); }}
                      id={`edit-category-${cat.id}`}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      id={`delete-category-${cat.id}`}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Main Admin Page ───────── */
function AdminContent() {
  const [activeTab, setActiveTab] = useState('users');
  const { user } = useAuth();

  return (
    <div className="app-container" style={{ maxWidth: '1100px', paddingBottom: '4rem' }}>
      {/* Admin Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <ShieldCheck size={15} /> Admin Control Center
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
          Platform Administration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Manage user roles, platform categories, and enforce content moderation policies.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem', paddingBottom: '0.25rem' }}>
        {[
          { id: 'users', label: 'User Management', icon: <Users size={16} /> },
          { id: 'categories', label: 'Category Management', icon: <Tag size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            id={`admin-tab-${tab.id}`}
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid #fbbf24' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'categories' && <CategoriesManagement />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
