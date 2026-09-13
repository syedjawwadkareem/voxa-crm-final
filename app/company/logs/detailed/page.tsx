'use client';

// ─── Call Logs Detailed View ───────────────────────────────────────────────────
// /company/logs/detailed — Master-detail inspector for call logs and call notes.

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calendar, Phone, ArrowUpRight, ArrowDownLeft, PhoneMissed,
  Search, RefreshCw, Plus, User, MessageSquare, Clock,
  ChevronRight, Filter, Eye, AlertCircle, FileText, CheckCircle2
} from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { telephonyApi, CallNoteRecord } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
  status: string; // "ANSWERED" | "NO ANSWER" | "BUSY" | "FAILED" | "CONGESTION"
  uniqueid?: string;
  queue?: string;
  userName?: string | null;
  leadName?: string | null;
}

function DetailedViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCallId = searchParams.get('callId') || '';

  // Data states
  const [logs, setLogs] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [extensionFilter, setExtensionFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [dispositionFilter, setDispositionFilter] = useState<'All' | 'Answered' | 'Missed' | 'Outgoing'>('All');

  // Notes states
  const [notes, setNotes] = useState<CallNoteRecord[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Fetch call logs
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await telephonyApi.getCompanyCallLogs();
      const fetchedLogs: CallRecord[] = res.data?.logs || [];
      setLogs(fetchedLogs);

      // Select initial call if specified or pick first call
      if (initialCallId) {
        const found = fetchedLogs.find(
          (c) => String(c.uniqueid) === initialCallId || String(c.id) === initialCallId
        );
        if (found) {
          setSelectedCall(found);
        } else if (fetchedLogs.length > 0) {
          setSelectedCall(fetchedLogs[0]);
        }
      } else if (fetchedLogs.length > 0) {
        setSelectedCall(fetchedLogs[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch call logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Fetch notes whenever selectedCall changes
  useEffect(() => {
    if (!selectedCall) {
      setNotes([]);
      return;
    }
    const callId = selectedCall.uniqueid || String(selectedCall.id);
    const loadNotes = async () => {
      setNotesLoading(true);
      try {
        const res = await telephonyApi.getCallNotes(callId);
        setNotes(res.data || []);
      } catch (err) {
        console.error('Failed to load notes', err);
      } finally {
        setNotesLoading(false);
      }
    };
    loadNotes();
  }, [selectedCall]);

  // Handle adding note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCall || !newNoteText.trim()) return;
    const callId = selectedCall.uniqueid || String(selectedCall.id);
    setSubmittingNote(true);
    try {
      const res = await telephonyApi.addCallNote(callId, newNoteText.trim());
      if (res.data) {
        setNotes((prev) => [res.data, ...prev]);
        setNewNoteText('');
        setShowAddNoteModal(false);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Filter calls
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Date filter
      if (startDate) {
        const callDate = new Date(log.start_time).toISOString().split('T')[0];
        if (callDate < startDate) return false;
      }
      if (endDate) {
        const callDate = new Date(log.start_time).toISOString().split('T')[0];
        if (callDate > endDate) return false;
      }

      // Extension filter
      if (extensionFilter.trim()) {
        const ext = (log.extension || '').toLowerCase();
        if (!ext.includes(extensionFilter.trim().toLowerCase())) return false;
      }

      // Destination filter
      if (destinationFilter.trim()) {
        const dest = (log.destination || log.callerid || '').toLowerCase();
        if (!dest.includes(destinationFilter.trim().toLowerCase())) return false;
      }

      // Disposition filter
      if (dispositionFilter === 'Answered') {
        if (log.status?.toUpperCase() !== 'ANSWERED') return false;
      } else if (dispositionFilter === 'Missed') {
        if (log.status?.toUpperCase() !== 'NO ANSWER' && log.status?.toUpperCase() !== 'BUSY') return false;
      } else if (dispositionFilter === 'Outgoing') {
        if (!log.context?.toLowerCase().includes('outgoing')) return false;
      }

      return true;
    });
  }, [logs, startDate, endDate, extensionFilter, destinationFilter, dispositionFilter]);

  // Formatters
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatSecs = (secs?: number) => {
    if (secs == null) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getDispositionLabel = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'NO ANSWER') return 'No answer';
    if (s === 'ANSWERED') return 'Answered';
    if (s === 'BUSY') return 'User Busy';
    if (s === 'FAILED') return 'Failed';
    return status || 'Normal Clearing';
  };

  const getBadgeStyle = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'NO ANSWER' || s === 'BUSY' || s === 'FAILED') {
      return { bg: '#fee2e2', color: '#dc2626', label: 'Missed' };
    }
    if (s === 'ANSWERED') {
      return { bg: '#dcfce7', color: '#16a34a', label: 'Answered' };
    }
    return { bg: '#f1f5f9', color: '#475569', label: status || 'Completed' };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CompanyHeader
        title="Call Logs"
        subtitle="Detailed call inspection, records & observations"
        actions={
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={fetchLogs}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-sm transition-colors"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        {/* Main Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">

          {/* LEFT PANEL: Filters & Scrollable Call List (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-20 overflow-hidden">

            {/* Filter Section */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              {/* Date Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-3 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="mm/dd/yyyy"
                  />
                </div>
                <div className="relative flex items-center gap-1">
                  <span className="text-slate-400 text-xs">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-3 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="mm/dd/yyyy"
                  />
                </div>
              </div>

              {/* Text Search Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Phone size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={extensionFilter}
                    onChange={(e) => setExtensionFilter(e.target.value)}
                    placeholder="Extension"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <ArrowUpRight size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={destinationFilter}
                    onChange={(e) => setDestinationFilter(e.target.value)}
                    placeholder="Destination"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Disposition Pills */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                {(['All', 'Answered', 'Missed', 'Outgoing'] as const).map((tab) => {
                  const isActive = dispositionFilter === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setDispositionFilter(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calls List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                  <RefreshCw className="animate-spin text-purple-600" size={24} />
                  <span>Loading call records...</span>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-rose-500 text-xs">
                  {error}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No call logs match the selected filters.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const callIdStr = log.uniqueid || String(log.id);
                  const isSelected =
                    selectedCall &&
                    (selectedCall.uniqueid || String(selectedCall.id)) === callIdStr;
                  const badge = getBadgeStyle(log.status);
                  const targetNum = log.destination || log.callerid || 'Unknown';

                  return (
                    <div
                      key={callIdStr}
                      onClick={() => setSelectedCall(log)}
                      className={`p-4 cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-purple-50/70 border-l-4 border-purple-600 shadow-inner'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar Circle */}
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                        O
                      </div>

                      {/* Info Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {targetNum}
                          </h4>
                          <span
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-0.5 text-purple-700 font-medium">
                            <ArrowUpRight size={12} /> Outgoing
                          </span>
                          <span>•</span>
                          <span>Ext {log.extension || '1002'}</span>
                          <span>•</span>
                          <span>{formatShortDate(log.start_time)}</span>
                        </div>

                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          {getDispositionLabel(log.status)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Call Details & Notes (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedCall ? (
              <>
                {/* Header Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-purple-600 text-white font-bold text-base flex items-center justify-center shadow">
                        O
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                          {selectedCall.destination || selectedCall.callerid}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          {selectedCall.leadName ? `Lead: ${selectedCall.leadName}` : selectedCall.destination || selectedCall.callerid}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono">
                        Call ID: #{selectedCall.id}
                      </span>
                    </div>
                  </div>

                  {/* Summary Card Grid */}
                  <div className="bg-purple-50/40 rounded-xl p-4 border border-purple-100/60 space-y-4">
                    {/* Top Meta Bar */}
                    <div className="flex items-center gap-2 text-xs flex-wrap pb-2 border-b border-purple-100">
                      <span className="font-semibold text-purple-900">
                        {formatDate(selectedCall.start_time)}
                      </span>
                      <span className="text-purple-300">|</span>
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold"
                        style={{
                          backgroundColor: getBadgeStyle(selectedCall.status).bg,
                          color: getBadgeStyle(selectedCall.status).color,
                        }}
                      >
                        {getBadgeStyle(selectedCall.status).label}
                      </span>
                      <span className="text-purple-300">|</span>
                      <span className="text-purple-700 font-medium inline-flex items-center gap-1">
                        <ArrowUpRight size={13} /> Outgoing
                      </span>
                      <span className="text-purple-300">|</span>
                      <span className="text-slate-600 font-medium">
                        Ext {selectedCall.extension || '1002'}
                      </span>
                    </div>

                    {/* Specs 4-Col Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          CALL ID
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          #{selectedCall.id}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          DURATION
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {formatSecs(selectedCall.duration)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          CALLER ID
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedCall.callerid || '1002'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          DESTINATION
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedCall.destination}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          STARTED AT
                        </span>
                        <span className="text-slate-800 font-medium">
                          {formatDate(selectedCall.start_time)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          ANSWERED AT
                        </span>
                        <span className="text-slate-800 font-medium">
                          {selectedCall.answer_time ? formatDate(selectedCall.answer_time) : '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          CONTEXT
                        </span>
                        <span className="font-mono text-slate-800">
                          {selectedCall.context || 'outgoing-ptcl'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          BILL SEC
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedCall.billsec ?? 0}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
                    <User size={16} />
                    <span>CALL DETAILS</span>
                  </div>

                  {/* Contact Info Subsection */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ◦ CONTACT INFO
                    </span>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 text-[11px] uppercase font-bold block mb-0.5">
                          NAME
                        </span>
                        <span className="text-slate-800 font-medium italic">
                          {selectedCall.leadName || selectedCall.userName || 'Unknown'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] uppercase font-bold block mb-0.5">
                          PHONE
                        </span>
                        <span className="text-slate-900 font-bold font-mono">
                          {selectedCall.destination || selectedCall.callerid}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call Notes Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <MessageSquare size={16} className="text-purple-600" />
                      <span>Call Notes</span>
                    </div>

                    <button
                      onClick={() => setShowAddNoteModal(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={14} /> Add Note
                    </button>
                  </div>

                  {/* Notes List */}
                  {notesLoading ? (
                    <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-purple-600" />
                      <span>Loading notes...</span>
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="p-6 bg-slate-50/60 rounded-xl border border-slate-100 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                      <AlertCircle size={18} className="text-slate-400" />
                      <span>No notes yet. Click the edit icon to add observations.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div
                          key={n._id}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-500 font-medium">
                            <span className="font-bold text-slate-900">{n.authorName}</span>
                            <span className="text-[11px]">{formatDate(n.createdAt)}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                            {n.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Select a call log from the left list to inspect detailed specs and observations.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Call Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-purple-600" />
                Add Call Note
              </h3>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observations / Note
                </label>
                <textarea
                  rows={4}
                  required
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Enter observation notes regarding this call..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteText.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
                >
                  {submittingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailedCallLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
      <DetailedViewContent />
    </Suspense>
  );
}
