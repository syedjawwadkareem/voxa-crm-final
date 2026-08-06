'use client';

// ─── Company — Users Page ─────────────────────────────────────────────────────
// /company/users — Manage users for the current company.
// Requires: users:read, users:create, users:update, users:delete

import { useState, useEffect, useCallback } from 'react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { companyUsersApi, rolesApi } from '@/lib/api';
import type { CompanyUser, Role, CreateCompanyUserPayload } from '@/lib/types';

const EMPTY_FORM: CreateCompanyUserPayload = { email: '', fullName: '', password: '', username: '', phoneNumber: '', roleId: '' };

export default function CompanyUsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCompanyUserPayload>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CompanyUser | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', status: 'active', roleId: '' });
  const [editLoading, setEditLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.allSettled([
        companyUsersApi.list(),
        rolesApi.companyList(),
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
    try {
      await companyUsersApi.create({
        ...createForm,
        roleId: createForm.roleId || undefined,
        username: createForm.username || undefined,
        phoneNumber: createForm.phoneNumber || undefined,
      });
      showToast('User created');
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(user: CompanyUser) {
    setEditTarget(user);
    const roleId = typeof user.roleId === 'object' && user.roleId !== null
      ? (user.roleId as Role)._id
      : (user.roleId as string) ?? '';
    setEditForm({ fullName: user.fullName, status: user.status, roleId });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await companyUsersApi.update(editTarget._id, { fullName: editForm.fullName, status: editForm.status as any });
      if (editForm.roleId) await companyUsersApi.assignRole(editTarget._id, editForm.roleId);
      showToast('User updated');
      setEditOpen(false);
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeactivate(user: CompanyUser) {
    if (!confirm(`Deactivate "${user.fullName}"?`)) return;
    try {
      await companyUsersApi.deactivate(user._id);
      showToast('User deactivated');
      fetchData();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Deactivation failed');
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
      <CompanyHeader
        title="Team Users"
        subtitle="Manage your company's team members"
        onMenuClick={() => {}}
        actions={
          <PermissionGuard permission="users:create">
            <button id="create-company-user-btn" className="btn-primary btn-blue" onClick={() => setCreateOpen(true)}>
              + Add User
            </button>
          </PermissionGuard>
        }
      />

      <div className="px-6 py-6">
        {error && <div className="chip chip-red mb-4 px-3 py-2 rounded-lg">{error}</div>}

        <div className="flex items-center gap-3 mb-4">
          <input
            id="company-user-search"
            className="input max-w-xs"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-slate-400 text-sm">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading users…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">No team members found.</div>
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
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="text-slate-400 text-xs">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <PermissionGuard permission="users:update">
                            <button className="btn-outline text-xs" onClick={() => openEdit(u)}>Edit</button>
                          </PermissionGuard>
                          <PermissionGuard permission="users:delete">
                            {u.status !== 'inactive' && (
                              <button
                                className="btn-outline text-xs"
                                style={{ color: '#991b1b', borderColor: '#991b1b' }}
                                onClick={() => handleDeactivate(u)}
                              >
                                Deactivate
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Team Member" maxWidth="560px">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium">Full Name *</label>
              <input className="input mt-1" required value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs font-medium">Email *</label>
              <input className="input mt-1" type="email" required value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="john@company.com" />
            </div>
            <div>
              <label className="text-xs font-medium">Password *</label>
              <input className="input mt-1" type="password" required minLength={8} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="text-xs font-medium">Username (Optional)</label>
              <input className="input mt-1" value={createForm.username} onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })} placeholder="johndoe" />
            </div>
            <div>
              <label className="text-xs font-medium">Phone (Optional)</label>
              <input className="input mt-1" value={createForm.phoneNumber} onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })} placeholder="+1234567890" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium">Role</label>
              <select className="select mt-1" value={createForm.roleId} onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}>
                <option value="">— No role —</option>
                {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={createLoading} className="w-full btn-primary btn-blue py-2.5 mt-2">
            {createLoading ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit: ${editTarget?.fullName}`}>
        <form onSubmit={handleEdit} className="space-y-3">
          <div>
            <label className="text-xs font-medium">Full Name *</label>
            <input className="input mt-1" required value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium">Status</label>
            <select className="select mt-1" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Assign Role</label>
            <select className="select mt-1" value={editForm.roleId} onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}>
              <option value="">— No role —</option>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={editLoading} className="w-full btn-primary btn-blue py-2.5">
            {editLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
