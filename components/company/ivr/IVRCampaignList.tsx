'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { ivrCampaignsApi } from '@/lib/api';

// Shape returned by GET /ivr-campaigns/obd (parsed from OBD CMS HTML table)
interface ObdCampaign {
  id: string;
  name: string;
  user: string;
  type: string;
  status: string;
  schedule: string;
}

interface LocalCampaign {
  _id: string;
  obdCampaignId?: string;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'complete') return 'bg-emerald-100 text-emerald-700';
  if (s === 'active'    || s === 'running')  return 'bg-blue-100 text-blue-700';
  if (s === 'failed'    || s === 'error')    return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export function IVRCampaignList({
  onCreateClick,
  onViewClick,
}: {
  onCreateClick: () => void;
  onViewClick: (localId: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<ObdCampaign[]>([]);
  const [localCampaigns, setLocalCampaigns] = useState<LocalCampaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const [obdData, localData] = await Promise.all([
        ivrCampaignsApi.listObd(),
        ivrCampaignsApi.list(),
      ]);
      setCampaigns((obdData.data as ObdCampaign[]) || []);
      setLocalCampaigns((localData.data as LocalCampaign[]) || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load OBD campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  /** Find the local MongoDB _id for a given OBD campaign id */
  const findLocalId = (obdId: string): string | null => {
    const match = localCampaigns.find(c => c.obdCampaignId === obdId);
    return match?._id ?? null;
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Campaign List</h2>
          <p className="text-sm text-slate-500">Live campaigns from OBD CMS.</p>
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
                    <span className="text-sm">Loading campaigns from OBD CMS...</span>
                  </div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  No campaigns found on OBD CMS. Click{' '}
                  <span className="font-semibold text-indigo-600 cursor-pointer" onClick={onCreateClick}>
                    Create Campaign
                  </span>{' '}
                  to get started.
                </td>
              </tr>
            ) : (
              campaigns.map((camp, index) => {
                const localId = findLocalId(camp.id);
                return (
                  <tr key={camp.id || index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500">{camp.id || index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{camp.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{camp.user || 'admin'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">{camp.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge(camp.status)}`}>
                        {camp.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{camp.schedule || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {localId ? (
                        <button
                          id={`view-campaign-${camp.id}`}
                          onClick={() => onViewClick(localId)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        >
                          <Eye size={12} />
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No local record</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
