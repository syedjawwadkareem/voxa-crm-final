'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface Campaign {
  _id: string;
  name: string;
  createdBy: string;
  type: string;
  status: string;
  schedule: string;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  } catch {
    return '-';
  }
}

export function IVRCampaignList({ onCreateClick }: { onCreateClick: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ success: boolean; data: Campaign[] }>('/ivr-campaigns');
      setCampaigns(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Campaign List</h2>
          <p className="text-sm text-slate-500">View all your IVR and broadcast campaigns.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCampaigns}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={onCreateClick}
            className="btn-primary text-sm"
          >
            + Create Campaign
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Schedule</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <RefreshCw size={20} className="animate-spin" />
                    <span className="text-sm">Loading campaigns...</span>
                  </div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  No campaigns found. Click <span className="font-semibold text-indigo-600 cursor-pointer" onClick={onCreateClick}>Create Campaign</span> to get started.
                </td>
              </tr>
            ) : (
              campaigns.map((camp, index) => (
                <tr key={camp._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{camp.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{camp.createdBy || 'admin'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 lowercase">{camp.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      camp.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      camp.status === 'active'    ? 'bg-blue-100 text-blue-700' :
                      camp.status === 'failed'    ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                    }`}>
                      {camp.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(camp.schedule || camp.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
