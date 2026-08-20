'use client';

import { useEffect, useState } from 'react';
import { ivrCampaignsApi } from '@/lib/api';
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Download,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface LocalCampaign {
  _id: string;
  name: string;
  type: string;
  description?: string;
  schedule?: string;
  scheduleTime?: string;
  obdCampaignId?: string;
  obdStatus?: string;
  audioId?: string;
  dtmfOptions?: { digit: string; optionText: string; replyAudio: string }[];
  createdAt: string;
}

interface ObdStats {
  total: string;
  pending: string;
  completed: string;
  failed: string;
}

interface Recipient {
  msisdn: string;
  status: string;
  attempts: string;
  lastAttempt: string;
}

interface ObdDetail {
  campaignName: string;
  stats: ObdStats;
  recipients: Recipient[];
}

function statusBadge(status: string) {
  const s = (status || '').toLowerCase().trim();
  if (s === 'completed' || s === 'complete' || s === 'answered')
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (s === 'cancel' || s === 'failed' || s === 'error' || s === 'busy' || s === 'no answer')
    return 'bg-red-100 text-red-700 border border-red-200';
  return 'bg-amber-100 text-amber-700 border border-amber-200';
}

const OBD_BASE = 'http://172.16.17.127/obd_cms/public';

export function CampaignDetail({
  campaignId,
  onBack,
}: {
  campaignId: string;
  onBack: () => void;
}) {
  const [local, setLocal] = useState<LocalCampaign | null>(null);
  const [obd, setObd] = useState<ObdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [obdLoading, setObdLoading] = useState(true);
  const [error, setError] = useState('');
  const [obdError, setObdError] = useState('');
  const [starting, setStarting] = useState(false);
  const [startMsg, setStartMsg] = useState('');

  const fetchLocal = async () => {
    try {
      const res = await ivrCampaignsApi.getById(campaignId);
      setLocal(res.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const fetchObd = async () => {
    setObdLoading(true);
    setObdError('');
    try {
      const res = await ivrCampaignsApi.getObdDetail(campaignId);
      setObd(res.data);
    } catch (e: unknown) {
      setObdError(e instanceof Error ? e.message : 'Failed to load OBD data');
    } finally {
      setObdLoading(false);
    }
  };

  useEffect(() => {
    fetchLocal();
    fetchObd();
  }, [campaignId]);

  const handleStart = async () => {
    setStarting(true);
    setStartMsg('');
    try {
      const res = await ivrCampaignsApi.start(campaignId);
      setStartMsg(res.message || 'Campaign started!');
      // Refresh local + obd data
      await fetchLocal();
      await fetchObd();
    } catch (e: unknown) {
      setStartMsg(e instanceof Error ? e.message : 'Failed to start campaign');
    } finally {
      setStarting(false);
    }
  };

  const statCards = [
    { label: 'Total', value: obd?.stats?.total ?? '—', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Pending', value: obd?.stats?.pending ?? '—', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Completed', value: obd?.stats?.completed ?? '—', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Failed', value: obd?.stats?.failed ?? '—', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ArrowLeft size={16} />
          Back to List
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm">Loading campaign…</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-red-600 text-sm">{error}</div>
      ) : local ? (
        <>
          {/* ── Campaign Info Card ── */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-slate-800">{local.name}</h2>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                      local.obdStatus === 'started'
                        ? 'bg-emerald-100 text-emerald-700'
                        : local.obdStatus === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {local.obdStatus || 'pending'}
                  </span>
                </div>
                {local.description && (
                  <p className="text-sm text-slate-500 mb-3">{local.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-700">Type:</span>{' '}
                    <span className="capitalize">{local.type}</span>
                  </span>
                  {local.scheduleTime && (
                    <span>
                      <span className="font-semibold text-slate-700">Scheduled:</span>{' '}
                      {new Date(local.scheduleTime).toLocaleString()}
                    </span>
                  )}
                  {local.obdCampaignId && (
                    <span>
                      <span className="font-semibold text-slate-700">OBD ID:</span>{' '}
                      {local.obdCampaignId}
                    </span>
                  )}
                </div>

                {/* DTMF Options */}
                {local.type === 'dtmf' && local.dtmfOptions && local.dtmfOptions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">DTMF Options</p>
                    <div className="flex flex-wrap gap-2">
                      {local.dtmfOptions.map((opt, i) => (
                        <div key={i} className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs text-slate-700">
                          <span className="font-bold text-emerald-700">Digit {opt.digit}</span>
                          {opt.optionText && <> → {opt.optionText}</>}
                          {opt.replyAudio && <span className="text-slate-400"> [{opt.replyAudio}]</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 min-w-fit">
                {startMsg && (
                  <div className={`text-xs px-3 py-1.5 rounded-lg ${startMsg.includes('success') || startMsg.includes('started') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {startMsg}
                  </div>
                )}
                {(local.obdStatus !== 'started') && local.obdCampaignId && (
                  <button
                    id="start-campaign-btn"
                    onClick={handleStart}
                    disabled={starting}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {starting ? 'Starting…' : 'Start Campaign'}
                  </button>
                )}
                {local.obdCampaignId && (
                  <a
                    id="export-csv-btn"
                    href={`${OBD_BASE}/campaigns/export/${local.obdCampaignId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Download size={14} />
                    Export CSV
                  </a>
                )}
                <button
                  onClick={fetchObd}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-200"
                >
                  <RefreshCw size={14} className={obdLoading ? 'animate-spin' : ''} />
                  Refresh Stats
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats Cards ── */}
          {obdLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-8 bg-slate-100 rounded w-12 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : obdError ? (
            <div className="card p-4 text-sm text-red-600 border border-red-200 bg-red-50">{obdError}</div>
          ) : obd ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                  <div key={label} className={`card p-5 border ${border} ${bg} flex items-center gap-4`}>
                    <div className={`p-2.5 rounded-xl bg-white shadow-sm`}>
                      <Icon size={20} className={color} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-slate-500 font-medium">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Recipients Table ── */}
              <div className="card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Recipients</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{obd.recipients.length} contact(s)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">MSISDN</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Attempts</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Last Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {obd.recipients.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                            No recipients found.
                          </td>
                        </tr>
                      ) : (
                        obd.recipients.map((r, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-slate-700 font-mono">{r.msisdn}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${statusBadge(r.status)}`}>
                                {r.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">{r.attempts || '0'}</td>
                            <td className="px-4 py-3 text-sm text-slate-400">{r.lastAttempt || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
