'use client';

// ─── Admin — Roles & Permissions ──────────────────────────────────────────────
// /admin/roles — Manage Voxa internal roles.
// Requires: view_roles (read), manage_roles (write)

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Modal } from '@/components/ui/Modal';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { PermissionCheckboxGrid } from '@/components/ui/PermissionCheckboxGrid';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { rolesApi } from '@/lib/api';
import type { Role, CreateRolePayload } from '@/lib/types';

const EMPTY_FORM: CreateRolePayload = { name: '', permissions: [], description: '' };

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRolePayload>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState<CreateRolePayload>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(`${type}::${msg}`);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rolesApi.adminList();
      setRoles(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      await rolesApi.adminCreate(createForm);
      showToast(`Role "${createForm.name}" created`, 'success');
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchRoles();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create role. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(role: Role) {
    setEditTarget(role);
    setEditForm({ name: role.name, permissions: [...role.permissions], description: role.description ?? '' });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    setEditError('');
    try {
      await rolesApi.adminUpdate(editTarget._id, editForm);
      showToast('Role updated', 'success');
      setEditOpen(false);
      fetchRoles();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to update role. Please try again.');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await rolesApi.adminDelete(role._id);
      showToast('Role deleted', 'success');
      fetchRoles();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  }


  return (
    <div>
      <AdminHeader
        title="Roles & Permissions"
        subtitle="Manage Voxa internal staff roles"
        onMenuClick={() => {}}
        actions={
          <PermissionGuard permission="roles:create">
            <button id="create-admin-role-btn" className="btn-primary inline-flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus size={15} strokeWidth={2} /> New Role
            </button>
          </PermissionGuard>
        }
      />

      <div className="px-6 py-6">
        {error && <div className="chip chip-red mb-4 px-3 py-2 rounded-lg">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading roles…</div>
        ) : roles.length === 0 ? (
          <div className="card px-4 py-12 text-center text-slate-400 text-sm">
            No roles yet. Create one to assign to staff members.
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {roles.map((role) => (
              <div key={role._id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-800">{role.name}</div>
                    {role.description && (
                      <div className="text-slate-400 text-xs mt-0.5">{role.description}</div>
                    )}
                  </div>
                  <span className={`chip ${role.status === 'active' ? 'chip-green' : 'chip-gray'}`}>
                    {role.status}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-1.5">
                    Permissions ({role.permissions.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.length === 0 ? (
                      <span className="text-xs text-slate-300">No permissions assigned</span>
                    ) : (
                      role.permissions.map((p) => (
                        <span key={p} className="chip chip-blue" style={{ fontSize: '0.65rem' }}>
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <PermissionGuard permission="roles:update">
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button className="btn-outline text-xs flex-1 inline-flex items-center justify-center gap-1" onClick={() => openEdit(role)}>
                      <Pencil size={11} strokeWidth={2} /> Edit
                    </button>
                    <button
                      className="btn-outline text-xs flex-1 inline-flex items-center justify-center gap-1"
                      style={{ color: '#991b1b', borderColor: '#991b1b' }}
                      onClick={() => handleDelete(role)}
                    >
                      <Trash2 size={11} strokeWidth={2} /> Delete
                    </button>
                  </div>
                </PermissionGuard>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(''); }} title="Create Voxa Role" maxWidth="560px">
        <form onSubmit={handleCreate} className="space-y-4">
          <ErrorAlert message={createError} variant="error" theme="light" onDismiss={() => setCreateError('')} />
          <div>
            <label className="text-xs font-medium">Role Name *</label>
            <input className="input mt-1" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. DID Manager" />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <input className="input mt-1" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div>
            <label className="text-xs font-medium">Permissions</label>
            <div className="mt-1">
              <PermissionCheckboxGrid
                selected={createForm.permissions}
                onChange={(permissions) => setCreateForm({ ...createForm, permissions })}
              />
            </div>
          </div>
          <button type="submit" disabled={createLoading} className="w-full btn-primary py-2.5">
            {createLoading ? 'Creating…' : 'Create Role'}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditError(''); }} title={`Edit Role: ${editTarget?.name}`} maxWidth="560px">
        <form onSubmit={handleEdit} className="space-y-4">
          <ErrorAlert message={editError} variant="error" theme="light" onDismiss={() => setEditError('')} />
          <div>
            <label className="text-xs font-medium">Role Name *</label>
            <input className="input mt-1" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <input className="input mt-1" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium">Permissions</label>
            <div className="mt-1">
              <PermissionCheckboxGrid
                selected={editForm.permissions}
                onChange={(permissions) => setEditForm({ ...editForm, permissions })}
              />
            </div>
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
