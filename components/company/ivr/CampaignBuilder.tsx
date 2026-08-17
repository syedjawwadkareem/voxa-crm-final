'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface CampaignBuilderProps {
  onSuccess: () => void;
}

export function CampaignBuilder({ onSuccess }: CampaignBuilderProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Broadcast',
    audioFile: '',
    csvFile: '',
    description: '',
    schedule: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Campaign Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/ivr-campaigns', {
        name: formData.name,
        type: formData.type,
        audioFile: formData.audioFile,
        csvFile: formData.csvFile,
        description: formData.description,
        schedule: formData.schedule || undefined,
      });
      setSuccess('Campaign created successfully!');
      setFormData({ name: '', type: 'Broadcast', audioFile: '', csvFile: '', description: '', schedule: '' });
      // Switch back to campaign list after a short delay
      setTimeout(() => {
        setSuccess('');
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Create Campaign</h2>
          <p className="text-sm text-slate-500">Fill in the details to create a new IVR campaign.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Row 1: Campaign Name + Campaign Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Campaign Name</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Enter campaign name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Campaign Type</label>
            <select
              className="input w-full"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Broadcast">Broadcast</option>
              <option value="DTMF">DTMF</option>
            </select>
          </div>
        </div>

        {/* Row 2: Audio File + Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Audio File</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g. Camp_1.wav"
              value={formData.audioFile}
              onChange={e => setFormData({ ...formData, audioFile: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Schedule</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={formData.schedule}
              onChange={e => setFormData({ ...formData, schedule: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3: CSV File */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 block mb-1">CSV File</label>
          <input
            type="text"
            className="input w-full"
            placeholder="CSV filename or path"
            value={formData.csvFile}
            onChange={e => setFormData({ ...formData, csvFile: e.target.value })}
          />
          <p className="text-xs text-slate-400 mt-1">Enter the CSV file name that contains your contact list.</p>
        </div>

        {/* Row 4: Description */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-slate-700 block mb-1">Description</label>
          <textarea
            className="input w-full h-24 resize-none"
            placeholder="Optional campaign description..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={onSuccess}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
