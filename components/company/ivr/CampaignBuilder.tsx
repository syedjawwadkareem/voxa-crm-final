'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { ivrCampaignsApi } from '@/lib/api';
import type { DtmfOption } from '@/lib/api';

interface CampaignBuilderProps {
  onSuccess: () => void;
}

const EMPTY_DTMF_ROW: DtmfOption = { digit: '0', option_text: '', reply_audio: '' };

export function CampaignBuilder({ onSuccess }: CampaignBuilderProps) {
  // ── Core fields (existing) ───────────────────────────────────────────────────
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');

  // ── OBD CMS fields ───────────────────────────────────────────────────────────
  const [campaignType, setCampaignType] = useState<'broadcast' | 'dtmf'>('broadcast');
  const [audioId, setAudioId]           = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [csvFile, setCsvFile]           = useState<File | null>(null);
  const [dtmfOptions, setDtmfOptions]   = useState<DtmfOption[]>([{ ...EMPTY_DTMF_ROW }]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // ── DTMF row helpers ─────────────────────────────────────────────────────────
  const addDtmfRow = () =>
    setDtmfOptions(prev => [...prev, { ...EMPTY_DTMF_ROW }]);

  const removeDtmfRow = (index: number) =>
    setDtmfOptions(prev => prev.filter((_, i) => i !== index));

  const updateDtmfRow = (index: number, field: keyof DtmfOption, value: string) =>
    setDtmfOptions(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));

  // Convert datetime-local value (YYYY-MM-DDTHH:mm) → OBD format (YYYY-MM-DD HH:mm:ss)
  const toObdDateTime = (val: string) => val ? val.replace('T', ' ') + ':00' : '';

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) { setError('Campaign Name is required.'); return; }
    if (!audioId)     { setError('Audio ID is required.'); return; }
    if (!scheduleTime){ setError('Schedule Time is required.'); return; }
    if (!csvFile)     { setError('CSV file is required.'); return; }
    if (campaignType === 'dtmf' && dtmfOptions.some(o => !o.option_text.trim())) {
      setError('All DTMF option texts are required.'); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',          name);
      fd.append('type',          campaignType);           // existing field
      fd.append('description',   description);
      // OBD fields
      fd.append('campaign_type', campaignType);
      fd.append('audio_id',      audioId);
      fd.append('schedule_time', toObdDateTime(scheduleTime)); // YYYY-MM-DD HH:mm:ss for OBD
      fd.append('schedule',      scheduleTime);           // populate existing schedule field too
      fd.append('csv_file',      csvFile, csvFile.name);
      if (campaignType === 'dtmf') {
        fd.append('dtmfOptions', JSON.stringify(dtmfOptions));
      }

      await ivrCampaignsApi.createWithFile(fd);
      setSuccess('Campaign created and queued for OBD CMS!');

      // Reset form
      setName(''); setDescription(''); setAudioId(''); setScheduleTime('');
      setCsvFile(null); setDtmfOptions([{ ...EMPTY_DTMF_ROW }]);
      if (csvInputRef.current) csvInputRef.current.value = '';
      setCampaignType('broadcast');

      setTimeout(() => { setSuccess(''); onSuccess(); }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Create Campaign</h2>
          <p className="text-sm text-slate-500">Fill in the details to create a new IVR campaign and sync it with OBD CMS.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{success}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Row 1: Campaign Name + Campaign Type ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              id="campaign-name"
              type="text"
              className="input w-full"
              placeholder="Enter campaign name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Campaign Type <span className="text-red-500">*</span>
            </label>
            <select
              id="campaign-type"
              className="input w-full"
              value={campaignType}
              onChange={e => setCampaignType(e.target.value as 'broadcast' | 'dtmf')}
            >
              <option value="broadcast">Broadcast</option>
              <option value="dtmf">DTMF</option>
            </select>
          </div>
        </div>

        {/* ── Row 2: Audio ID + Schedule Time ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Audio File <span className="text-red-500">*</span>
            </label>
            <select
              id="audio-id"
              className="input w-full"
              value={audioId}
              onChange={e => setAudioId(e.target.value)}
            >
              <option value="" disabled>Select Audio</option>
              <option value="4">Camp_1.wav</option>
              <option value="3">Flow B main.wav</option>
              <option value="2">Flow A main.wav</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Select the audio file for this campaign.</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">
              Schedule Time <span className="text-red-500">*</span>
            </label>
            {/* Wrapper makes the ENTIRE row clickable, not just the calendar icon */}
            <div
              className="relative cursor-pointer"
              onClick={() => {
                const el = document.getElementById('schedule-time') as HTMLInputElement | null;
                if (el) {
                  el.focus();
                  try { el.showPicker?.(); } catch (_) {}
                }
              }}
            >
              <input
                id="schedule-time"
                type="datetime-local"
                className="input w-full cursor-pointer"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                style={{ colorScheme: 'light' }}
              />
            </div>
            {scheduleTime && (
              <p className="text-xs text-slate-400 mt-1">
                OBD format: <span className="font-mono text-slate-600">{toObdDateTime(scheduleTime)}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Row 3: CSV File Upload ─────────────────────────────────────────── */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 block mb-1">
            Contact List (CSV) <span className="text-red-500">*</span>
          </label>
          <div
            className="relative flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-lg px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload size={18} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 flex-1 truncate">
              {csvFile ? csvFile.name : 'Click to upload .csv file'}
            </span>
            {csvFile && (
              <span className="text-xs text-slate-400">
                {(csvFile.size / 1024).toFixed(1)} KB
              </span>
            )}
            <input
              ref={csvInputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => setCsvFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Upload the CSV file containing your contact list.</p>
        </div>

        {/* ── Row 4: Description ────────────────────────────────────────────── */}
        <div className="mb-5">
          <label className="text-sm font-semibold text-slate-700 block mb-1">Description</label>
          <textarea
            id="campaign-description"
            className="input w-full h-20 resize-none"
            placeholder="Optional campaign description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* ── DTMF Options Section (visible only when type = dtmf) ──────────── */}
        {campaignType === 'dtmf' && (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-800">DTMF Options</h3>
                <p className="text-xs text-indigo-500">Configure keypress responses for this campaign.</p>
              </div>
              <button
                type="button"
                id="add-dtmf-row"
                onClick={addDtmfRow}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-300 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors"
              >
                <Plus size={13} /> Add Option
              </button>
            </div>

            <div className="space-y-3">
              {/* Column headers */}
              <div className="grid grid-cols-[80px_1fr_1fr_36px] gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                <span>Digit</span>
                <span>Option Text</span>
                <span>Reply Audio</span>
                <span />
              </div>

              {dtmfOptions.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[80px_1fr_1fr_36px] gap-3 items-center">
                  {/* Digit selector */}
                  <select
                    id={`dtmf-digit-${idx}`}
                    className="input text-sm"
                    value={row.digit}
                    onChange={e => updateDtmfRow(idx, 'digit', e.target.value)}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={String(i)}>{i}</option>
                    ))}
                    <option value="*">*</option>
                    <option value="#">#</option>
                  </select>

                  {/* Option text */}
                  <input
                    id={`dtmf-text-${idx}`}
                    type="text"
                    className="input text-sm"
                    placeholder="e.g. Press 1 for Sales"
                    value={row.option_text}
                    onChange={e => updateDtmfRow(idx, 'option_text', e.target.value)}
                  />

                  {/* Reply audio */}
                  <select
                    id={`dtmf-audio-${idx}`}
                    className="input text-sm"
                    value={row.reply_audio}
                    onChange={e => updateDtmfRow(idx, 'reply_audio', e.target.value)}
                  >
                    <option value="">No Audio</option>
                    <option value="FlowAResponse1">FlowAResponse1</option>
                    <option value="FlowAresponse2">FlowAresponse2</option>
                    <option value="FlowBResponse2">FlowBResponse2</option>
                    <option value="FlowBresponse1">FlowBresponse1</option>
                  </select>

                  {/* Remove button */}
                  <button
                    type="button"
                    id={`dtmf-remove-${idx}`}
                    onClick={() => removeDtmfRow(idx)}
                    disabled={dtmfOptions.length === 1}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove option"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button
            id="submit-campaign"
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
          <button
            id="cancel-campaign"
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
