'use client';

// ─── Admin — Billing Plans Page ───────────────────────────────────────────────────
// /admin/plans — Full CRUD for plans.
// Requires permissions: billing:update

import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Modal } from '@/components/ui/Modal';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { billingApi } from '@/lib/api';
import type { Plan } from '@/lib/types';

const EMPTY_FORM: Partial<Plan> = {
  name: '',
  type: 'prepaid',
  duration_type: 'monthly',
  cost: 0,
  tokens: 1000,
  ai_receptionist: false,
  bulk_ai_calling: false,
  max_agents: 5,
  max_concurrent_calls: 10,
  is_custom: false,
  is_active: true,
  description: '',
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<Plan>>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState<Partial<Plan>>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await billingApi.getPlans();
      setPlans(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await billingApi.createPlan(createForm);
      showToast(`Plan "${createForm.name}" created`);
      setCreateForm(EMPTY_FORM);
      setCreateOpen(false);
      fetchPlans();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  function openEdit(plan: Plan) {
    setEditTarget(plan);
    setEditForm({ ...plan });
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await billingApi.updatePlan(editTarget._id, editForm);
      showToast('Plan updated');
      setEditOpen(false);
      fetchPlans();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditLoading(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(plan: Plan) {
    if (!confirm(`Are you sure you want to delete ${plan.name}?`)) return;
    try {
      await billingApi.deletePlan(plan._id);
      showToast('Plan deleted');
      fetchPlans();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  // Common form render for both Create and Edit modals
  const renderFormFields = (form: Partial<Plan>, setForm: (val: Partial<Plan>) => void) => (
    <>
      <div>
        <label className="text-xs font-medium">Plan Name *</label>
        <input className="input mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium">Billing Type *</label>
          <select className="select mt-1" required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'prepaid' | 'postpaid' })}>
            <option value="prepaid">Prepaid</option>
            <option value="postpaid">Postpaid</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Duration Type *</label>
          <select className="select mt-1" required value={form.duration_type} onChange={(e) => setForm({ ...form, duration_type: e.target.value as 'monthly' | 'pay-as-you-go' })}>
            <option value="monthly">Monthly</option>
            <option value="pay-as-you-go">Pay As You Go</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Cost ($) *</label>
          <input className="input mt-1" type="number" min={0} required value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs font-medium">Tokens Cap *</label>
          <input className="input mt-1" type="number" min={1} required value={form.tokens} onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs font-medium">Max Concurrent Calls</label>
          <input className="input mt-1" type="number" min={1} value={form.max_concurrent_calls} onChange={(e) => setForm({ ...form, max_concurrent_calls: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs font-medium">Max Agents</label>
          <input className="input mt-1" type="number" min={1} value={form.max_agents} onChange={(e) => setForm({ ...form, max_agents: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <label className="toggle">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span />
          </label>
          <span className="text-sm font-medium">Active (Assignable)</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 mt-4 mb-2 p-3 bg-slate-50 rounded">
        <div className="flex items-center gap-2">
          <label className="toggle">
            <input type="checkbox" checked={form.ai_receptionist} onChange={(e) => setForm({ ...form, ai_receptionist: e.target.checked })} />
            <span />
          </label>
          <span className="text-sm">AI Receptionist</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="toggle">
            <input type="checkbox" checked={form.bulk_ai_calling} onChange={(e) => setForm({ ...form, bulk_ai_calling: e.target.checked })} />
            <span />
          </label>
          <span className="text-sm">Bulk AI Calling</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="toggle">
            <input type="checkbox" checked={form.is_custom} onChange={(e) => setForm({ ...form, is_custom: e.target.checked })} />
            <span />
          </label>
          <span className="text-sm">Custom Plan</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium">Description</label>
        <textarea className="input mt-1" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
    </>
  );

  return (
    <div>
      <AdminHeader
        title="Billing Plans"
        subtitle="Manage available billing plans for companies"
        onMenuClick={() => {}}
        actions={
          <PermissionGuard permission="billing:update">
            <button
              className="btn-primary"
              onClick={() => { setCreateOpen(true); setCreateForm(EMPTY_FORM); }}
            >
              <Plus size={15} strokeWidth={2} />
              New Plan
            </button>
          </PermissionGuard>
        }
      />

      <div className="px-6 py-6">
        {error && <div className="chip chip-red mb-4 px-3 py-2 rounded-lg">{error}</div>}

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading plans…</div>
            ) : plans.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">
                No plans yet. Create one above.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Billing Type</th>
                    <th>Duration</th>
                    <th>Cost</th>
                    <th>Tokens Cap</th>
                    <th>Features</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p._id}>
                      <td className="font-medium text-slate-800">
                        {p.name}
                        {p.is_custom && <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] uppercase font-bold tracking-wider">Custom</span>}
                      </td>
                      <td>
                        <span className={`chip ${p.type === 'prepaid' ? 'chip-blue' : 'chip-indigo'}`}>{p.type}</span>
                      </td>
                      <td className="capitalize text-slate-600">{p.duration_type}</td>
                      <td className="font-mono">${p.cost}</td>
                      <td className="font-mono">{p.tokens.toLocaleString()}</td>
                      <td>
                        <div className="flex gap-1">
                          {p.ai_receptionist && <span className="chip chip-blue text-[10px] px-1.5 py-0">Receptionist</span>}
                          {p.bulk_ai_calling && <span className="chip chip-indigo text-[10px] px-1.5 py-0">Bulk</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${p.is_active ? 'chip-green' : 'chip-gray'}`}>
                          {p.is_active ? 'Active' : 'Retired'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <PermissionGuard permission="billing:update">
                            <button
                              className="btn-outline text-xs inline-flex items-center gap-1"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil size={11} strokeWidth={2} /> Edit
                            </button>
                            <button
                              className="btn-outline text-xs inline-flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(p)}
                            >
                              <Trash2 size={11} strokeWidth={2} /> Delete
                            </button>
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Plan" maxWidth="560px">
        <form onSubmit={handleCreate} className="space-y-4">
          {renderFormFields(createForm, setCreateForm)}
          <button type="submit" disabled={createLoading} className="w-full btn-primary py-2.5 mt-2">
            {createLoading ? 'Creating…' : 'Create Plan'}
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Plan: ${editTarget?.name}`} maxWidth="560px">
        <form onSubmit={handleEdit} className="space-y-4">
          {renderFormFields(editForm, setEditForm)}
          <button type="submit" disabled={editLoading} className="w-full btn-primary py-2.5 mt-2">
            {editLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Toast */}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
