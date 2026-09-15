'use client';

// ─── Admin AI Agents ──────────────────────────────────────────────────────────
// Two-tab UI: Agent Configs (CRUD + trigger calls) | Call History (transcript viewer)

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot, Plus, Phone, Trash2, Edit3, RefreshCw, X, AlertCircle, Loader2,
  ChevronDown, ChevronUp, CheckCircle2, Clock, Mic, MicOff, Building2,
  Settings2, History, PhoneCall, PhoneOff, Voicemail, Send, ExternalLink,
  ToggleLeft, ToggleRight, Info, Hash,
} from 'lucide-react';
import { aiAgentsApi, companiesApi } from '@/lib/api';
import type { AgentConfig, AiCall, CreateAgentConfigPayload, AiCallStatus } from '@/lib/api';
import { toast, confirmModal } from '@/components/ui/NotificationProvider';

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
  voicemail:   { label: 'Voicemail',   cls: 'bg-teal-100     text-teal-700    border-teal-200',     icon: Voicemail   },
  transferred: { label: 'Transferred', cls: 'bg-cyan-100     text-cyan-700    border-cyan-200',     icon: PhoneCall   },
  failed:      { label: 'Failed',      cls: 'bg-red-100      text-red-700     border-red-200',      icon: AlertCircle },
};

function CallStatusBadge({ status }: { status: AiCallStatus }) {
  const { label, cls, icon: Icon } = STATUS_MAP[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-teal-500' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Form field wrapper ────────────────────────────────────────────────────────

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

// ── VOICES available in Gemini Live ──────────────────────────────────────────

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];

// ── Empty config form ─────────────────────────────────────────────────────────

const emptyForm = (): Partial<CreateAgentConfigPayload> => ({
  name: '', tone: '', script: '', voice: 'Puck', language: 'ur-en-auto',
  speak_first: 'agent', hangup_enabled: true,
  dtmf_enabled: false, voicemail_detection_enabled: false,
  call_recording_enabled: false, noise_cancellation_enabled: false,
  transfer_enabled: false, idle_timeout_seconds: 10, idle_max_reprompts: 2,
  greeting_message: '', goodbye_message: '', voicemail_message: '',
  webhook_url: '', webhook_secret: '',
  goodbye_message_verbatim: false,
});

// ── Agent Config Form (slide-over panel) ─────────────────────────────────────

interface ConfigFormProps {
  companies: { _id: string; name: string }[];
  initial?: AgentConfig | null;
  onClose: () => void;
  onSaved: () => void;
}

function ConfigForm({ companies, initial, onClose, onSaved }: ConfigFormProps) {
  const [form, setForm] = useState<Partial<CreateAgentConfigPayload>>(() =>
    initial ? {
      company_id: typeof initial.company_id === 'object' ? (initial.company_id as any)?._id : initial.company_id as string,
      name: initial.name, tone: initial.tone, script: initial.script, voice: initial.voice,
      language: initial.language, speak_first: initial.speak_first,
      hangup_enabled: initial.hangup_enabled, dtmf_enabled: initial.dtmf_enabled,
      voicemail_detection_enabled: initial.voicemail_detection_enabled,
      voicemail_message: initial.voicemail_message ?? '',
      call_recording_enabled: initial.call_recording_enabled,
      noise_cancellation_enabled: initial.noise_cancellation_enabled,
      transfer_enabled: initial.transfer_enabled,
      idle_timeout_seconds: initial.idle_timeout_seconds,
      idle_max_reprompts: initial.idle_max_reprompts,
      greeting_message: initial.greeting_message ?? '',
      goodbye_message: initial.goodbye_message ?? '',
      goodbye_message_verbatim: initial.goodbye_message_verbatim,
      webhook_url: initial.webhook_url, webhook_secret: initial.webhook_secret,
    } : { ...emptyForm() }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key: keyof CreateAgentConfigPayload, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  async function handleSave() {
    if (!form.name?.trim())   { setErr('Name is required'); return; }
    if (!form.tone?.trim())   { setErr('Tone is required'); return; }
    if (!form.script?.trim()) { setErr('Script is required'); return; }
    if (!form.voice?.trim())  { setErr('Voice is required'); return; }
    if (!initial && !form.company_id) { setErr('Company is required'); return; }

    setSaving(true); setErr('');
    try {
      if (initial) {
        await aiAgentsApi.updateConfig(initial._id, form);
      } else {
        await aiAgentsApi.createConfig(form as CreateAgentConfigPayload);
      }
      onSaved();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">{initial ? 'Edit Agent Config' : 'New Agent Config'}</h3>
            <p className="text-slate-400 text-sm mt-0.5">Configure an AI voice agent</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {err && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {err}
            </div>
          )}

          {/* Basic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!initial && (
              <Field label="Company" required>
                <select id="ai-config-company" className={selectCls} value={form.company_id ?? ''} onChange={e => set('company_id', e.target.value)}>
                  <option value="">— Select company —</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Config Name" required>
              <input id="ai-config-name" className={inputCls} placeholder="e.g. Acme Support Agent" value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
            </Field>
            <Field label="Voice" required hint="Gemini Live voice name">
              <select id="ai-config-voice" className={selectCls} value={form.voice ?? 'Puck'} onChange={e => set('voice', e.target.value)}>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Tone" required>
              <input id="ai-config-tone" className={inputCls} placeholder="e.g. friendly, formal, professional" value={form.tone ?? ''} onChange={e => set('tone', e.target.value)} />
            </Field>
            <Field label="Language" hint="Informational — actual behavior is driven by script">
              <input id="ai-config-lang" className={inputCls} placeholder="ur-en-auto" value={form.language ?? ''} onChange={e => set('language', e.target.value)} />
            </Field>
            <Field label="Speaks First">
              <select id="ai-config-speak-first" className={selectCls} value={form.speak_first ?? 'agent'} onChange={e => set('speak_first', e.target.value as any)}>
                <option value="agent">Agent greets first</option>
                <option value="caller">Wait for caller to speak</option>
              </select>
            </Field>
          </div>

          <Field label="System Prompt (Script)" required hint="Defines the agent's persona, language, tone, and conversation rules">
            <textarea id="ai-config-script" className={`${inputCls} h-36 resize-y font-mono text-xs`} placeholder="You are a bilingual (Urdu/English) voice agent for..." value={form.script ?? ''} onChange={e => set('script', e.target.value)} />
          </Field>

          <Field label="Greeting Message" hint="Optional custom opening line — null uses a generic default">
            <input className={inputCls} placeholder="Hello! How can I help you today?" value={form.greeting_message ?? ''} onChange={e => set('greeting_message', e.target.value || null)} />
          </Field>

          {/* Feature toggles */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Feature Flags</p>
            {([
              ['hangup_enabled',             'Agent can hang up',           'Lets agent end call naturally'],
              ['dtmf_enabled',               'DTMF (keypad tones)',         'Agent can press digits during call'],
              ['voicemail_detection_enabled','Voicemail detection',         'Listens for answering machines'],
              ['call_recording_enabled',     'Record calls',               'Saves call audio as WAV'],
              ['noise_cancellation_enabled', 'Noise cancellation',          'Currently a no-op (known limitation)'],
              ['transfer_enabled',           'Call transfer',               'Not yet verified — leave off'],
              ['goodbye_message_verbatim',   'Verbatim goodbye message',    'Speak goodbye exactly as written'],
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
            <Field label="Voicemail Message" required hint="Spoken verbatim if call reaches voicemail, then agent hangs up">
              <input className={inputCls} placeholder="Hi, this is a message for..." value={form.voicemail_message ?? ''} onChange={e => set('voicemail_message', e.target.value)} />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Idle Timeout (seconds)">
              <input type="number" className={inputCls} min={3} max={60} step={1} value={form.idle_timeout_seconds ?? 10} onChange={e => set('idle_timeout_seconds', Number(e.target.value))} />
            </Field>
            <Field label="Max Re-prompts">
              <input type="number" className={inputCls} min={0} max={10} step={1} value={form.idle_max_reprompts ?? 2} onChange={e => set('idle_max_reprompts', Number(e.target.value))} />
            </Field>
          </div>

          <Field label="Goodbye Message" hint="What the agent says when ending due to silence (null = generic)">
            <input className={inputCls} placeholder="Thank you for your time. Goodbye!" value={form.goodbye_message ?? ''} onChange={e => set('goodbye_message', e.target.value || null)} />
          </Field>

          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Webhook (optional — auto-set if blank)</p>
            <Field label="Webhook URL" hint="Where the AI pipeline POSTs call results">
              <input className={inputCls} placeholder="https://yourcrm.com/webhooks/voxa" value={form.webhook_url ?? ''} onChange={e => set('webhook_url', e.target.value)} />
            </Field>
            <Field label="Webhook Secret" hint="HMAC secret to verify webhook signatures (auto-generated if blank)">
              <input className={inputCls} placeholder="auto-generated" value={form.webhook_secret ?? ''} onChange={e => set('webhook_secret', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button id="ai-config-save-btn" onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Saving…' : initial ? 'Update Config' : 'Create Config'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trigger Call Modal ────────────────────────────────────────────────────────

function TriggerCallModal({ config, isAdmin, onClose, onTriggered }: {
  config: AgentConfig; isAdmin: boolean; onClose: () => void; onTriggered: () => void;
}) {
  const [form, setForm] = useState({ phone_number: '', from_number: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleTrigger() {
    if (!form.phone_number.trim() || !form.from_number.trim()) { setErr('Both fields are required'); return; }
    setLoading(true); setErr('');
    try {
      if (isAdmin) {
        await aiAgentsApi.triggerCall({ agent_config_id: config._id, ...form });
      } else {
        await aiAgentsApi.companyTriggerCall({ agent_config_id: config._id, ...form });
      }
      onTriggered();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-800">Trigger AI Call</h3>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{config.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {err && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {err}
            </div>
          )}
          <div className="flex items-start gap-2 text-blue-700 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>Call result will arrive via webhook. Check Call History for transcript.</span>
          </div>
          <Field label="Caller ID (From Number)" required hint="Pakistani format: 03XXXXXXXXX">
            <input id="ai-call-from" className={inputCls} placeholder="03001234567" value={form.from_number} onChange={e => setForm(f => ({ ...f, from_number: e.target.value }))} />
          </Field>
          <Field label="Destination (Phone Number)" required hint="Number to call — 03XXXXXXXXX format">
            <input id="ai-call-to" className={inputCls} placeholder="03022011625" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium">Cancel</button>
          <button id="ai-call-trigger-btn" onClick={handleTrigger} disabled={loading}
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
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-slate-800">Call Detail</h3>
            <p className="text-slate-400 text-xs font-mono mt-0.5">{call.call_id ?? call._id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              ['Status',    <CallStatusBadge key="s" status={call.status} />],
              ['To Number', <span key="to" className="font-mono text-slate-700">{call.phone_number}</span>],
              ['From',      <span key="fr" className="font-mono text-slate-700">{call.from_number}</span>],
              ['Duration',  fmtDuration(call.duration_seconds)],
              ['Started',   fmt(call.started_at)],
              ['Ended',     fmt(call.ended_at)],
            ].map(([label, val], i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{label as string}</div>
                <div className="text-slate-800 font-medium text-sm">{val as React.ReactNode}</div>
              </div>
            ))}
          </div>

          {call.ended_reason && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Ended reason: <strong>{call.ended_reason}</strong>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recording</p>
              <a href={call.recording_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-medium">
                <ExternalLink size={13} /> Download WAV
              </a>
            </div>
          )}

          {/* Structured output */}
          {call.structured_output && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Structured Output</p>
              <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
                {JSON.stringify(call.structured_output, null, 2)}
              </pre>
            </div>
          )}

          {/* Transcript */}
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
                      <div className={`text-xs mt-1 opacity-60`}>
                        {turn.ts ? new Date(turn.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No transcript available</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminAiAgents() {
  const [activeTab, setActiveTab] = useState<'configs' | 'calls'>('configs');
  const [configs, setConfigs]   = useState<AgentConfig[]>([]);
  const [calls, setCalls]       = useState<AiCall[]>([]);
  const [companies, setCompanies] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [callsLoading, setCallsLoading] = useState(false);
  const [error, setError]       = useState('');

  // Panels
  const [showForm, setShowForm]         = useState(false);
  const [editConfig, setEditConfig]     = useState<AgentConfig | null>(null);
  const [triggerConfig, setTriggerConfig] = useState<AgentConfig | null>(null);
  const [detailCall, setDetailCall]     = useState<AiCall | null>(null);

  // Filters
  const [configSearch, setConfigSearch]   = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter]   = useState('');

  // Load configs & companies
  const loadConfigs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [cfgRes, coRes] = await Promise.all([
        aiAgentsApi.listConfigs(companyFilter || undefined),
        companiesApi.list(),
      ]);
      setConfigs(cfgRes.data ?? []);
      setCompanies((coRes.data ?? []) as any[]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [companyFilter]);

  // Load calls
  const loadCalls = useCallback(async () => {
    setCallsLoading(true);
    try {
      const res = await aiAgentsApi.listCalls({
        company_id: companyFilter || undefined,
        status: statusFilter || undefined,
      });
      setCalls(res.data ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setCallsLoading(false); }
  }, [companyFilter, statusFilter]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);
  useEffect(() => { if (activeTab === 'calls') loadCalls(); }, [activeTab, loadCalls]);

  async function handleDeleteConfig(cfg: AgentConfig) {
    const confirmed = await confirmModal({
      title: 'Delete AI Agent',
      message: `Are you sure you want to delete "${cfg.name}"? This action cannot be undone.`,
      confirmText: 'Delete Agent',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await aiAgentsApi.deleteConfig(cfg._id);
      toast.success(`Agent "${cfg.name}" deleted`);
      await loadConfigs();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  }

  const filteredConfigs = configs.filter(c =>
    c.name.toLowerCase().includes(configSearch.toLowerCase()) ||
    (typeof c.company_id === 'object' && c.company_id?.name?.toLowerCase().includes(configSearch.toLowerCase()))
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bot size={22} className="text-teal-500" />
            AI Calling Agents
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage Voxa AI voice agents and outbound call history</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => activeTab === 'configs' ? loadConfigs() : loadCalls()}
            className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors">
            <RefreshCw size={16} />
          </button>
          {activeTab === 'configs' && (
            <button id="ai-config-add-btn" onClick={() => { setEditConfig(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20">
              <Plus size={16} /> New Agent Config
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['configs', 'calls'] as const).map(tab => (
          <button key={tab} id={`ai-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab === 'configs' ? <><Settings2 size={14} className="inline mr-1.5" />Agent Configs</> : <><History size={14} className="inline mr-1.5" />Call History</>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {activeTab === 'configs' && (
          <input className="flex-1 bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
            placeholder="Search configs…" value={configSearch} onChange={e => setConfigSearch(e.target.value)} />
        )}
        <select className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer min-w-[160px]"
          value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        {activeTab === 'calls' && (
          <select className="bg-white border border-slate-200 shadow-sm rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer min-w-[140px]"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{STATUS_MAP[s as AiCallStatus].label}</option>)}
          </select>
        )}
      </div>

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
          ) : filteredConfigs.length === 0 ? (
            <div className="text-center py-16">
              <Bot size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">{configs.length === 0 ? 'No agent configs yet. Create one to get started.' : 'No configs match your search.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {['Name', 'Company', 'Voice', 'Features', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConfigs.map(cfg => {
                    const co = typeof cfg.company_id === 'object' ? cfg.company_id : null;
                    return (
                      <tr key={cfg._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{cfg.name}</div>
                          <div className="text-xs text-slate-400">{cfg.tone}</div>
                        </td>
                        <td className="px-4 py-3">
                          {co ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-blue-400" />
                              <span className="text-slate-600">{co.name}</span>
                            </div>
                          ) : <span className="text-slate-400 italic text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full text-xs font-semibold">{cfg.voice}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {cfg.hangup_enabled         && <span className="text-xs bg-teal-50 text-teal-600 border border-teal-100 px-1.5 py-0.5 rounded">Hangup</span>}
                            {cfg.dtmf_enabled           && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded">DTMF</span>}
                            {cfg.call_recording_enabled && <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">Record</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmt(cfg.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button id={`ai-trigger-${cfg._id}`} onClick={() => setTriggerConfig(cfg)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors" title="Trigger call">
                              <Phone size={14} />
                            </button>
                            <button id={`ai-edit-${cfg._id}`} onClick={() => { setEditConfig(cfg); setShowForm(true); }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button id={`ai-delete-${cfg._id}`} onClick={() => handleDeleteConfig(cfg)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* ── CALLS TAB ── */}
      {activeTab === 'calls' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          {callsLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-500" /></div>
          ) : calls.length === 0 ? (
            <div className="text-center py-16">
              <Phone size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No calls yet. Trigger a call from an agent config to see results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {['To Number', 'Agent Config', 'Company', 'Status', 'Duration', 'Triggered', 'Detail'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calls.map(call => {
                    const cfg = typeof call.agent_config_id === 'object' ? call.agent_config_id : null;
                    const co  = typeof call.company_id === 'object' ? call.company_id : null;
                    return (
                      <tr key={call._id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setDetailCall(call)}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-800">{call.phone_number}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{cfg?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{co?.name ?? '—'}</td>
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

      {/* Panels / Modals */}
      {showForm      && <ConfigForm companies={companies} initial={editConfig} onClose={() => { setShowForm(false); setEditConfig(null); }} onSaved={loadConfigs} />}
      {triggerConfig && <TriggerCallModal config={triggerConfig} isAdmin={true} onClose={() => setTriggerConfig(null)} onTriggered={loadCalls} />}
      {detailCall    && <CallDetailPanel call={detailCall} onClose={() => setDetailCall(null)} />}
    </div>
  );
}
