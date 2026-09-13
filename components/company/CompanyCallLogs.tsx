'use client';

// ─── Company Call Logs ─────────────────────────────────────────────────────────
// Call history for company users. Scoped to company org with listening,
// recording unique id checks, and complete AI transcribe & summary viewing.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PhoneOutgoing, PhoneIncoming, PhoneMissed,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Eye, Headphones, Archive, RotateCcw, X, Activity, ArrowUpDown, Filter,
  Sparkles, AlertCircle, CheckCircle
} from 'lucide-react';
import { telephonyApi } from '@/lib/api';
import { CallAnalysisModal } from '../admin/CallAnalysisModal';
import { CallAudioPlayer, AudioPlayerCall } from '../admin/CallAudioPlayer';

// ── Types ──────────────────────────────────────────────────────────────────────
interface CallRecord {
  id: number;
  extension: string;
  callerid: string;
  destination: string;
  context: string;
  start_time: string;
  answer_time: string;
  end_time?: string;
  duration?: number;
  billsec?: number;
  status: string; // Raw API: "ANSWERED" | "NO ANSWER" | "BUSY" | "FAILED" | "CONGESTION"
  uniqueid?: string;
  queue?: string;
  userName?: string | null;
  leadName?: string | null;
}

type CallStatus = 'all' | 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED' | 'CONGESTION';
type ViewStatus = 'active' | 'archive';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDuration(secs?: number) {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function getCallDirection(log: CallRecord): 'out' | 'in' {
  const out = log.context?.toLowerCase().includes('outgoing') || log.context?.toLowerCase().includes('out');
  return out ? 'out' : 'in';
}

// ── Status Config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
}> = {
  'ANSWERED': {
    label: 'Answered',
    bg: '#dcfce7',
    text: '#15803d',
    dot: '#22c55e',
    border: '#bbf7d0',
  },
  'NO ANSWER': {
    label: 'No Answer',
    bg: '#fee2e2',
    text: '#dc2626',
    dot: '#ef4444',
    border: '#fecaca',
  },
  'BUSY': {
    label: 'Busy',
    bg: '#fef3c7',
    text: '#d97706',
    dot: '#f59e0b',
    border: '#fde68a',
  },
  'FAILED': {
    label: 'Failed',
    bg: '#fce7f3',
    text: '#be185d',
    dot: '#ec4899',
    border: '#fbcfe8',
  },
  'CONGESTION': {
    label: 'Congestion',
    bg: '#ede9fe',
    text: '#7c3aed',
    dot: '#8b5cf6',
    border: '#ddd6fe',
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status?.toUpperCase()] || {
    label: status || 'Unknown',
    bg: '#f1f5f9',
    text: '#64748b',
    dot: '#94a3b8',
    border: '#e2e8f0',
  };
}

// ── API ────────────────────────────────────────────────────────────────────────
const API_BASE = 'http://172.16.17.127/api/api.php';

async function fetchCallLogs(): Promise<CallRecord[]> {
  const authRes = await fetch(`${API_BASE}?action=GenerateAuthKey&user=apiUAsk&pass=7xK9pQ2mW5vB`);
  const authData = await authRes.json();
  if (authData.status !== 'success') throw new Error(authData.message || 'Auth failed');
  const logsRes = await fetch(`${API_BASE}?action=GetRecentCalls`, {
    headers: { 'X-Auth-Token': authData.data.token },
  });
  const logsData = await logsRes.json();
  if (logsData.status !== 'success') throw new Error('Failed to parse call logs');
  return logsData.data.recent_calls || [];
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11,
  fontWeight: 600, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = { padding: '9px 12px', verticalAlign: 'middle' };

// ── Sub-components ─────────────────────────────────────────────────────────────
function ActionBtn({ id, icon, label, color, onClick, disabled }: {
  id: string; icon: React.ReactNode; label: string; color: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      id={id} onClick={onClick} title={label} disabled={disabled}
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: `${color}40`, color, background: `${color}10` }}
    >
      {icon} {label}
    </button>
  );
}

function PaginationBtn({ id, disabled, onClick, label }: {
  id: string; disabled: boolean; onClick: () => void; label: React.ReactNode;
}) {
  return (
    <button
      id={id} disabled={disabled} onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded border text-xs font-semibold transition-colors"
      style={{
        borderColor: disabled ? '#e2e8f0' : '#cbd5e1',
        color: disabled ? '#cbd5e1' : '#475569',
        background: disabled ? '#f8fafc' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function DirectionIcon({ direction, status }: { direction: 'out' | 'in'; status: string }) {
  const isNoAnswer = status === 'NO ANSWER' || status === 'BUSY' || status === 'FAILED' || status === 'CONGESTION';

  if (isNoAnswer) return <PhoneMissed size={13} color="#ef4444" />;
  if (direction === 'out') return <PhoneOutgoing size={13} color="#3b82f6" />;
  return <PhoneIncoming size={13} color="#22c55e" />;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      background: cfg.bg,
      color: cfg.text,
      border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

const ALL_STATUSES: CallStatus[] = ['all', 'ANSWERED', 'NO ANSWER', 'BUSY', 'FAILED', 'CONGESTION'];
const STATUS_LABELS: Record<CallStatus, string> = {
  'all': 'All Statuses',
  'ANSWERED': 'Answered',
  'NO ANSWER': 'No Answer',
  'BUSY': 'Busy',
  'FAILED': 'Failed',
  'CONGESTION': 'Congestion',
};

export function CompanyCallLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [callStatus, setCallStatus] = useState<CallStatus>('all');
  const [viewStatus, setViewStatus] = useState<ViewStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [archived, setArchived] = useState<Set<number>>(new Set());

  // Dropdowns
  const [statusOpen, setStatusOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  // Audio Player & AI View state
  const [playingCall, setPlayingCall] = useState<AudioPlayerCall | null>(null);
  const [viewingCall, setViewingCall] = useState<CallRecord | null>(null);
  const [checkingAudioId, setCheckingAudioId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  const showToast = (type: 'error' | 'info' | 'success', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [isCompanyAdmin, setIsCompanyAdmin] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await telephonyApi.getCompanyCallLogs();
      if (res.data) {
        setLogs(res.data.logs || []);
        setIsCompanyAdmin(res.data.isCompanyAdmin ?? true);
      }
    }
    catch (e: any) {
      try {
        setLogs(await fetchCallLogs());
      } catch (fallbackErr: any) {
        setError(e.message ?? 'Failed to load call logs');
      }
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!(e.target as Element).closest('.filter-dropdown-container')) {
        setStatusOpen(false); setViewOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => logs.filter((log) => {
    const isArc = archived.has(log.id);
    const rawStatus = (log.status || '').toUpperCase();

    // View Status
    if (viewStatus === 'active' && isArc) return false;
    if (viewStatus === 'archive' && !isArc) return false;

    // Call Status
    if (callStatus !== 'all' && rawStatus !== callStatus) return false;

    // Date range
    if (startDate || endDate) {
      const logDate = new Date(log.start_time).setHours(0, 0, 0, 0);
      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (logDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(0, 0, 0, 0);
        if (logDate > end) return false;
      }
    }

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (![log.callerid, log.destination, log.extension, log.context, log.status, log.uniqueid, log.userName, log.leadName].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [logs, archived, viewStatus, callStatus, startDate, endDate, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id));
  const someChecked = paginated.some((r) => selectedIds.has(r.id));

  useEffect(() => setPage(1), [searchTerm, callStatus, viewStatus, startDate, endDate]);

  function toggleSelect(id: number) {
    setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (allChecked) setSelectedIds((p) => { const n = new Set(p); paginated.forEach((r) => n.delete(r.id)); return n; });
    else setSelectedIds((p) => { const n = new Set(p); paginated.forEach((r) => n.add(r.id)); return n; });
  }
  function bulkArchive() {
    setArchived((p) => { const n = new Set(p); selectedIds.forEach((id) => n.add(id)); return n; });
    setSelectedIds(new Set());
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      const s = (l.status || 'UNKNOWN').toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const handleListenClick = async (log: CallRecord) => {
    const targetUniqueId = log.uniqueid || String(log.id);
    const direction = getCallDirection(log);
    const customerPhone = direction === 'out' ? log.destination : log.callerid;

    setCheckingAudioId(log.id);

    try {
      const res = await telephonyApi.checkRecording({
        uniqueid: targetUniqueId,
        phone: customerPhone,
      });

      if (res.data && res.data.exists) {
        setPlayingCall({
          id: log.id,
          uniqueid: targetUniqueId,
          callerid: log.callerid,
          destination: log.destination,
          direction: direction,
          start_time: log.start_time,
          duration: log.duration,
        });
      } else {
        showToast('error', `Recording not found for call (${targetUniqueId}) in /var/data/`);
      }
    } catch (err: any) {
      showToast('error', `Recording not found for call (${targetUniqueId})`);
    } finally {
      setCheckingAudioId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative" style={{ fontFamily: 'Inter, sans-serif', minHeight: '100%' }}>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border bg-white animate-slideIn">
          {toastMessage.type === 'error' ? (
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle size={18} className="text-teal-500 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-800">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap gap-3 items-end relative z-20">

        {/* Date Filter */}
        <div className="flex gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-3 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-slate-600"
              style={{ height: 34 }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-3 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-slate-600"
              style={{ height: 34 }}
            />
          </div>
        </div>

        {/* Call Status */}
        <div className="relative filter-dropdown-container">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Call Status</label>
          <button
            onClick={(e) => { e.stopPropagation(); setStatusOpen((o) => !o); setViewOpen(false); }}
            className="flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            style={{ height: 34, minWidth: 160 }}
          >
            <Activity size={13} className="text-slate-400" />
            <span className="flex-1 text-left text-xs">
              {STATUS_LABELS[callStatus]}
            </span>
            {callStatus !== 'all' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: getStatusConfig(callStatus).bg,
                  color: getStatusConfig(callStatus).text,
                }}>
                {statusCounts[callStatus] || 0}
              </span>
            )}
            <ArrowUpDown size={11} className="text-slate-400" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1"
              style={{ minWidth: 200 }} onClick={(e) => e.stopPropagation()}>
              {ALL_STATUSES.map((s) => {
                const cfg = s !== 'all' ? getStatusConfig(s) : null;
                const count = s !== 'all' ? (statusCounts[s] || 0) : logs.length;
                return (
                  <button key={s} onClick={() => { setCallStatus(s); setStatusOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                    style={{ color: callStatus === s ? '#3b82f6' : '#374151' }}>
                    {callStatus === s
                      ? <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      : cfg
                        ? <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                        : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    }
                    <span className="flex-1">{STATUS_LABELS[s]}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View Status */}
        <div className="relative filter-dropdown-container">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">View Status</label>
          <button
            onClick={(e) => { e.stopPropagation(); setViewOpen((o) => !o); setStatusOpen(false); }}
            className="flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            style={{ height: 34, minWidth: 140 }}
          >
            <Eye size={13} className="text-slate-400" />
            <span className="flex-1 text-left text-xs">{viewStatus === 'active' ? 'Active' : 'Archived'}</span>
            <ArrowUpDown size={11} className="text-slate-400" />
          </button>
          {viewOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1"
              style={{ minWidth: 160 }} onClick={(e) => e.stopPropagation()}>
              {(['active', 'archive'] as ViewStatus[]).map((v) => (
                <button key={v} onClick={() => { setViewStatus(v); setViewOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  style={{ color: viewStatus === v ? '#3b82f6' : '#374151' }}>
                  {viewStatus === v && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  {v === 'active' ? 'Active' : 'Archived'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Search</label>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search numbers, ID, status, context…"
              className="w-full pl-8 pr-8 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              style={{ height: 34 }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 items-end">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-4 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ height: 34, background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
          >
            <Filter size={12} /> Apply Filters
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 text-xs font-medium border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            style={{ height: 34 }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Bulk Action Bar ────────────────────────────────────────────────── */}
      {someChecked && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
          <span className="text-xs font-semibold text-blue-700">{selectedIds.size} selected</span>
          <button onClick={bulkArchive}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
            <Archive size={11} /> Bulk Archive
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <RefreshCw size={28} className="animate-spin text-blue-500" />
            <span className="text-sm text-slate-400 font-medium">Loading call logs…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
              <X size={22} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Connection Error</p>
            <p className="text-xs text-red-500 max-w-sm">{error}</p>
            <button onClick={refresh} className="mt-4 px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: '#3b82f6' }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <PhoneMissed size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No call logs found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={TH}>
                  <input type="checkbox" checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={toggleAll}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#3b82f6' }} />
                </th>
                <th style={TH}>Date &amp; Time ↑</th>
                {isCompanyAdmin && <th style={TH}>User / Agent</th>}
                <th style={TH}>ID / Ext</th>
                <th style={TH}>Customer Number</th>
                <th style={TH}>Direction</th>
                <th style={TH}>Duration</th>
                <th style={TH}>Bill Sec</th>
                <th style={TH}>Status</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((log, idx) => {
                const direction = getCallDirection(log);
                const rawStatus = (log.status || '').toUpperCase();
                const isArc = archived.has(log.id);
                const isSel = selectedIds.has(log.id);
                const rowBg = isSel ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#fafbfc';
                const isCheckingThis = checkingAudioId === log.id;

                return (
                  <tr key={log.id} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9' }}>
                    <td style={TD}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(log.id)}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#3b82f6' }} />
                    </td>
                    <td style={TD}>
                      <span style={{ color: '#334155', fontWeight: 500, fontSize: 12 }}>
                        {formatDateTime(log.start_time)}
                      </span>
                    </td>
                    {isCompanyAdmin && (
                      <td style={TD}>
                        <div className="flex flex-col">
                          <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12 }}>
                            {log.userName || '—'}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: 10 }}>
                            Ext: {log.extension || 'System'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td style={TD}>
                      <div className="flex flex-col">
                        <span style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                          {log.uniqueid || log.id}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 10 }}>
                          Ext: {log.extension}
                        </span>
                      </div>
                    </td>
                    <td style={TD}>
                      <div className="flex flex-col">
                        <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 12 }}>
                          {direction === 'out' ? log.destination : log.callerid}
                        </span>
                        {log.leadName && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5 self-start">
                            {log.leadName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <DirectionIcon direction={direction} status={rawStatus} />
                        <span style={{
                          color: direction === 'out' ? '#3b82f6' : '#22c55e',
                          fontSize: 11, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.03em',
                        }}>
                          {direction === 'out' ? 'Outbound' : 'Inbound'}
                        </span>
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 12 }}>
                        {formatDuration(log.duration)}
                      </span>
                    </td>
                    <td style={TD}>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>
                        {formatDuration(log.billsec)}
                      </span>
                    </td>
                    <td style={TD}>
                      <StatusBadge status={rawStatus} />
                    </td>
                    <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <ActionBtn
                          id={`co-view-${log.id}`}
                          icon={<Eye size={11} />}
                          label="View"
                          color="#3b82f6"
                          onClick={() => router.push(`/company/logs/detailed?callId=${encodeURIComponent(log.uniqueid || String(log.id))}`)}
                        />
                        <ActionBtn
                          id={`co-listen-${log.id}`}
                          icon={isCheckingThis ? <RefreshCw size={11} className="animate-spin" /> : <Headphones size={11} />}
                          label={isCheckingThis ? 'Loading…' : 'Listen'}
                          color="#8b5cf6"
                          disabled={isCheckingThis}
                          onClick={() => handleListenClick(log)}
                        />
                        {isArc
                          ? <ActionBtn id={`co-unarchive-${log.id}`} icon={<RotateCcw size={11} />} label="Unarchive" color="#64748b"
                            onClick={() => setArchived((p) => { const n = new Set(p); n.delete(log.id); return n; })} />
                          : <ActionBtn id={`co-archive-${log.id}`} icon={<Archive size={11} />} label="Archive" color="#64748b"
                            onClick={() => setArchived((p) => { const n = new Set(p); n.add(log.id); return n; })} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
          <span className="text-xs text-slate-500">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()} calls
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn id="co-first-page" disabled={page === 1} onClick={() => setPage(1)} label="«" />
            <PaginationBtn id="co-prev-page" disabled={page === 1} onClick={() => setPage((p) => p - 1)} label={<ChevronLeft size={13} />} />
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">{page} / {totalPages}</span>
            <PaginationBtn id="co-next-page" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} label={<ChevronRight size={13} />} />
            <PaginationBtn id="co-last-page" disabled={page === totalPages} onClick={() => setPage(totalPages)} label="»" />
          </div>
        </div>
      )}

      {/* ── Audio Player Floating Bar ──────────────────────────────────────── */}
      {playingCall && (
        <CallAudioPlayer
          call={playingCall}
          onClose={() => setPlayingCall(null)}
          onViewDetails={(call) => {
            const fullLog = logs.find(l => (l.uniqueid && l.uniqueid === call.uniqueid) || l.id === call.id);
            if (fullLog) setViewingCall(fullLog);
          }}
        />
      )}

      {/* ── AI Analysis & Full Transcript Modal ────────────────────────────── */}
      {viewingCall && (
        <CallAnalysisModal
          call={viewingCall}
          isOpen={Boolean(viewingCall)}
          onClose={() => setViewingCall(null)}
        />
      )}
    </div>
  );
}