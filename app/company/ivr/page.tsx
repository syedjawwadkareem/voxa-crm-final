'use client';

import { useState } from 'react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { IVRCampaignList } from '@/components/company/ivr/IVRCampaignList';
import { CampaignBuilder } from '@/components/company/ivr/CampaignBuilder';
import { List, Plus } from 'lucide-react';

export default function IVRPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  return (
    <div>
      <CompanyHeader
        title="IVR & Campaigns"
        subtitle="Manage your interactive voice responses and automated calling campaigns"
        onMenuClick={() => {}}
      />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('list')}
          >
            <List size={16} />
            Campaign List
          </button>
          <button
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={16} />
            Create Campaign
          </button>
        </div>

        {activeTab === 'list' ? (
          <IVRCampaignList onCreateClick={() => setActiveTab('create')} />
        ) : (
          <CampaignBuilder onSuccess={() => setActiveTab('list')} />
        )}
      </div>
    </div>
  );
}
