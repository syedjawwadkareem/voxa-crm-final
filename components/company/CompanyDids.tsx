'use client';

// ─── Company DID Numbers ───────────────────────────────────────────────────────
// Shows DIDs assigned to this company by admin, with assignment history.

import { useState, useEffect, useCallback } from 'react';
import {
  Hash, PhoneCall, History, Clock, CheckCircle2,
  Loader2, AlertCircle, X, ChevronRight, Info,
} from 'lucide-react';
import { didsApi } from '@/lib/api';
import type { Did, DidHistoryRow } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────

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
      .catch(() => {})
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border ${
                      i === 0
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      {i === 0
                        ? <CheckCircle2 size={14} className="text-blue-500" />
                        : <Clock size={12} className="text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          row.status === 'assigned' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyDid, setHistoryDid] = useState<Did | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await didsApi.listMine();
      setDids(res.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = dids.filter(d =>
    d.did_number.includes(search) ||
    d.label.toLowerCase().includes(search.toLowerCase()) ||
    d.context.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Hash size={22} className="text-blue-500" />
          Your DID Numbers
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Phone numbers assigned to your company by the Voxa admin
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <span>
          These DIDs are managed by your Voxa administrator. Contact them to request changes or additional numbers.
          You can select any of these as your caller ID when making calls from the dialer.
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Hash size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{dids.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Total Assigned</div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{dids.filter(d => d.status === 'assigned').length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Active</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        id="company-did-search"
        className="w-full bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        placeholder="Search by number, label or context…"
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
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(did => (
            <div
              key={did._id}
              className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PhoneCall size={18} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-slate-800 font-semibold text-lg tracking-wide">
                      {did.did_number}
                    </div>
                    {did.label && (
                      <div className="text-slate-500 text-sm mt-0.5">{did.label}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                  </div>
                </div>

                <button
                  id={`company-did-history-${did._id}`}
                  onClick={() => setHistoryTarget(did)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-xs font-medium transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100"
                >
                  <History size={13} />
                  History
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="text-slate-400">Assigned:</span>{' '}
                  <span className="text-slate-700 font-medium">{fmt(did.assigned_at)}</span>
                </div>
                {did.notes && (
                  <div className="col-span-2 mt-1">
                    <span className="text-slate-400">Notes:</span>{' '}
                    <span className="text-slate-600">{did.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History drawer */}
      {historyTarget && (
        <HistoryDrawer did={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
