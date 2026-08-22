'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ClipboardList, RefreshCw, AlertCircle, Trash2,
  Loader2, X, Phone, Mail, User, Calendar, CheckCircle2, Search
} from 'lucide-react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { integrationsApi, type MetaForm, type MetaFormLead } from '@/lib/api';

// ─── Form Detail Modal ────────────────────────────────────────────────────────

function FormDetailModal({
  form,
  onClose,
  onArchive,
}: {
  form: MetaForm;
  onClose: () => void;
  onArchive: () => void;
}) {
  const [leads, setLeads] = useState<MetaFormLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    integrationsApi.getLeadsByFormId(form.id)
      .then(res => setLeads(res.leads ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load leads'))
      .finally(() => setLoading(false));
  }, [form.id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4 animate-slide-up"
        style={{ border: '1px solid #e2e8f0' }}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-bold text-slate-800 text-lg leading-tight truncate">{form.name}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
              onClick={onArchive}
            >
              <Trash2 size={14} /> Archive Form
            </button>
            <button
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Form Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Form Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Form ID</div>
                <div className="font-mono text-sm text-slate-700 break-all">{form.id}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Status</div>
                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-0.5 rounded-full ${form.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {form.status === 'ACTIVE' && <CheckCircle2 size={13} />}
                  {form.status}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Created</div>
                <div className="text-sm text-slate-700">{new Date(form.created_time).toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Leads</div>
                <div className="text-sm font-bold text-slate-800">{form.leads_count}</div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 col-span-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Created Via</div>
                <div className="text-sm text-slate-700">{form.created_via_voxa ? 'VOXA CRM' : 'Meta Ads Manager'}</div>
              </div>
            </div>
          </div>

          {/* Associated Leads */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Associated Leads {!loading && `(${leads.length})`}
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" /> Loading leads…
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            ) : leads.length === 0 ? (
              <div className="rounded-xl border border-slate-200 py-10 text-center text-slate-400">
                <Users size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leads captured for this form yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.map(lead => (
                  <div key={lead.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={16} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{lead.fullName}</span>
                        <span className="chip chip-blue text-[10px]">New</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        {lead.email && lead.email !== '—' && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} /> {lead.email}
                          </span>
                        )}
                        {lead.phone && lead.phone !== '—' && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={12} /> {lead.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Calendar size={11} />
                        Captured: {new Date(lead.created_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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

// ─── Forms Management Page ────────────────────────────────────────────────────

export default function FormsPage() {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState<'active' | 'archived'>('active');
  const [forms, setForms] = useState<MetaForm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingForms, setLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState('');
  const [selectedForm, setSelectedForm] = useState<MetaForm | null>(null);

  const fetchForms = useCallback(async () => {
    setLoadingForms(true);
    setFormsError('');
    try {
      const res = await integrationsApi.getMetaForms();
      setForms(res.forms ?? []);
    } catch (err: unknown) {
      setFormsError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setLoadingForms(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const activeForms = forms.filter(f => f.status === 'ACTIVE');
  const archivedForms = forms.filter(f => f.status !== 'ACTIVE');
  const baseDisplayedForms = filterTab === 'active' ? activeForms : archivedForms;
  
  // Search filter
  const displayedForms = baseDisplayedForms.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id.includes(searchQuery)
  );

  return (
    <div>
      <CompanyHeader
        title="Forms"
        subtitle="Manage and view your lead capture forms"
        onMenuClick={() => {}}
      />

      <div className="px-6 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Forms</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and view your lead capture forms</p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            style={{ background: '#5a61da' }}
            onClick={() => router.push('/company/omnichannel')}
          >
            + Create New Form
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center mb-6 border-b border-slate-200 justify-between overflow-x-auto hide-scrollbar">
          <div className="flex gap-4 min-w-max">
            <button
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${filterTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setFilterTab('active')}
            >
              <div className="flex items-center gap-2">
                Active Forms
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                  style={filterTab === 'active' ? { background: '#e0e7ff', color: '#4f46e5' } : { background: '#f1f5f9', color: '#64748b' }}>
                  {activeForms.length}
                </span>
              </div>
            </button>
            <button
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${filterTab === 'archived' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setFilterTab('archived')}
            >
              <div className="flex items-center gap-2">
                Archived Forms
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                  style={filterTab === 'archived' ? { background: '#e0e7ff', color: '#4f46e5' } : { background: '#f1f5f9', color: '#64748b' }}>
                  {archivedForms.length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Filters and List */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search forms by name or ID..."
                className="input w-full"
                style={{ paddingLeft: '2.5rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500">{displayedForms.length} Forms</span>
              <button className="btn-outline text-xs flex items-center gap-1.5 px-4 py-1.5" onClick={fetchForms}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {loadingForms ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={22} className="animate-spin mr-2" /> Loading forms...
            </div>
          ) : formsError ? (
            <div className="card p-6 flex items-center gap-3 text-red-600">
              <AlertCircle size={18} />
              <div>
                <div className="font-medium text-sm">Failed to load forms</div>
                <div className="text-xs text-slate-500 mt-0.5">{formsError}</div>
                <button className="btn-outline mt-2 text-xs" onClick={fetchForms}>Retry</button>
              </div>
            </div>
          ) : displayedForms.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm text-slate-500">
                {searchQuery
                  ? 'No forms match your search.'
                  : filterTab === 'active' ? 'No active forms found. Click "Create New Form" to get started.' : 'No archived forms.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedForms.map(f => (
                <div
                  key={f.id}
                  className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-bold text-slate-800 text-sm mb-1.5 truncate">{f.name}</div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <ClipboardList size={13} className="text-slate-400" />
                        {f.leads_count} leads
                      </span>
                      <span>Created {new Date(f.created_time).toLocaleDateString()}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        f.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <button
                      className="btn-outline text-sm px-5 py-1.5 font-medium"
                      onClick={() => setSelectedForm(f)}
                    >
                      View
                    </button>
                    <button className="btn-outline px-2.5 py-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Detail Modal */}
      {selectedForm && (
        <FormDetailModal
          form={selectedForm}
          onClose={() => setSelectedForm(null)}
          onArchive={() => {
            // TODO: call archive API
            setSelectedForm(null);
          }}
        />
      )}
    </div>
  );
}
