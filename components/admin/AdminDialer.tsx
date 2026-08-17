'use client';

// ─── AdminDialer — Live Softphone Component ───────────────────────────────────
// Wired to the Voxa CRM backend dialer API which proxies:
//   CALL   → Asterisk API → SIP bridge → LiveKit room
//   HANGUP → LiveKit Admin API (delete room) → drops SIP/PSTN call
//
// Call state machine:
//   idle ─→ dialing ─→ ringing ─→ connected ─→ ended ─→ idle

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, Delete, Mic, MicOff, PhoneOff, Pause, Play,
  ArrowRightLeft, UserPlus, Volume2, ShieldAlert, Loader2,
  AlertCircle, CheckCircle2, WifiOff
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended' | 'error';

interface DialerState {
  callState: CallState;
  roomName: string | null;
  number: string;
  errorMsg: string;
  isMuted: boolean;
  isOnHold: boolean;
  elapsedSeconds: number;
}

// ── API base ──────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// State label + colour
const STATE_LABEL: Record<CallState, { text: string; color: string }> = {
  idle:      { text: 'Ready',       color: '#94a3b8' },
  dialing:   { text: 'Dialing…',   color: '#f59e0b' },
  ringing:   { text: 'Ringing…',   color: '#3b82f6' },
  connected: { text: 'Connected',  color: '#22c55e' },
  ended:     { text: 'Call Ended', color: '#ef4444' },
  error:     { text: 'Error',      color: '#ef4444' },
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminDialer() {
  const [state, setState] = useState<DialerState>({
    callState: 'idle',
    roomName: null,
    number: '',
    errorMsg: '',
    isMuted: false,
    isOnHold: false,
    elapsedSeconds: 0,
  });

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const hangingUp   = useRef(false);
  const roomRef     = useRef<any>(null); // holds the LiveKit Room instance
  const lastCallTime = useRef<number>(0); // flood guard: min 5s between calls

  // ── Live timer when connected ──────────────────────────────────────────

  useEffect(() => {
    if (state.callState === 'connected') {
      timerRef.current = setInterval(() => {
        setState((s) => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.callState]);

  // ── LiveKit room connection ───────────────────────────────────────────

  const connectToLiveKit = useCallback(async (roomName: string) => {
    // 1. Get LiveKit client SDK dynamically to prevent SSR issues
    const { Room, RoomEvent, DefaultReconnectPolicy } = await import('livekit-client');

    // 2. Fetch browser client token from backend
    const identity = `browser-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await fetch(`${API}/dialer/token?roomName=${encodeURIComponent(roomName)}&identity=${identity}`);
    if (!res.ok) throw new Error('Failed to fetch LiveKit token');
    const data = await res.json();
    if (!data.success || !data.token) throw new Error('Invalid token returned');

    // 3. Create room instance and connect
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
    const room = new Room({
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      reconnectPolicy: new DefaultReconnectPolicy(),
    });

    roomRef.current = room;

    // Handle incoming audio tracks
    room.on(RoomEvent.TrackSubscribed, (track: any) => {
      if (track.kind === 'audio') {
        const el = track.attach();
        el.setAttribute('id', `audio-${track.sid}`);
        document.body.appendChild(el);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
      const el = document.getElementById(`audio-${track.sid}`);
      if (el) {
        track.detach(el);
        el.remove();
      }
    });

    room.on(RoomEvent.ParticipantConnected, (participant: any) => {
      if (participant.identity.startsWith('sip_')) {
        setState((s) => {
          if (s.callState === 'ringing' || s.callState === 'dialing') {
            return { ...s, callState: 'connected' };
          }
          return s;
        });
      }
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant: any) => {
      if (participant.identity.startsWith('sip_')) {
        // Disconnect when SIP user leaves
        setState((s) => ({
          ...s,
          callState: 'ended',
          roomName: null,
        }));
        setTimeout(() => setState((s) => ({ ...s, callState: 'idle', elapsedSeconds: 0 })), 2000);
      }
    });

    room.on(RoomEvent.Reconnecting, () => {
      setState((s) => ({ ...s, errorMsg: 'Reconnecting...' }));
    });

    room.on(RoomEvent.Reconnected, () => {
      setState((s) => ({ ...s, errorMsg: '' }));
    });

    room.on(RoomEvent.Disconnected, () => {
      setState((s) => ({
        ...s,
        callState: 'ended',
        roomName: null,
      }));
      setTimeout(() => setState((s) => ({ ...s, callState: 'idle', elapsedSeconds: 0 })), 2000);
    });

    // Connect to server
    await room.connect(wsUrl, data.token);
    console.log('[Softphone] Browser connected to LiveKit room:', roomName);

    // Enable local microphone by default
    await room.localParticipant.setMicrophoneEnabled(true);
    console.log('[Softphone] Microphone published');
  }, []);

  const disconnectFromLiveKit = useCallback(() => {
    if (roomRef.current) {
      try {
        // Detach all audio elements
        roomRef.current.localParticipant.setMicrophoneEnabled(false);
        roomRef.current.disconnect();
      } catch (err) {
        console.error('[Softphone] LiveKit disconnect error:', err);
      }
      roomRef.current = null;
      // Clean up any remaining dynamically attached audio tags
      document.querySelectorAll('audio[id^="audio-"]').forEach((el) => el.remove());
    }
  }, []);

  // Sync mute state with LiveKit Room
  useEffect(() => {
    if (roomRef.current) {
      roomRef.current.localParticipant.setMicrophoneEnabled(!state.isMuted)
        .catch((err: any) => console.error('Failed to toggle mute in LiveKit room:', err));
    }
  }, [state.isMuted]);

  useEffect(() => {
    return () => {
      disconnectFromLiveKit();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [disconnectFromLiveKit]);

  // ── Key handlers ──────────────────────────────────────────────────────

  function handleKeyPress(digit: string) {
    if (state.callState !== 'idle') return;
    setState((s) => ({
      ...s,
      number: s.number.length < 15 ? s.number + digit : s.number,
    }));
  }

  function handleDelete() {
    setState((s) => ({ ...s, number: s.number.slice(0, -1) }));
  }

  // ── CALL ──────────────────────────────────────────────────────────────

  async function handleCall() {
    const num = state.number.trim();
    if (!num) return;

    // Enforce 5-second cooldown to prevent flood rejection (Issue #5)
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime.current;
    if (timeSinceLastCall < 5000) {
      const waitSeconds = Math.ceil((5000 - timeSinceLastCall) / 1000);
      setState((s) => ({
        ...s,
        callState: 'error',
        errorMsg: `Please wait ${waitSeconds}s before calling again.`
      }));
      setTimeout(() => setState((s) => ({ ...s, callState: 'idle', errorMsg: '' })), 2500);
      return;
    }
    lastCallTime.current = now;

    setState((s) => ({ ...s, callState: 'dialing', errorMsg: '' }));

    try {
      const roomName = 'phone-room';

      // 1. Connect to the LiveKit room FIRST (and get mic permission)
      await connectToLiveKit(roomName);

      // 2. Call the backend to trigger Asterisk
      const res = await fetch(`${API}/dialer/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Server error ${res.status}`);
      }

      setState((s) => ({
        ...s,
        callState: 'ringing',
        roomName,
        elapsedSeconds: 0,
      }));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate call';
      setState((s) => ({ ...s, callState: 'error', errorMsg: msg }));
      setTimeout(() => setState((s) => ({ ...s, callState: 'idle', errorMsg: '' })), 4000);
      disconnectFromLiveKit();
    }
  }

  // ── HANGUP ────────────────────────────────────────────────────────────

  async function handleHangup() {
    if (hangingUp.current) return;
    hangingUp.current = true;

    const { roomName } = state;

    disconnectFromLiveKit();
    setState((s) => ({ ...s, callState: 'ended' }));

    try {
      if (roomName) {
        await fetch(`${API}/dialer/hangup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        });
      }
    } catch (err) {
      console.error('[Dialer] Hangup error:', err);
      // Still show ended state — room may already be gone
    } finally {
      hangingUp.current = false;
      setTimeout(() => {
        setState({
          callState: 'idle',
          roomName: null,
          number: '',
          errorMsg: '',
          isMuted: false,
          isOnHold: false,
          elapsedSeconds: 0,
        });
      }, 1500);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────

  const { callState, number, isMuted, isOnHold, elapsedSeconds, errorMsg } = state;
  const isActive  = callState === 'ringing' || callState === 'connected';
  const isBusy    = callState === 'dialing' || callState === 'ended';
  const { text: stateText, color: stateColor } = STATE_LABEL[callState];

  const keys = [
    { digit: '1', letters: '' },  { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },{ digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },{ digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },  { digit: '0', letters: '+' },   { digit: '#', letters: '' },
  ];

  return (
    <div className="w-full mx-auto bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100/50">
      <div className="flex flex-col items-center">

        {/* ── Display ─────────────────────────────────────────────────── */}
        <div className="w-full mb-5">
          {/* Number / status display */}
          <div className="h-16 flex items-center justify-center relative bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            {/* Animated background when ringing */}
            {callState === 'ringing' && (
              <div
                className="absolute inset-0 opacity-10 animate-pulse"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
              />
            )}
            {/* Animated background when connected */}
            {callState === 'connected' && (
              <div
                className="absolute inset-0 opacity-10"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}
              />
            )}

            {callState === 'idle' ? (
              <input
                type="text"
                className="w-full bg-transparent text-center text-2xl tracking-wider font-semibold z-10 focus:outline-none text-slate-800 placeholder-slate-300"
                placeholder="Enter Number"
                value={number}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d+*#]/g, '').slice(0, 15);
                  setState((s) => ({ ...s, number: val }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && number.trim()) {
                    handleCall();
                  }
                }}
              />
            ) : (
              <span className="text-2xl tracking-wider font-semibold z-10 text-slate-800">
                {number}
              </span>
            )}

            {number && callState === 'idle' && (
              <button
                onClick={handleDelete}
                className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200/50 rounded-full z-10"
              >
                <Delete size={18} />
              </button>
            )}
          </div>

          {/* Status row */}
          <div className="flex items-center justify-center gap-2 mt-2.5 h-6">
            {callState === 'dialing' && (
              <Loader2 size={13} className="animate-spin" style={{ color: stateColor }} />
            )}
            {callState === 'ringing' && (
              <span className="flex gap-0.5">
                {[0,1,2].map((i) => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: stateColor, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            )}
            {callState === 'connected' && (
              <CheckCircle2 size={13} style={{ color: stateColor }} />
            )}
            {callState === 'ended' && (
              <WifiOff size={13} style={{ color: stateColor }} />
            )}
            {callState === 'error' && (
              <AlertCircle size={13} style={{ color: stateColor }} />
            )}

            <span className="text-sm font-medium" style={{ color: stateColor }}>
              {callState === 'connected'
                ? `${stateText} · ${formatDuration(elapsedSeconds)}`
                : callState === 'error'
                ? errorMsg || stateText
                : stateText}
            </span>
          </div>
        </div>

        {/* ── Dial Pad — only when idle ────────────────────────────────── */}
        {callState === 'idle' && (
          <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mb-7">
            {keys.map((key, i) => (
              <button
                key={i}
                onClick={() => handleKeyPress(key.digit)}
                className="group flex flex-col items-center justify-center w-16 h-16 mx-auto rounded-full bg-slate-50/50 hover:bg-teal-50 hover:shadow-md transition-all duration-200 border border-slate-100 hover:border-teal-100 active:scale-95"
              >
                <span className="text-2xl font-medium text-slate-700 group-hover:text-teal-700 leading-none">
                  {key.digit}
                </span>
                {key.letters && (
                  <span className="text-[9px] font-semibold text-slate-400 group-hover:text-teal-500 uppercase tracking-widest mt-0.5">
                    {key.letters}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── In-call controls ─────────────────────────────────────────── */}
        {isActive && (
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
            {/* Mute */}
            <button
              onClick={() => setState((s) => ({ ...s, isMuted: !s.isMuted }))}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${
                isMuted
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isMuted ? <MicOff size={20} className="mb-1" /> : <Mic size={20} className="mb-1" />}
              <span className="text-xs font-medium">Mute</span>
            </button>

            {/* Hold */}
            <button
              onClick={() => setState((s) => ({ ...s, isOnHold: !s.isOnHold }))}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${
                isOnHold
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isOnHold ? <Play size={20} className="mb-1" /> : <Pause size={20} className="mb-1" />}
              <span className="text-xs font-medium">Hold</span>
            </button>

            {/* Transfer (future) */}
            <button className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all bg-slate-50 text-slate-400 cursor-not-allowed opacity-50">
              <ArrowRightLeft size={20} className="mb-1" />
              <span className="text-xs font-medium">Transfer</span>
            </button>

            {/* Add (future) */}
            <button className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all bg-slate-50 text-slate-400 cursor-not-allowed opacity-50">
              <UserPlus size={20} className="mb-1" />
              <span className="text-xs font-medium">Add</span>
            </button>

            {/* Supervisor (future) */}
            <button className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all bg-slate-50 text-slate-400 cursor-not-allowed opacity-50">
              <ShieldAlert size={20} className="mb-1" />
              <span className="text-[11px] font-medium text-center leading-tight">Supervisor</span>
            </button>

            {/* Volume (future) */}
            <button className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all bg-slate-50 text-slate-400 cursor-not-allowed opacity-50">
              <Volume2 size={20} className="mb-1" />
              <span className="text-xs font-medium">Volume</span>
            </button>
          </div>
        )}

        {/* ── Primary Action Button ─────────────────────────────────────── */}
        <div className="w-full max-w-[280px]">
          {/* END CALL */}
          {(isActive || isBusy) ? (
            <button
              onClick={isActive ? handleHangup : undefined}
              disabled={isBusy}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-white transition-all duration-200 ${
                isBusy
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isBusy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {callState === 'dialing' ? 'Connecting…' : 'Ending…'}
                </>
              ) : (
                <>
                  <PhoneOff size={18} />
                  End Call
                </>
              )}
            </button>
          ) : (
            /* CALL */
            <button
              onClick={handleCall}
              disabled={!number.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 hover:from-teal-600 hover:to-emerald-500 text-white font-medium shadow-lg shadow-teal-500/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              <Phone size={18} fill="currentColor" />
              Call
            </button>
          )}
        </div>

        {/* ── Room debug info (only in dev, non-idle) ───────────────────── */}
        {process.env.NODE_ENV === 'development' && state.roomName && (
          <div className="mt-3 text-[10px] text-slate-400 text-center font-mono">
            Room: {state.roomName}
          </div>
        )}

      </div>
    </div>
  );
}
