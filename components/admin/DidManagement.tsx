'use client';

// ─── Admin DID Management ─────────────────────────────────────────────────────
// Two tabs: DID Pool (add/assign/release) and History viewer per DID.

import { useState, useEffect, useCallback } from 'react';
import {
  Hash, Plus, Building2, X, Clock, CheckCircle2, XCircle,
  ChevronRight, RefreshCw, Trash2, Edit3, PhoneCall, History,
  AlertCircle, Loader2, RotateCcw, Info,
} from 'lucide-react';
import { didsApi, companiesApi } from '@/lib/api';
import type { Did, DidHistoryRow } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface Company { _id: string; name: string; status: string; }

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: 'Available',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    assigned:  { label: 'Assigned',   cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
    released:  { label: 'Released',   cls: 'bg-slate-100  text-slate-600  border-slate-200'  },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ── Format date ───────────────────────────────────────────────────────────────

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Modal base ────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-slate-800 font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all';

// ── Add DID Modal ─────────────────────────────────────────────────────────────

function AddDidModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ did_number: '', label: '', notes: '', context: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    if (!form.did_number.trim()) { setErr('DID number is required'); return; }
    setSaving(true);
    setErr('');
    try {
      await didsApi.create(form);
      onAdded();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add New DID" onClose={onClose}>
      <div className="space-y-4">
        {err && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {err}
          </div>
        )}
        <Field label="DID Number" required>
          <input
            id="did-add-number"
            className={inputCls}
            placeholder="+92300XXXXXXX or 03XXXXXXXXX"
            value={form.did_number}
            onChange={e => setForm(f => ({ ...f, did_number: e.target.value }))}
          />
        </Field>
        <Field label="Label / Friendly Name">
          <input
            id="did-add-label"
            className={inputCls}
            placeholder="e.g. Lahore Sales Line"
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          />
        </Field>
        <Field label="Context / Purpose">
          <input
            id="did-add-context"
            className={inputCls}
            placeholder="e.g. inbound, sales, support"
            value={form.context}
            onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
          />
        </Field>
        <Field label="Notes">
          <textarea
            id="did-add-notes"
            className={`${inputCls} h-20 resize-none`}
            placeholder="Internal admin notes…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </Field>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            Cancel
          </button>
          <button
            id="did-add-save-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Adding…' : 'Add DID'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Assign DID Modal ──────────────────────────────────────────────────────────

function AssignDidModal({
  did, companies, onClose, onDone,
}: {
  did: Did; companies: Company[]; onClose: () => void; onDone: () => void;
}) {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleAssign() {
    if (!selectedCompany) { setErr('Please select a company'); return; }
    setSaving(true);
    setErr('');
    try {
      await didsApi.assign(did._id, selectedCompany);
      onDone();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={`Assign ${did.did_number}`} onClose={onClose}>
      <div className="space-y-4">
        {err && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} /> {err}
          </div>
        )}
        {did.company_id && (
          <div className="flex items-start gap-2 text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              Currently assigned to <strong>{did.company_id.name}</strong>. Assigning to a new company will automatically release it.
            </span>
          </div>
        )}
        <Field label="Select Company" required>
          <select
            id="did-assign-company-select"
            className={`${inputCls} cursor-pointer`}
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
          >
            <option value="">— Choose a company —</option>
            {companies.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm">
            Cancel
          </button>
          <button
            id="did-assign-confirm-btn"
            onClick={handleAssign}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-sm font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
            {saving ? 'Assigning…' : 'Assign DID'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ did, onClose }: { did: Did; onClose: () => void }) {
  const [history, setHistory] = useState<Did[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    didsApi.getHistory(did._id)
      .then(r => setHistory(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [did._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-slate-800 font-semibold text-lg">Assignment History</h3>
            <p className="text-slate-500 text-sm mt-0.5 font-mono">{did.did_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No history found</p>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-5">
                {history.map((row, i) => (
                  <div key={row._id} className="flex gap-4 relative">
                    {/* Dot */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border ${
                      i === 0 ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {i === 0
                        ? <CheckCircle2 size={14} className="text-teal-500" />
                        : <Clock size={12} className="text-slate-400" />
                      }
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={row.status} />
                        {i === 0 && (
                          <span className="text-xs text-teal-600 font-medium">(Current)</span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-800 font-medium">
                        {row.company_id
                          ? (row.company_id as any).name ?? 'Unknown Company'
                          : 'Available Pool'}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Assigned: {fmt(row.assigned_at)}
                        {row.released_at && (
                          <span className="ml-2">· Released: {fmt(row.released_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DidManagement() {
  const [dids, setDids] = useState<Did[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAdd, setShowAdd]       = useState(false);
  const [assignTarget, setAssignTarget] = useState<Did | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Did | null>(null);

  // UI state
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [didsRes, companiesRes] = await Promise.all([
        didsApi.list(),
        companiesApi.list(),
      ]);
      setDids(didsRes.data ?? []);
      setCompanies((companiesRes.data ?? []) as Company[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRelease(did: Did) {
    if (!confirm(`Release ${did.did_number} from ${(did.company_id as any)?.name ?? 'company'} back to pool?`)) return;
    setActionLoading(s => ({ ...s, [did._id]: true }));
    try {
      await didsApi.release(did._id);
      await load();
    } catch (e: any) {
      alert('Release failed: ' + e.message);
    } finally {
      setActionLoading(s => ({ ...s, [did._id]: false }));
    }
  }

  async function handleDelete(did: Did) {
    if (!confirm(`Permanently delete ${did.did_number} from the pool?`)) return;
    setActionLoading(s => ({ ...s, [did._id]: true }));
    try {
      await didsApi.delete(did._id);
      await load();
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    } finally {
      setActionLoading(s => ({ ...s, [did._id]: false }));
    }
  }

  // Filtered list
  const filtered = dids.filter(d => {
    const matchSearch =
      d.did_number.toLowerCase().includes(search.toLowerCase()) ||
      d.label.toLowerCase().includes(search.toLowerCase()) ||
      ((d.company_id as any)?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary counts
  const available = dids.filter(d => d.status === 'available').length;
  const assigned  = dids.filter(d => d.status === 'assigned').length;

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Hash size={22} className="text-teal-500" />
            DID Management
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Provision phone numbers and assign them to companies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            id="did-add-btn"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20"
          >
            <Plus size={16} />
            Add DID
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total DIDs',  value: dids.length,  color: 'text-slate-800',  bg: 'bg-slate-100', icon: Hash },
          { label: 'Available',   value: available,    color: 'text-teal-600',   bg: 'bg-teal-50',   icon: CheckCircle2 },
          { label: 'Assigned',    value: assigned,     color: 'text-blue-600',   bg: 'bg-blue-50',   icon: Building2 },
        ].map(card => (
          <div key={card.label} className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
              <card.icon size={18} className={card.color} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="did-search"
          className="flex-1 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
          placeholder="Search by number, label, or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          id="did-status-filter"
          className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all cursor-pointer min-w-[140px]"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Hash size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              {dids.length === 0 ? 'No DIDs in the pool yet. Click "Add DID" to get started.' : 'No DIDs match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {['DID Number', 'Label', 'Status', 'Assigned To', 'Assigned At', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(did => (
                  <tr key={did._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={14} className="text-teal-500 flex-shrink-0" />
                        <span className="font-mono text-slate-800 font-medium">{did.did_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {did.label || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={did.status} />
                    </td>
                    <td className="px-4 py-3">
                      {did.company_id ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-blue-500 flex-shrink-0" />
                          <span className="text-slate-700 font-medium">{(did.company_id as any).name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Pool (unassigned)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {fmt(did.assigned_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Assign */}
                        <button
                          id={`did-assign-${did._id}`}
                          onClick={() => setAssignTarget(did)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Assign to company"
                        >
                          <Building2 size={14} />
                        </button>

                        {/* Release */}
                        {did.company_id && (
                          <button
                            id={`did-release-${did._id}`}
                            onClick={() => handleRelease(did)}
                            disabled={actionLoading[did._id]}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                            title="Release from company"
                          >
                            {actionLoading[did._id]
                              ? <Loader2 size={14} className="animate-spin" />
                              : <RotateCcw size={14} />
                            }
                          </button>
                        )}

                        {/* History */}
                        <button
                          id={`did-history-${did._id}`}
                          onClick={() => setHistoryTarget(did)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                          title="View assignment history"
                        >
                          <History size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          id={`did-delete-${did._id}`}
                          onClick={() => handleDelete(did)}
                          disabled={actionLoading[did._id]}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete DID"
                        >
                          {actionLoading[did._id]
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddDidModal onClose={() => setShowAdd(false)} onAdded={load} />
      )}
      {assignTarget && (
        <AssignDidModal
          did={assignTarget}
          companies={companies}
          onClose={() => setAssignTarget(null)}
          onDone={load}
        />
      )}
      {historyTarget && (
        <HistoryPanel did={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
