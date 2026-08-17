'use client';

// ─── Admin — Staff Users Page ─────────────────────────────────────────────────
// /admin/admin-users — Manage Voxa internal staff accounts.
// Requires: users:read (list), users:create (add), users:update (edit/role), users:delete (deactivate)

import { useState, useEffect, useCallback } from 'react';
import { Pencil, UserX, UserPlus, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { adminUsersApi, rolesApi } from '@/lib/api';
import type { AdminUser, Role, CreateAdminUserPayload } from '@/lib/types';

const EMPTY_FORM: CreateAdminUserPayload = { email: '', fullName: '', password: '', roleId: '' };

export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminUserPayload>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', roleId: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const prefixed = `${type}::${msg}`;
    setToast(prefixed);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.allSettled([
        adminUsersApi.list(),
        rolesApi.adminList(),
      ]);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data ?? []);
      if (rolesRes.status === 'fulfilled') setRoles(rolesRes.value.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await adminUsersApi.create({ ...createForm, roleId: createForm.roleId || undefined });
      showToast('Staff member created', 'success');
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchData();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create staff member. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(user: AdminUser) {
    setEditTarget(user);
    const roleId = typeof user.roleId === 'object' && user.roleId !== null
      ? (user.roleId as Role)._id
      : (user.roleId as string) ?? '';
    setEditForm({ fullName: user.fullName, roleId });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    setEditError('');
    try {
      await adminUsersApi.update(editTarget._id, { fullName: editForm.fullName });
      if (editForm.roleId) await adminUsersApi.assignRole(editTarget._id, editForm.roleId);
      showToast('User updated', 'success');
      setEditOpen(false);
      fetchData();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to update user. Please try again.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeactivate(user: AdminUser) {
    if (!confirm(`Deactivate "${user.fullName}"?`)) return;
    try {
      await adminUsersApi.deactivate(user._id);
      showToast('User deactivated', 'success');
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Deactivation failed', 'error');
    }
  }

  const getRoleName = (roleId: string | Role | null | undefined) => {
    if (!roleId) return '—';
    if (typeof roleId === 'object') return roleId.name;
    const r = roles.find((r) => r._id === roleId);
    return r?.name ?? '—';
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const initials = (name: string) =>
    name.split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  const avatarColors = ['#0f8f7a', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff Users</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage Voxa internal team members</p>
        </div>
        <PermissionGuard permission="users:create">
          <button id="create-admin-user-btn" className="btn-primary inline-flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
            <UserPlus size={15} strokeWidth={2} /> Add Staff
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        {error && <div className="chip chip-red mb-4 px-3 py-2 rounded-lg">{error}</div>}

        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="admin-user-search"
              className="input max-w-xs pl-8"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-slate-400 text-sm">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading staff…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">No staff members found.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className="avatar"
                            style={{ background: avatarColors[i % avatarColors.length] }}
                          >
                            {initials(u.fullName)}
                          </span>
                          <span className="font-medium text-slate-800">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="text-slate-500">{u.email}</td>
                      <td>
                        <span className="chip chip-blue">{getRoleName(u.roleId)}</span>
                      </td>
                      <td>
                        <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="text-slate-400 text-xs">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <PermissionGuard permission="users:update">
                            <button className="btn-outline text-xs inline-flex items-center gap-1" onClick={() => openEdit(u)}>
                              <Pencil size={11} strokeWidth={2} /> Edit
                            </button>
                          </PermissionGuard>
                          <PermissionGuard permission="users:delete">
                            {u.isActive && (
                              <button
                                className="btn-outline text-xs inline-flex items-center gap-1"
                                style={{ color: '#991b1b', borderColor: '#991b1b' }}
                                onClick={() => handleDeactivate(u)}
                              >
                                <UserX size={11} strokeWidth={2} /> Deactivate
                              </button>
                            )}
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(''); }} title="Add Staff Member">
        <form onSubmit={handleCreate} className="space-y-3">
          <ErrorAlert message={createError} variant="error" theme="light" onDismiss={() => setCreateError('')} />
          <div>
            <label className="text-xs font-medium">Full Name *</label>
            <input className="input mt-1" required value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} placeholder="John Doe" />
          </div>
          <div>
            <label className="text-xs font-medium">Email *</label>
            <input className="input mt-1" type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="john@voxa.com" />
          </div>
          <div>
            <label className="text-xs font-medium">Password *</label>
            <input className="input mt-1" type="password" required minLength={8} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="text-xs font-medium">Role</label>
            <select className="select mt-1" value={createForm.roleId} onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}>
              <option value="">— No role —</option>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={createLoading} className="w-full btn-primary py-2.5">
            {createLoading ? 'Creating…' : 'Create Staff Member'}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditError(''); }} title={`Edit: ${editTarget?.fullName}`}>
        <form onSubmit={handleEdit} className="space-y-3">
          <ErrorAlert message={editError} variant="error" theme="light" onDismiss={() => setEditError('')} />
          <div>
            <label className="text-xs font-medium">Full Name *</label>
            <input className="input mt-1" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium">Assign Role</label>
            <select className="select mt-1" value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}>
              <option value="">— No role —</option>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={editLoading} className="w-full btn-primary py-2.5">
            {editLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {toast && (() => {
        const isError = toast.startsWith('error::');
        const isSuccess = toast.startsWith('success::');
        const msg = toast.includes('::') ? toast.split('::').slice(1).join('::') : toast;
        return (
          <div className={`toast show ${isError ? 'toast-error' : isSuccess ? 'toast-success' : ''}`}>
            {isError ? '✕ ' : isSuccess ? '✓ ' : ''}{msg}
          </div>
        );
      })()}
    </div>
  );
}
