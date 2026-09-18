'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Headphones, Play, Pause, Volume2, VolumeX, Sparkles,
  FileText, CheckCircle2, AlertTriangle, MessageSquare,
  Clock, Tag, RefreshCw, Copy, Check, Info, PhoneCall,
  User, Bot, ArrowRight, CornerDownRight, HelpCircle
} from 'lucide-react';
import {
  telephonyApi,
  CallAnalysisRecord,
  CallOutcome,
  CallSentiment,
  TranscriptSegment
} from '@/lib/api';

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
  status: string;
  uniqueid?: string;
  queue?: string;
  companyId?: string;
}

interface CallAnalysisModalProps {
  call: CallRecord;
  isOpen: boolean;
  onClose: () => void;
  onPlayAudio?: (call: CallRecord, seekTime?: number) => void;
}

const OUTCOME_CONFIG: Record<CallOutcome, { label: string; bg: string; text: string; border: string }> = {
  interested: { label: 'Interested', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  converted: { label: 'Converted', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  follow_up_required: { label: 'Follow Up Required', bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  not_interested: { label: 'Not Interested', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
  complaint: { label: 'Complaint', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  other: { label: 'General / Other', bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
};

const SENTIMENT_CONFIG: Record<CallSentiment, { label: string; bg: string; text: string; dot: string }> = {
  positive: { label: 'Positive Sentiment', bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  neutral: { label: 'Neutral Sentiment', bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  negative: { label: 'Negative Sentiment', bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
};

function formatSeconds(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallAnalysisModal({ call, isOpen, onClose, onPlayAudio }: CallAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'fulltext'>('summary');
  const [analysis, setAnalysis] = useState<CallAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<'mixed' | 'urdu' | 'roman_urdu'>('mixed');
  const [copied, setCopied] = useState(false);

  // Audio preview inside modal
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioChecking, setAudioChecking] = useState(false);
  const [hasRecording, setHasRecording] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const callIdentifier = call.uniqueid || String(call.id);
  const customerPhone = call.context?.toLowerCase().includes('out') ? call.destination : call.callerid;

  // Load existing analysis and check audio
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setLoading(true);
    setAudioChecking(true);

    // 1. Fetch analysis
    telephonyApi.getCallAnalysis(callIdentifier)
      .then((res) => {
        if (res.data) setAnalysis(res.data);
      })
      .catch(() => {
        // Not analyzed yet is normal
        setAnalysis(null);
      })
      .finally(() => setLoading(false));

    // 2. Check recording existence
    telephonyApi.checkRecording({
      uniqueid: call.uniqueid || String(call.id),
      phone: customerPhone,
      destination: call.destination,
      callerid: call.callerid,
      start_time: call.start_time,
      did: call.callerid || call.extension,
    })
      .then((res) => {
        if (res.data && res.data.exists) {
          setHasRecording(true);
          const stream = telephonyApi.getRecordingStreamUrl({
            uniqueid: call.uniqueid || String(call.id),
            phone: customerPhone,
            destination: call.destination,
            callerid: call.callerid,
            start_time: call.start_time,
            filename: res.data.filename,
          });
          setAudioUrl(stream);
        } else {
          setHasRecording(false);
        }
      })
      .catch(() => {
        setHasRecording(false);
      })
      .finally(() => setAudioChecking(false));

  }, [isOpen, callIdentifier, customerPhone, call.id, call.uniqueid, call.start_time, call.destination, call.callerid]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  // Run AI Pipeline Analysis
  const handleRunAnalysis = async (force = false) => {
    setAnalyzing(true);
    setError(null);

    try {
      const res = await telephonyApi.processCall({
        call_id: callIdentifier,
        uniqueid: call.uniqueid || String(call.id),
        phone: customerPhone,
        destination: call.destination,
        callerid: call.callerid,
        start_time: call.start_time,
        script: script,
        force: force,
      });

      if (res.data) {
        setAnalysis(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process call recording with AI Pipeline.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyTranscript = () => {
    const text = analysis?.transcript?.full_text || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Call Details &amp; AI Analysis
                </h3>
                <span className="text-[11px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                  ID: {call.uniqueid || call.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Number: <span className="font-mono text-white font-semibold">{customerPhone}</span> &bull; {new Date(call.start_time).toLocaleString()} &bull; Duration: {call.duration ? `${call.duration}s` : '—'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Audio Player Bar ──────────────────────────────────────────────── */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {audioChecking ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw size={13} className="animate-spin text-teal-600" />
              <span>Locating audio recording in /var/data/…</span>
            </div>
          ) : hasRecording && audioUrl ? (
            <div className="flex items-center gap-4 flex-1">
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => setIsPlaying(false)}
              />
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow transition-all active:scale-95 flex-shrink-0"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>

              <div className="flex-1 max-w-md">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-0.5">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(duration)}</span>
                </div>
              </div>

              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Recording Available
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
              <span>Recording not found in /var/data/ for this call.</span>
            </div>
          )}

          {/* Script selector & AI Process action */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500">Script:</label>
              <select
                value={script}
                onChange={(e) => setScript(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="mixed">Mixed (Urdu + English)</option>
                <option value="urdu">Urdu</option>
                <option value="roman_urdu">Roman Urdu</option>
              </select>
            </div>

            <button
              onClick={() => handleRunAnalysis(true)}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0f8f7a, #22c1a5)' }}
            >
              <Sparkles size={13} className={analyzing ? 'animate-spin' : ''} />
              {analyzing ? 'Analyzing Call…' : analysis ? 'Re-Analyze' : 'Analyze Call'}
            </button>
          </div>
        </div>

        {/* ── Tabs Navigation ──────────────────────────────────────────────── */}
        <div className="px-6 bg-white border-b border-slate-100 flex gap-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={14} /> AI Summary &amp; Key Insights
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={14} /> Segmented Transcript Timeline
            {analysis?.transcript?.segments?.length ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {analysis.transcript.segments.length}
              </span>
            ) : null}
          </button>
          <button
            onClick={() => setActiveTab('fulltext')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'fulltext'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={14} /> Full Transcript Text
          </button>
        </div>

        {/* ── Content Area ─────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Processing Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw size={24} className="animate-spin text-teal-600" />
              <span className="text-xs font-medium">Loading call analysis…</span>
            </div>
          ) : !analysis ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-3">
                <Sparkles size={24} className="text-teal-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">No AI Analysis Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Transcribe Urdu/English audio and generate structured caller intent, key points, and action items via Gemini &amp; Groq pipeline.
              </p>
              <button
                onClick={() => handleRunAnalysis(false)}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #0f8f7a, #22c1a5)' }}
              >
                <Sparkles size={14} className={analyzing ? 'animate-spin' : ''} />
                {analyzing ? 'Processing Pipeline…' : 'Start AI Analysis'}
              </button>
            </div>
          ) : (
            <>
              {/* ── Tab 1: AI Summary ────────────────────────────────────────── */}
              {activeTab === 'summary' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Top summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Outcome & Sentiment */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Call Outcome &amp; Sentiment
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {analysis.summary.outcome && (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold border"
                            style={{
                              background: OUTCOME_CONFIG[analysis.summary.outcome]?.bg || '#f1f5f9',
                              color: OUTCOME_CONFIG[analysis.summary.outcome]?.text || '#475569',
                              borderColor: OUTCOME_CONFIG[analysis.summary.outcome]?.border || '#e2e8f0',
                            }}
                          >
                            Outcome: {OUTCOME_CONFIG[analysis.summary.outcome]?.label || analysis.summary.outcome}
                          </span>
                        )}

                        {analysis.summary.sentiment && (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                            style={{
                              background: SENTIMENT_CONFIG[analysis.summary.sentiment]?.bg || '#f1f5f9',
                              color: SENTIMENT_CONFIG[analysis.summary.sentiment]?.text || '#475569',
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: SENTIMENT_CONFIG[analysis.summary.sentiment]?.dot || '#94a3b8' }}
                            />
                            {SENTIMENT_CONFIG[analysis.summary.sentiment]?.label || analysis.summary.sentiment}
                          </span>
                        )}
                      </div>

                      {analysis.summary.caller_intent && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Caller Intent
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {analysis.summary.caller_intent}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Topics Discussed & Language */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Topics Discussed
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.summary.topics_discussed && analysis.summary.topics_discussed.length > 0 ? (
                          analysis.summary.topics_discussed.map((topic, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-100 font-medium"
                            >
                              <Tag size={11} className="text-teal-600" />
                              {topic}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No specific topics tagged.</span>
                        )}
                      </div>

                      {analysis.summary.language_notes && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Language &amp; Dialect Notes
                          </span>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {analysis.summary.language_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Points & Action Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Key Points */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <CheckCircle2 size={13} className="text-teal-600" />
                        Key Points
                      </div>
                      <ul className="space-y-2">
                        {analysis.summary.key_points && analysis.summary.key_points.length > 0 ? (
                          analysis.summary.key_points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400 italic">No key points generated.</li>
                        )}
                      </ul>
                    </div>

                    {/* Action Items */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <CornerDownRight size={13} className="text-indigo-600" />
                        Action Items &amp; Next Steps
                      </div>
                      <ul className="space-y-2">
                        {analysis.summary.action_items && analysis.summary.action_items.length > 0 ? (
                          analysis.summary.action_items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/50">
                              <input
                                type="checkbox"
                                defaultChecked={false}
                                className="accent-teal-600 mt-0.5 rounded cursor-pointer"
                              />
                              <span className="leading-relaxed font-medium">{item}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-400 italic">No action items required.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 2: Segmented Transcript Timeline ────────────────────── */}
              {activeTab === 'transcript' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Click any timestamp to play audio from that exact second.</span>
                    <span className="font-semibold text-slate-600">
                      {analysis.transcript.segments?.length || 0} segments
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {analysis.transcript.segments && analysis.transcript.segments.length > 0 ? (
                      analysis.transcript.segments.map((seg, idx) => {
                        const isAgent = seg.speaker.toLowerCase().includes('agent') || seg.speaker.toLowerCase().includes('speaker 1');
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border transition-all hover:shadow-sm ${
                              isAgent
                                ? 'bg-white border-slate-200'
                                : 'bg-teal-50/40 border-teal-100'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                    isAgent ? 'bg-slate-100 text-slate-700' : 'bg-teal-100 text-teal-700'
                                  }`}
                                >
                                  {isAgent ? <Bot size={11} /> : <User size={11} />}
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                  {seg.speaker}
                                </span>
                                {seg.language && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">
                                    {seg.language}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => seekTo(seg.start_time)}
                                className="flex items-center gap-1 text-[11px] font-mono font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 transition-colors"
                                title="Play from this point"
                              >
                                <Play size={10} />
                                {formatSeconds(seg.start_time)} - {formatSeconds(seg.end_time)}
                              </button>
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed font-normal pl-7">
                              {seg.text}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                        No segmented timeline available for this recording.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab 3: Full Transcript Text ─────────────────────────────── */}
              {activeTab === 'fulltext' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Complete transcribed text</span>
                    <button
                      onClick={handleCopyTranscript}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {copied ? <Check size={12} className="text-teal-600" /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy Transcript'}
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans max-h-[400px] overflow-y-auto">
                    {analysis.transcript.full_text || 'No transcription text available.'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ──────────────────────────────────────────────────── */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Info size={13} className="text-slate-400" />
            <span>AI powered by Gemini 3.6 Flash &amp; Groq GPT-OSS 20B</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
