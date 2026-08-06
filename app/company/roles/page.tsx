'use client';

// ─── Company — Roles & Permissions ────────────────────────────────────────────
// /company/roles — Manage roles scoped to this company.
// Requires: view_roles (read), manage_roles (write)

import { useState, useEffect, useCallback } from 'react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { Modal } from '@/components/ui/Modal';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { PermissionCheckboxGrid } from '@/components/ui/PermissionCheckboxGrid';
import { rolesApi } from '@/lib/api';
import type { Role, CreateRolePayload } from '@/lib/types';

const EMPTY_FORM: CreateRolePayload = { name: '', permissions: [], description: '' };

export default function CompanyRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRolePayload>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState<CreateRolePayload>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await rolesApi.companyList();
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
    try {
      await rolesApi.companyCreate(createForm);
      showToast(`Role "${createForm.name}" created`);
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      fetchRoles();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Create failed');
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
    try {
      await rolesApi.companyUpdate(editTarget._id, editForm);
      showToast('Role updated');
      setEditOpen(false);
      fetchRoles();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await rolesApi.companyDelete(role._id);
      showToast('Role deleted');
      fetchRoles();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed');
    }
  }


  return (
    <div>
      <CompanyHeader
        title="Roles & Permissions"
        subtitle="Manage company-level roles"
        onMenuClick={() => {}}
        actions={
          <PermissionGuard permission="roles:create">
            <button id="create-company-role-btn" className="btn-primary btn-blue" onClick={() => setCreateOpen(true)}>
              + New Role
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
            No roles yet. Create one to assign to team members.
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
                    <button className="btn-outline text-xs flex-1" onClick={() => openEdit(role)}>
                      Edit
                    </button>
                    <button
                      className="btn-outline text-xs flex-1"
                      style={{ color: '#991b1b', borderColor: '#991b1b' }}
                      onClick={() => handleDelete(role)}
                    >
                      Delete
                    </button>
                  </div>
                </PermissionGuard>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Company Role" maxWidth="560px">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-medium">Role Name *</label>
            <input className="input mt-1" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Sales Agent" />
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
          <button type="submit" disabled={createLoading} className="w-full btn-primary btn-blue py-2.5">
            {createLoading ? 'Creating…' : 'Create Role'}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Role: ${editTarget?.name}`} maxWidth="560px">
        <form onSubmit={handleEdit} className="space-y-4">
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
          <button type="submit" disabled={editLoading} className="w-full btn-primary btn-blue py-2.5">
            {editLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
