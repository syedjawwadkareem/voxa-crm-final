'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, RefreshCw, Loader2, Phone, Mail, Search, Filter, Calendar, ClipboardList, X,
  PhoneOutgoing, PhoneIncoming, Clock, AlertCircle, MessageSquare, Send, CheckCircle2,
  ExternalLink, Plus, Upload, FileText, Megaphone
} from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { CampaignsSection } from '@/components/company/CampaignsSection';
import {
  leadsApi, integrationsApi, messengerApi, type CapturedLead, type LeadsStats, type MetaForm,
  type MessengerConversation, type MessengerMessage
} from '@/lib/api';
import { toast } from '@/components/ui/NotificationProvider';

// ─── CallLog Modal ────────────────────────────────────────────────────────────
function LeadCallLogModal({ lead, onClose }: { lead: CapturedLead, onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchLogs() {
      try {
        setLoading(true);
        const authRes = await fetch('http://172.16.17.127/api/api.php?action=GenerateAuthKey&user=apiUAsk&pass=7xK9pQ2mW5vB');
        if (!authRes.ok) throw new Error('Failed to fetch auth key');
        const authData = await authRes.json();
        if (authData.status !== 'success') throw new Error(authData.message || 'Authentication failed');

        const token = authData.data.token;
        const logsRes = await fetch('http://172.16.17.127/api/api.php?action=GetRecentCalls', {
          headers: { 'X-Auth-Token': token }
        });
        if (!logsRes.ok) throw new Error('Failed to fetch call logs');
        const logsData = await logsRes.json();
        if (logsData.status !== 'success') throw new Error('Failed to parse call logs');

        if (isMounted) {
          const allCalls = logsData.data.recent_calls || [];
          const normalize = (num: string) => (num || '').replace(/\D/g, '').slice(-10);
          const leadCore = normalize(lead.phone || '');

          const filtered = allCalls.filter((c: any) => {
            if (!leadCore) return false;
            const destCore = normalize(c.destination || '');
            return destCore === leadCore;
          });
          setLogs(filtered);
          setError('');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch logs');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchLogs();
    return () => { isMounted = false; };
  }, [lead.phone]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Call History</h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><Phone size={12}/> {lead.phone || 'No phone'}</p>
          </div>
          <button className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin mr-2" /> Loading calls...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-red-500">
              <AlertCircle size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Clock size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No recent calls found for this number.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any, idx) => {
                const isIncoming = log.context !== 'from-internal';
                return (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="mt-1">
                      {isIncoming ? <PhoneIncoming size={16} className="text-green-500" /> : <PhoneOutgoing size={16} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 text-sm">
                          {isIncoming ? 'Incoming Call' : 'Outgoing Call'}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(log.start_time).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-4">
                          <span><strong>From:</strong> {log.callerid}</span>
                          <span><strong>To:</strong> {log.destination}</span>
                        </div>
                        {log.answer_time && (
                          <div className="text-[11px] text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 mt-1 inline-block self-start">
                            Answered at {new Date(log.answer_time).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease forwards; }
      `}</style>
    </div>
  );
}

// ─── Add Single Lead Modal ───────────────────────────────────────────────────
function AddSingleLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formName, setFormName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() && !phone.trim()) {
      setError('Please provide at least a Name or Phone Number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await leadsApi.addSingleLead({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        formName: formName.trim() || 'Manual Lead'
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Add Single Lead</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manually add a contact to your leads list</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Form / Group Name *</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g. Website Contact Form, Direct Walk-in"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Groups this lead under a form name for filtering</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              className="input w-full"
              placeholder="John Doe"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                className="input w-full"
                placeholder="+92 300 1234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                className="input w-full"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" className="btn-outline text-xs px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5" style={{ background: '#4f46e5' }} disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Users size={13} />}
              {saving ? 'Saving...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Upload CSV Leads Modal ──────────────────────────────────────────────────
function UploadCsvLeadsModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formName, setFormName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<Array<{ fullName: string; email: string; phone: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          setError('CSV file appears to be empty or missing data rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('full') || h.includes('customer'));
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
        const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('contact') || h.includes('number'));

        const rows: Array<{ fullName: string; email: string; phone: string }> = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const fullName = nameIdx >= 0 ? cols[nameIdx] || '' : cols[0] || '';
          const email = emailIdx >= 0 ? cols[emailIdx] || '' : '';
          const phone = phoneIdx >= 0 ? cols[phoneIdx] || '' : cols[1] || '';

          if (fullName || phone || email) {
            rows.push({ fullName, email, phone });
          }
        }

        setParsedLeads(rows);
        if (rows.length === 0) {
          setError('Could not extract lead records from CSV.');
        }
      } catch (err: any) {
        setError('Error reading CSV file.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (parsedLeads.length === 0) {
      setError('No leads parsed from CSV file.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await leadsApi.importCsvLeads({
        formName: formName.trim() || file?.name.replace(/\.csv$/i, '') || 'CSV Import',
        leads: parsedLeads
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV leads.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Import Leads from CSV</h3>
            <p className="text-xs text-slate-500 mt-0.5">Batch upload lead contacts from a spreadsheet file</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Form / Group Name *</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g. Real Estate Expo Sept 2026"
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Name this batch of leads so you can view and filter them later</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select CSV File *</label>
            <input
              type="file"
              accept=".csv"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 text-xs text-slate-500 cursor-pointer"
              onChange={handleFileChange}
            />
          </div>

          {parsedLeads.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Parsed Preview</span>
                <span className="chip chip-blue text-[10px]">{parsedLeads.length} leads found</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {parsedLeads.slice(0, 3).map((lead, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600 truncate flex items-center gap-3">
                    <span className="font-semibold text-slate-800 w-1/3 truncate">{lead.fullName || 'No name'}</span>
                    <span className="text-slate-500 w-1/3 truncate">{lead.phone || 'No phone'}</span>
                    <span className="text-slate-400 w-1/3 truncate">{lead.email || 'No email'}</span>
                  </div>
                ))}
                {parsedLeads.length > 3 && (
                  <div className="text-[10px] text-slate-400 italic pt-1">
                    + {parsedLeads.length - 3} more contacts...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" className="btn-outline text-xs px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
              style={{ background: '#4f46e5' }}
              onClick={handleImport}
              disabled={uploading || parsedLeads.length === 0}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />}
              {uploading ? 'Importing...' : `Import ${parsedLeads.length} Leads`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Facebook Messenger Section Component ─────────────────────────────────────
function MessengerSection() {
  const router = useRouter();
  const [conversations, setConversations] = useState<MessengerConversation[]>([]);
  const [selectedPsid, setSelectedPsid] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const checkConfig = useCallback(async () => {
    try {
      const res = await integrationsApi.getConfig('meta');
      if (res.data?.credentials?.metaPageAccessToken && res.data?.credentials?.metaPageId) {
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
      }
    } catch {
      setIsConfigured(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError('');
    try {
      const res = await messengerApi.getConversations();
      const convs = res.conversations ?? [];
      setConversations(convs);
      if (convs.length > 0 && !selectedPsid) {
        setSelectedPsid(convs[0].psid);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Messenger conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }, [selectedPsid]);

  const fetchThread = useCallback(async (psid: string) => {
    setLoadingMessages(true);
    try {
      const res = await messengerApi.getThread(psid);
      setMessages(res.messages ?? []);
    } catch (err: any) {
      console.error('Failed to load thread messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    checkConfig();
  }, [checkConfig]);

  useEffect(() => {
    if (isConfigured) {
      fetchConversations();
    }
  }, [isConfigured, fetchConversations]);

  useEffect(() => {
    if (selectedPsid) {
      fetchThread(selectedPsid);
    }
  }, [selectedPsid, fetchThread]);

  const handleSend = async () => {
    if (!selectedPsid || !replyText.trim() || sending) return;
    const textToSend = replyText.trim();
    setReplyText('');
    setSending(true);

    const tempMsg: MessengerMessage = {
      direction: 'outbound',
      content: textToSend,
      sent_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await messengerApi.sendMessage(selectedPsid, textToSend);
      fetchThread(selectedPsid);
      toast.success('Message sent');
    } catch (err: any) {
      toast.error(`Failed to send message: ${err.message || 'Meta API error'}`);
      fetchThread(selectedPsid);
    } finally {
      setSending(false);
    }
  };

  const selectedConv = conversations.find(c => c.psid === selectedPsid);

  const filteredConversations = conversations.filter(c =>
    (c.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.snippet || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.psid || '').includes(searchQuery)
  );

  if (isConfigured === false) {
    return (
      <div className="card p-8 border border-slate-200 text-center max-w-2xl mx-auto my-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={28} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Meta Credentials Required</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          To use Facebook Messenger, please configure your Meta Page Access Token and Page ID in the Omnichannel Meta section.
        </p>
        <button
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 font-medium rounded-xl"
          style={{ background: '#1877F2' }}
          onClick={() => router.push('/company/omnichannel')}
        >
          <ExternalLink size={16} /> Configure Meta Credentials
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row" style={{ height: '640px' }}>
      {/* ── Left Sidebar: Conversations List ── */}
      <div className="w-full md:w-80 flex-shrink-0 border-r border-slate-200 flex flex-col bg-slate-50/50">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">Conversations</span>
            <span className="chip chip-blue text-[10px]">{conversations.length}</span>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            onClick={fetchConversations}
            title="Refresh conversations"
          >
            <RefreshCw size={14} className={loadingConversations ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs">
              <Loader2 size={18} className="animate-spin mr-2 text-indigo-500" /> Loading chats...
            </div>
          ) : error ? (
            <div className="p-4 text-xs text-red-500 text-center flex flex-col items-center">
              <AlertCircle size={20} className="mb-1 opacity-60" />
              {error}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = conv.psid === selectedPsid;
              const initials = (conv.display_name || 'U').substring(0, 2).toUpperCase();

              return (
                <div
                  key={conv.thread_id}
                  onClick={() => setSelectedPsid(conv.psid)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-slate-800 text-xs truncate">{conv.display_name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {conv.updated_time ? new Date(conv.updated_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{conv.snippet || 'No message preview'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Active Chat Thread ── */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {(selectedConv.display_name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{selectedConv.display_name}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono">PSID: {selectedConv.psid}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 size={10} /> Facebook Messenger
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="btn-outline text-xs px-3 py-1 flex items-center gap-1"
                onClick={() => selectedPsid && fetchThread(selectedPsid)}
              >
                <RefreshCw size={12} className={loadingMessages ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/20">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
                  <Loader2 size={20} className="animate-spin mr-2 text-indigo-500" /> Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                  <MessageSquare size={28} className="mb-2 opacity-30" />
                  No messages in this thread yet.
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isOutbound
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                            : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Bar */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
              <input
                type="text"
                placeholder="Type your reply to customer..."
                className="input flex-1 text-xs py-2.5"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="btn-primary px-4 py-2.5 text-xs flex items-center gap-1.5 shrink-0 rounded-xl"
                style={{ background: '#4f46e5' }}
                onClick={handleSend}
                disabled={sending || !replyText.trim()}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
            <MessageSquare size={36} className="mb-2 opacity-20" />
            Select a conversation from the left to view messages.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function LeadManagementPage() {
  const [mainTab, setMainTab] = useState<'leads' | 'messenger' | 'campaigns'>('leads');
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedLeadForLogs, setSelectedLeadForLogs] = useState<CapturedLead | null>(null);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);
  const [showUploadCsvModal, setShowUploadCsvModal] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');

  const fetchLeadsAndForms = useCallback(async () => {
    setLoadingLeads(true);
    try {
      // Fetch all stored database leads (includes Meta webhooks, CSV imports, manual entries)
      const res = await leadsApi.getAll();
      const allLeads = res.leads ?? [];

      // Also get stats from API
      const statsRes = await leadsApi.getStats().catch(() => null);

      setLeads(allLeads);

      const today = new Date();
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      } else {
        setStats({
          total: allLeads.length,
          new: allLeads.filter(l => {
            const leadDate = new Date(l.created_at);
            return leadDate.getDate() === today.getDate() &&
                   leadDate.getMonth() === today.getMonth() &&
                   leadDate.getFullYear() === today.getFullYear();
          }).length,
          status: 'Live',
          converted: 0
        });
      }
    } catch {
      // silent
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsAndForms();
  }, [fetchLeadsAndForms]);

  // Extract unique form / group names for the filter dropdown
  const uniqueFormNames = useMemo(() => {
    const names = new Set<string>();
    leads.forEach(l => {
      if (l.form_name) names.add(l.form_name);
    });
    return Array.from(names);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.full_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.form_name || '').toLowerCase().includes(q)
      );
    }

    if (formFilter) {
      result = result.filter(l => l.form_name === formFilter || l.form_id === formFilter);
    }

    if (dateFilter) {
      const now = new Date();
      result = result.filter(l => {
        const leadDate = new Date(l.created_at);
        const diffDays = (now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === 'today') return diffDays <= 1;
        if (dateFilter === '7days') return diffDays <= 7;
        if (dateFilter === '30days') return diffDays <= 30;
        return true;
      });
    }

    return result;
  }, [leads, searchQuery, formFilter, dateFilter]);

  return (
    <div>
      <CompanyHeader
        title="Lead Management"
        subtitle="View and manage captured leads, manual CSV imports, Facebook Messenger, and Meta Ad Campaigns"
        onMenuClick={() => {}}
      />

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Lead Management</h1>
            <p className="text-sm text-slate-500 mt-1">View leads captured from Meta, CSV files, or manual entries</p>
          </div>

          {/* Add Leads Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              className="btn-primary text-xs flex items-center gap-1.5 px-3.5 py-2.5 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              onClick={() => setShowAddSingleModal(true)}
            >
              <Plus size={15} /> Add Single Lead
            </button>
            <button
              className="btn-outline text-xs flex items-center gap-1.5 px-3.5 py-2.5 font-semibold rounded-xl bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
              onClick={() => setShowUploadCsvModal(true)}
            >
              <Upload size={15} className="text-teal-600" /> Upload CSV
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center mb-6 border-b border-slate-200 gap-6">
          <button
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              mainTab === 'leads' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setMainTab('leads')}
          >
            <Users size={16} /> Captured Leads
          </button>
          <button
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              mainTab === 'messenger' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setMainTab('messenger')}
          >
            <MessageSquare size={16} /> Facebook Messenger
          </button>
          <button
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              mainTab === 'campaigns' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setMainTab('campaigns')}
          >
            <Megaphone size={16} /> Meta Campaigns
          </button>
        </div>

        {mainTab === 'campaigns' ? (
          <CampaignsSection />
        ) : mainTab === 'messenger' ? (
          <MessengerSection />
        ) : (
          <>
            {/* Stats Block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="card p-6 border border-slate-200">
                <div className="text-sm font-semibold text-slate-500 mb-1">Total Leads</div>
                <div className="text-3xl font-bold text-slate-800">{stats?.total ?? 0}</div>
              </div>
              <div className="card p-6 border border-slate-200">
                <div className="text-sm font-semibold text-slate-500 mb-1">New Leads</div>
                <div className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>{stats?.new ?? 0}</div>
              </div>
              <div className="card p-6 border border-slate-200">
                <div className="text-sm font-semibold text-slate-500 mb-1">Status</div>
                <div className="text-lg font-bold text-slate-800 mt-2">{stats?.status ?? 'Live'}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 md:items-center justify-between" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex flex-col sm:flex-row flex-1 gap-4 items-start sm:items-center w-full">
                <div className="relative w-full sm:w-64 flex-shrink-0">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads by name, email, phone..."
                    className="input w-full bg-slate-50 border-slate-200"
                    style={{ paddingLeft: '2.5rem' }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 w-full overflow-x-auto">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                    <Filter size={14} className="text-slate-400" />
                    <select
                      className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                      value={formFilter}
                      onChange={e => setFormFilter(e.target.value)}
                    >
                      <option value="">All Form / Group Names</option>
                      {uniqueFormNames.map((name, idx) => (
                        <option key={idx} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                    <Calendar size={14} className="text-slate-400" />
                    <select
                      className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                      value={dateFilter}
                      onChange={e => setDateFilter(e.target.value)}
                    >
                      <option value="">All Time</option>
                      <option value="today">Today</option>
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                    </select>
                  </div>
                </div>
              </div>

              <button className="btn-outline text-xs flex items-center gap-1.5 px-4 py-2 bg-white flex-shrink-0" onClick={fetchLeadsAndForms} disabled={loadingLeads}>
                <RefreshCw size={13} className={loadingLeads ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            <div className="card p-0 border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-800">Showing {filteredLeads.length} leads</h2>
              </div>

              {loadingLeads ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 size={22} className="animate-spin mr-2" /> Loading leads…
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No leads match your criteria.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredLeads.map(lead => {
                    const initials = (lead.full_name || 'U').substring(0, 2).toUpperCase();

                    const diffMs = Date.now() - new Date(lead.created_at).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    let timeStr = '';
                    if (diffMins < 60) timeStr = `${diffMins}m ago`;
                    else if (diffHours < 24) timeStr = `${diffHours}h ago`;
                    else timeStr = `${diffDays}d ago`;

                    const sourceLabel = lead.source === 'csv' ? 'CSV Import' : lead.source === 'manual' ? 'Manual Entry' : 'Meta Lead Gen';

                    return (
                      <div key={lead.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 sm:w-56 flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: lead.source === 'csv' ? '#3b82f6' : lead.source === 'manual' ? '#10b981' : '#a78bfa' }}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 text-sm mb-1 truncate">{lead.full_name || '—'}</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {lead.lead_status === 'new' && (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">New</span>
                              )}
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{sourceLabel}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 items-center">
                          <div className="flex flex-col gap-2 justify-center">
                            <div className="flex items-center gap-2 text-slate-500 text-sm truncate">
                              <Phone size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{lead.phone || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm truncate">
                              <Mail size={14} className="text-slate-400 shrink-0" /> <span className="truncate">{lead.email || '—'}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ClipboardList size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate font-medium">Form / Group: <span className="text-slate-800 font-semibold">{lead.form_name || 'Default'}</span></span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0 sm:items-end w-full sm:w-auto">
                          <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-start sm:self-auto mt-2 sm:mt-0" suppressHydrationWarning>
                            {timeStr}
                          </div>
                          <button
                            onClick={() => setSelectedLeadForLogs(lead)}
                            className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto text-slate-600 bg-white mt-1 sm:mt-0"
                            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                          >
                            View Call Logs
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Call Logs Modal */}
      {selectedLeadForLogs && (
        <LeadCallLogModal
          lead={selectedLeadForLogs}
          onClose={() => setSelectedLeadForLogs(null)}
        />
      )}

      {/* Add Single Lead Modal */}
      {showAddSingleModal && (
        <AddSingleLeadModal
          onClose={() => setShowAddSingleModal(false)}
          onSuccess={() => fetchLeadsAndForms()}
        />
      )}

      {/* Upload CSV Leads Modal */}
      {showUploadCsvModal && (
        <UploadCsvLeadsModal
          onClose={() => setShowUploadCsvModal(false)}
          onSuccess={() => fetchLeadsAndForms()}
        />
      )}
    </div>
  );
}
