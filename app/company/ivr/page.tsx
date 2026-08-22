'use client';

import { useState } from 'react';
import { CompanyHeader } from '@/components/company/CompanyHeader';
import { IVRCampaignList } from '@/components/company/ivr/IVRCampaignList';
import { CampaignBuilder } from '@/components/company/ivr/CampaignBuilder';
import { CampaignDetail } from '@/components/company/ivr/CampaignDetail';
import { AudioLibrary } from '@/components/company/ivr/AudioLibrary';
import { List, Plus, Music } from 'lucide-react';
import type { AudioFile } from '@/lib/api';

type ActiveTab = 'list' | 'audio' | 'create' | 'detail';

export default function IVRPage() {
  const [activeTab, setActiveTab]           = useState<ActiveTab>('list');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  // Shared audio list: AudioLibrary populates it, CampaignBuilder consumes it
  const [sharedAudioList, setSharedAudioList] = useState<AudioFile[] | undefined>(undefined);

  const handleViewClick = (localId: string) => {
    setSelectedCampaignId(localId);
    setActiveTab('detail');
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'list',   label: 'Campaign List',  icon: <List size={16} /> },
    { id: 'audio',  label: 'Audio Library',  icon: <Music size={16} /> },
    { id: 'create', label: 'Create Campaign', icon: <Plus size={16} /> },
  ];

  return (
    <div>
      <CompanyHeader
        title="IVR & Campaigns"
        subtitle="Manage your interactive voice responses and automated calling campaigns"
        onMenuClick={() => {}}
      />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Tab bar — hidden when viewing detail */}
        {activeTab !== 'detail' && (
          <div className="flex border-b border-slate-200 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'list' && (
          <IVRCampaignList
            onCreateClick={() => setActiveTab('create')}
            onViewClick={handleViewClick}
          />
        )}

        {/* Audio Library tab — updates sharedAudioList whenever files change */}
        {activeTab === 'audio' && (
          <AudioLibrary onAudioListChange={setSharedAudioList} />
        )}

        {activeTab === 'create' && (
          <CampaignBuilder
            onSuccess={() => setActiveTab('list')}
            audioList={sharedAudioList}
          />
        )}

        {activeTab === 'detail' && selectedCampaignId && (
          <CampaignDetail
            campaignId={selectedCampaignId}
            onBack={() => setActiveTab('list')}
          />
        )}
      </div>
    </div>
  );
}
