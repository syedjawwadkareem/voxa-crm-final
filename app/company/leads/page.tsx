'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, RefreshCw, Loader2, Phone, Mail, Search, Filter, Calendar, ClipboardList, X, PhoneOutgoing, PhoneIncoming, Clock, AlertCircle } from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { leadsApi, integrationsApi, type CapturedLead, type LeadsStats, type MetaForm } from '@/lib/api';

// --- CallLog Modal ---
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

          // Normalize to last 10 digits (handles both +923421879566 and 03421879566)
          // +923421879566 → digits → 923421879566 → last10 → 3421879566
          // 03421879566   → digits → 03421879566  → last10 → 3421879566
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

export default function LeadManagementPage() {
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [forms, setForms] = useState<MetaForm[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Call Log Modal state
  const [selectedLeadForLogs, setSelectedLeadForLogs] = useState<CapturedLead | null>(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState(''); // e.g. "today", "7days", "30days", ""
  const [formFilter, setFormFilter] = useState(''); // form id

  const fetchLeadsAndForms = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const formsRes = await integrationsApi.getMetaForms();
      
      const allForms = formsRes.forms ?? [];
      setForms(allForms);
      
      // Fetch leads for all forms via the Meta API
      const leadsPromises = allForms.map(form => 
        integrationsApi.getLeadsByFormId(form.id).then(res => 
          (res.leads ?? []).map(lead => ({
            id: lead.id,
            full_name: lead.fullName,
            email: lead.email,
            phone: lead.phone,
            created_at: lead.created_time,
            form_id: form.id,
            lead_status: 'new' // mock status for now
          } as CapturedLead))
        ).catch(() => []) // gracefully handle errors for individual forms
      );
      
      const leadsArrays = await Promise.all(leadsPromises);
      const combinedLeads = leadsArrays.flat().sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setLeads(combinedLeads);
      const today = new Date();
      setStats({
        total: combinedLeads.length,
        new: combinedLeads.filter(l => {
          if (l.lead_status !== 'new') return false;
          const leadDate = new Date(l.created_at);
          return leadDate.getDate() === today.getDate() &&
                 leadDate.getMonth() === today.getMonth() &&
                 leadDate.getFullYear() === today.getFullYear();
        }).length,
        status: 'Live',
        converted: 0
      });
    } catch {
      // silent
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsAndForms();
  }, [fetchLeadsAndForms]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        (l.full_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q)
      );
    }
    
    if (formFilter) {
      result = result.filter(l => l.form_id === formFilter);
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
        subtitle="View and manage captured leads from all channels"
        onMenuClick={() => {}}
      />

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Captured Leads</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage leads captured from all active channels</p>
        </div>

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
                  <option value="">All Forms</option>
                  {forms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
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
                
                // Format time ago
                const diffMs = Date.now() - new Date(lead.created_at).getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                let timeStr = '';
                if (diffMins < 60) timeStr = `${diffMins}m ago`;
                else if (diffHours < 24) timeStr = `${diffHours}h ago`;
                else timeStr = `${diffDays}d ago`;
                
                const form = forms.find(f => f.id === lead.form_id);

                return (
                  <div key={lead.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 sm:w-56 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: '#a78bfa' }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm mb-1 truncate">{lead.full_name || '—'}</div>
                        {lead.lead_status === 'new' && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">New</span>
                        )}
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
                      {form ? (
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <ClipboardList size={12} className="shrink-0" /> <span className="truncate">Form: {form.name}</span>
                        </div>
                      ) : (
                        <div />
                      )}
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
      </div>
      
      {/* Call Logs Modal */}
      {selectedLeadForLogs && (
        <LeadCallLogModal 
          lead={selectedLeadForLogs} 
          onClose={() => setSelectedLeadForLogs(null)} 
        />
      )}
    </div>
  );
}
