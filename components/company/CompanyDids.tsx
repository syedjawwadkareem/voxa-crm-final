'use client';

// ─── Company DID Management ───────────────────────────────────────────────────
// Shows DIDs assigned to this company by system admin (View-Only).
// Company admins can assign specific DIDs to users within the company.

import { useState, useEffect, useCallback } from 'react';
import {
  Hash, PhoneCall, History, Clock, CheckCircle2,
  Loader2, AlertCircle, X, ChevronRight, Info,
  User, UserPlus, UserCheck, Shield
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { didsApi, companyUsersApi } from '@/lib/api';
import type { Did, DidHistoryRow, CompanyUser } from '@/lib/api';

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ── History Drawer ────────────────────────────────────────────────────────────

function HistoryDrawer({ did, onClose }: { did: Did; onClose: () => void }) {
  const [history, setHistory] = useState<DidHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    didsApi.getMineHistory(did._id)
      .then(r => setHistory(r.data ?? []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [did._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h3 className="text-slate-800 font-semibold">Assignment History</h3>
            <p className="text-slate-500 text-sm font-mono mt-0.5">{did.did_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-teal-500" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-slate-500 text-center py-10 text-sm">No history found</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-5">
                {history.map((row, i) => (
                  <div key={row._id} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border ${i === 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                      }`}>
                      {i === 0
                        ? <CheckCircle2 size={14} className="text-blue-500" />
                        : <Clock size={12} className="text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${row.status === 'assigned' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          {row.status}
                        </span>
                        {i === 0 && <span className="text-xs text-blue-600 font-medium">(Current)</span>}
                      </div>
                      <div className="mt-1 text-sm text-slate-800 font-medium">{row.company}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Assigned: {fmt(row.assigned_at)}
                        {row.released_at && <span className="ml-2">· Released: {fmt(row.released_at)}</span>}
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

export function CompanyDids() {
  const [dids, setDids] = useState<Did[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyDid, setHistoryDid] = useState<Did | null>(null);
  const [search, setSearch] = useState('');

  // Assign user modal state
  const [assignDid, setAssignDid] = useState<Did | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [didsRes, usersRes] = await Promise.all([
        didsApi.listMine(),
        companyUsersApi.list(),
      ]);
      setDids(didsRes.data ?? []);
      setCompanyUsers(usersRes.data ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load DID management data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAssignModal = (did: Did) => {
    setAssignDid(did);
    setSelectedUserId(did.assigned_user_id?._id || '');
    setAssignError('');
  };

  const handleSaveUserAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDid) return;
    setAssignLoading(true);
    setAssignError('');
    try {
      const targetUserId = selectedUserId.trim() ? selectedUserId.trim() : null;
      await didsApi.assignUserToMine(assignDid._id, targetUserId);

      const assignedUserObj = companyUsers.find(u => u._id === targetUserId);
      const userLabel = assignedUserObj ? (assignedUserObj.fullName || assignedUserObj.email) : 'None';

      showToast(targetUserId ? `Assigned ${assignDid.did_number} to ${userLabel}` : `Unassigned ${assignDid.did_number}`);

      setAssignDid(null);
      loadData();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to update user assignment');
    } finally {
      setAssignLoading(false);
    }
  };

  const filtered = dids.filter(d =>
    d.did_number.includes(search) ||
    d.label.toLowerCase().includes(search.toLowerCase()) ||
    d.context.toLowerCase().includes(search.toLowerCase()) ||
    (d.assigned_user_id?.fullName && d.assigned_user_id.fullName.toLowerCase().includes(search.toLowerCase())) ||
    (d.assigned_user_id?.email && d.assigned_user_id.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-medium text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Hash size={22} className="text-blue-500" />
          DID Management
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          View company DID numbers and assign them to specific team members
        </p>
      </div>



      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Hash size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{dids.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Total DIDs</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{dids.filter(d => d.status === 'assigned').length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Active DIDs</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <UserCheck size={18} className="text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">{dids.filter(d => d.assigned_user_id).length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Assigned to Users</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        id="company-did-search"
        className="w-full bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        placeholder="Search by number, label, context or assigned user…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* DID cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Hash size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">
            {dids.length === 0
              ? 'No DID numbers have been assigned to your company yet.'
              : 'No results match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(did => {
            const assignedUser = did.assigned_user_id;
            const roleName = typeof assignedUser?.roleId === 'object' && assignedUser.roleId ? (assignedUser.roleId as any).name : (assignedUser?.roleId || 'User');

            return (
              <div
                key={did._id}
                className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* DID Information (View Only) */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PhoneCall size={18} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-800 font-semibold text-lg tracking-wide">
                          {did.did_number}
                        </span>
                        <Badge
                          label="Active"
                          cls="bg-emerald-100 text-emerald-700 border-emerald-200"
                        />
                        {did.context && (
                          <Badge
                            label={did.context}
                            cls="bg-slate-100 text-slate-600 border-slate-200"
                          />
                        )}
                      </div>

                      {did.label && (
                        <div className="text-slate-500 text-sm mt-0.5">{did.label}</div>
                      )}

                      {/* Assigned User Tag */}
                      <div className="mt-2.5 flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-medium">Assigned User:</span>
                        {assignedUser ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 font-medium">
                            <User size={13} className="text-indigo-600" />
                            {assignedUser.fullName || assignedUser.email}
                            <span className="text-indigo-400 font-normal">({roleName})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned to user</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Assign User & View History */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                    <button
                      id={`assign-user-did-${did._id}`}
                      onClick={() => openAssignModal(did)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      <UserPlus size={14} />
                      {assignedUser ? 'Change User' : 'Assign User'}
                    </button>

                    {/* <button
                      id={`company-did-history-${did._id}`}
                      onClick={() => setHistoryDid(did)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium px-3 py-2 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      <History size={13} />
                      History
                      <ChevronRight size={12} />
                    </button> */}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div>
                    Assigned to company on <span className="text-slate-600 font-medium">{fmt(did.assigned_at)}</span>
                  </div>
                  {did.notes && (
                    <div className="truncate max-w-xs text-slate-500">
                      Note: {did.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign User Modal */}
      {assignDid && (
        <Modal
          open={!!assignDid}
          onClose={() => setAssignDid(null)}
          title={`Assign DID (${assignDid.did_number}) to User`}
          maxWidth="480px"
        >
          <form onSubmit={handleSaveUserAssignment} className="space-y-4">
            {assignError && (
              <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg">
                {assignError}
              </div>
            )}

            <div className="text-xs text-slate-600">
              Select a team member to assign this specific DID number ({assignDid.did_number}). The user can belong to any role (Super Admin, Agent, Manager, or Custom Role).
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Company User
              </label>
              <select
                id="assign-did-user-select"
                className="select w-full"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Unassigned (None) --</option>
                {companyUsers.map(u => {
                  const roleLabel = typeof u.roleId === 'object' && u.roleId ? (u.roleId as any).name : 'User';
                  return (
                    <option key={u._id} value={u._id}>
                      {u.fullName || u.email} ({roleLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setAssignDid(null)}
                disabled={assignLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-blue text-xs flex items-center gap-1.5"
                disabled={assignLoading}
              >
                {assignLoading && <Loader2 size={14} className="animate-spin" />}
                Save Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* History drawer */}
      {historyDid && (
        <HistoryDrawer did={historyDid} onClose={() => setHistoryDid(null)} />
      )}
    </div>
  );
}

