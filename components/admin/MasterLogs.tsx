'use client';

// ─── Master Call Logs — Admin Portal ──────────────────────────────────────────
// Full-page call history table with filters: company, date, call status,
// view status, keyword search, audio listening with uniqueid resolution,
// and AI transcription & summary viewing modal via CRM Call Recording Pipeline.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PhoneOutgoing, PhoneIncoming, PhoneMissed,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  Eye, Headphones, Archive, RotateCcw, Filter,
  X, Activity, ArrowUpDown, Building2, AlertCircle,
  Sparkles, CheckCircle, Users, DownloadCloud
} from 'lucide-react';
import { companiesApi, telephonyApi } from '@/lib/api';
import { CallAnalysisModal } from './CallAnalysisModal';
import { CallAudioPlayer, AudioPlayerCall } from './CallAudioPlayer';

// ── Types ────────────────────────────────────────────────────────────────────
export interface CallRecord {
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
  status: string; // Raw API status: "ANSWERED" | "NO ANSWER" | "BUSY" | "FAILED" | "CONGESTION"
  uniqueid?: string;
  queue?: string;
  companyId?: string;
  companyName?: string | null;
  userName?: string | null;
  leadName?: string | null;
  recording_filename?: string | null;
  has_recording?: boolean;
  recording_stream_url?: string | null;
}

// API raw statuses
type CallStatus = 'all' | 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED' | 'CONGESTION';
type ViewStatus = 'active' | 'archive';

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Status Config ─────────────────────────────────────────────────────────────
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

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchAdminCallLogs(): Promise<CallRecord[]> {
  const res = await telephonyApi.getAdminMasterLogs();
  return res.data?.logs || [];
}

// Fallback: direct Asterisk fetch if backend is unreachable
const API_BASE = 'http://172.16.17.127/api/api.php';
async function fetchCallLogsFallback(): Promise<CallRecord[]> {
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

// ── Cell styles ───────────────────────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 11,
  fontWeight: 600, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = { padding: '9px 12px', verticalAlign: 'middle' };

// ── Sub-components ─────────────────────────────────────────────────────────────
function ActionBtn({ id, icon, label, color, onClick, disabled = false }: {
  id: string; icon: React.ReactNode; label: string; color: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      id={id} onClick={onClick} title={label} disabled={disabled}
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all hover:opacity-85 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: `${color}40`, color, background: `${color}12` }}
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

// Direction icon
function DirectionIcon({ direction, status }: { direction: 'out' | 'in'; status: string }) {
  const isNoAnswer = status === 'NO ANSWER' || status === 'BUSY' || status === 'FAILED' || status === 'CONGESTION';

  if (isNoAnswer) return <PhoneMissed size={13} color="#ef4444" />;
  if (direction === 'out') return <PhoneOutgoing size={13} color="#3b82f6" />;
  return <PhoneIncoming size={13} color="#22c55e" />;
}

// ── Status Badge ───────────────────────────────────────────────────────────────
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

export function MasterLogs() {
  const [logs, setLogs] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [callStatus, setCallStatus] = useState<CallStatus>('all');
  const [viewStatus, setViewStatus] = useState<ViewStatus>('active');
  const [companyId, setCompanyId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [archived, setArchived] = useState<Set<number>>(new Set());

  // Dropdowns
  const [statusOpen, setStatusOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);

  // ── Recording Audio Player & AI Analysis Modal State ─────────────────────────
  const [playingCall, setPlayingCall] = useState<AudioPlayerCall | null>(null);
  const [viewingCall, setViewingCall] = useState<CallRecord | null>(null);
  const [checkingAudioId, setCheckingAudioId] = useState<number | null>(null);
  const [fetchingRecordings, setFetchingRecordings] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'info' | 'success'; text: string } | null>(null);

  const showToast = (type: 'error' | 'info' | 'success', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setLogs(await fetchAdminCallLogs());
    }
    catch (e: any) {
      // Fallback to direct Asterisk if backend fails
      try {
        setLogs(await fetchCallLogsFallback());
      } catch (fallbackErr: any) {
        setError(e.message ?? 'Failed to load call logs');
      }
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    companiesApi.list().then(res => {
      if (res.data) setCompanies(res.data);
    }).catch(console.error);
  }, [refresh]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!(e.target as Element).closest('.filter-dropdown-container')) {
        setStatusOpen(false); setViewOpen(false); setCompanyOpen(false);
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

    // Call Status — match against real API status field
    if (callStatus !== 'all' && rawStatus !== callStatus) return false;

    // Company
    if (companyId !== 'all' && log.companyId && log.companyId !== companyId) return false;

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
      if (![log.callerid, log.destination, log.extension, log.context, log.status, log.uniqueid, log.userName, log.companyName].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [logs, archived, viewStatus, callStatus, companyId, startDate, endDate, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allChecked = paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id));
  const someChecked = paginated.some((r) => selectedIds.has(r.id));

  useEffect(() => setPage(1), [searchTerm, callStatus, viewStatus, companyId, startDate, endDate]);

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

  // Count badges for filter summary
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      const s = (l.status || 'UNKNOWN').toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [logs]);

  // ── Handle Fetch Recordings Action ─────────────────────────────────────────
  const handleFetchRecordings = async () => {
    setFetchingRecordings(true);
    try {
      const res = await telephonyApi.fetchRecordings();
      const info = res.data;
      if (info) {
        showToast(
          'success',
          info.message || `Processed ${info.total || 0} recordings: ${info.newly_downloaded || 0} downloaded, ${info.already_exists || 0} already present.`
        );
      } else {
        showToast('success', 'Recordings fetched successfully.');
      }
      refresh();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || err.message || 'Failed to fetch recordings from Asterisk');
    } finally {
      setFetchingRecordings(false);
    }
  };

  // ── Handle Listen Action ───────────────────────────────────────────────────
  const handleListenClick = async (log: CallRecord) => {
    const targetUniqueId = log.uniqueid || String(log.id);
    const direction = getCallDirection(log);
    const customerPhone = direction === 'out' ? log.destination : log.callerid;

    setCheckingAudioId(log.id);

    try {
      const res = await telephonyApi.checkRecording({
        uniqueid: targetUniqueId,
        phone: customerPhone,
        destination: log.destination,
        callerid: log.callerid,
        start_time: log.start_time,
        filename: log.recording_filename || undefined,
        did: log.callerid || log.extension,
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
        showToast('error', `Recording not found for call (${customerPhone || targetUniqueId})`);
      }
    } catch (err: any) {
      showToast('error', `Recording not found for call (${customerPhone || targetUniqueId})`);
    } finally {
      setCheckingAudioId(null);
    }
  };

  // ── Handle View Action ─────────────────────────────────────────────────────
  const handleViewClick = (log: CallRecord) => {
    setViewingCall(log);
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Toast Notification ─────────────────────────────────────────────── */}
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
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap gap-3 items-end relative z-20 flex-shrink-0">

        {/* Company Filter */}
        <div className="relative filter-dropdown-container">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Company</label>
          <button
            onClick={(e) => { e.stopPropagation(); setCompanyOpen((o) => !o); setStatusOpen(false); setViewOpen(false); }}
            className="flex items-center gap-2 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            style={{ height: 34, minWidth: 150 }}
          >
            <Building2 size={13} className="text-slate-400" />
            <span className="flex-1 text-left text-xs truncate max-w-[120px]">
              {companyId === 'all' ? 'All Companies' : companies.find(c => c._id === companyId)?.name || 'Company'}
            </span>
            <ArrowUpDown size={11} className="text-slate-400" />
          </button>
          {companyOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-[300px] overflow-y-auto"
              style={{ minWidth: 190 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { setCompanyId('all'); setCompanyOpen(false); }}
                className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                style={{ color: companyId === 'all' ? '#0f8f7a' : '#374151' }}>
                {companyId === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                All Companies
              </button>
              {companies.map((c) => (
                <button key={c._id} onClick={() => { setCompanyId(c._id); setCompanyOpen(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                  style={{ color: companyId === c._id ? '#0f8f7a' : '#374151' }}>
                  {companyId === c._id && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-3 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors text-slate-600"
              style={{ height: 34 }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-3 pr-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors text-slate-600"
              style={{ height: 34 }}
            />
          </div>
        </div>

        {/* Call Status */}
        <div className="relative filter-dropdown-container">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Call Status</label>
          <button
            onClick={(e) => { e.stopPropagation(); setStatusOpen((o) => !o); setViewOpen(false); setCompanyOpen(false); }}
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
                    style={{ color: callStatus === s ? '#0f8f7a' : '#374151' }}>
                    {callStatus === s
                      ? <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
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
            onClick={(e) => { e.stopPropagation(); setViewOpen((o) => !o); setStatusOpen(false); setCompanyOpen(false); }}
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
                  style={{ color: viewStatus === v ? '#0f8f7a' : '#374151' }}>
                  {viewStatus === v && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
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
              placeholder="Search numbers, ID, status, or context…"
              className="w-full pl-8 pr-8 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-colors"
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
            onClick={handleFetchRecordings}
            disabled={fetchingRecordings}
            className="flex items-center gap-1.5 px-3.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 active:scale-95 rounded-lg transition-all disabled:opacity-50"
            style={{ height: 34 }}
            title="Fetch and sync recordings from Asterisk (172.16.17.127)"
          >
            <DownloadCloud size={13} className={fetchingRecordings ? 'animate-bounce text-teal-600' : ''} />
            <span>{fetchingRecordings ? 'Fetching…' : 'Fetch Recordings'}</span>
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-4 text-xs font-semibold text-white rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ height: 34, background: 'linear-gradient(135deg, #0f8f7a, #22c1a5)' }}
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
        <div className="px-6 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-semibold text-teal-700">{selectedIds.size} selected</span>
          <button onClick={bulkArchive}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 transition-colors">
            <Archive size={11} /> Bulk Archive
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600">
            Clear selection
          </button>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto border-t border-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <RefreshCw size={28} className="animate-spin text-teal-500" />
            <span className="text-sm text-slate-400 font-medium">Loading call logs…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-3">
              <X size={22} className="text-red-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Connection Error</p>
            <p className="text-xs text-red-500 max-w-sm">{error}</p>
            <button onClick={refresh} className="mt-4 px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: '#0f8f7a' }}>
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
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={TH}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={toggleAll}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f8f7a' }}
                  />
                </th>
                <th style={TH}>Date &amp; Time ↑</th>
                <th style={TH}>Company</th>
                <th style={TH}>User / Agent</th>
                <th style={TH}>Unique ID / Ext</th>
                <th style={TH}>Customer Number</th>
                <th style={TH}>Direction</th>
                <th style={TH}>Duration</th>
                <th style={TH}>Bill Sec</th>
                <th style={TH}>Call Status</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((log, idx) => {
                const direction = getCallDirection(log);
                const rawStatus = (log.status || '').toUpperCase();
                const isArc = archived.has(log.id);
                const isSel = selectedIds.has(log.id);
                const rowBg = isSel ? '#f0fdf9' : idx % 2 === 0 ? 'white' : '#fafbfc';
                const isCheckingThis = checkingAudioId === log.id;

                return (
                  <tr key={log.id} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9' }}>
                    <td style={TD}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(log.id)}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0f8f7a' }} />
                    </td>
                    <td style={TD}>
                      <span style={{ color: '#334155', fontWeight: 500, fontSize: 12 }}>
                        {formatDateTime(log.start_time)}
                      </span>
                    </td>
                    {/* Company column */}
                    <td style={TD}>
                      {log.companyName ? (
                        <div className="flex flex-col">
                          <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 12 }}>{log.companyName}</span>
                          {log.companyId && (
                            <span style={{ color: '#94a3b8', fontSize: 10 }}>{log.companyId.slice(-6)}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {/* User / Agent column */}
                    <td style={TD}>
                      {log.userName ? (
                        <div className="flex flex-col">
                          <span style={{ color: '#0f766e', fontWeight: 600, fontSize: 12 }}>{log.userName}</span>
                          <span style={{ color: '#94a3b8', fontSize: 10 }}>Ext: {log.extension || '—'}</span>
                        </div>
                      ) : log.extension ? (
                        <div className="flex flex-col">
                          <span style={{ color: '#64748b', fontWeight: 500, fontSize: 12 }}>Agent ({log.extension})</span>
                          <span style={{ color: '#94a3b8', fontSize: 10 }}>Ext: {log.extension}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={TD}>
                      <div className="flex flex-col">
                        <span style={{ color: '#0f766e', fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                          {log.uniqueid || log.id}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 10 }}>
                          Ext: {log.extension}
                        </span>
                      </div>
                    </td>
                    <td style={TD}>
                      <span style={{ color: '#334155', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                        {direction === 'out' ? log.destination : log.callerid}
                      </span>
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
                        {/* View Action - opens full transcript & summary */}
                        <ActionBtn
                          id={`ml-view-${log.id}`}
                          icon={<Sparkles size={11} />}
                          label="View"
                          color="#3b82f6"
                          onClick={() => handleViewClick(log)}
                        />

                        {/* Listen Action - checks audio and plays */}
                        <ActionBtn
                          id={`ml-listen-${log.id}`}
                          icon={isCheckingThis ? <RefreshCw size={11} className="animate-spin" /> : <Headphones size={11} />}
                          label={isCheckingThis ? 'Loading…' : (log.has_recording ? 'Listen ⏺' : 'Listen')}
                          color={log.has_recording ? '#0d9488' : '#0f8f7a'}
                          disabled={isCheckingThis}
                          onClick={() => handleListenClick(log)}
                        />

                        {isArc
                          ? <ActionBtn id={`ml-unarchive-${log.id}`} icon={<RotateCcw size={11} />} label="Unarchive" color="#64748b"
                            onClick={() => setArchived((p) => { const n = new Set(p); n.delete(log.id); return n; })} />
                          : <ActionBtn id={`ml-archive-${log.id}`} icon={<Archive size={11} />} label="Archive" color="#64748b"
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

      {/* ── Pagination Footer ─────────────────────────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
          <span className="text-xs text-slate-500">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()} calls
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn id="ml-first-page" disabled={page === 1} onClick={() => setPage(1)} label="«" />
            <PaginationBtn id="ml-prev-page" disabled={page === 1} onClick={() => setPage((p) => p - 1)} label={<ChevronLeft size={13} />} />
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">{page} / {totalPages}</span>
            <PaginationBtn id="ml-next-page" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} label={<ChevronRight size={13} />} />
            <PaginationBtn id="ml-last-page" disabled={page === totalPages} onClick={() => setPage(totalPages)} label="»" />
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