'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { Music, Upload, RefreshCw, CheckCircle2, AlertCircle, Loader2, FileAudio, X } from 'lucide-react';
import { audioApi } from '@/lib/api';
import type { AudioFile } from '@/lib/api';

interface AudioLibraryProps {
  /** Called whenever the audio list changes so CampaignBuilder can refresh its dropdown */
  onAudioListChange?: (list: AudioFile[]) => void;
}

export function AudioLibrary({ onAudioListChange }: AudioLibraryProps) {
  const [audioList, setAudioList]       = useState<AudioFile[]>([]);
  const [loading, setLoading]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [dragOver, setDragOver]         = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch audio list ─────────────────────────────────────────────────────────
  const fetchAudioList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await audioApi.list();
      const list = res.data ?? [];
      setAudioList(list);
      onAudioListChange?.(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load audio files.');
    } finally {
      setLoading(false);
    }
  }, [onAudioListChange]);

  useEffect(() => { fetchAudioList(); }, [fetchAudioList]);

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.match(/\.(wav|mp3|ogg|m4a)$/i)) {
      setError('Only audio files (.wav, .mp3, .ogg, .m4a) are supported.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must not exceed 20 MB.');
      return;
    }
    setError('');
    setSelectedFile(file);
  };

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('audio', selectedFile, selectedFile.name);
      await audioApi.upload(fd);
      setSuccess(`"${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchAudioList();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Upload Card ──────────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Upload size={18} className="text-indigo-600" />
              Upload Audio File
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload WAV, MP3, OGG or M4A files (max&nbsp;20&nbsp;MB) to OBD CMS.
            </p>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-10 transition-all select-none
            ${selectedFile
              ? 'border-emerald-400 bg-emerald-50/40 cursor-default'
              : dragOver
                ? 'border-indigo-500 bg-indigo-50/60 cursor-copy scale-[1.01]'
                : 'border-slate-200 bg-slate-50/50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30'
            }`}
        >
          {selectedFile ? (
            <>
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100">
                <FileAudio size={28} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700 text-sm">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &mdash; ready to upload
                </p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100">
                <Music size={28} className="text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-600 text-sm">Drag &amp; drop your audio file here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse &mdash; WAV, MP3, OGG, M4A</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,.mp3,.ogg,.m4a,audio/wav,audio/mpeg,audio/ogg"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }}
          />
        </div>

        {/* Upload button */}
        <div className="mt-4 flex justify-end">
          <button
            id="audio-upload-btn"
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? <><Loader2 size={16} className="animate-spin" /> Uploading&hellip;</>
              : <><Upload size={16} /> Upload to OBD CMS</>
            }
          </button>
        </div>
      </div>

      {/* ── Audio Library Table ───────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileAudio size={18} className="text-indigo-600" />
              Audio Library
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading
                ? 'Loading\u2026'
                : `${audioList.length} audio file${audioList.length !== 1 ? 's' : ''} in OBD CMS`}
            </p>
          </div>
          <button
            id="audio-refresh-btn"
            type="button"
            onClick={fetchAudioList}
            disabled={loading}
            title="Refresh audio list"
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-3" />
            <span className="text-sm">Fetching audio files from OBD CMS&hellip;</span>
          </div>
        ) : audioList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Music size={40} className="opacity-30" />
            <p className="text-sm">No audio files found in OBD CMS.</p>
            <p className="text-xs">Upload your first file using the panel above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Original Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stored As</th>
                </tr>
              </thead>
              <tbody>
                {audioList.map((audio, idx) => (
                  <tr key={`${audio.id}-${idx}`} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold">
                        {audio.id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <span className="flex items-center gap-2">
                        <FileAudio size={14} className="text-indigo-400 shrink-0" />
                        {audio.original_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs truncate max-w-[200px]" title={audio.stored_file}>
                      {audio.stored_file}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
