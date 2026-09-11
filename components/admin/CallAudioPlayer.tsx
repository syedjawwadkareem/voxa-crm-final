'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, X, Volume2, VolumeX, Download,
  Headphones, RefreshCw, AlertCircle, PhoneIncoming, PhoneOutgoing
} from 'lucide-react';
import { telephonyApi } from '@/lib/api';

export interface AudioPlayerCall {
  id: number;
  uniqueid?: string;
  callerid: string;
  destination: string;
  direction?: 'in' | 'out';
  start_time: string;
  duration?: number;
}

interface CallAudioPlayerProps {
  call: AudioPlayerCall | null;
  onClose: () => void;
  onViewDetails?: (call: AudioPlayerCall) => void;
}

function formatTime(secs: number) {
  if (isNaN(secs)) return '00:00';
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function CallAudioPlayer({ call, onClose, onViewDetails }: CallAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!call) return;

    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);

    const customerPhone = call.direction === 'out' ? call.destination : call.callerid;
    const targetUniqueId = call.uniqueid || String(call.id);

    telephonyApi.checkRecording({
      uniqueid: targetUniqueId,
      phone: customerPhone,
    })
      .then((res) => {
        if (res.data && res.data.exists) {
          const streamUrl = telephonyApi.getRecordingStreamUrl({
            uniqueid: targetUniqueId,
            phone: customerPhone,
          });
          setAudioSrc(streamUrl);
          setLoading(false);
        } else {
          setError('Recording not found');
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || 'Recording not found on server');
        setLoading(false);
      });
  }, [call]);

  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioRef.current.muted = nextMute;
  };

  const changeRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  if (!call) return null;

  const phoneDisplay = call.direction === 'out' ? call.destination : call.callerid;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl p-4 animate-slideUp">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              audioRef.current.playbackRate = playbackRate;
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => {
            setError('Error loading audio stream');
            setLoading(false);
          }}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        {/* Call Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 flex-shrink-0">
            <Headphones size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">{phoneDisplay}</span>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800">
                {call.uniqueid ? `ID: ${call.uniqueid}` : `ID: ${call.id}`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {new Date(call.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {call.direction === 'out' ? 'Outbound' : 'Inbound'}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-1 max-w-sm justify-center">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw size={14} className="animate-spin text-teal-400" />
              <span>Loading audio…</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/50 px-3 py-1 rounded-lg border border-red-800/50">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full gap-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center transition-all shadow active:scale-95"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>

                <button
                  onClick={changeRate}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>
              </div>

              <div className="flex items-center gap-2 w-full">
                <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={onSeek}
                  className="w-full accent-teal-400 h-1 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-400 w-8">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!error && audioSrc && (
            <>
              <button
                onClick={toggleMute}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>

              <a
                href={audioSrc}
                download={`call_${call.uniqueid || call.id}.wav`}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                title="Download Audio"
              >
                <Download size={13} />
              </a>
            </>
          )}

          {onViewDetails && (
            <button
              onClick={() => onViewDetails(call)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition-colors"
            >
              AI View
            </button>
          )}

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
