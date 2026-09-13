'use client';

// ─── Call Logs Detailed View ───────────────────────────────────────────────────
// /company/logs/detailed — Master-detail inspector with dynamic Omnichannel Lead
// resolution, Audio Player playback, and AI Call Summarization & Transcription.

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Phone, ArrowUpRight, ArrowDownLeft, RefreshCw, Plus, User,
  MessageSquare, AlertCircle, Play, Pause, Volume2, VolumeX,
  Download, Sparkles, Bot, CheckSquare, ListChecks, HelpCircle,
  Share2, ShoppingBag, MessageCircle, Layers, CheckCircle2, ChevronDown
} from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import {
  telephonyApi,
  leadsApi,
  CallNoteRecord,
  CallAnalysisRecord,
  CapturedLead
} from '@/lib/api';
import { toast } from '@/components/ui/NotificationProvider';

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

// Helper to normalize phone numbers for omnichannel matching
function normalizePhone(num?: string | null): string {
  if (!num) return '';
  const digits = num.replace(/\D/g, '');
  if (digits.startsWith('92') && digits.length >= 11) return digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 10) return digits.slice(1);
  return digits;
}

function isPhoneMatch(p1?: string | null, p2?: string | null): boolean {
  const d1 = normalizePhone(p1);
  const d2 = normalizePhone(p2);
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;
  if (d1.length >= 9 && d2.length >= 9 && d1.slice(-9) === d2.slice(-9)) return true;
  return false;
}

function DetailedViewContent() {
  const searchParams = useSearchParams();
  const initialCallId = searchParams.get('callId') || '';

  // Data states
  const [logs, setLogs] = useState<CallRecord[]>([]);
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Preferred lead names override per call uniqueid/id
  const [selectedLeadNameMap, setSelectedLeadNameMap] = useState<Record<string, string>>({});

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

  // Audio Recording states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [recordingExists, setRecordingExists] = useState<boolean | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string>('');
  const [checkingRecording, setCheckingRecording] = useState(false);

  // AI Call Analysis / Summary & Transcript states
  const [analysis, setAnalysis] = useState<CallAnalysisRecord | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'summary' | 'transcript'>('summary');

  // Fetch initial call logs & captured leads
  const fetchLogsAndLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const [logsRes, leadsRes] = await Promise.allSettled([
        telephonyApi.getCompanyCallLogs(),
        leadsApi.getAll()
      ]);

      let fetchedLogs: CallRecord[] = [];
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.logs) {
        fetchedLogs = logsRes.value.data.logs;
        setLogs(fetchedLogs);
      }

      if (leadsRes.status === 'fulfilled' && leadsRes.value.leads) {
        setLeads(leadsRes.value.leads);
      }

      // Select initial call if specified or pick first call
      if (initialCallId && fetchedLogs.length > 0) {
        const found = fetchedLogs.find(
          (c) => String(c.uniqueid) === initialCallId || String(c.id) === initialCallId
        );
        if (found) {
          setSelectedCall(found);
        } else {
          setSelectedCall(fetchedLogs[0]);
        }
      } else if (fetchedLogs.length > 0) {
        setSelectedCall((prev) => prev || fetchedLogs[0]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch call logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndLeads();
  }, []);

  // Helper to get matched leads for a phone number
  const getMatchedLeadsForPhone = (phoneNum?: string | null): CapturedLead[] => {
    if (!phoneNum || !leads.length) return [];
    return leads.filter((lead) => isPhoneMatch(lead.phone, phoneNum));
  };

  // Helper to resolve lead info for a call
  const resolveLeadForCall = (call: CallRecord) => {
    const targetPhone = call.destination || call.callerid || '';
    const matched = getMatchedLeadsForPhone(targetPhone);
    const callKey = call.uniqueid || String(call.id);
    const selectedOverride = selectedLeadNameMap[callKey];

    const sources = Array.from(new Set(matched.map((m) => m.source?.toLowerCase() || 'form').filter(Boolean)));
    const names = Array.from(new Set(matched.map((m) => m.full_name).filter(Boolean)));

    let displayName: string | null = selectedOverride || null;
    if (!displayName) {
      // Prioritize meta lead name, then whatsapp, then first matched
      const metaLead = matched.find((m) => m.source?.toLowerCase() === 'meta');
      const waLead = matched.find((m) => m.source?.toLowerCase() === 'whatsapp');
      if (metaLead?.full_name) displayName = metaLead.full_name;
      else if (waLead?.full_name) displayName = waLead.full_name;
      else if (names.length > 0) displayName = names[0];
      else displayName = call.leadName || call.userName || null;
    }

    return {
      matchedLeads: matched,
      sources,
      names,
      displayName
    };
  };

  // Fetch notes, check recording & load AI analysis whenever selectedCall changes
  useEffect(() => {
    if (!selectedCall) {
      setNotes([]);
      setRecordingExists(null);
      setRecordingUrl('');
      setAnalysis(null);
      return;
    }

    const callId = selectedCall.uniqueid || String(selectedCall.id);
    const targetPhone = selectedCall.destination || selectedCall.callerid;

    // 1. Load Notes
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

    // 2. Check Audio Recording
    const checkAudio = async () => {
      setCheckingRecording(true);
      setIsPlaying(false);
      setCurrentTime(0);
      try {
        const checkRes = await telephonyApi.checkRecording({
          uniqueid: selectedCall.uniqueid,
          phone: targetPhone
        });
        if (checkRes.data?.exists) {
          setRecordingExists(true);
          const stream = telephonyApi.getRecordingStreamUrl({
            uniqueid: selectedCall.uniqueid,
            phone: targetPhone
          });
          setRecordingUrl(stream);
        } else {
          // Construct fallback stream url
          const stream = telephonyApi.getRecordingStreamUrl({
            uniqueid: selectedCall.uniqueid,
            phone: targetPhone
          });
          setRecordingUrl(stream);
          setRecordingExists(true); // Attempt to allow playback stream
        }
      } catch {
        // Fallback stream URL attempt
        const stream = telephonyApi.getRecordingStreamUrl({
          uniqueid: selectedCall.uniqueid,
          phone: targetPhone
        });
        setRecordingUrl(stream);
        setRecordingExists(true);
      } finally {
        setCheckingRecording(false);
      }
    };
    checkAudio();

    // 3. Load AI Analysis
    const loadAnalysis = async () => {
      setAnalysisLoading(true);
      try {
        const res = await telephonyApi.getCallAnalysis(callId);
        if (res.data && (res.data.summary || res.data.transcript)) {
          setAnalysis(res.data);
        } else {
          setAnalysis(null);
        }
      } catch {
        setAnalysis(null);
      } finally {
        setAnalysisLoading(false);
      }
    };
    loadAnalysis();
  }, [selectedCall]);

  // Handle Trigger AI Analysis
  const handleTriggerAnalysis = async () => {
    if (!selectedCall) return;
    const callId = selectedCall.uniqueid || String(selectedCall.id);
    setIsAnalyzing(true);
    try {
      const res = await telephonyApi.processCall({
        call_id: String(selectedCall.id),
        uniqueid: selectedCall.uniqueid,
        phone: selectedCall.destination || selectedCall.callerid,
        audio_url: recordingUrl || undefined,
        force: true
      });
      if (res.data) {
        setAnalysis(res.data);
        toast.success('AI analysis completed successfully');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to analyze call with AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        toast.success('Note added successfully');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Audio Controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Audio play error:', e);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
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
    if (secs == null || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
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

  const renderChannelBadge = (src: string) => {
    const s = src.toLowerCase();
    if (s.includes('meta') || s.includes('facebook') || s.includes('instagram')) {
      return (
        <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <Share2 size={11} className="text-blue-600" /> Meta
        </span>
      );
    }
    if (s.includes('whatsapp')) {
      return (
        <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <MessageCircle size={11} className="text-emerald-600" /> WhatsApp
        </span>
      );
    }
    if (s.includes('shopify')) {
      return (
        <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
          <ShoppingBag size={11} className="text-teal-600" /> Shopify
        </span>
      );
    }
    if (s.includes('daraz')) {
      return (
        <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
          <ShoppingBag size={11} className="text-orange-600" /> Daraz
        </span>
      );
    }
    return (
      <span key={src} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
        <Layers size={11} className="text-purple-600" /> {src.toUpperCase()}
      </span>
    );
  };

  const selectedCallLeadInfo = selectedCall ? resolveLeadForCall(selectedCall) : null;
  const selectedCallKey = selectedCall ? (selectedCall.uniqueid || String(selectedCall.id)) : '';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CompanyHeader
        title="Call Logs"
        subtitle="Detailed call inspection, omnichannel identity, recordings & AI intelligence"
        actions={
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={fetchLogsAndLeads}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md shadow-sm transition-colors"
              title="Refresh logs & leads"
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
                    placeholder="Destination / Phone"
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
                          ? 'bg-purple-600 text-white shadow-sm'
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
                  const leadInfo = resolveLeadForCall(log);

                  const initialLetter = leadInfo.displayName
                    ? leadInfo.displayName.charAt(0).toUpperCase()
                    : targetNum.charAt(0).toUpperCase() || 'C';

                  return (
                    <div
                      key={callIdStr}
                      onClick={() => setSelectedCall(log)}
                      className={`p-4 cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-purple-50/80 border-l-4 border-purple-600 shadow-inner'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar Circle */}
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                        {initialLetter}
                      </div>

                      {/* Info Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            {leadInfo.displayName ? (
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-sm font-bold text-slate-900 truncate">
                                  {leadInfo.displayName}
                                </span>
                              </div>
                            ) : (
                              <h4 className="text-sm font-bold text-slate-900 truncate font-mono">
                                {targetNum}
                              </h4>
                            )}
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Omnichannel sources tags */}
                        {leadInfo.sources.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {leadInfo.sources.map((s) => renderChannelBadge(s))}
                          </div>
                        )}

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          {leadInfo.displayName && (
                            <>
                              <span className="font-mono text-slate-600 font-semibold">{targetNum}</span>
                              <span>•</span>
                            </>
                          )}
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

          {/* RIGHT PANEL: Call Details, Audio Player, AI Intelligence & Notes (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedCall ? (
              <>
                {/* 1. Header & Identity Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                        {selectedCallLeadInfo?.displayName
                          ? selectedCallLeadInfo.displayName.charAt(0).toUpperCase()
                          : (selectedCall.destination || selectedCall.callerid || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-bold text-slate-900 leading-tight">
                            {selectedCallLeadInfo?.displayName || selectedCall.destination || selectedCall.callerid}
                          </h2>
                          {selectedCallLeadInfo?.sources.map((s) => renderChannelBadge(s))}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-700">
                            {selectedCall.destination || selectedCall.callerid}
                          </span>
                          {selectedCallLeadInfo?.matchedLeads.length ? (
                            <span className="text-emerald-600 font-medium">
                              (Matched in {selectedCallLeadInfo.matchedLeads.length} Lead Record{selectedCallLeadInfo.matchedLeads.length > 1 ? 's' : ''})
                            </span>
                          ) : (
                            <span className="text-slate-400">(Direct Telephony Call)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-mono block">
                        Call ID: #{selectedCall.id}
                      </span>
                      {selectedCall.uniqueid && (
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]" title={selectedCall.uniqueid}>
                          UID: {selectedCall.uniqueid}
                        </span>
                      )}
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

                {/* 2. Contact & Omnichannel Identity Resolution Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                      <User size={16} />
                      <span>Contact & Omnichannel Identity</span>
                    </div>

                    {selectedCallLeadInfo && selectedCallLeadInfo.names.length > 1 && (
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500 font-semibold">Display As:</label>
                        <select
                          value={selectedCallLeadInfo.displayName || ''}
                          onChange={(e) => {
                            setSelectedLeadNameMap((prev) => ({
                              ...prev,
                              [selectedCallKey]: e.target.value
                            }));
                          }}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {selectedCallLeadInfo.names.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        RESOLVED NAME
                      </span>
                      <span className="text-slate-900 font-bold text-sm block">
                        {selectedCallLeadInfo?.displayName || 'Unregistered Contact'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        PHONE NUMBER
                      </span>
                      <span className="text-slate-900 font-bold font-mono text-sm block">
                        {selectedCall.destination || selectedCall.callerid}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                        CHANNEL SOURCES
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {selectedCallLeadInfo && selectedCallLeadInfo.sources.length > 0 ? (
                          selectedCallLeadInfo.sources.map((s) => renderChannelBadge(s))
                        ) : (
                          <span className="text-slate-500 font-medium text-xs">Direct PBX</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lead Matches Table / Details if found */}
                  {selectedCallLeadInfo && selectedCallLeadInfo.matchedLeads.length > 0 && (
                    <div className="mt-2 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                        Linked Omnichannel Leads ({selectedCallLeadInfo.matchedLeads.length})
                      </span>
                      <div className="space-y-2">
                        {selectedCallLeadInfo.matchedLeads.map((mLead) => (
                          <div
                            key={mLead.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {renderChannelBadge(mLead.source || 'form')}
                              <span className="font-bold text-slate-800">{mLead.full_name}</span>
                              {mLead.email && (
                                <span className="text-slate-500 text-[11px]">({mLead.email})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              {mLead.form_name && <span>Form: {mLead.form_name}</span>}
                              <span>•</span>
                              <span>{formatShortDate(mLead.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Audio Recording Player Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Volume2 size={16} className="text-purple-600" />
                      <span>Call Audio Recording</span>
                    </div>

                    {recordingUrl && (
                      <a
                        href={recordingUrl}
                        download={`call_recording_${selectedCall.id}.wav`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Download size={13} /> Download WAV
                      </a>
                    )}
                  </div>

                  {checkingRecording ? (
                    <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-purple-600" />
                      <span>Checking call recording availability...</span>
                    </div>
                  ) : (
                    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-inner space-y-3">
                      {/* Hidden audio element */}
                      {recordingUrl && (
                        <audio
                          ref={audioRef}
                          src={recordingUrl}
                          onTimeUpdate={() => {
                            if (audioRef.current) {
                              setCurrentTime(audioRef.current.currentTime);
                            }
                          }}
                          onLoadedMetadata={() => {
                            if (audioRef.current) {
                              setAudioDuration(audioRef.current.duration || selectedCall.duration || 0);
                            }
                          }}
                          onEnded={() => setIsPlaying(false)}
                          onError={(e) => {
                            console.warn('Audio streaming notice', e);
                          }}
                        />
                      )}

                      {/* Controls Bar */}
                      <div className="flex items-center gap-4">
                        {/* Play/Pause Button */}
                        <button
                          onClick={togglePlay}
                          className="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 flex-shrink-0"
                          title={isPlaying ? 'Pause' : 'Play Recording'}
                        >
                          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                        </button>

                        {/* Seek Slider & Timers */}
                        <div className="flex-1 space-y-1">
                          <input
                            type="range"
                            min={0}
                            max={audioDuration || selectedCall.duration || 100}
                            step={0.1}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                          />
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>{formatSecs(currentTime)}</span>
                            <span>{formatSecs(audioDuration || selectedCall.duration || 0)}</span>
                          </div>
                        </div>

                        {/* Speed Selector */}
                        <button
                          onClick={cyclePlaybackRate}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition-colors"
                          title="Change Playback Speed"
                        >
                          {playbackRate}x
                        </button>

                        {/* Volume Control */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={toggleMute}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 accent-purple-500 cursor-pointer h-1 bg-slate-700 rounded-lg hidden sm:block"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <span className="flex items-center gap-1 text-slate-300">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          Audio Stream Ready
                        </span>
                        <span className="font-mono text-slate-500">
                          {selectedCall.uniqueid || `call_${selectedCall.id}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. AI Call Summarization & Transcription Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Sparkles size={16} className="text-indigo-600" />
                      <span>AI Call Intelligence & Transcription</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTriggerAnalysis}
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        <Sparkles size={13} className={isAnalyzing ? 'animate-spin' : ''} />
                        {isAnalyzing ? 'Analyzing with AI...' : analysis ? 'Re-Analyze Call' : 'Generate AI Summary'}
                      </button>
                    </div>
                  </div>

                  {/* Tabs: Summary vs Transcript */}
                  {analysis && (
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <button
                        onClick={() => setActiveAnalysisTab('summary')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeAnalysisTab === 'summary'
                            ? 'bg-purple-100 text-purple-800 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Executive Summary & Insights
                      </button>
                      <button
                        onClick={() => setActiveAnalysisTab('transcript')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeAnalysisTab === 'transcript'
                            ? 'bg-purple-100 text-purple-800 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Conversation Transcript
                      </button>
                    </div>
                  )}

                  {/* Analysis Content */}
                  {analysisLoading ? (
                    <div className="p-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-indigo-600" />
                      <span>Checking AI analysis records...</span>
                    </div>
                  ) : analysis ? (
                    activeAnalysisTab === 'summary' ? (
                      <div className="space-y-4">
                        {/* Summary Badges & Intent */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                              CALL OUTCOME
                            </span>
                            <span className="font-bold text-xs capitalize text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                              {analysis.summary?.outcome?.replace(/_/g, ' ') || 'Completed'}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                              SENTIMENT
                            </span>
                            <span
                              className={`font-bold text-xs capitalize px-2 py-0.5 rounded-md inline-block ${
                                analysis.summary?.sentiment === 'positive'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : analysis.summary?.sentiment === 'negative'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {analysis.summary?.sentiment || 'Neutral'}
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                              CALLER INTENT
                            </span>
                            <span className="font-semibold text-xs text-slate-800 line-clamp-2">
                              {analysis.summary?.caller_intent || 'General Inquiry'}
                            </span>
                          </div>
                        </div>

                        {/* Key Discussion Points */}
                        {analysis.summary?.key_points && analysis.summary.key_points.length > 0 && (
                          <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100/70 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                              <ListChecks size={14} className="text-indigo-600" />
                              <span>Key Discussion Points</span>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-700 pl-2">
                              {analysis.summary.key_points.map((pt, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-indigo-600 font-bold">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Items */}
                        {analysis.summary?.action_items && analysis.summary.action_items.length > 0 && (
                          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/70 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                              <CheckSquare size={14} className="text-emerald-600" />
                              <span>Follow-up Action Items</span>
                            </div>
                            <div className="space-y-1.5 text-xs text-slate-700">
                              {analysis.summary.action_items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input type="checkbox" readOnly defaultChecked={false} className="rounded accent-emerald-600" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Language & Script notes */}
                        {analysis.summary?.language_notes && (
                          <div className="text-[11px] text-slate-500 italic">
                            Language note: {analysis.summary.language_notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Transcript Tab */
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {analysis.transcript?.segments && analysis.transcript.segments.length > 0 ? (
                          analysis.transcript.segments.map((seg, idx) => {
                            const isAgent = seg.speaker?.toLowerCase().includes('agent') || seg.speaker?.toLowerCase().includes('bot');
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border text-xs space-y-1 ${
                                  isAgent
                                    ? 'bg-purple-50/60 border-purple-100'
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-bold flex items-center gap-1 ${isAgent ? 'text-purple-700' : 'text-slate-800'}`}>
                                    {isAgent ? <Bot size={13} /> : <User size={13} />}
                                    {seg.speaker || (isAgent ? 'Agent / AI' : 'Customer')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {formatSecs(seg.start_time)} - {formatSecs(seg.end_time)}
                                  </span>
                                </div>
                                <p className="text-slate-700 leading-relaxed font-normal">
                                  {seg.text}
                                </p>
                              </div>
                            );
                          })
                        ) : analysis.transcript?.full_text ? (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {analysis.transcript.full_text}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No transcript turns recorded for this call.
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="p-6 bg-indigo-50/30 rounded-xl border border-indigo-100/60 text-center text-slate-600 text-xs flex flex-col items-center gap-2">
                      <Bot size={24} className="text-indigo-500" />
                      <div className="max-w-md">
                        <span className="font-bold text-slate-800 block mb-1">
                          No AI Summary Generated Yet
                        </span>
                        <span>
                          Click &quot;Generate AI Summary&quot; above to transcribe this call recording and extract conversation highlights, sentiment, caller intent, and follow-up action items.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Call Notes Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <MessageSquare size={16} className="text-purple-600" />
                      <span>Call Notes & Manual Observations</span>
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
                      <span>No notes yet. Click &quot;Add Note&quot; to write observations.</span>
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
                Select a call log from the left list to inspect detailed specs, recordings, and AI intelligence.
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
