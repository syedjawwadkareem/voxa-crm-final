'use client';

// ─── Company Omnichannel — Integration Hub ────────────────────────────────────
// /company/omnichannel — 4 major tabs: Meta | WhatsApp | SMS | Email
// Meta tab: credentials setup → connected state (Webhook Info & Form Generator)

import { useState, useEffect, useCallback } from 'react';
import {
  Share2 as Facebook, MessageSquare, Phone, Mail, CheckCircle2,
  XCircle, X, Link2, Copy, Eye, EyeOff, Plus, Trash2,
  GripVertical, AlertCircle, ChevronRight, ArrowLeft,
  Info, Loader2, RefreshCw, ExternalLink, Zap,
  ShoppingBag, Package
} from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import {
  integrationsApi,
  type MetaCredentials,
  type ShopifyCredentials,
  type DarazCredentials,
  type PlatformIntegration,
  type PlatformType
} from '@/lib/api';
import { getUser } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'shopify' | 'daraz' | 'meta' | 'whatsapp' | 'sms' | 'email';
type SubView = 'setup' | 'connected';
type FormBuilderTab = 'builder' | 'preview' | 'json';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

const STANDARD_FIELDS: FormField[] = [
  { id: 'FULL_NAME', type: 'FULL_NAME', label: 'Full Name', required: false },
  { id: 'EMAIL', type: 'EMAIL', label: 'Email', required: false },
  { id: 'PHONE', type: 'PHONE', label: 'Phone', required: false },
  { id: 'DATE_TIME', type: 'DATE_TIME', label: 'Date / Time', required: false },
  { id: 'CITY', type: 'CITY', label: 'City', required: false },
  { id: 'STATE', type: 'STATE', label: 'State', required: false },
  { id: 'COUNTRY', type: 'COUNTRY', label: 'Country', required: false },
  { id: 'ZIP', type: 'ZIP', label: 'ZIP / Post Code', required: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000';
const VERIFY_TOKEN = 'IiukcOmBxbJioQWsDzV73NH9KZHfVlOzRqjyouqt6Egz#';

function companyWebhookUrl(companyId: string | null | undefined): string {
  if (companyId) return `${BASE_URL}/api/v1/integrations/webhook/meta/${companyId}`;
  return `${BASE_URL}/api/v1/integrations/webhook/meta`;
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-700' : 'bg-amber-600';
  return (
    <div className={`fixed bottom-5 right-5 z-[300] flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl text-white text-sm font-medium animate-slide-up ${bg}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : type === 'error' ? <XCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

// ─── Channel Tab Card (left panel selector) ───────────────────────────────────

function ChannelTabCard({
  icon: Icon, label, description, color, bgColor, borderColor, active, onClick,
}: {
  icon: React.ElementType; label: string; description: string;
  color: string; bgColor: string; borderColor: string;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer"
      style={{
        borderColor: active ? color : '#e5e7eb',
        background: active ? bgColor : '#fff',
        boxShadow: active ? `0 0 0 3px ${color}18` : 'none',
      }}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bgColor }}>
          <Icon size={18} style={{ color }} strokeWidth={1.75} />
        </div>
        <div>
          <div className="font-semibold text-slate-800 text-sm">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
        {active && <ChevronRight size={16} className="ml-auto flex-shrink-0" style={{ color }} />}
      </div>
    </button>
  );
}

// ─── Meta: Credentials Setup Form ────────────────────────────────────────────

function MetaSetupForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<MetaCredentials>({
    metaAppId: '',
    metaAppSecret: '',
    metaPageAccessToken: '',
    metaPageId: '',
    metaAdAccountId: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.metaPageAccessToken || !form.metaPageId) {
      setError('Page Access Token and Page ID are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await integrationsApi.saveConfig('meta', form);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string, key: keyof MetaCredentials, placeholder: string,
    isSecret = false, showState?: boolean, toggleShow?: () => void
  ) => (
    <div>
      <label className="text-xs font-semibold text-slate-600 block mb-1.5">{label}</label>
      <div className="relative flex items-center">
        <input
          type={isSecret && !showState ? 'password' : 'text'}
          className="input pr-9"
          placeholder={placeholder}
          value={form[key] ?? ''}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
        {isSecret && toggleShow && (
          <button
            type="button"
            className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors"
            onClick={toggleShow}
          >
            {showState ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#e7f0fd' }}>
          <Facebook size={22} style={{ color: '#1877F2' }} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Connect Meta Ads</h2>
          <p className="text-slate-500 text-sm">Enter your Meta developer credentials to enable Lead Ads.</p>
        </div>
      </div>

      {/* Instructions banner */}
      <div className="rounded-xl p-4 mb-6 border flex items-start gap-3" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
        <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#2563eb' }} />
        <p className="text-sm" style={{ color: '#1e40af' }}>
          Go to <strong>developers.facebook.com</strong> → Your App → Settings to find these credentials.
          You will need a <em>Page Access Token</em> with <code>leads_retrieval</code> permission.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Meta App ID', 'metaAppId', '123456789012345')}
        {field('Meta App Secret', 'metaAppSecret', '••••••••••••', true, showSecret, () => setShowSecret(v => !v))}
        {field('Meta Page ID', 'metaPageId', '102345678901234')}
        {field('Meta Ad Account ID', 'metaAdAccountId', 'act_123456789')}
        <div className="md:col-span-2">
          {field('Page Access Token *', 'metaPageAccessToken', 'EAABsbCS...', true, showToken, () => setShowToken(v => !v))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700" style={{ background: '#fee2e2' }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {saving ? 'Saving…' : 'Save & Connect'}
        </button>
        <span className="text-xs text-slate-400">
          Credentials are stored securely. Only meta-related operations use them.
        </span>
      </div>
    </div>
  );
}

// ─── Meta: Webhook Info Box ───────────────────────────────────────────────────

function WebhookInfoBox({ companyId, verifyToken }: { companyId: string | null | undefined; verifyToken?: string }) {
  const webhookUrl = companyWebhookUrl(companyId);
  const secretToken = verifyToken || VERIFY_TOKEN;
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);

  const copy = (text: string, which: 'url' | 'token') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  return (
    <div className="card p-5 mb-5 border-2" style={{ borderColor: '#dbeafe', background: '#eff6ff' }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap size={15} style={{ color: '#2563eb' }} />
        <span className="font-semibold text-slate-800 text-sm">Meta Webhook Configuration</span>
        <span className="chip chip-blue ml-auto">Required step</span>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Add the following URL in your <strong>Meta Developer Portal</strong> → App → Webhooks → Subscribe to <em>leadgen</em> & <em>messages</em> events.
      </p>

      {/* Callback URL */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wide">Callback URL</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 truncate">
            {webhookUrl}
          </div>
          <button
            className="btn-outline flex-shrink-0 flex items-center gap-1.5"
            onClick={() => copy(webhookUrl, 'url')}
          >
            {copied === 'url' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied === 'url' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <label className="text-xs font-semibold text-slate-500 block mb-1.5 mt-2.5 uppercase tracking-wide">Webhook Secret Token (Unique to your company)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 truncate">
            {secretToken}
          </div>
          <button
            className="btn-outline flex-shrink-0 flex items-center gap-1.5"
            onClick={() => copy(secretToken, 'token')}
          >
            {copied === 'token' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied === 'token' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Meta: Form Generator ─────────────────────────────────────────────────────

function MetaFormGenerator({ onFormCreated }: { onFormCreated: () => void }) {
  const [activeTab, setActiveTab] = useState<FormBuilderTab>('builder');
  const [formName, setFormName] = useState('Lead Capture Form');
  const [addedFields, setAddedFields] = useState<FormField[]>([
    { id: 'FULL_NAME', type: 'FULL_NAME', label: 'Full Name', required: true },
    { id: 'EMAIL', type: 'EMAIL', label: 'Email', required: true },
    { id: 'PHONE', type: 'PHONE', label: 'Phone', required: true },
  ]);
  const [creating, setCreating] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [customFieldLabel, setCustomFieldLabel] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const addedFieldIds = new Set(addedFields.map(f => f.id));

  const addField = (field: FormField) => {
    if (addedFieldIds.has(field.id)) return;
    setAddedFields(prev => [...prev, { ...field }]);
  };

  const removeField = (id: string) => {
    setAddedFields(prev => prev.filter(f => f.id !== id));
  };

  const toggleRequired = (id: string) => {
    setAddedFields(prev => prev.map(f => f.id === id ? { ...f, required: !f.required } : f));
  };

  const formJson = {
    name: formName,
    questions: addedFields.map(f => f.type === 'CUSTOM' ? { type: 'CUSTOM', label: f.label, required: f.required } : { type: f.type, required: f.required }),
  };

  const jsonStr = JSON.stringify(formJson, null, 2);

  const handleCreate = async () => {
    if (!formName.trim() || addedFields.length === 0) return;
    setCreating(true);
    try {
      await integrationsApi.createMetaForm({
        name: formName,
        questions: addedFields.map(f => f.type === 'CUSTOM' ? { type: 'CUSTOM', label: f.label } : { type: f.type }),
      });
      onFormCreated();
    } catch {
      // surface error via parent toast
    } finally {
      setCreating(false);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 1800);
    });
  };

  const tabs: { key: FormBuilderTab; label: string }[] = [
    { key: 'builder', label: 'Builder' },
    { key: 'preview', label: 'Preview' },
    { key: 'json', label: 'JSON Output' },
  ];

  return (
    <div className="card mt-5">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Plus size={16} style={{ color: '#1877F2' }} /> Form Generator
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Create and publish Meta Ads lead forms</div>
        </div>
        <span className="chip chip-blue text-xs flex items-center gap-1">
          <Facebook size={12} /> Meta Ads
        </span>
      </div>

      <div className="flex" style={{ minHeight: 480 }}>
        {/* Left: Field Library */}
        <div className="w-48 flex-shrink-0 border-r border-slate-100 p-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Field Library</div>
          <div className="text-xs text-slate-400 mb-3">
            {addedFields.length} field{addedFields.length !== 1 ? 's' : ''} selected
          </div>
          <div className="text-xs font-semibold text-slate-500 mb-2">Standard Fields</div>
          <div className="space-y-1">
            {STANDARD_FIELDS.map(field => {
              const isAdded = addedFieldIds.has(field.id);
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                  style={{ background: isAdded ? '#eff6ff' : 'transparent' }}
                  onClick={() => !isAdded && addField(field)}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: isAdded ? '#1877F2' : '#94a3b8' }}
                    />
                    <span className="text-xs font-medium" style={{ color: isAdded ? '#1e40af' : '#475569' }}>
                      {field.label}
                    </span>
                  </div>
                  {isAdded ? (
                    <span className="text-[10px] text-blue-500 font-semibold">ADDED</span>
                  ) : (
                    <Plus size={12} className="text-slate-400" />
                  )}
                </div>
              );
            })}
          </div>

          <button
            className="w-full mt-6 py-2.5 flex items-center justify-center  text-sm font-medium rounded-xl border-2 border-dashed transition-colors"
            style={{ borderColor: '#1877F2', color: '#1877F2', backgroundColor: '#f5f3ff' }}
            onClick={() => setShowCustomModal(true)}
          >
            <Plus size={14} /> Create Custom Field
          </button>
        </div>

        {/* Right: Form Builder */}
        <div className="flex-1 flex flex-col">
          {/* Form name input */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
            <input
              className="input flex-1 font-medium"
              placeholder="Form name…"
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-slate-100 px-4">
            {tabs.map(t => (
              <button
                key={t.key}
                className="tab"
                style={activeTab === t.key ? {
                  color: '#1877F2',
                  borderBottomColor: '#1877F2',
                  borderBottom: '2px solid #1877F2',
                  fontWeight: 600,
                } : {}}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 p-5 overflow-y-auto">

            {/* ── Builder ── */}
            {activeTab === 'builder' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-slate-800">{addedFields.length}</span>
                    <span className="text-sm text-slate-500 ml-1">total fields</span>
                  </div>
                </div>

                {addedFields.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Plus size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Add fields from the library on the left.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addedFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                      >
                        <GripVertical size={15} className="text-slate-300 flex-shrink-0" />
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#1877F2' }} />
                        <span className="flex-1 text-sm font-medium text-slate-700">{field.label}</span>
                        <button
                          className="chip cursor-pointer transition-all"
                          style={{
                            background: field.required ? '#fee2e2' : '#f1f5f9',
                            color: field.required ? '#991b1b' : '#64748b',
                            border: `1px solid ${field.required ? '#fca5a5' : '#e2e8f0'}`,
                          }}
                          onClick={() => toggleRequired(field.id)}
                          title="Toggle required"
                        >
                          {field.required ? 'Required' : 'Optional'}
                        </button>
                        <button
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          onClick={() => removeField(field.id)}
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Preview ── */}
            {activeTab === 'preview' && (
              <div className="max-w-sm mx-auto">
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 pt-5 pb-3 border-b border-slate-100 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Meta Ads — Form Preview
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">{formName || 'Untitled Form'}</h3>
                    <p className="text-xs text-slate-500 mt-1">Please provide your details below.</p>
                  </div>
                  <div className="p-5 space-y-4">
                    {addedFields.map(f => (
                      <div key={f.id}>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">
                          {f.label}
                          {f.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type={f.type === 'EMAIL' ? 'email' : f.type === 'PHONE' ? 'tel' : 'text'}
                          className="input"
                          placeholder="Your answer"
                          readOnly
                        />
                      </div>
                    ))}
                    {addedFields.length === 0 && (
                      <p className="text-sm text-center text-slate-400 py-6">No fields added yet.</p>
                    )}
                    {addedFields.length > 0 && (
                      <button className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#1877F2' }}>
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── JSON Output ── */}
            {activeTab === 'json' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">Meta Form JSON</span>
                  <div className="flex gap-2">
                    <button
                      className="btn-outline flex items-center gap-1.5 text-xs"
                      onClick={copyJson}
                    >
                      {jsonCopied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      {jsonCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5"
                      style={{ background: '#1877F2' }}
                      onClick={handleCreate}
                      disabled={creating || !formName || addedFields.length === 0}
                    >
                      {creating ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                      {creating ? 'Creating…' : 'Create Form in Meta'}
                    </button>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900 text-green-400 font-mono text-xs p-4 overflow-x-auto leading-relaxed select-all whitespace-pre">
                  {jsonStr}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Field Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Add Custom Question</h3>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => { setShowCustomModal(false); setCustomFieldLabel(''); }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Question Label</label>
              <input
                type="text"
                className="w-full border-2 rounded-xl px-4 py-3 text-slate-800 focus:outline-none transition-all"
                style={{ borderColor: '#4f46e5', boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)' }}
                placeholder="e.g. When do you plan to move?"
                value={customFieldLabel}
                onChange={e => setCustomFieldLabel(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && customFieldLabel.trim()) {
                    e.preventDefault();
                    addField({ id: `CUSTOM_${Date.now()}`, type: 'CUSTOM', label: customFieldLabel.trim(), required: false });
                    setCustomFieldLabel('');
                    setShowCustomModal(false);
                  }
                }}
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                onClick={() => { setShowCustomModal(false); setCustomFieldLabel(''); }}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#4f46e5' }}
                disabled={!customFieldLabel.trim()}
                onClick={() => {
                  if (customFieldLabel.trim()) {
                    addField({ id: `CUSTOM_${Date.now()}`, type: 'CUSTOM', label: customFieldLabel.trim(), required: false });
                    setCustomFieldLabel('');
                    setShowCustomModal(false);
                  }
                }}
              >
                Add to Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Meta: Connected View ─────────────────────────────────────────────────────

function MetaConnectedView({
  integration, companyId, onDisconnect, onRefresh, onFormCreated
}: {
  integration: PlatformIntegration;
  companyId: string | null | undefined;
  onDisconnect: () => void;
  onRefresh: () => void;
  onFormCreated: () => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Meta integration?')) return;
    setDisconnecting(true);
    try {
      await integrationsApi.deleteConfig('meta');
      onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div>
      {/* Status row */}
      <div className="card p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e7f0fd' }}>
          <Facebook size={20} style={{ color: '#1877F2' }} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">Meta Ads Integration</span>
            <span className="chip chip-green flex items-center gap-1">
              <CheckCircle2 size={11} /> Connected
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span>Page ID: <span className="font-mono font-medium">{integration.credentials?.metaPageId || '—'}</span></span>
            <span>Leads captured: <span className="font-semibold text-slate-700">{integration.leadsReceivedCount}</span></span>
            {integration.connectedAt && (
              <span>Connected: {new Date(integration.connectedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline flex items-center gap-1.5 text-xs" onClick={onRefresh}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            className="btn-outline flex items-center gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
            Disconnect
          </button>
        </div>
      </div>

      <WebhookInfoBox companyId={companyId} verifyToken={integration.webhookVerifyToken} />

      <MetaFormGenerator onFormCreated={onFormCreated} />
    </div>
  );
}


// ─── Shopify: Credentials Setup Form ──────────────────────────────────────────

function ShopifySetupForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<ShopifyCredentials>({
    shopifyShopUrl: '',
    shopifyAccessToken: '',
    shopifyApiKey: '',
    shopifyApiSecretKey: '',
    shopifyApiVersion: '2024-04',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.shopifyShopUrl || !form.shopifyAccessToken) {
      setError('Shop Domain (e.g. your-store.myshopify.com) and Admin API Access Token are required.');
      return;
    }
    let cleanDomain = form.shopifyShopUrl.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (!cleanDomain.includes('.')) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    }

    setSaving(true);
    setError('');
    try {
      await integrationsApi.saveConfig('shopify', {
        ...form,
        shopifyShopUrl: cleanDomain,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save Shopify credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#ecfdf5' }}>
          <ShoppingBag size={22} style={{ color: '#008060' }} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Connect Shopify Store</h2>
          <p className="text-slate-500 text-sm">Sync your Shopify orders, products, and customer data directly with Voxa CRM.</p>
        </div>
      </div>

      {/* Instructions banner */}
      <div className="rounded-xl p-4 mb-6 border flex items-start gap-3" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
        <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
        <div className="text-sm" style={{ color: '#14532d' }}>
          <p className="font-semibold mb-1">How to get your Shopify Admin API Token:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-emerald-900/90">
            <li>In your Shopify Admin, go to <strong>Settings &gt; Apps and sales channels &gt; Develop apps</strong>.</li>
            <li>Click <strong>Create an app</strong> and name it (e.g., "Voxa CRM").</li>
            <li>Configure Admin API scopes (enable <code>read_orders</code>, <code>write_orders</code>, <code>read_customers</code>, <code>read_products</code>).</li>
            <li>Click <strong>Install App</strong> and copy your <strong>Admin API Access Token</strong> (starts with <code>shpat_</code>).</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Shop Domain (myshopify.com) *</label>
          <input
            type="text"
            className="input"
            placeholder="my-store.myshopify.com"
            value={form.shopifyShopUrl ?? ''}
            onChange={e => setForm(f => ({ ...f, shopifyShopUrl: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">API Version</label>
          <select
            className="select"
            value={form.shopifyApiVersion ?? '2024-04'}
            onChange={e => setForm(f => ({ ...f, shopifyApiVersion: e.target.value }))}
          >
            <option value="2024-04">2024-04 (Latest Supported)</option>
            <option value="2024-01">2024-01</option>
            <option value="2023-10">2023-10</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Admin API Access Token *</label>
          <div className="relative flex items-center">
            <input
              type={showToken ? 'text' : 'password'}
              className="input pr-9 font-mono text-xs"
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={form.shopifyAccessToken ?? ''}
              onChange={e => setForm(f => ({ ...f, shopifyAccessToken: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors"
              onClick={() => setShowToken(v => !v)}
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">API Key (Client ID) <span className="text-slate-400 font-normal">(Optional)</span></label>
          <input
            type="text"
            className="input font-mono text-xs"
            placeholder="e.g. 7c9a6b..."
            value={form.shopifyApiKey ?? ''}
            onChange={e => setForm(f => ({ ...f, shopifyApiKey: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">API Secret Key <span className="text-slate-400 font-normal">(Optional / Webhooks)</span></label>
          <div className="relative flex items-center">
            <input
              type={showSecret ? 'text' : 'password'}
              className="input pr-9 font-mono text-xs"
              placeholder="••••••••••••"
              value={form.shopifyApiSecretKey ?? ''}
              onChange={e => setForm(f => ({ ...f, shopifyApiSecretKey: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors"
              onClick={() => setShowSecret(v => !v)}
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700" style={{ background: '#fee2e2' }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving} style={{ background: '#008060' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {saving ? 'Connecting…' : 'Save & Connect Shopify'}
        </button>
        <span className="text-xs text-slate-400">
          All credentials are encrypted and stored securely.
        </span>
      </div>
    </div>
  );
}

// ─── Shopify: Connected View ──────────────────────────────────────────────────

function ShopifyConnectedView({
  integration, companyId, onDisconnect, onRefresh
}: {
  integration: PlatformIntegration;
  companyId: string | null | undefined;
  onDisconnect: () => void;
  onRefresh: () => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const webhookUrl = `${BASE_URL}/api/v1/integrations/webhook/shopify/${companyId || ''}`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Shopify integration?')) return;
    setDisconnecting(true);
    try {
      await integrationsApi.deleteConfig('shopify');
      onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Status row */}
      <div className="card p-5 flex items-center gap-4 border-2" style={{ borderColor: '#bbf7d0' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#ecfdf5' }}>
          <ShoppingBag size={22} style={{ color: '#008060' }} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">Shopify Store Integration</span>
            <span className="chip chip-green flex items-center gap-1">
              <CheckCircle2 size={11} /> Connected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
            <span>Store: <span className="font-mono font-semibold text-slate-700">{integration.credentials?.shopifyShopUrl || '—'}</span></span>
            <span>API Version: <span className="font-mono text-slate-700">{integration.credentials?.shopifyApiVersion || '2024-04'}</span></span>
            {integration.connectedAt && (
              <span>Connected: {new Date(integration.connectedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline flex items-center gap-1.5 text-xs" onClick={onRefresh}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            className="btn-outline flex items-center gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
            Disconnect
          </button>
        </div>
      </div>

      {/* Webhook Configuration Card */}
      <div className="card p-5 border-2" style={{ borderColor: '#d1fae5', background: '#f0fdf4' }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} style={{ color: '#059669' }} />
          <span className="font-semibold text-slate-800 text-sm">Shopify Real-Time Webhook URL</span>
          <span className="chip chip-green ml-auto">Optional Real-time Sync</span>
        </div>
        <p className="text-xs text-slate-600 mb-3">
          To receive instant order and customer updates in Voxa CRM, configure this webhook endpoint in your Shopify Admin under <strong>Settings &gt; Notifications &gt; Webhooks</strong> (format: JSON, events: <code>orders/create</code>, <code>orders/updated</code>).
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2.5 text-slate-700 truncate">
            {webhookUrl}
          </div>
          <button
            className="btn-outline flex-shrink-0 flex items-center gap-1.5 text-xs bg-white"
            onClick={() => copy(webhookUrl, 'shopify-wh')}
          >
            {copied === 'shopify-wh' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied === 'shopify-wh' ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Daraz: Credentials Setup Form ────────────────────────────────────────────

function DarazSetupForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<DarazCredentials>({
    darazShopName: '',
    darazSellerId: '',
    darazAppKey: '',
    darazAppSecret: '',
    darazAccessToken: '',
    darazRegion: 'PK',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const REGIONS = [
    { code: 'PK', name: 'Pakistan (Daraz.pk)' },
    { code: 'BD', name: 'Bangladesh (Daraz.com.bd)' },
    { code: 'LK', name: 'Sri Lanka (Daraz.lk)' },
    { code: 'NP', name: 'Nepal (Daraz.com.np)' },
    { code: 'MM', name: 'Myanmar (Shop.com.mm)' },
  ];

  const handleSave = async () => {
    if (!form.darazShopName || !form.darazSellerId || !form.darazAppKey || !form.darazAppSecret || !form.darazAccessToken) {
      setError('Shop Name, Seller ID, App Key, App Secret, and Access Token are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await integrationsApi.saveConfig('daraz', form);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save Daraz credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
          <Package size={22} style={{ color: '#f85606' }} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Connect Daraz Seller Center</h2>
          <p className="text-slate-500 text-sm">Connect your Daraz Open Platform account to synchronize marketplace orders and products.</p>
        </div>
      </div>

      {/* Instructions banner */}
      <div className="rounded-xl p-4 mb-6 border flex items-start gap-3" style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
        <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#ea580c' }} />
        <div className="text-sm" style={{ color: '#7c2d12' }}>
          <p className="font-semibold mb-1">Daraz Open Platform setup:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-amber-950/90">
            <li>Register as a developer on <strong>open.daraz.com</strong>.</li>
            <li>Create an app under your developer account to obtain your <strong>App Key</strong> and <strong>App Secret</strong>.</li>
            <li>Authorize your Seller Center account to generate an <strong>Access Token</strong>.</li>
            <li>Find your <strong>Seller ID / Short Code</strong> in your Daraz Seller Center Profile settings.</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Marketplace Region *</label>
          <select
            className="select"
            value={form.darazRegion ?? 'PK'}
            onChange={e => setForm(f => ({ ...f, darazRegion: e.target.value }))}
          >
            {REGIONS.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Shop / Brand Name *</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. My Flagship Store"
            value={form.darazShopName ?? ''}
            onChange={e => setForm(f => ({ ...f, darazShopName: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Seller ID / Short Code *</label>
          <input
            type="text"
            className="input font-mono text-xs"
            placeholder="e.g. PK12345ABC"
            value={form.darazSellerId ?? ''}
            onChange={e => setForm(f => ({ ...f, darazSellerId: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">App Key (Client Key) *</label>
          <input
            type="text"
            className="input font-mono text-xs"
            placeholder="e.g. 102938"
            value={form.darazAppKey ?? ''}
            onChange={e => setForm(f => ({ ...f, darazAppKey: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">App Secret *</label>
          <div className="relative flex items-center">
            <input
              type={showSecret ? 'text' : 'password'}
              className="input pr-9 font-mono text-xs"
              placeholder="••••••••••••"
              value={form.darazAppSecret ?? ''}
              onChange={e => setForm(f => ({ ...f, darazAppSecret: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors"
              onClick={() => setShowSecret(v => !v)}
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">Seller Access Token *</label>
          <div className="relative flex items-center">
            <input
              type={showToken ? 'text' : 'password'}
              className="input pr-9 font-mono text-xs"
              placeholder="500000000000xxxxxx"
              value={form.darazAccessToken ?? ''}
              onChange={e => setForm(f => ({ ...f, darazAccessToken: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-2 text-slate-400 hover:text-slate-700 transition-colors"
              onClick={() => setShowToken(v => !v)}
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700" style={{ background: '#fee2e2' }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving} style={{ background: '#f85606' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {saving ? 'Connecting…' : 'Save & Connect Daraz'}
        </button>
        <span className="text-xs text-slate-400">
          Daraz Open Platform API credentials.
        </span>
      </div>
    </div>
  );
}

// ─── Daraz: Connected View ────────────────────────────────────────────────────

function DarazConnectedView({
  integration, onDisconnect, onRefresh
}: {
  integration: PlatformIntegration;
  onDisconnect: () => void;
  onRefresh: () => void;
}) {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Daraz integration?')) return;
    setDisconnecting(true);
    try {
      await integrationsApi.deleteConfig('daraz');
      onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  };

  const regionNames: Record<string, string> = {
    PK: 'Pakistan (Daraz.pk)',
    BD: 'Bangladesh (Daraz.com.bd)',
    LK: 'Sri Lanka (Daraz.lk)',
    NP: 'Nepal (Daraz.com.np)',
    MM: 'Myanmar (Shop.com.mm)',
  };

  return (
    <div className="space-y-5">
      {/* Status row */}
      <div className="card p-5 flex items-center gap-4 border-2" style={{ borderColor: '#fed7aa' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
          <Package size={22} style={{ color: '#f85606' }} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">Daraz Marketplace Integration</span>
            <span className="chip chip-green flex items-center gap-1">
              <CheckCircle2 size={11} /> Connected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-500">
            <span>Shop: <span className="font-semibold text-slate-700">{integration.credentials?.darazShopName || '—'}</span></span>
            <span>Seller ID: <span className="font-mono text-slate-700">{integration.credentials?.darazSellerId || '—'}</span></span>
            <span>Region: <span className="chip chip-blue py-0.5 px-2 text-[11px]">{regionNames[integration.credentials?.darazRegion || 'PK'] || integration.credentials?.darazRegion || 'PK'}</span></span>
            {integration.connectedAt && (
              <span>Connected: {new Date(integration.connectedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline flex items-center gap-1.5 text-xs" onClick={onRefresh}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            className="btn-outline flex items-center gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coming Soon Placeholder ───────────────────────────────────────────────────

function ComingSoon({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${color}18` }}>
        <Icon size={30} style={{ color }} strokeWidth={1.5} />
      </div>
      <h3 className="font-bold text-slate-800 text-lg mb-2">{label} Integration</h3>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">
        {label} channel configuration is coming soon. Stay tuned for updates!
      </p>
      <div className="mt-5">
        <span className="chip chip-yellow">Coming Soon</span>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompanyOmnichannelPage() {
  const user = getUser();
  const companyId = user?.companyId;
  const isEcommerce = user?.businessType === 'ecommerce';

  const [activeTab, setActiveTab] = useState<MainTab>(isEcommerce ? 'shopify' : 'meta');
  const [subView, setSubView] = useState<SubView>('setup');
  const [integration, setIntegration] = useState<PlatformIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const loadIntegration = useCallback(async (platform: MainTab) => {
    if (['whatsapp', 'sms', 'email'].includes(platform)) {
      setIntegration(null);
      return;
    }
    setLoading(true);
    try {
      const res = await integrationsApi.getConfig(platform as PlatformType);
      if (res.data) {
        setIntegration(res.data);
        setSubView('connected');
      } else {
        setIntegration(null);
        setSubView('setup');
      }
    } catch {
      setIntegration(null);
      setSubView('setup');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegration(activeTab);
  }, [activeTab, loadIntegration]);

  const tabs: { key: MainTab; icon: React.ElementType; label: string; desc: string; color: string; bg: string; border: string }[] = isEcommerce
    ? [
        { key: 'shopify', icon: ShoppingBag, label: 'Shopify', desc: 'Store & Orders Sync', color: '#008060', bg: '#ecfdf5', border: '#a7f3d0' },
        { key: 'daraz', icon: Package, label: 'Daraz', desc: 'Seller Center Sync', color: '#f85606', bg: '#fff7ed', border: '#fed7aa' },
        { key: 'meta', icon: Facebook, label: 'Meta', desc: 'Lead Ads & Catalog', color: '#1877F2', bg: '#e7f0fd', border: '#bfdbfe' },
        { key: 'whatsapp', icon: MessageSquare, label: 'WhatsApp', desc: 'Business Messaging', color: '#25D366', bg: '#f0fdf4', border: '#bbf7d0' },
        { key: 'sms', icon: Phone, label: 'SMS', desc: 'Text & Tracking OTPs', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
        { key: 'email', icon: Mail, label: 'Email', desc: 'Order Notifications', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
      ]
    : [
        { key: 'meta', icon: Facebook, label: 'Meta', desc: 'Lead Ads & Forms', color: '#1877F2', bg: '#e7f0fd', border: '#bfdbfe' },
        { key: 'whatsapp', icon: MessageSquare, label: 'WhatsApp', desc: 'Business Messaging', color: '#25D366', bg: '#f0fdf4', border: '#bbf7d0' },
        { key: 'sms', icon: Phone, label: 'SMS', desc: 'Text Messaging', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
        { key: 'email', icon: Mail, label: 'Email', desc: 'Email Marketing', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
      ];

  const currentTab = tabs.find(t => t.key === activeTab) || tabs[0];

  return (
    <div>
      <CompanyHeader
        title="Omnichannel"
        subtitle={isEcommerce ? "Connect your eCommerce store, marketplace, and communication channels" : "Connect and manage your communication channels"}
        onMenuClick={() => { }}
      />

      <div className="px-6 py-6 max-w-6xl">
        <div className="flex gap-6">
          {/* ── Left: Channel selector ── */}
          <div className="w-60 flex-shrink-0 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 flex items-center justify-between">
              <span>Channels</span>
              {isEcommerce && <span className="chip chip-blue py-0 text-[10px]">eCommerce</span>}
            </div>
            {tabs.map(t => (
              <ChannelTabCard
                key={t.key}
                icon={t.icon}
                label={t.label}
                description={t.desc}
                color={t.color}
                bgColor={t.bg}
                borderColor={t.border}
                active={activeTab === t.key}
                onClick={() => setActiveTab(t.key)}
              />
            ))}
          </div>

          {/* ── Right: Tab content ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: currentTab.bg }}>
                <currentTab.icon size={20} style={{ color: currentTab.color }} strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{currentTab.label} Integration</h2>
                <p className="text-xs text-slate-500">{currentTab.desc}</p>
              </div>
            </div>

            {/* Shopify tab */}
            {activeTab === 'shopify' && (
              loading ? (
                <div className="card flex items-center justify-center py-20 text-slate-400">
                  <Loader2 size={24} className="animate-spin mr-2" /> Loading…
                </div>
              ) : subView === 'setup' ? (
                <ShopifySetupForm
                  onSaved={() => {
                    loadIntegration('shopify');
                    setToast({ msg: 'Shopify store connected successfully!', type: 'success' });
                  }}
                />
              ) : integration ? (
                <ShopifyConnectedView
                  integration={integration}
                  companyId={companyId}
                  onDisconnect={() => {
                    setIntegration(null);
                    setSubView('setup');
                    setToast({ msg: 'Shopify integration disconnected.', type: 'warning' });
                  }}
                  onRefresh={() => loadIntegration('shopify')}
                />
              ) : null
            )}

            {/* Daraz tab */}
            {activeTab === 'daraz' && (
              loading ? (
                <div className="card flex items-center justify-center py-20 text-slate-400">
                  <Loader2 size={24} className="animate-spin mr-2" /> Loading…
                </div>
              ) : subView === 'setup' ? (
                <DarazSetupForm
                  onSaved={() => {
                    loadIntegration('daraz');
                    setToast({ msg: 'Daraz Seller Center connected successfully!', type: 'success' });
                  }}
                />
              ) : integration ? (
                <DarazConnectedView
                  integration={integration}
                  onDisconnect={() => {
                    setIntegration(null);
                    setSubView('setup');
                    setToast({ msg: 'Daraz integration disconnected.', type: 'warning' });
                  }}
                  onRefresh={() => loadIntegration('daraz')}
                />
              ) : null
            )}

            {/* Meta tab */}
            {activeTab === 'meta' && (
              loading ? (
                <div className="card flex items-center justify-center py-20 text-slate-400">
                  <Loader2 size={24} className="animate-spin mr-2" /> Loading…
                </div>
              ) : subView === 'setup' ? (
                <MetaSetupForm
                  onSaved={() => {
                    loadIntegration('meta');
                    setToast({ msg: 'Meta integration connected successfully!', type: 'success' });
                  }}
                />
              ) : integration ? (
                <MetaConnectedView
                  integration={integration}
                  companyId={companyId}
                  onDisconnect={() => {
                    setIntegration(null);
                    setSubView('setup');
                    setToast({ msg: 'Meta integration disconnected.', type: 'warning' });
                  }}
                  onRefresh={() => loadIntegration('meta')}
                  onFormCreated={() => {
                    setToast({ msg: 'Form created successfully on Meta! View it in Lead Management.', type: 'success' });
                  }}
                />
              ) : null
            )}

            {/* WhatsApp tab */}
            {activeTab === 'whatsapp' && (
              <ComingSoon icon={MessageSquare} label="WhatsApp" color="#25D366" />
            )}

            {/* SMS tab */}
            {activeTab === 'sms' && (
              <ComingSoon icon={Phone} label="SMS" color="#8b5cf6" />
            )}

            {/* Email tab */}
            {activeTab === 'email' && (
              <ComingSoon icon={Mail} label="Email" color="#f59e0b" />
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease forwards; }
      `}</style>
    </div>
  );
}
