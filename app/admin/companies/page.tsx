'use client';

// ─── Admin — Companies Page ───────────────────────────────────────────────────
// /admin/companies — Full CRUD for companies.
// Requires permissions: view_companies (read), manage_companies (write).

import { useState, useEffect, useCallback } from 'react';
import { Pencil, UserCog, CheckCircle, Ban, Plus, Search } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { companiesApi, billingApi } from '@/lib/api';
import type { Company, CreateCompanyPayload, CompanyStatus, BillingModel, Plan, TenantInfo } from '@/lib/types';

const EMPTY_FORM: CreateCompanyPayload = {
  name: '',
  billingModel: 'prepaid',
  adminEmail: '',
  adminFullName: '',
  maxConcurrentCalls: 10,
  aiReceptionistEnabled: false,
  bulkAiCallingEnabled: false,
  forceHalt: false,
  planId: '',
  tenant: {
    tenant_id: '',
    region: '',
    province: '',
    address: '',
    contact_name: '',
    contact_email: '',
  }
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Create modal (3-step wizard)
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [createForm, setCreateForm] = useState<CreateCompanyPayload>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Update Tenant modal
  const [tenantOpen, setTenantOpen] = useState(false);
  const [tenantTarget, setTenantTarget] = useState<Company | null>(null);
  const [tenantForm, setTenantForm] = useState<TenantInfo>({
    tenant_id: '', region: '', province: '', address: '', contact_name: '', contact_email: ''
  });
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantError, setTenantError] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    // store type on a data attr via class trick — we'll encode it in the string
    // Actually we just store a prefixed string: ':type:message'
    setToast(`${type}::${msg}`);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companiesApi.list();
      setCompanies(res.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await billingApi.getPlans();
      setPlans(res.data ?? []);
      if (res.data && res.data.length > 0) {
        setCreateForm(prev => ({ ...prev, planId: res.data[0]._id, billingModel: 'prepaid' }));
      }
    } catch (e) {
      console.error('Failed to load plans', e);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchPlans();
  }, [fetchCompanies, fetchPlans]);

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (createStep < 3) {
      setCreateStep(createStep + 1);
      return;
    }

    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await companiesApi.create(createForm);
      setTempPassword(res.data?.tempPassword ?? '');
      showToast(`Company "${createForm.name}" created`, 'success');
      setCreateForm(EMPTY_FORM);
      fetchCompanies();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create company. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }

  const handlePlanChange = (planId: string) => {
    setCreateForm({ ...createForm, planId });
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  function openEdit(company: Company) {
    setEditTarget(company);
    setEditName(company.name);
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    setEditError('');
    try {
      await companiesApi.update(editTarget._id, { name: editName });
      showToast('Company updated', 'success');
      setEditOpen(false);
      fetchCompanies();
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to update company. Please try again.');
    } finally {
      setEditLoading(false);
    }
  }

  // ── Update Tenant ───────────────────────────────────────────────────────────
  function openTenantUpdate(company: Company) {
    setTenantTarget(company);
    setTenantForm({
      tenant_id: '', region: '', province: '', address: '', contact_name: '', contact_email: ''
    });
    setTenantOpen(true);
  }

  async function handleTenantUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantTarget) return;
    setTenantLoading(true);
    setTenantError('');
    try {
      await companiesApi.updateTenant(tenantTarget._id, tenantForm);
      showToast('Tenant info updated successfully', 'success');
      setTenantOpen(false);
      fetchCompanies();
    } catch (e: unknown) {
      setTenantError(e instanceof Error ? e.message : 'Failed to update tenant. Please try again.');
    } finally {
      setTenantLoading(false);
    }
  }

  // ── Status toggle ────────────────────────────────────────────────────────────
  async function handleStatusChange(company: Company, status: CompanyStatus) {
    try {
      await companiesApi.updateStatus(company._id, status);
      showToast(`Status updated to ${status}`, 'success');
      fetchCompanies();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Status update failed', 'error');
    }
  }

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <AdminHeader
        title="Companies"
        subtitle="Manage all client companies on the Voxa platform"
        onMenuClick={() => { }}
        actions={
          <PermissionGuard permission="companies:create">
            <button
              id="create-company-btn"
              className="btn-primary"
              onClick={() => { setCreateOpen(true); setCreateStep(1); setTempPassword(''); }}
            >
              <Plus size={15} strokeWidth={2} />
              New Company
            </button>
          </PermissionGuard>
        }
      />

      <div className="px-6 py-6">
        {error && <div className="chip chip-red mb-4 px-3 py-2 rounded-lg">{error}</div>}

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="company-search"
              className="input max-w-xs pl-8"
              placeholder="    Search companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-slate-400 text-sm">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">Loading companies…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">
                {search ? 'No companies match your search.' : 'No companies yet. Create one above.'}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Tenant ID</th>
                    <th>Status</th>
                    <th>Billing</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td className="font-medium text-slate-800">{c.name}</td>
                      <td className="text-slate-600 font-mono text-xs">{c.tenant?.tenant_id || '—'}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="capitalize">{c.billingModel}</td>
                      <td className="text-slate-400 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <PermissionGuard permission="companies:update">
                            <button
                              className="btn-outline text-xs inline-flex items-center gap-1"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil size={11} strokeWidth={2} /> Edit
                            </button>
                            <button
                              className="btn-outline text-xs inline-flex items-center gap-1"
                              onClick={() => openTenantUpdate(c)}
                            >
                              <UserCog size={11} strokeWidth={2} /> Update Tenant
                            </button>
                            {c.status !== 'active' && (
                              <button
                                className="btn-outline text-xs inline-flex items-center gap-1"
                                style={{ color: '#166534', borderColor: '#166534' }}
                                onClick={() => handleStatusChange(c, 'active')}
                              >
                                <CheckCircle size={11} strokeWidth={2} /> Activate
                              </button>
                            )}
                            {c.status === 'active' && (
                              <button
                                className="btn-outline text-xs inline-flex items-center gap-1"
                                style={{ color: '#991b1b', borderColor: '#991b1b' }}
                                onClick={() => handleStatusChange(c, 'suspended')}
                              >
                                <Ban size={11} strokeWidth={2} /> Suspend
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

      {/* Create Modal (Wizard) */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(''); }} title={`Create New Company (Step ${createStep} of 3)`} maxWidth="600px">
        {tempPassword ? (
          <div className="space-y-4">
            <div
              className="rounded-lg p-4"
              style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}
            >
              <div className="font-semibold text-green-800 mb-1">✅ Company Created!</div>
              <div className="text-green-700 text-sm">
                Temporary password for the company admin:
              </div>
              <code className="block mt-2 font-mono text-green-900 bg-green-50 px-3 py-2 rounded text-sm select-all">
                {tempPassword}
              </code>
              <div className="text-green-600 text-xs mt-2">Share this with the company admin — they should change it on first login.</div>
            </div>
            <button className="w-full btn-primary" onClick={() => { setCreateOpen(false); setTempPassword(''); }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <ErrorAlert message={createError} variant="error" theme="light" onDismiss={() => setCreateError('')} />
            {/* STEP 1: BILLING */}
            {createStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-sm text-slate-600 mb-4">Select the billing plan for this company. This will determine if they are prepaid or postpaid.</div>

                <div>
                  <label className="text-xs font-medium">Billing Model *</label>
                  <select
                    className="select mt-1"
                    required
                    value={createForm.billingModel}
                    onChange={(e) => setCreateForm({ ...createForm, billingModel: e.target.value as BillingModel, planId: '' })}
                  >
                    <option value="prepaid">Prepaid</option>
                    <option value="postpaid">Postpaid</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium">Billing Plan *</label>
                  <select className="select mt-1" required value={createForm.planId} onChange={(e) => handlePlanChange(e.target.value)}>
                    <option value="" disabled>Select a plan...</option>
                    {plans
                      .filter(p => p.type === createForm.billingModel && p.is_active)
                      .map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.duration_type} — {p.tokens.toLocaleString()} tokens)</option>
                      ))}
                  </select>
                  {plans.filter(p => p.type === createForm.billingModel && p.is_active).length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No active {createForm.billingModel} plans found. Create one in the Billing Plans section first.</p>
                  )}
                </div>
                {createForm.planId && (
                  <div className="bg-slate-50 p-3 rounded text-sm text-slate-700">
                    <strong>Model:</strong> <span className="capitalize">{createForm.billingModel}</span><br />
                    <strong>Description:</strong> {plans.find(p => p._id === createForm.planId)?.description}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: TENANT INFO */}
            {createStep === 2 && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="col-span-2 text-sm text-slate-600 mb-2">Enter the tenant and contact information for this company.</div>
                <div>
                  <label className="text-xs font-medium">Tenant ID *</label>
                  <input className="input mt-1" required value={createForm.tenant.tenant_id} onChange={(e) => setCreateForm({ ...createForm, tenant: { ...createForm.tenant, tenant_id: e.target.value } })} placeholder="TENANT-123" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Name *</label>
                  <input className="input mt-1" required value={createForm.tenant.contact_name} onChange={(e) => setCreateForm({ ...createForm, tenant: { ...createForm.tenant, contact_name: e.target.value } })} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="text-xs font-medium">Contact Email *</label>
                  <input className="input mt-1" type="email" required value={createForm.tenant.contact_email} onChange={(e) => setCreateForm({ ...createForm, tenant: { ...createForm.tenant, contact_email: e.target.value } })} placeholder="jane@tenant.com" />
                </div>
                <div>
                  <label className="text-xs font-medium">Region</label>
                  <input className="input mt-1" value={createForm.tenant.region} onChange={(e) => setCreateForm({ ...createForm, tenant: { ...createForm.tenant, region: e.target.value } })} placeholder="NA" />
                </div>
                <div>
                  <label className="text-xs font-medium">Province</label>
                  <input className="input mt-1" value={createForm.tenant.province} onChange={(e) => setCreateForm({ ...createForm, tenant: { ...createForm.tenant, province: e.target.value } })} placeholder="Ontario" />
                </div>
                <div>
                  <label className="text-xs font-medium">Address</label>
                  <input className="input mt-1" value={createForm.tenant.address} onChange={(e) => setCreateForm({ ...createForm, tenant: { ...createForm.tenant, address: e.target.value } })} placeholder="123 Main St" />
                </div>
              </div>
            )}

            {/* STEP 3: COMPANY INFO */}
            {createStep === 3 && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="col-span-2 text-sm text-slate-600 mb-2">Configure the core company details and initial admin user.</div>
                <div className="col-span-2">
                  <label className="text-xs font-medium">Company Name *</label>
                  <input className="input mt-1" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="text-xs font-medium">Admin Email *</label>
                  <input className="input mt-1" type="email" required value={createForm.adminEmail} onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })} placeholder="admin@acme.com" />
                </div>
                <div>
                  <label className="text-xs font-medium">Admin Full Name *</label>
                  <input className="input mt-1" required value={createForm.adminFullName} onChange={(e) => setCreateForm({ ...createForm, adminFullName: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-medium">Max Concurrent Calls</label>
                  <input className="input mt-1" type="number" min={1} value={createForm.maxConcurrentCalls} onChange={(e) => setCreateForm({ ...createForm, maxConcurrentCalls: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 col-span-2 mt-2">
                  <label className="toggle">
                    <input type="checkbox" checked={createForm.aiReceptionistEnabled} onChange={(e) => setCreateForm({ ...createForm, aiReceptionistEnabled: e.target.checked })} />
                    <span />
                  </label>
                  <span className="text-sm">AI Receptionist</span>
                  <label className="toggle ml-4">
                    <input type="checkbox" checked={createForm.bulkAiCallingEnabled} onChange={(e) => setCreateForm({ ...createForm, bulkAiCallingEnabled: e.target.checked })} />
                    <span />
                  </label>
                  <span className="text-sm">Bulk AI Calling</span>
                </div>
                {createForm.billingModel === 'postpaid' && (
                  <div className="flex items-center gap-2 col-span-2 mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                    <label className="toggle">
                      <input type="checkbox" checked={createForm.forceHalt} onChange={(e) => setCreateForm({ ...createForm, forceHalt: e.target.checked })} />
                      <span />
                    </label>
                    <span className="text-sm font-semibold text-red-700">Force Halt Service (Hard Block)</span>
                    <span className="text-xs text-red-600 ml-2">Applies immediately regardless of plan limits.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
              {createStep > 1 ? (
                <button type="button" className="btn-outline" onClick={() => setCreateStep(createStep - 1)}>Back</button>
              ) : <div></div>}

              <button type="submit" disabled={createLoading || !createForm.planId} className="btn-primary">
                {createStep < 3 ? 'Next' : (createLoading ? 'Creating…' : 'Create Company')}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditError(''); }} title={`Edit Company: ${editTarget?.name}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <ErrorAlert message={editError} variant="error" theme="light" onDismiss={() => setEditError('')} />
          <div>
            <label className="text-xs font-medium">Company Name *</label>
            <input className="input mt-1" required value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <button type="submit" disabled={editLoading} className="w-full btn-primary py-2.5">
            {editLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* Update Tenant Modal */}
      <Modal open={tenantOpen} onClose={() => { setTenantOpen(false); setTenantError(''); }} title={`Update Tenant: ${tenantTarget?.name}`} maxWidth="500px">
        <form onSubmit={handleTenantUpdate} className="space-y-4">
          <ErrorAlert message={tenantError} variant="error" theme="light" onDismiss={() => setTenantError('')} />
          <div className="text-sm text-slate-600 mb-4">
            This will deactivate the current tenant info and create a new active record.
          </div>
          <div>
            <label className="text-xs font-medium">Tenant ID *</label>
            <input className="input mt-1" required value={tenantForm.tenant_id} onChange={(e) => setTenantForm({ ...tenantForm, tenant_id: e.target.value })} placeholder="NEW-TENANT-123" />
          </div>
          <div>
            <label className="text-xs font-medium">Contact Name *</label>
            <input className="input mt-1" required value={tenantForm.contact_name} onChange={(e) => setTenantForm({ ...tenantForm, contact_name: e.target.value })} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="text-xs font-medium">Contact Email *</label>
            <input className="input mt-1" type="email" required value={tenantForm.contact_email} onChange={(e) => setTenantForm({ ...tenantForm, contact_email: e.target.value })} placeholder="jane@tenant.com" />
          </div>
          <div>
            <label className="text-xs font-medium">Region</label>
            <input className="input mt-1" value={tenantForm.region} onChange={(e) => setTenantForm({ ...tenantForm, region: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium">Province</label>
            <input className="input mt-1" value={tenantForm.province} onChange={(e) => setTenantForm({ ...tenantForm, province: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium">Address</label>
            <input className="input mt-1" value={tenantForm.address} onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })} />
          </div>
          <button type="submit" disabled={tenantLoading} className="w-full btn-primary py-2.5 mt-2">
            {tenantLoading ? 'Updating…' : 'Update Tenant Info'}
          </button>
        </form>
      </Modal>

      {/* Toast */}
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
