'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Megaphone, Plus, RefreshCw, Search, Filter, Calendar,
  TrendingUp, Users, MousePointer, DollarSign, Eye,
  Play, Pause, Trash2, Edit3, ChevronRight, ArrowLeft,
  CheckCircle2, XCircle, AlertCircle, Layers, Image as ImageIcon,
  ExternalLink, BarChart3, PieChart, Smartphone, Globe, Shield,
  Sliders, Loader2, Sparkles, HelpCircle, ArrowUpRight
} from 'lucide-react';
import {
  campaignsApi,
  integrationsApi,
  type MetaCampaign,
  type MetaAdSet,
  type MetaAd,
  type CampaignInsights,
  type MetaForm
} from '@/lib/api';
import { toast, confirmModal } from '@/components/ui/NotificationProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(centsOrAmount: string | number | null | undefined, isCents = false): string {
  if (centsOrAmount === null || centsOrAmount === undefined || centsOrAmount === '') return '—';
  const val = isCents ? Number(centsOrAmount) / 100 : Number(centsOrAmount);
  if (isNaN(val)) return '—';
  return `PKR ${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatNumber(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

const OBJECTIVE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  OUTCOME_LEADS: { label: 'Lead Generation', color: '#0f8f7a', bg: '#0f8f7a18' },
  OUTCOME_TRAFFIC: { label: 'Traffic', color: '#0284c7', bg: '#0284c718' },
  OUTCOME_AWARENESS: { label: 'Awareness', color: '#8b5cf6', bg: '#8b5cf618' },
  OUTCOME_ENGAGEMENT: { label: 'Engagement', color: '#f59e0b', bg: '#f59e0b18' },
  OUTCOME_SALES: { label: 'Sales / Conversions', color: '#10b981', bg: '#10b98118' },
};

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7d', label: 'Last 7 Days' },
  { value: 'last_14d', label: 'Last 14 Days' },
  { value: 'last_30d', label: 'Last 30 Days' },
  { value: 'last_90d', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'maximum', label: 'All Time' },
];

export function CampaignsSection() {
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'>('ALL');

  // Drilldown Campaign Detail State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignDetail, setCampaignDetail] = useState<MetaCampaign | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'adsets' | 'ads' | 'breakdowns'>('overview');

  // Modals
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [showCreateAdSetModal, setShowCreateAdSetModal] = useState(false);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);

  // Forms available for linking
  const [metaForms, setMetaForms] = useState<MetaForm[]>([]);

  // ─── Fetch Campaigns ──────────────────────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await campaignsApi.getCampaigns(datePreset);
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
      } else {
        setError(res.error || 'Unable to fetch Meta campaigns. Please ensure Meta credentials are set.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  // ─── Fetch Campaign Details ──────────────────────────────────────────────────
  const fetchCampaignDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await campaignsApi.getCampaignById(id, datePreset, true);
      if (res.success && res.campaign) {
        setCampaignDetail(res.campaign);
      } else {
        toast.error(res.error || 'Failed to fetch campaign details', { title: 'Error' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch campaign details', { title: 'Error' });
    } finally {
      setDetailLoading(false);
    }
  }, [datePreset]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignDetail(selectedCampaignId);
    }
  }, [selectedCampaignId, fetchCampaignDetail]);

  // Fetch Meta Forms for Ad creation
  useEffect(() => {
    integrationsApi.getMetaForms()
      .then(res => {
        if (res.success && res.forms) setMetaForms(res.forms);
      })
      .catch(() => {});
  }, []);

  // ─── Status Toggle Handlers ──────────────────────────────────────────────────
  async function handleToggleCampaignStatus(campaign: MetaCampaign, e: React.MouseEvent) {
    e.stopPropagation();
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await campaignsApi.updateCampaign(campaign.id, { status: newStatus });
      if (res.success) {
        toast.success(`Campaign set to ${newStatus}`, { title: 'Success' });
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus, effective_status: newStatus } : c));
        if (campaignDetail && campaignDetail.id === campaign.id) {
          setCampaignDetail(prev => prev ? { ...prev, status: newStatus, effective_status: newStatus } : null);
        }
      } else {
        toast.error(res.error || 'Could not update status', { title: 'Status Update Failed' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status', { title: 'Error' });
    }
  }

  async function handleToggleAdSetStatus(adset: MetaAdSet) {
    const newStatus = adset.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await campaignsApi.updateAdSet(adset.id, { status: newStatus });
      if (res.success) {
        toast.success(`Ad Set set to ${newStatus}`, { title: 'Success' });
        if (selectedCampaignId) fetchCampaignDetail(selectedCampaignId);
      } else {
        toast.error(res.error || 'Failed to update Ad Set', { title: 'Error' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status', { title: 'Error' });
    }
  }

  async function handleToggleAdStatus(ad: MetaAd) {
    const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await campaignsApi.updateAd(ad.id, { status: newStatus });
      if (res.success) {
        toast.success(`Ad set to ${newStatus}`, { title: 'Success' });
        if (selectedCampaignId) fetchCampaignDetail(selectedCampaignId);
      } else {
        toast.error(res.error || 'Failed to update Ad', { title: 'Error' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status', { title: 'Error' });
    }
  }

  // ─── Delete Handlers ──────────────────────────────────────────────────────────
  async function handleDeleteCampaign(campaign: MetaCampaign, e: React.MouseEvent) {
    e.stopPropagation();
    const confirmed = await confirmModal({
      title: 'Delete Campaign?',
      message: `Are you sure you want to permanently delete campaign "${campaign.name}"? This action will remove all associated ad sets and ads on Meta.`,
      confirmText: 'Delete Campaign',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const res = await campaignsApi.deleteCampaign(campaign.id);
      if (res.success) {
        toast.success('Campaign deleted successfully', { title: 'Deleted' });
        setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
        if (selectedCampaignId === campaign.id) {
          setSelectedCampaignId(null);
          setCampaignDetail(null);
        }
      } else {
        toast.error(res.error || 'Could not delete campaign', { title: 'Delete Failed' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campaign', { title: 'Error' });
    }
  }

  // ─── Filtered Campaigns ───────────────────────────────────────────────────────
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.includes(searchQuery) ||
        (c.objective || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, statusFilter]);

  // Aggregate stats across all campaigns
  const aggregateStats = useMemo(() => {
    let totalSpend = 0;
    let totalReach = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalLeads = 0;

    campaigns.forEach(c => {
      if (c.insights) {
        totalSpend += parseFloat(c.insights.spend || '0');
        totalReach += parseInt(c.insights.reach || '0', 10);
        totalImpressions += parseInt(c.insights.impressions || '0', 10);
        totalClicks += parseInt(c.insights.clicks || '0', 10);
        if (c.insights.actions) {
          totalLeads += parseInt(c.insights.actions.lead || c.insights.actions.link_click || '0', 10);
        }
      }
    });

    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : '0.00';

    return { totalSpend, totalReach, totalImpressions, totalClicks, totalLeads, avgCtr, avgCpc };
  }, [campaigns]);

  return (
    <div className="space-y-6">
      {/* ── Top Alert if Meta credentials missing ── */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-amber-950">Meta Integration Notice</div>
            <p className="mt-0.5 text-amber-800">{error}</p>
            <p className="mt-2 text-xs text-amber-700">
              Ensure your Meta Ad Account ID, Page Access Token, and Page ID are configured in the{' '}
              <a href="/company/omnichannel" className="font-semibold underline hover:text-amber-950">
                Omnichannel Meta Settings
              </a>.
            </p>
          </div>
          <button
            onClick={fetchCampaigns}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-semibold rounded-lg text-xs transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Header Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
              <Megaphone size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Meta Ad Campaigns</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Launch, monitor, and optimize your Meta lead and traffic campaigns with real-time performance insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-700">
            <Calendar size={14} className="text-teal-600" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              {DATE_PRESETS.map(dp => (
                <option key={dp.value} value={dp.value}>{dp.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-teal-600' : ''} />
          </button>

          <button
            onClick={() => setShowCreateCampaignModal(true)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
          >
            <Plus size={15} /> Create Campaign
          </button>
        </div>
      </div>

      {/* ── If a campaign is selected, render drill-down detail view ── */}
      {selectedCampaignId ? (
        <CampaignDetailView
          campaign={campaignDetail}
          loading={detailLoading}
          onBack={() => {
            setSelectedCampaignId(null);
            setCampaignDetail(null);
          }}
          detailTab={detailTab}
          setDetailTab={setDetailTab}
          onToggleStatus={handleToggleCampaignStatus}
          onToggleAdSetStatus={handleToggleAdSetStatus}
          onToggleAdStatus={handleToggleAdStatus}
          onOpenCreateAdSet={() => setShowCreateAdSetModal(true)}
          onOpenCreateAd={() => setShowCreateAdModal(true)}
          onRefresh={() => fetchCampaignDetail(selectedCampaignId)}
        />
      ) : (
        <>
          {/* ── Top Metric Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <div className="card p-4 border border-slate-200 bg-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Total Spend</span>
                <DollarSign size={15} className="text-teal-600" />
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatCurrency(aggregateStats.totalSpend)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{datePreset.replace('_', ' ')}</div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Total Reach</span>
                <Users size={15} className="text-sky-600" />
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatNumber(aggregateStats.totalReach)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Unique people</div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Impressions</span>
                <Eye size={15} className="text-purple-600" />
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatNumber(aggregateStats.totalImpressions)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Total ad views</div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Total Clicks</span>
                <MousePointer size={15} className="text-indigo-600" />
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatNumber(aggregateStats.totalClicks)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Avg CTR: {aggregateStats.avgCtr}%</div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl shadow-xs col-span-2 md:col-span-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Total Results</span>
                <TrendingUp size={15} className="text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-emerald-600">
                {formatNumber(aggregateStats.totalLeads)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Avg CPC: PKR {aggregateStats.avgCpc}</div>
            </div>
          </div>

          {/* ── Search & Filter Controls ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns by name, ID, objective..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs font-medium text-slate-600">
              <span className="text-slate-400 mr-1 text-[11px]">Filter:</span>
              {(['ALL', 'ACTIVE', 'PAUSED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === status
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* ── Campaigns Table ── */}
          <div className="card overflow-hidden border border-slate-200 bg-white rounded-xl shadow-xs">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-teal-600 mb-3" />
                <p className="text-sm font-medium">Loading Meta campaigns...</p>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700">No Campaigns Found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'No campaigns match your current filters.'
                    : 'You have not created any campaigns on Meta yet. Click "Create Campaign" to get started.'}
                </p>
                {!searchQuery && statusFilter === 'ALL' && (
                  <button
                    onClick={() => setShowCreateCampaignModal(true)}
                    className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    + Create Your First Campaign
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Campaign Name</th>
                      <th className="py-3 px-4">Objective</th>
                      <th className="py-3 px-4">Budget</th>
                      <th className="py-3 px-4">Spend</th>
                      <th className="py-3 px-4">Results</th>
                      <th className="py-3 px-4">Cost / Result</th>
                      <th className="py-3 px-4">Impressions / Reach</th>
                      <th className="py-3 px-4">CTR / CPC</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCampaigns.map((camp) => {
                      const objMeta = OBJECTIVE_LABELS[camp.objective] || { label: camp.objective, color: '#64748b', bg: '#f1f5f9' };
                      const isActive = camp.status === 'ACTIVE';
                      const resultsCount = camp.insights?.actions?.lead || camp.insights?.actions?.link_click || camp.insights?.actions?.purchase || '0';
                      const costPerResult = camp.insights?.cost_per_action_type?.lead || camp.insights?.cost_per_action_type?.link_click || camp.insights?.cost_per_action_type?.purchase || null;

                      return (
                        <tr
                          key={camp.id}
                          onClick={() => setSelectedCampaignId(camp.id)}
                          className="hover:bg-slate-50/80 transition cursor-pointer group"
                        >
                          {/* Toggle status */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleToggleCampaignStatus(camp, e)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? 'bg-teal-600' : 'bg-slate-300'
                              }`}
                              title={isActive ? 'Active — click to pause' : 'Paused — click to activate'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Name & ID */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 group-hover:text-teal-700 flex items-center gap-1.5">
                              {camp.name}
                              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-teal-600 transition" />
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {camp.id}</div>
                          </td>

                          {/* Objective */}
                          <td className="py-3.5 px-4">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                              style={{ color: objMeta.color, backgroundColor: objMeta.bg }}
                            >
                              {objMeta.label}
                            </span>
                          </td>

                          {/* Budget */}
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {camp.daily_budget ? (
                              <div>
                                <span>{formatCurrency(camp.daily_budget, true)}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">/ day</span>
                              </div>
                            ) : camp.lifetime_budget ? (
                              <div>
                                <span>{formatCurrency(camp.lifetime_budget, true)}</span>
                                <span className="text-[10px] text-slate-400 block font-normal">lifetime</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Ad Set Level</span>
                            )}
                          </td>

                          {/* Spend */}
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {camp.insights ? formatCurrency(camp.insights.spend) : 'PKR 0.00'}
                          </td>

                          {/* Results */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-teal-700">{formatNumber(resultsCount)}</div>
                            <div className="text-[10px] text-slate-400">
                              {camp.objective.includes('LEAD') ? 'Leads' : 'Clicks'}
                            </div>
                          </td>

                          {/* Cost per result */}
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {costPerResult ? formatCurrency(costPerResult) : '—'}
                          </td>

                          {/* Impressions / Reach */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">
                              {camp.insights ? formatNumber(camp.insights.impressions) : '0'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {camp.insights ? formatNumber(camp.insights.reach) : '0'} reach
                            </div>
                          </td>

                          {/* CTR / CPC */}
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-medium">
                              {camp.insights?.ctr ? `${parseFloat(camp.insights.ctr).toFixed(2)}%` : '0.00%'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              CPC: {camp.insights?.cpc ? formatCurrency(camp.insights.cpc) : '—'}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCampaignId(camp.id)}
                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                                title="View Details"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCampaign(camp, e)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete Campaign"
                              >
                                <Trash2 size={15} />
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
        </>
      )}

      {/* ── Modals ── */}
      {showCreateCampaignModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateCampaignModal(false)}
          onSuccess={() => {
            setShowCreateCampaignModal(false);
            fetchCampaigns();
          }}
        />
      )}

      {showCreateAdSetModal && selectedCampaignId && (
        <CreateAdSetModal
          campaignId={selectedCampaignId}
          onClose={() => setShowCreateAdSetModal(false)}
          onSuccess={() => {
            setShowCreateAdSetModal(false);
            fetchCampaignDetail(selectedCampaignId);
          }}
        />
      )}

      {showCreateAdModal && selectedCampaignId && campaignDetail && (
        <CreateAdModal
          campaignId={selectedCampaignId}
          adsets={campaignDetail.adsets || []}
          forms={metaForms}
          onClose={() => setShowCreateAdModal(false)}
          onSuccess={() => {
            setShowCreateAdModal(false);
            fetchCampaignDetail(selectedCampaignId);
          }}
        />
      )}
    </div>
  );
}

// ─── Campaign Detail Drill-down View ──────────────────────────────────────────

function CampaignDetailView({
  campaign,
  loading,
  onBack,
  detailTab,
  setDetailTab,
  onToggleStatus,
  onToggleAdSetStatus,
  onToggleAdStatus,
  onOpenCreateAdSet,
  onOpenCreateAd,
  onRefresh,
}: {
  campaign: MetaCampaign | null;
  loading: boolean;
  onBack: () => void;
  detailTab: 'overview' | 'adsets' | 'ads' | 'breakdowns';
  setDetailTab: (t: 'overview' | 'adsets' | 'ads' | 'breakdowns') => void;
  onToggleStatus: (c: MetaCampaign, e: React.MouseEvent) => void;
  onToggleAdSetStatus: (as: MetaAdSet) => void;
  onToggleAdStatus: (ad: MetaAd) => void;
  onOpenCreateAdSet: () => void;
  onOpenCreateAd: () => void;
  onRefresh: () => void;
}) {
  if (loading || !campaign) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200">
        <Loader2 size={32} className="animate-spin text-teal-600 mb-3" />
        <p className="text-sm font-medium">Loading campaign details & ad assets...</p>
      </div>
    );
  }

  const objMeta = OBJECTIVE_LABELS[campaign.objective] || { label: campaign.objective, color: '#64748b', bg: '#f1f5f9' };
  const allAds = (campaign.adsets || []).flatMap(as => as.ads || []);

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Back to Campaigns"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">{campaign.name}</h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ color: objMeta.color, backgroundColor: objMeta.bg }}
              >
                {objMeta.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                campaign.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {campaign.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>ID: <span className="font-mono text-slate-600">{campaign.id}</span></span>
              {campaign.ad_account_name && <span>• Account: <span className="text-slate-600 font-medium">{campaign.ad_account_name}</span></span>}
              {campaign.page_name && <span>• Page: <span className="text-slate-600 font-medium">{campaign.page_name}</span></span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Refresh Details"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={(e) => onToggleStatus(campaign, e)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              campaign.status === 'ACTIVE'
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {campaign.status === 'ACTIVE' ? <><Pause size={14} /> Pause Campaign</> : <><Play size={14} /> Activate Campaign</>}
          </button>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setDetailTab('overview')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            detailTab === 'overview' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={15} /> Overview & Performance
        </button>
        <button
          onClick={() => setDetailTab('adsets')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            detailTab === 'adsets' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={15} /> Ad Sets ({campaign.adsets?.length || 0})
        </button>
        <button
          onClick={() => setDetailTab('ads')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            detailTab === 'ads' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon size={15} /> Ads & Creatives ({allAds.length})
        </button>
        <button
          onClick={() => setDetailTab('breakdowns')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            detailTab === 'breakdowns' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart size={15} /> Audience & Placements
        </button>
      </div>

      {/* ── Tab Content: Overview ── */}
      {detailTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="card p-4 border border-slate-200 bg-white rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Spend</div>
              <div className="text-lg font-bold text-slate-900">
                {campaign.insights ? formatCurrency(campaign.insights.spend) : 'PKR 0.00'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Budget: {campaign.daily_budget ? `${formatCurrency(campaign.daily_budget, true)} / day` : 'Ad Set Level'}
              </div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Reach & Impressions</div>
              <div className="text-lg font-bold text-slate-900">
                {campaign.insights ? formatNumber(campaign.insights.reach) : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {campaign.insights ? formatNumber(campaign.insights.impressions) : '0'} total views
              </div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Clicks & CTR</div>
              <div className="text-lg font-bold text-slate-900">
                {campaign.insights ? formatNumber(campaign.insights.clicks) : '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                CTR: {campaign.insights?.ctr ? `${parseFloat(campaign.insights.ctr).toFixed(2)}%` : '0%'}
              </div>
            </div>

            <div className="card p-4 border border-slate-200 bg-white rounded-xl">
              <div className="text-xs text-slate-400 mb-1">Cost Efficiency</div>
              <div className="text-lg font-bold text-teal-700">
                CPC: {campaign.insights?.cpc ? formatCurrency(campaign.insights.cpc) : '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                CPM: {campaign.insights?.cpm ? formatCurrency(campaign.insights.cpm) : '—'}
              </div>
            </div>
          </div>

          {/* Action Results Breakdown Table */}
          {campaign.insights?.actions && Object.keys(campaign.insights.actions).length > 0 && (
            <div className="card p-5 border border-slate-200 bg-white rounded-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-teal-600" /> Action Results & Conversion Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(campaign.insights.actions).map(([actionKey, val]) => (
                  <div key={actionKey} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-medium text-slate-500 capitalize">
                      {actionKey.replace(/_/g, ' ')}
                    </div>
                    <div className="text-base font-bold text-slate-800 mt-0.5">{formatNumber(val)}</div>
                    {campaign.insights?.cost_per_action_type?.[actionKey] && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Cost: {formatCurrency(campaign.insights.cost_per_action_type[actionKey])}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Timeline Mini-Chart */}
          {campaign.insights_daily && campaign.insights_daily.length > 0 && (
            <div className="card p-5 border border-slate-200 bg-white rounded-xl">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-teal-600" /> Daily Spend & Impressions Timeline
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Spend</th>
                      <th className="py-2 px-3">Impressions</th>
                      <th className="py-2 px-3">Reach</th>
                      <th className="py-2 px-3">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaign.insights_daily.map(day => (
                      <tr key={day.date_start} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-700">{day.date_start}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{formatCurrency(day.spend)}</td>
                        <td className="py-2 px-3 text-slate-600">{formatNumber(day.impressions)}</td>
                        <td className="py-2 px-3 text-slate-600">{formatNumber(day.reach)}</td>
                        <td className="py-2 px-3 font-medium text-teal-700">{formatNumber(day.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Ad Sets ── */}
      {detailTab === 'adsets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Campaign Ad Sets</h3>
            <button
              onClick={onOpenCreateAdSet}
              className="btn-primary flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
            >
              <Plus size={14} /> Add Ad Set
            </button>
          </div>

          <div className="card overflow-hidden border border-slate-200 bg-white rounded-xl">
            {(campaign.adsets || []).length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Layers size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-xs">No Ad Sets in this campaign</p>
                <button
                  onClick={onOpenCreateAdSet}
                  className="mt-3 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Create Ad Set
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ad Set Name</th>
                      <th className="py-3 px-4">Targeting</th>
                      <th className="py-3 px-4">Budget</th>
                      <th className="py-3 px-4">Spend</th>
                      <th className="py-3 px-4">Results</th>
                      <th className="py-3 px-4">Ads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(campaign.adsets || []).map(as => {
                      const isActive = as.status === 'ACTIVE';
                      return (
                        <tr key={as.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <button
                              onClick={() => onToggleAdSetStatus(as)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                isActive ? 'bg-teal-600' : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{as.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {as.id}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {as.targeting ? (
                              <div>
                                <span>Age: {as.targeting.age_min ?? 18} - {as.targeting.age_max ?? 65}+</span>
                                {as.targeting.geo_locations?.countries && (
                                  <span className="block text-[10px] text-slate-400 font-medium">
                                    {as.targeting.geo_locations.countries.join(', ')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              'Default'
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {as.daily_budget ? formatCurrency(as.daily_budget, true) : 'CBO Managed'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {as.insights ? formatCurrency(as.insights.spend) : 'PKR 0.00'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-teal-700">
                              {as.insights?.actions?.lead || as.insights?.actions?.link_click || '0'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-600">
                            {(as.ads || []).length} ads
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: Ads & Creatives ── */}
      {detailTab === 'ads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Ads & Visual Creatives</h3>
            <button
              onClick={onOpenCreateAd}
              className="btn-primary flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer"
            >
              <Plus size={14} /> Create Ad
            </button>
          </div>

          {allAds.length === 0 ? (
            <div className="card p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              <ImageIcon size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700 text-xs">No Ads Created Yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload an image creative and attach a lead generation form to publish an ad.
              </p>
              <button
                onClick={onOpenCreateAd}
                className="mt-3 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Create Ad Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAds.map(ad => {
                const creative = ad.creative;
                const linkData = creative?.object_story_spec?.link_data;
                const imgUrl = creative?.image_url || creative?.thumbnail_url;
                const isActive = ad.status === 'ACTIVE';

                return (
                  <div key={ad.id} className="card border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs flex flex-col">
                    {/* Ad Creative Image Preview */}
                    <div className="relative h-44 bg-slate-100 border-b border-slate-200 flex items-center justify-center overflow-hidden">
                      {imgUrl ? (
                        <img src={imgUrl} alt={ad.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon size={28} />
                          <span className="text-[10px] mt-1">No Image Preview</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => onToggleAdStatus(ad)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs transition cursor-pointer ${
                            isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {ad.status}
                        </button>
                      </div>
                    </div>

                    {/* Ad Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm mb-1">{ad.name}</div>
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {creative?.title || linkData?.name || 'Ad Headline'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {creative?.body || linkData?.message || 'Ad message copy...'}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Spend: <strong className="text-slate-800">{ad.insights ? formatCurrency(ad.insights.spend) : 'PKR 0.00'}</strong></span>
                        <span>Results: <strong className="text-teal-700">{ad.insights?.actions?.lead || ad.insights?.actions?.link_click || '0'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Breakdowns ── */}
      {detailTab === 'breakdowns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Age Demographics */}
          <div className="card p-5 border border-slate-200 bg-white rounded-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users size={16} className="text-teal-600" /> Age Distribution
            </h3>
            {campaign.insights_by_age && campaign.insights_by_age.length > 0 ? (
              <div className="space-y-2.5">
                {campaign.insights_by_age.map(row => (
                  <div key={row.age} className="text-xs">
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>Age {row.age}</span>
                      <span>{formatCurrency(row.spend)} ({formatNumber(row.clicks)} clicks)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(8, (Number(row.impressions) / (Number(campaign.insights?.impressions || 1))) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No age breakdown data for this date range.</p>
            )}
          </div>

          {/* Gender Demographics */}
          <div className="card p-5 border border-slate-200 bg-white rounded-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users size={16} className="text-indigo-600" /> Gender Breakdown
            </h3>
            {campaign.insights_by_gender && campaign.insights_by_gender.length > 0 ? (
              <div className="space-y-3">
                {campaign.insights_by_gender.map(row => (
                  <div key={row.gender} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 capitalize">{row.gender}</span>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatCurrency(row.spend)}</div>
                      <div className="text-[10px] text-slate-400">{formatNumber(row.clicks)} clicks • {formatNumber(row.impressions)} views</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No gender breakdown data available.</p>
            )}
          </div>

          {/* Placements Breakdown */}
          <div className="card p-5 border border-slate-200 bg-white rounded-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Globe size={16} className="text-sky-600" /> Platform & Placements
            </h3>
            {campaign.insights_by_placement && campaign.insights_by_placement.length > 0 ? (
              <div className="space-y-2">
                {campaign.insights_by_placement.map((row, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 capitalize">{row.publisher_platform}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{row.platform_position.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{formatCurrency(row.spend)}</span>
                      <span className="block text-[10px] text-slate-400">{formatNumber(row.clicks)} clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No placement data available.</p>
            )}
          </div>

          {/* Device Distribution */}
          <div className="card p-5 border border-slate-200 bg-white rounded-xl">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Smartphone size={16} className="text-purple-600" /> Devices
            </h3>
            {campaign.insights_by_device && campaign.insights_by_device.length > 0 ? (
              <div className="space-y-2">
                {campaign.insights_by_device.map((row, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 capitalize">{row.impression_device.replace(/_/g, ' ')}</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{formatCurrency(row.spend)}</span>
                      <span className="block text-[10px] text-slate-400">{formatNumber(row.impressions)} views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No device breakdown data available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Create Campaign ───────────────────────────────────────────────────

function CreateCampaignModal({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_LEADS');
  const [status, setStatus] = useState('PAUSED');
  const [dailyBudgetPkr, setDailyBudgetPkr] = useState('2500');
  const [bidStrategy, setBidStrategy] = useState('LOWEST_COST_WITHOUT_CAP');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Campaign name is required', { title: 'Validation' });
      return;
    }

    setSaving(true);
    try {
      const dailyBudgetCents = Number(dailyBudgetPkr) * 100;
      const res = await campaignsApi.createCampaign({
        name: name.trim(),
        objective,
        status,
        daily_budget: dailyBudgetCents,
        bid_strategy: bidStrategy,
      });

      if (res.success) {
        toast.success('Campaign created successfully on Meta!', { title: 'Campaign Created' });
        onSuccess();
      } else {
        toast.error(res.error || 'Could not create campaign on Meta', { title: 'Creation Failed' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campaign', { title: 'Error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Create Meta Campaign</h3>
        <p className="text-xs text-slate-500 mb-4">
          Create a new advertising campaign directly synced with your Meta Ad Account.
        </p>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Campaign Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Askari Heights Launch"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Campaign Objective</label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
            >
              <option value="OUTCOME_LEADS">Lead Generation (Instant Forms)</option>
              <option value="OUTCOME_TRAFFIC">Traffic (Website Link Clicks)</option>
              <option value="OUTCOME_AWARENESS">Brand Awareness / Reach</option>
              <option value="OUTCOME_ENGAGEMENT">Post Engagement / Messages</option>
              <option value="OUTCOME_SALES">Sales / Conversions</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Daily Budget (PKR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">PKR</span>
              <input
                type="number"
                value={dailyBudgetPkr}
                onChange={(e) => setDailyBudgetPkr(e.target.value)}
                placeholder="2500"
                min="100"
                step="50"
                className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Budget is set in PKR and auto-converted to cents for Meta Graph API.
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
            >
              <option value="PAUSED">PAUSED (Recommended - won't spend until activated)</option>
              <option value="ACTIVE">ACTIVE (Starts delivering immediately once approved)</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Create Ad Set ─────────────────────────────────────────────────────

function CreateAdSetModal({
  campaignId,
  onClose,
  onSuccess
}: {
  campaignId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [dailyBudgetPkr, setDailyBudgetPkr] = useState('');
  const [ageMin, setAgeMin] = useState('21');
  const [ageMax, setAgeMax] = useState('55');
  const [gender, setGender] = useState<string>('all');
  const [country, setCountry] = useState('PK');
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Ad Set name is required', { title: 'Validation' });
      return;
    }

    setSaving(true);
    try {
      const genders = gender === 'all' ? [1, 2] : gender === 'male' ? [1] : [2];
      const payload: any = {
        name: name.trim(),
        campaign_id: campaignId,
        status: 'PAUSED',
        targeting: {
          age_min: Number(ageMin),
          age_max: Number(ageMax),
          genders,
          geo_locations: { countries: [country] }
        }
      };

      if (dailyBudgetPkr) {
        payload.daily_budget = Number(dailyBudgetPkr) * 100;
      }

      const res = await campaignsApi.createAdSet(payload);
      if (res.success) {
        toast.success('Ad Set created successfully on Meta!', { title: 'Ad Set Created' });
        onSuccess();
      } else {
        toast.error(res.error || 'Could not create Ad Set', { title: 'Creation Failed' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Ad Set', { title: 'Error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-slide-up">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Create Ad Set</h3>
        <p className="text-xs text-slate-500 mb-4">
          Define the target audience, age range, and location for this Ad Set.
        </p>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ad Set Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karachi 25-55 High Intent"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Min Age</label>
              <input
                type="number"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                min="18"
                max="65"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Max Age</label>
              <input
                type="number"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                min="18"
                max="65"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
              >
                <option value="all">All Genders</option>
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="PK"
                maxLength={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium uppercase"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ad Set Daily Budget (Optional)</label>
            <input
              type="number"
              value={dailyBudgetPkr}
              onChange={(e) => setDailyBudgetPkr(e.target.value)}
              placeholder="Leave empty if campaign has budget (CBO)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Create Ad Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Create Ad & Creative ──────────────────────────────────────────────

function CreateAdModal({
  campaignId,
  adsets,
  forms,
  onClose,
  onSuccess
}: {
  campaignId: string;
  adsets: MetaAdSet[];
  forms: MetaForm[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [adsetName, setAdsetName] = useState(adsets[0]?.id || '');
  const [adName, setAdName] = useState('');
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [ctaType, setCtaType] = useState('LEARN_MORE');
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!adsetName) {
      toast.warning('Please select an Ad Set', { title: 'Validation' });
      return;
    }
    if (!imageFile) {
      toast.warning('Please upload an image for the ad creative', { title: 'Validation' });
      return;
    }
    if (!headline || !message || !adName) {
      toast.warning('Ad Name, Headline, and Message are required', { title: 'Validation' });
      return;
    }

    setSaving(true);
    try {
      // 1. Upload Image to Meta to get image_hash
      const uploadRes = await campaignsApi.uploadAdImage(imageFile);
      if (!uploadRes.success || !uploadRes.image_hash) {
        throw new Error(uploadRes.error || 'Failed to upload image to Meta');
      }

      // 2. Create Ad Creative
      const creativeRes = await campaignsApi.createAdCreative({
        name: `${adName} - Creative`,
        image_hash: uploadRes.image_hash,
        headline,
        message,
        lead_gen_form_id: selectedFormId || undefined,
        cta_type: ctaType
      });

      if (!creativeRes.success || !creativeRes.creative_id) {
        throw new Error(creativeRes.error || 'Failed to create creative on Meta');
      }

      // 3. Create Ad
      const adRes = await campaignsApi.createAd({
        name: adName,
        adset_id: adsetName,
        creative_id: creativeRes.creative_id,
        status: 'PAUSED'
      });

      if (adRes.success) {
        toast.success('Ad and Creative published to Meta successfully!', { title: 'Ad Created' });
        onSuccess();
      } else {
        throw new Error(adRes.error || 'Failed to create ad on Meta');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating Ad', { title: 'Creation Error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Create Ad & Creative</h3>
        <p className="text-xs text-slate-500 mb-4">
          Upload an image, configure your copy, and link a lead form.
        </p>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Target Ad Set *</label>
            <select
              value={adsetName}
              onChange={(e) => setAdsetName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
            >
              {adsets.map(as => (
                <option key={as.id} value={as.id}>{as.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ad Name *</label>
            <input
              type="text"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
              placeholder="e.g. Askari Heights Creative 1"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Creative Image * (1080×1080px recommended)</label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 transition relative">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
                required
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {imagePreview ? (
                <div className="flex items-center justify-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                  <div className="text-left text-xs">
                    <span className="font-semibold text-teal-700 block">Image Selected</span>
                    <span className="text-slate-400">Click or drag to replace</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400 py-2">
                  <ImageIcon size={24} className="text-teal-600 mb-1" />
                  <span className="font-semibold text-slate-700">Click to upload image</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG up to 30MB</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Headline (Bold text) *</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Luxury Apartments in Lahore — Book Now"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Main Ad Body Copy *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="e.g. 3 & 4 bedroom luxury apartments with easy 3-year installments. Limited inventory available."
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Call to Action (CTA)</label>
              <select
                value={ctaType}
                onChange={(e) => setCtaType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
              >
                <option value="LEARN_MORE">Learn More</option>
                <option value="SIGN_UP">Sign Up</option>
                <option value="APPLY_NOW">Apply Now</option>
                <option value="GET_QUOTE">Get Quote</option>
                <option value="CONTACT_US">Contact Us</option>
                <option value="SUBSCRIBE">Subscribe</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Linked Lead Form</label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium cursor-pointer"
              >
                {forms.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Publish Ad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
