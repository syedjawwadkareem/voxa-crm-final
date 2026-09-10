'use client';

// ─── Company AI Agents ────────────────────────────────────────────────────────
// Two-tab UI: My Agent Configs (own CRUD) | My Call History (transcript viewer)

import { useState, useEffect, useCallback } from 'react';
import {
  Bot, Plus, Phone, Trash2, Edit3, RefreshCw, X, AlertCircle, Loader2,
  CheckCircle2, Clock, PhoneOff, Voicemail, PhoneCall, ExternalLink,
  Settings2, History, Info, Building2,
} from 'lucide-react';
import { aiAgentsApi } from '@/lib/api';
import type { AgentConfig, AiCall, CreateAgentConfigPayload, AiCallStatus } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d?: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const fmtDuration = (s?: number | null) => {
  if (s == null) return '—';
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<AiCallStatus, { label: string; cls: string; icon: React.FC<any> }> = {
  queued:      { label: 'Queued',      cls: 'bg-amber-100    text-amber-700   border-amber-200',    icon: Clock       },
  ringing:     { label: 'Ringing',     cls: 'bg-blue-100     text-blue-700    border-blue-200',     icon: Phone       },
  completed:   { label: 'Completed',   cls: 'bg-emerald-100  text-emerald-700 border-emerald-200',  icon: CheckCircle2},
  no_answer:   { label: 'No Answer',   cls: 'bg-slate-100    text-slate-600   border-slate-200',    icon: PhoneOff    },
  voicemail:   { label: 'Voicemail',   cls: 'bg-purple-100   text-purple-700  border-purple-200',   icon: Voicemail   },
  transferred: { label: 'Transferred', cls: 'bg-cyan-100     text-cyan-700    border-cyan-200',     icon: PhoneCall   },
  failed:      { label: 'Failed',      cls: 'bg-red-100      text-red-700     border-red-200',      icon: AlertCircle },
};

function CallStatusBadge({ status }: { status: AiCallStatus }) {
  const { label, cls, icon: Icon } = STATUS_MAP[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={11} />{label}
    </span>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal-500' : 'bg-slate-200'} cursor-pointer`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Form field ────────────────────────────────────────────────────────────────

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all';
const selectCls = inputCls + ' cursor-pointer';
const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];

const emptyForm = (): Partial<CreateAgentConfigPayload> => ({
  name: '', tone: '', script: '', voice: 'Puck', language: 'ur-en-auto',
  speak_first: 'agent', hangup_enabled: true, dtmf_enabled: false,
  voicemail_detection_enabled: false, call_recording_enabled: false,
  idle_timeout_seconds: 10, idle_max_reprompts: 2,
  greeting_message: '', goodbye_message: '', voicemail_message: '',
  webhook_url: '', webhook_secret: '', goodbye_message_verbatim: false,
});

// ── Config Form panel ─────────────────────────────────────────────────────────

function ConfigForm({ initial, onClose, onSaved }: { initial?: AgentConfig | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<CreateAgentConfigPayload>>(() =>
    initial ? {
      name: initial.name, tone: initial.tone, script: initial.script, voice: initial.voice,
      language: initial.language, speak_first: initial.speak_first,
      hangup_enabled: initial.hangup_enabled, dtmf_enabled: initial.dtmf_enabled,
      voicemail_detection_enabled: initial.voicemail_detection_enabled,
      voicemail_message: initial.voicemail_message ?? '',
      call_recording_enabled: initial.call_recording_enabled,
      idle_timeout_seconds: initial.idle_timeout_seconds, idle_max_reprompts: initial.idle_max_reprompts,
      greeting_message: initial.greeting_message ?? '',
      goodbye_message: initial.goodbye_message ?? '',
      goodbye_message_verbatim: initial.goodbye_message_verbatim,
      webhook_url: initial.webhook_url, webhook_secret: initial.webhook_secret,
    } : { ...emptyForm() }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof CreateAgentConfigPayload, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name?.trim() || !form.tone?.trim() || !form.script?.trim() || !form.voice?.trim()) {
      setErr('Name, tone, script, and voice are required'); return;
    }
    setSaving(true); setErr('');
    try {
      if (initial) {
        await aiAgentsApi.companyUpdateConfig(initial._id, form);
      } else {
        await aiAgentsApi.companyCreateConfig(form);
      }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">{initial ? 'Edit Agent Config' : 'New Agent Config'}</h3>
            <p className="text-slate-400 text-sm">Configure your AI voice agent</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {err && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {err}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Config Name" required>
              <input className={inputCls} placeholder="e.g. Sales Agent" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
            </Field>
            <Field label="Voice" required>
              <select className={selectCls} value={form.voice ?? 'Puck'} onChange={e => set('voice', e.target.value)}>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Tone" required>
              <input className={inputCls} placeholder="friendly, formal, professional…" value={form.tone ?? ''} onChange={e => set('tone', e.target.value)} />
            </Field>
            <Field label="Speaks First">
              <select className={selectCls} value={form.speak_first ?? 'agent'} onChange={e => set('speak_first', e.target.value as any)}>
                <option value="agent">Agent greets first</option>
                <option value="caller">Wait for caller</option>
              </select>
            </Field>
          </div>

          <Field label="System Prompt (Script)" required hint="Persona, language, and conversation rules">
            <textarea className={`${inputCls} h-32 resize-y font-mono text-xs`} placeholder="You are a bilingual (Urdu/English) voice agent for…" value={form.script ?? ''} onChange={e => set('script', e.target.value)} />
          </Field>

          <Field label="Greeting Message" hint="Custom opening line (blank = generic default)">
            <input className={inputCls} placeholder="Hello! How can I help you today?" value={form.greeting_message ?? ''} onChange={e => set('greeting_message', e.target.value || null)} />
          </Field>

          {/* Feature toggles */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Feature Flags</p>
            {([
              ['hangup_enabled',             'Agent can hang up',       'Ends call when conversation concludes'],
              ['dtmf_enabled',               'DTMF keypad tones',       'Agent can press digits'],
              ['voicemail_detection_enabled','Voicemail detection',      'Detect and handle answering machines'],
              ['call_recording_enabled',     'Record calls',             'Save call audio as WAV'],
            ] as [keyof CreateAgentConfigPayload, string, string][]).map(([key, label, hint]) => (
              <div key={key} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400">{hint}</p>
                </div>
                <Toggle checked={!!form[key]} onChange={v => set(key, v)} />
              </div>
            ))}
          </div>

          {form.voicemail_detection_enabled && (
            <Field label="Voicemail Message" required hint="Spoken verbatim if call reaches voicemail">
              <input className={inputCls} placeholder="Hi, this is a message for…" value={form.voicemail_message ?? ''} onChange={e => set('voicemail_message', e.target.value)} />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Idle Timeout (seconds)">
              <input type="number" className={inputCls} min={3} max={60} value={form.idle_timeout_seconds ?? 10} onChange={e => set('idle_timeout_seconds', Number(e.target.value))} />
            </Field>
            <Field label="Max Re-prompts">
              <input type="number" className={inputCls} min={0} max={10} value={form.idle_max_reprompts ?? 2} onChange={e => set('idle_max_reprompts', Number(e.target.value))} />
            </Field>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 shadow-md shadow-teal-500/20 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : initial ? 'Update' : 'Create Config'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trigger Call Modal ────────────────────────────────────────────────────────

function TriggerCallModal({ config, onClose, onTriggered }: { config: AgentConfig; onClose: () => void; onTriggered: () => void }) {
  const [form, setForm] = useState({ phone_number: '', from_number: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    if (!form.phone_number.trim() || !form.from_number.trim()) { setErr('Both fields are required'); return; }
    setLoading(true); setErr('');
    try {
      await aiAgentsApi.companyTriggerCall({ agent_config_id: config._id, ...form });
      onTriggered(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Trigger AI Call</h3>
            <p className="text-slate-400 text-sm truncate">{config.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle size={14} />{err}</div>}
          <div className="flex items-start gap-2 text-blue-700 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>Result arrives via webhook. Check Call History after the call ends.</span>
          </div>
          <Field label="Caller ID (From Number)" required hint="03XXXXXXXXX format">
            <input className={inputCls} placeholder="03001234567" value={form.from_number} onChange={e => setForm(f => ({ ...f, from_number: e.target.value }))} />
          </Field>
          <Field label="Number to Call" required hint="03XXXXXXXXX format">
            <input className={inputCls} placeholder="03022011625" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button>
          <button onClick={go} disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 shadow-md shadow-teal-500/20 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
            {loading ? 'Queuing…' : 'Trigger Call'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Call Detail Panel ─────────────────────────────────────────────────────────

function CallDetailPanel({ call, onClose }: { call: AiCall; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800">Call Detail</h3>
            <p className="text-slate-400 text-xs font-mono mt-0.5">{call.call_id ?? call._id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Status',   <CallStatusBadge key="s" status={call.status} />],
              ['To',       <span key="t" className="font-mono text-slate-700 text-sm">{call.phone_number}</span>],
              ['From',     <span key="f" className="font-mono text-slate-700 text-sm">{call.from_number}</span>],
              ['Duration', fmtDuration(call.duration_seconds)],
              ['Started',  fmt(call.started_at)],
              ['Ended',    fmt(call.ended_at)],
            ].map(([label, val], i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{label as string}</div>
                <div className="text-slate-800 font-medium text-sm">{val as React.ReactNode}</div>
              </div>
            ))}
          </div>

          {call.structured_output && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Structured Output</p>
              <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(call.structured_output, null, 2)}
              </pre>
            </div>
          )}

          {call.recording_url && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recording</p>
              <a href={call.recording_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium">
                <ExternalLink size={13} /> Download WAV
              </a>
            </div>
          )}

          {call.transcript && call.transcript.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Transcript</p>
              <div className="space-y-3">
                {call.transcript.map((turn, i) => (
                  <div key={i} className={`flex gap-3 ${turn.role === 'agent' ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      turn.role === 'agent' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {turn.role === 'agent' ? 'AI' : 'C'}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      turn.role === 'agent' ? 'bg-slate-100 text-slate-800 rounded-tl-sm' : 'bg-blue-500 text-white rounded-tr-sm'
                    }`}>
                      {turn.text}
                      {turn.ts && (
                        <div className="text-xs mt-1 opacity-60">
                          {new Date(turn.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-400 text-sm py-8">No transcript available yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CompanyAiAgents() {
  const [activeTab, setActiveTab] = useState<'configs' | 'calls'>('configs');
  const [configs, setConfigs]     = useState<AgentConfig[]>([]);
  const [calls, setCalls]         = useState<AiCall[]>([]);
  const [loading, setLoading]     = useState(true);
  const [callsLoading, setCallsLoading] = useState(false);
  const [error, setError]         = useState('');

  const [showForm, setShowForm]         = useState(false);
  const [editConfig, setEditConfig]     = useState<AgentConfig | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<AgentConfig | null>(null);
  const [detailCall, setDetailCall]     = useState<AiCall | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadConfigs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await aiAgentsApi.companyListConfigs();
      setConfigs(res.data ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const loadCalls = useCallback(async () => {
    setCallsLoading(true);
    try {
      const res = await aiAgentsApi.companyListCalls(statusFilter || undefined);
      setCalls(res.data ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setCallsLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);
  useEffect(() => { if (activeTab === 'calls') loadCalls(); }, [activeTab, loadCalls]);

  async function handleDelete(cfg: AgentConfig) {
    if (!confirm(`Delete "${cfg.name}"?`)) return;
    try {
      await aiAgentsApi.companyDeleteConfig(cfg._id);
      await loadConfigs();
    } catch (e: any) { alert('Error: ' + e.message); }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bot size={22} className="text-teal-500" />
            AI Calling Agents
          </h2>
          <p className="text-slate-500 text-sm mt-1">Configure your AI voice agents and view call results</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => activeTab === 'configs' ? loadConfigs() : loadCalls()}
            className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
            <RefreshCw size={16} />
          </button>
          {activeTab === 'configs' && (
            <button onClick={() => { setEditConfig(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 shadow-md shadow-teal-500/20">
              <Plus size={16} /> New Agent Config
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['configs', 'calls'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab === 'configs' ? <><Settings2 size={14} className="inline mr-1.5" />My Agents</> : <><History size={14} className="inline mr-1.5" />Call History</>}
          </button>
        ))}
      </div>

      {/* Status filter (calls tab) */}
      {activeTab === 'calls' && (
        <select className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer min-w-[140px]"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{STATUS_MAP[s as AiCallStatus].label}</option>)}
        </select>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── CONFIGS TAB ── */}
      {activeTab === 'configs' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-500" /></div>
          ) : configs.length === 0 ? (
            <div className="text-center py-16">
              <Bot size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No agent configs yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {configs.map(cfg => (
                <div key={cfg._id} className="p-5 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800">{cfg.name}</div>
                        <div className="text-sm text-slate-500 mt-0.5">{cfg.tone} · <span className="font-medium text-purple-600">{cfg.voice}</span></div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {cfg.hangup_enabled         && <span className="text-xs bg-teal-50 text-teal-600 border border-teal-100 px-1.5 py-0.5 rounded">Hangup</span>}
                          {cfg.dtmf_enabled           && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">DTMF</span>}
                          {cfg.call_recording_enabled && <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">Record</span>}
                          {!cfg.pipeline_config_id    && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">⚠ Not synced to pipeline</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => setTriggerConfig(cfg)}
                        className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors" title="Trigger call">
                        <Phone size={14} />
                      </button>
                      <button onClick={() => { setEditConfig(cfg); setShowForm(true); }}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(cfg)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CALLS TAB ── */}
      {activeTab === 'calls' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          {callsLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-500" /></div>
          ) : calls.length === 0 ? (
            <div className="text-center py-16">
              <Phone size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No calls yet. Trigger a call from your agent configs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {['To Number', 'Agent', 'Status', 'Duration', 'Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calls.map(call => {
                    const cfg = typeof call.agent_config_id === 'object' ? call.agent_config_id : null;
                    return (
                      <tr key={call._id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setDetailCall(call)}>
                        <td className="px-4 py-3 font-mono text-slate-800">{call.phone_number}</td>
                        <td className="px-4 py-3 text-slate-600">{cfg?.name ?? '—'}</td>
                        <td className="px-4 py-3"><CallStatusBadge status={call.status} /></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDuration(call.duration_seconds)}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmt(call.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 opacity-0 group-hover:opacity-100 transition-all">
                            <ExternalLink size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm      && <ConfigForm initial={editConfig} onClose={() => { setShowForm(false); setEditConfig(null); }} onSaved={loadConfigs} />}
      {triggerConfig && <TriggerCallModal config={triggerConfig} onClose={() => setTriggerConfig(null)} onTriggered={loadCalls} />}
      {detailCall    && <CallDetailPanel call={detailCall} onClose={() => setDetailCall(null)} />}
    </div>
  );
}
