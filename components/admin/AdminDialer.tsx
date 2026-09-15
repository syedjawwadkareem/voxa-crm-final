'use client';

// ─── AdminDialer — ARI/AMI/JsSIP Softphone Component ─────────────────────────
// Audio: JsSIP UA registers as PJSIP/AGENT_EXTENSION over wss:// (WebRTC)
// Calls: ARI REST via backend → POST /api/v1/dialer/calls/pstn or /calls/agent
// Events: SSE stream → GET /api/v1/dialer/events (real-time call state)
// Hangup: ARI REST → DELETE /api/v1/dialer/pstn/calls/:callId or /calls/:channelId
// Mute:   JsSIP session.mute() + ARI fallback
// Hold:   JsSIP session.hold() + ARI fallback
//
// Call state machine (driven by SSE events from Asterisk):
//   idle ─→ dialing ─→ ringing-agent ─→ agent-answered ─→ dialing-pstn ─→ bridged ─→ ended ─→ idle

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  Phone, Delete, Mic, MicOff, PhoneOff, Pause, Play,
  ArrowRightLeft, UserPlus, Volume2, ShieldAlert, Loader2,
  AlertCircle, CheckCircle2, WifiOff, Radio, Hash, ChevronDown,
  Search, X, User, MessageSquare, Mail, Layers, Sparkles
} from 'lucide-react';
import { getPortal, getAccessToken } from '@/lib/auth';
import { leadsApi, type CapturedLead } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type CallState =
  | 'idle'
  | 'dialing'
  | 'ringing'          // agent extension ringing (leg A)
  | 'agent-answered'   // agent picked up, dialing PSTN (leg B)
  | 'connected'        // bridged (both legs up)
  | 'ended'
  | 'error';

type PhoneRegState = 'connecting' | 'registered' | 'unregistered' | 'failed' | 'disabled';

interface SipCreds {
  enabled: boolean;
  wsUrl?: string;
  uri?: string;
  authUser?: string;
  password?: string;
  displayName?: string;
  realm?: string;
  agentExtension?: string;
  reason?: string;
}

interface CallInfo {
  callId: string | null;  // PSTN two-leg bridge id (== bridgeId)
  channelId: string | null;  // agent channel id (usable for mute/hold/hangup)
  type: 'pstn' | 'internal' | null;
  destination: string | null;
}

interface DialerState {
  callState: CallState;
  number: string;
  errorMsg: string;
  isMuted: boolean;
  isOnHold: boolean;
  elapsedSeconds: number;
  callRoute: string;
  sipState: PhoneRegState;
  sipWho: string;
  banner: { html: string; type: 'err' | 'warn' } | null;
}

// ── API base ──────────────────────────────────────────────────────────────────

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');
const DIALER = `${API}/dialer`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// 1–5 digits → internal SIP extension; anything else → PSTN
function classifyDestination(val: string): 'none' | 'internal' | 'pstn' {
  const cleaned = val.replace(/[\s\-()]/g, '');
  if (!cleaned) return 'none';
  if (/^\d{1,5}$/.test(cleaned)) return 'internal';
  return 'pstn';
}

const STATE_LABEL: Record<CallState, { text: string; color: string }> = {
  idle: { text: 'Ready', color: '#94a3b8' },
  dialing: { text: 'Dialing…', color: '#f59e0b' },
  ringing: { text: 'Ringing…', color: '#3b82f6' },
  'agent-answered': { text: 'Connecting…', color: '#8b5cf6' },
  connected: { text: 'Connected', color: '#22c55e' },
  ended: { text: 'Call Ended', color: '#ef4444' },
  error: { text: 'Error', color: '#ef4444' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminDialer() {
  const [state, setState] = useState<DialerState>({
    callState: 'idle',
    number: '',
    errorMsg: '',
    isMuted: false,
    isOnHold: false,
    elapsedSeconds: 0,
    callRoute: '',
    sipState: 'connecting',
    sipWho: '',
    banner: null,
  });

  // Omnichannel Leads Search state
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [searchLeadQuery, setSearchLeadQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // DID dropdown — admin can call from any DID in the pool
  const [dids, setDids] = useState<{ _id: string; did_number: string; label: string; status: string }[]>([]);
  const [selectedDid, setSelectedDid] = useState<string>(''); // did_number or empty = use server default

  // Refs — don't trigger re-renders
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callRef = useRef<CallInfo>({ callId: null, channelId: null, type: null, destination: null });
  const phoneRef = useRef<{
    ua: any; session: any; creds: SipCreds | null; registered: boolean; expectInvite: number; fatal: string | null;
  }>({ ua: null, session: null, creds: null, registered: false, expectInvite: 0, fatal: null });
  const sseRef = useRef<EventSource | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const hangingUp = useRef(false);

  // ── Timer ────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    setState(s => ({ ...s, elapsedSeconds: 0 }));
    timerRef.current = setInterval(() => {
      setState(s => ({ ...s, elapsedSeconds: s.elapsedSeconds + 1 }));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setState(s => ({ ...s, elapsedSeconds: 0 }));
  }, []);

  // ── UI helpers ────────────────────────────────────────────────────────────

  const setStatus = useCallback((callState: CallState, errorMsg = '') => {
    setState(s => ({ ...s, callState, errorMsg }));
  }, []);

  const showBanner = useCallback((html: string, type: 'err' | 'warn' = 'warn') => {
    setState(s => ({ ...s, banner: { html, type } }));
  }, []);

  const hideBanner = useCallback(() => {
    setState(s => ({ ...s, banner: null }));
  }, []);

  const resetState = useCallback((msg?: string) => {
    stopTimer();
    callRef.current = { callId: null, channelId: null, type: null, destination: null };
    phoneRef.current.expectInvite = 0;

    // Terminate any active SIP session
    if (phoneRef.current.session && !phoneRef.current.session.isEnded()) {
      try { phoneRef.current.session.terminate(); } catch (_) { }
    }
    phoneRef.current.session = null;

    // Stop remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    setState(s => ({
      ...s,
      callState: 'idle',
      errorMsg: msg || '',
      isMuted: false,
      isOnHold: false,
      elapsedSeconds: 0,
      callRoute: '',
    }));
  }, [stopTimer]);

  // ── Remote audio wiring ───────────────────────────────────────────────────

  const attachRemoteAudio = useCallback((session: any) => {
    const pc = session?.connection;
    if (!pc || pc.__voxaWired) return;
    pc.__voxaWired = true;

    const remoteStream = new MediaStream();

    function playStream() {
      if (remoteStream.getTracks().length === 0) return;
      const el = remoteAudioRef.current;
      if (!el) return;
      if (el.srcObject !== remoteStream) el.srcObject = remoteStream;
      el.play().catch(() => {
        showBanner('<b>Browser blocked audio.</b> Click anywhere to allow it.', 'warn');
        document.addEventListener('click', () => { hideBanner(); el.play().catch(() => { }); }, { once: true });
      });
    }

    pc.addEventListener('track', (ev: RTCTrackEvent) => {
      const track = ev.track;
      if (!remoteStream.getTracks().includes(track)) remoteStream.addTrack(track);
      if (ev.streams?.[0]) {
        ev.streams[0].getTracks().forEach((t: MediaStreamTrack) => {
          if (!remoteStream.getTracks().includes(t)) remoteStream.addTrack(t);
        });
      }
      playStream();
    });

    pc.getReceivers().forEach((r: RTCRtpReceiver) => {
      if (r.track && !remoteStream.getTracks().includes(r.track)) remoteStream.addTrack(r.track);
    });
    playStream();
  }, [showBanner, hideBanner]);

  // ── JsSIP session handling ────────────────────────────────────────────────

  const attachSession = useCallback((session: any, originator: string) => {
    // One call at a time
    if (phoneRef.current.session && !phoneRef.current.session.isEnded()) {
      if (originator === 'remote') {
        try { session.terminate({ status_code: 486, reason_phrase: 'Busy Here' }); } catch (_) { }
      }
      return;
    }
    phoneRef.current.session = session;

    const ANSWER_OPTIONS = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [], rtcpMuxPolicy: 'require' }
    };

    session.on('peerconnection', () => attachRemoteAudio(session));
    session.on('accepted', () => attachRemoteAudio(session));
    session.on('confirmed', () => {
      attachRemoteAudio(session);
      if (callRef.current.type === 'internal') {
        setStatus('connected');
        startTimer();
      }
    });
    session.on('getusermediafailed', () => {
      showBanner('<b>Microphone not available.</b> Check browser permissions.', 'err');
    });
    session.on('ended', () => {
      phoneRef.current.session = null;
      if (!callRef.current.callId && !callRef.current.channelId) resetState('Call ended');
    });
    session.on('failed', (e: any) => {
      phoneRef.current.session = null;
      if (!callRef.current.callId && !callRef.current.channelId) {
        resetState('Call failed' + (e?.cause ? ' — ' + e.cause : ''));
      }
    });

    if (originator !== 'remote') return;

    // Auto-answer solicited INVITE (leg A of a PSTN call we just placed)
    const solicited = Date.now() - phoneRef.current.expectInvite < 45000;
    if (solicited) {
      phoneRef.current.expectInvite = 0;
      session.answer(ANSWER_OPTIONS);
      return;
    }

    // Unexpected inbound call — show incoming UI
    const from = session.remote_identity?.uri?.user || 'unknown';
    setState(s => ({
      ...s,
      callState: 'ringing',
      callRoute: `Incoming call from ${from}`,
    }));
  }, [attachRemoteAudio, setStatus, startTimer, showBanner, resetState]);

  // ── JsSIP UA initialisation ───────────────────────────────────────────────

  const initPhone = useCallback(async () => {
    let creds: SipCreds;
    try {
      const res = await fetch(`${DIALER}/sip/credentials`);
      creds = await res.json();
      if (!res.ok) throw new Error((creds as any).error || `HTTP ${res.status}`);
    } catch (err: any) {
      phoneRef.current.fatal = 'credentials';
      setState(s => ({ ...s, sipState: 'failed', sipWho: '' }));
      showBanner(
        '<b>Could not read SIP credentials</b> from the backend (' + err.message +
        '). Calls will connect but have no audio.',
        'err'
      );
      return;
    }

    if (!creds.enabled) {
      phoneRef.current.fatal = 'disabled';
      setState(s => ({ ...s, sipState: 'disabled', sipWho: creds.uri || '' }));
      showBanner('<b>WEBRTC_AGENT is off</b> — every call will be silent until it is enabled.', 'err');
      return;
    }

    phoneRef.current.creds = creds;
    setState(s => ({ ...s, sipWho: creds.uri || '' }));

    if (!window.isSecureContext) {
      phoneRef.current.fatal = 'insecure';
      setState(s => ({ ...s, sipState: 'failed' }));
      showBanner(
        '<b>Not a secure context.</b> Browsers only allow microphone access over HTTPS ' +
        '(or from localhost). The softphone cannot capture audio here.',
        'err'
      );
      return;
    }

    // Dynamically import JsSIP (client-side only)
    let JsSIP: any;
    try {
      JsSIP = (await import('jssip')).default;
    } catch {
      phoneRef.current.fatal = 'jssip';
      setState(s => ({ ...s, sipState: 'failed' }));
      showBanner('<b>JsSIP failed to load.</b> Check the browser console for details.', 'err');
      return;
    }

    try {
      if (creds.agentExtension && creds.authUser && creds.agentExtension !== creds.authUser) {
        showBanner(
          `<b>Mismatch:</b> browser registers as <code>${creds.authUser}</code> but server rings ` +
          `<code>${creds.agentExtension}</code> for the agent leg. ` +
          'One of SIP_EXTENSION / AGENT_EXTENSION needs to change.',
          'warn'
        );
      }

      const socket = new JsSIP.WebSocketInterface(creds.wsUrl);
      const ua = new JsSIP.UA({
        sockets: [socket],
        uri: creds.uri,
        password: creds.password,
        authorization_user: creds.authUser,
        display_name: creds.displayName,
        realm: creds.realm || undefined,
        register: true,
        register_expires: 300,
        session_timers: false,
      });
      phoneRef.current.ua = ua;

      setState(s => ({ ...s, sipState: 'connecting' }));

      ua.on('connected', () => setState(s => ({ ...s, sipState: 'connecting' })));
      ua.on('registered', () => {
        phoneRef.current.registered = true;
        setState(s => ({ ...s, sipState: 'registered' }));
        hideBanner();
      });
      ua.on('unregistered', () => {
        phoneRef.current.registered = false;
        setState(s => ({ ...s, sipState: 'unregistered' }));
      });
      ua.on('registrationFailed', (e: any) => {
        phoneRef.current.registered = false;
        setState(s => ({ ...s, sipState: 'failed' }));
        showBanner(
          `<b>Registration failed</b> for ${creds.authUser} (${e?.cause || 'unknown'}). ` +
          'Check that the endpoint exists with <code>webrtc=yes</code> and the password matches.',
          'err'
        );
      });
      ua.on('disconnected', (e: any) => {
        phoneRef.current.registered = false;
        setState(s => ({ ...s, sipState: 'unregistered' }));
        if (e?.error) {
          showBanner(
            `<b>Cannot reach ${creds.wsUrl}.</b> Check the Asterisk WebSocket and certificate.`,
            'err'
          );
        }
      });
      ua.on('newRTCSession', (e: any) => attachSession(e.session, e.originator));
      ua.start();
    } catch (err: any) {
      phoneRef.current.fatal = 'init_error';
      setState(s => ({ ...s, sipState: 'failed' }));
      showBanner(`<b>Softphone crashed:</b> ${err.message}`, 'err');
    }
  }, [attachSession, showBanner, hideBanner]);

  // ── SSE event handling ────────────────────────────────────────────────────

  const handleEvent = useCallback((evt: any) => {
    const isOurCall = (e: any) => callRef.current.callId && e.callId === callRef.current.callId;

    switch (evt.event) {
      case 'AriConnected':
        if (!callRef.current.callId && !callRef.current.channelId && !phoneRef.current.session) {
          resetState('Ready to call');
        }
        break;

      case 'AriDisconnected':
        setState(s => ({ ...s, errorMsg: 'ARI disconnected — reconnecting…' }));
        break;

      case 'PstnCallStarted':
        if (!isOurCall(evt)) break;
        setState(s => ({ ...s, callState: 'ringing', callRoute: evt.route || '' }));
        break;

      case 'AgentAnswered':
        if (!isOurCall(evt)) break;
        setState(s => ({
          ...s,
          callState: 'agent-answered',
          callRoute: s.callRoute,
        }));
        break;

      case 'PstnDialing':
        if (!isOurCall(evt)) break;
        setState(s => ({ ...s, callState: 'agent-answered', callRoute: evt.route || evt.dialString || s.callRoute }));
        break;

      case 'PstnCallBridged':
        if (!isOurCall(evt)) break;
        setState(s => ({ ...s, callState: 'connected', callRoute: s.callRoute }));
        startTimer();
        break;

      case 'PstnCallFailed':
        if (!isOurCall(evt)) break;
        stopTimer();
        setState(s => ({
          ...s, callState: 'error',
          errorMsg: 'Failed: ' + (evt.error || 'call could not be completed'),
        }));
        setTimeout(() => resetState(), 3500);
        break;

      case 'PstnLegEnded':
        if (!isOurCall(evt)) break;
        if (evt.leg === 'pstn') {
          setState(s => ({ ...s, errorMsg: `Far end hung up${evt.cause ? ' (' + evt.cause + ')' : ''}` }));
        }
        break;

      case 'PstnCallEnded': {
        if (!isOurCall(evt)) break;
        const never = evt.lastState && evt.lastState !== 'bridged';
        stopTimer();
        setState(s => ({
          ...s, callState: 'ended',
          errorMsg: never ? `Ended before connecting${evt.reason ? ' — ' + evt.reason : ''}` : 'Call ended',
        }));
        setTimeout(() => resetState(), 2000);
        break;
      }

      case 'StasisStart':
        // Direct single-leg PSTN: Local channel answer = far end picked up
        if (!callRef.current.callId && callRef.current.type === 'pstn' && evt.channelId === callRef.current.channelId) {
          setState(s => ({ ...s, callState: 'connected' }));
          startTimer();
        }
        break;

      case 'ChannelDestroyed':
        if (!callRef.current.callId && callRef.current.channelId && evt.channelId === callRef.current.channelId) {
          stopTimer();
          setState(s => ({ ...s, callState: 'ended', errorMsg: 'Call ended' }));
          setTimeout(() => resetState(), 2000);
        }
        break;

      default:
        break;
    }
  }, [startTimer, stopTimer, resetState]);

  const connectEvents = useCallback(() => {
    if (sseRef.current) sseRef.current.close();
    const sse = new EventSource(`${DIALER}/events`);
    sseRef.current = sse;
    sse.onmessage = (msg) => {
      try { handleEvent(JSON.parse(msg.data)); } catch (_) { }
    };
    sse.onerror = () => { }; // EventSource auto-retries
  }, [handleEvent]);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Create the remote audio element once
    const audio = document.createElement('audio');
    audio.setAttribute('autoplay', '');
    audio.setAttribute('playsinline', '');
    audio.style.display = 'none';
    document.body.appendChild(audio);
    remoteAudioRef.current = audio;

    connectEvents();
    initPhone();

    // Load all DIDs (admin can call from any, company only their own)
    const portal = typeof window !== 'undefined' ? getPortal() : 'admin';
    const didPath = portal === 'customer' ? '/dids/company/mine' : '/dids';
    const token = typeof window !== 'undefined' ? getAccessToken() : '';

    fetch(`${API}${didPath}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data && d.data.length > 0) {
          setDids(d.data);
          // Auto-select the first assigned DID — no "system default" fallback
          setSelectedDid(d.data[0].did_number);
        }
      })
      .catch(() => { });

    // Load omnichannel leads (Meta, WhatsApp, Email, CSV, etc.)
    leadsApi.getAll()
      .then(res => {
        if (res.success && res.leads) {
          setLeads(res.leads);
        }
      })
      .catch(() => { });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sseRef.current) sseRef.current.close();
      if (phoneRef.current.ua) { try { phoneRef.current.ua.stop(); } catch (_) { } }
      if (audio.parentNode) audio.parentNode.removeChild(audio);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside listener for leads search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered leads matching user search
  const filteredLeads = useMemo(() => {
    if (!searchLeadQuery.trim()) return [];
    const q = searchLeadQuery.toLowerCase();
    return leads.filter(l =>
      (l.full_name || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.source || '').toLowerCase().includes(q) ||
      (l.form_name || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [leads, searchLeadQuery]);

  const handleSelectLead = (lead: CapturedLead) => {
    const cleaned = (lead.phone || '').replace(/[^\d+*#]/g, '');
    setState(s => ({ ...s, number: cleaned }));
    setSelectedLeadName(lead.full_name || lead.phone);
    setSearchLeadQuery('');
    setIsSearchOpen(false);
  };

  // ── CALL ──────────────────────────────────────────────────────────────────

  // Block the call if no DID is assigned
  async function handleCall() {
    const num = state.number.trim();
    if (!num) return;

    const type = classifyDestination(num);
    if (type === 'none') return;

    // For PSTN calls, require an assigned DID — no server default allowed
    if (type === 'pstn' && !selectedDid) {
      showBanner(
        '<b>No Caller ID selected.</b> Ask your admin to assign a DID to your account before making outbound calls.',
        'err'
      );
      return;
    }

    // Block PSTN calls if softphone not registered (no audio)
    if (type === 'pstn' && phoneRef.current.creds?.enabled && !phoneRef.current.registered) {
      showBanner(
        '<b>Softphone not registered.</b> Wait for "Registered" status before placing a PSTN call ' +
        '— otherwise the call will connect with no audio.',
        'err'
      );
      setStatus('error', 'Softphone not registered');
      setTimeout(() => resetState(), 3000);
      return;
    }

    setState(s => ({ ...s, callState: 'dialing', errorMsg: '' }));
    hideBanner();

    // Internal call: placed straight from the softphone
    if (type === 'internal' && phoneRef.current.registered && phoneRef.current.ua) {
      const creds = phoneRef.current.creds!;
      try {
        const target = `sip:${num}@${creds.realm || ''}`;
        phoneRef.current.ua.call(target, {
          mediaConstraints: { audio: true, video: false },
          pcConfig: { iceServers: [], rtcpMuxPolicy: 'require' }
        });
        callRef.current = { callId: null, channelId: null, type: 'internal', destination: num };
        setState(s => ({ ...s, callState: 'ringing', callRoute: `Softphone → ${target}` }));
      } catch (err: any) {
        resetState('Could not place the call: ' + err.message);
      }
      return;
    }

    // PSTN call: server-side origination via ARI
    if (type === 'pstn') phoneRef.current.expectInvite = Date.now();

    try {
      let res: Response, data: any;

      if (type === 'internal') {
        res = await fetch(`${DIALER}/calls/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: num }),
        });
      } else {
        res = await fetch(`${DIALER}/calls/pstn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: num,
            ...(selectedDid ? { caller_id: selectedDid } : {}),
          }),
        });
      }

      data = await res.json().catch(() => ({}));

      if (!res.ok || !(data.id || data.callId)) {
        phoneRef.current.expectInvite = 0;
        const msg = data.error || data.message || `Server error ${res.status}`;
        setState(s => ({ ...s, callState: 'error', errorMsg: msg }));
        setTimeout(() => resetState(), 4000);
        return;
      }

      callRef.current = {
        callId: data.callId || null,
        channelId: data.id || null,
        type,
        destination: data.destination || num,
      };

      if (data.warning) showBanner('<b>No audio on this call.</b> ' + data.warning, 'err');

      setState(s => ({
        ...s,
        callState: 'ringing',
        callRoute: data.route || (type === 'internal' ? `Direct → PJSIP/${num}` : `${num} via trunk`),
      }));

    } catch (_err) {
      phoneRef.current.expectInvite = 0;
      setState(s => ({ ...s, callState: 'error', errorMsg: 'Network error — is the server running?' }));
      setTimeout(() => resetState(), 4000);
    }
  }

  // ── HANGUP ────────────────────────────────────────────────────────────────

  async function handleHangup() {
    if (hangingUp.current) return;
    hangingUp.current = true;
    phoneRef.current.expectInvite = 0;

    // End SIP session immediately
    if (phoneRef.current.session && !phoneRef.current.session.isEnded()) {
      try { phoneRef.current.session.terminate(); } catch (_) { }
    }
    phoneRef.current.session = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    stopTimer();
    setState(s => ({ ...s, callState: 'ended' }));

    const { callId, channelId } = callRef.current;
    const url = callId
      ? `${DIALER}/pstn/calls/${encodeURIComponent(callId)}`
      : channelId
        ? `${DIALER}/calls/${encodeURIComponent(channelId)}`
        : null;

    try {
      if (url) await fetch(url, { method: 'DELETE' });
    } catch (_) { /* channel may already be gone */ }

    hangingUp.current = false;
    setTimeout(() => resetState(), 1500);
  }

  // ── MUTE ─────────────────────────────────────────────────────────────────

  async function handleMute() {
    const isMuted = state.isMuted;

    // Prefer JsSIP mute (stops mic track locally — no re-INVITE)
    if (phoneRef.current.session && !phoneRef.current.session.isEnded()) {
      try {
        if (isMuted) phoneRef.current.session.unmute({ audio: true });
        else phoneRef.current.session.mute({ audio: true });
        setState(s => ({ ...s, isMuted: !isMuted }));
      } catch (_) { }
      return;
    }

    // ARI fallback for calls without a browser SIP leg
    const { channelId } = callRef.current;
    if (!channelId) return;
    try {
      const method = isMuted ? 'DELETE' : 'POST';
      const res = await fetch(`${DIALER}/calls/${encodeURIComponent(channelId)}/mute`, { method });
      if (res.ok || res.status === 204) setState(s => ({ ...s, isMuted: !isMuted }));
    } catch (_) { }
  }

  // ── HOLD ─────────────────────────────────────────────────────────────────

  async function handleHold() {
    const isOnHold = state.isOnHold;

    // Prefer JsSIP hold (sends re-INVITE with sendonly — Asterisk plays MoH)
    if (phoneRef.current.session && !phoneRef.current.session.isEnded()) {
      try {
        if (isOnHold) phoneRef.current.session.unhold();
        else phoneRef.current.session.hold();
        setState(s => ({ ...s, isOnHold: !isOnHold }));
      } catch (_) { }
      return;
    }

    // ARI fallback
    const { channelId } = callRef.current;
    if (!channelId) return;
    try {
      const method = isOnHold ? 'DELETE' : 'POST';
      const res = await fetch(`${DIALER}/calls/${encodeURIComponent(channelId)}/hold`, { method });
      if (res.ok || res.status === 204) setState(s => ({ ...s, isOnHold: !isOnHold }));
    } catch (_) { }
  }

  // ── Answer / Reject incoming (when an unexpected INVITE arrives) ───────────

  function handleAnswerIncoming() {
    if (!phoneRef.current.session) return;
    phoneRef.current.session.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers: [], rtcpMuxPolicy: 'require' }
    });
    callRef.current = { callId: null, channelId: null, type: 'internal', destination: 'inbound' };
    setState(s => ({ ...s, callState: 'connected' }));
    startTimer();
  }

  function handleRejectIncoming() {
    if (!phoneRef.current.session) return;
    try { phoneRef.current.session.terminate({ status_code: 603, reason_phrase: 'Declined' }); } catch (_) { }
    phoneRef.current.session = null;
    resetState('Call declined');
  }

  // ── Keypad ───────────────────────────────────────────────────────────────

  function handleKeyPress(digit: string) {
    if (state.callState !== 'idle') return;
    setState(s => ({ ...s, number: s.number.length < 15 ? s.number + digit : s.number }));
  }

  function handleDelete() {
    setState(s => ({ ...s, number: s.number.slice(0, -1) }));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const { callState, number, isMuted, isOnHold, elapsedSeconds, errorMsg, sipState, sipWho, banner, callRoute } = state;

  const isActive = callState === 'connected';
  const isRinging = callState === 'ringing' || callState === 'agent-answered';
  const isBusy = callState === 'dialing' || callState === 'ended';
  const isInCall = isActive || isRinging || isBusy;

  const { text: stateText, color: stateColor } = STATE_LABEL[callState];

  const sipDotColor =
    sipState === 'registered' ? '#22c55e' :
      sipState === 'connecting' ? '#f59e0b' :
        sipState === 'disabled' ? '#94a3b8' :
          '#ef4444';

  const sipLabel =
    sipState === 'registered' ? 'Registered — audio ready' :
      sipState === 'connecting' ? 'Connecting…' :
        sipState === 'unregistered' ? 'Unregistered' :
          sipState === 'failed' ? 'Registration failed' :
            sipState === 'disabled' ? 'Softphone disabled' :
              'Starting…';

  const keys = [
    { digit: '1', letters: '' }, { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' }, { digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' }, { digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' }, { digit: '0', letters: '+' }, { digit: '#', letters: '' },
  ];

  return (
    <div className="w-full mx-auto bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-slate-100/50">
      <div className="flex flex-col items-center">

        {/* ── SIP registration bar ──────────────────────────────────────── */}
        <div className="w-full mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              className="w-2 h-2 rounded-full inline-block flex-shrink-0 transition-colors duration-300"
              style={{ background: sipDotColor, boxShadow: sipState === 'registered' ? `0 0 6px ${sipDotColor}` : 'none' }}
            />
            {sipLabel}
          </span>
          <span className="text-slate-400 font-mono truncate max-w-[140px]">{sipWho || '—'}</span>
        </div>

        {/* ── Error / warning banner ─────────────────────────────────────── */}
        {banner && (
          <div
            className={`w-full mb-3 text-xs px-3 py-2 rounded-xl border leading-relaxed ${banner.type === 'err'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            dangerouslySetInnerHTML={{ __html: banner.html }}
          />
        )}

        {/* ── DID Caller ID Selector ────────────────────────────────────── */}
        {callState === 'idle' && (
          <div className="w-full mb-4">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Hash size={10} /> Caller ID (DID)
            </label>
            {dids.length === 0 ? (
              <div className="w-full flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                <span className="font-semibold">No DID assigned.</span>
                <span className="text-amber-600">Contact your admin to assign a caller ID.</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="admin-dialer-did-select"
                  value={selectedDid}
                  onChange={e => setSelectedDid(e.target.value)}
                  className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-300 transition-all cursor-pointer pr-8"
                >
                  {dids.map(d => (
                    <option key={d._id} value={d.did_number}>
                      {d.did_number}{d.label ? ` · ${d.label}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>
        )}

        {/* ── Omnichannel Leads Search Bar ──────────────────────────────── */}
        {callState === 'idle' && (
          <div ref={searchContainerRef} className="w-full mb-3.5 relative">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Search size={10} className="text-teal-600" /> Search Omnichannel Leads
              </span>
              {leads.length > 0 && (
                <span className="text-[9px] text-slate-400 font-normal">
                  {leads.length} contacts
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchLeadQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchLeadQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search name, phone, email (Meta, WA...)"
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition-all shadow-2xs"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              {searchLeadQuery && (
                <button
                  onClick={() => {
                    setSearchLeadQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Selected Contact Pill */}
            {selectedLeadName && !searchLeadQuery && (
              <div className="mt-1.5 flex items-center justify-between bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg text-[11px] text-teal-850">
                <span className="truncate flex items-center gap-1 font-medium">
                  <User size={11} className="text-teal-600 flex-shrink-0" />
                  Lead: <strong className="font-semibold text-teal-950">{selectedLeadName}</strong>
                </span>
                <button
                  onClick={() => setSelectedLeadName(null)}
                  className="text-teal-600 hover:text-teal-900 ml-1.5 p-0.5 cursor-pointer"
                  title="Clear selected contact"
                >
                  <X size={11} />
                </button>
              </div>
            )}

            {/* Results Dropdown */}
            {isSearchOpen && searchLeadQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 animate-slide-up">
                {filteredLeads.length === 0 ? (
                  <div className="py-3.5 px-3 text-center text-xs text-slate-400">
                    No leads found matching &ldquo;{searchLeadQuery}&rdquo;
                  </div>
                ) : (
                  filteredLeads.map(lead => {
                    const src = (lead.source || lead.form_name || 'meta').toLowerCase();
                    let badgeBg = 'bg-teal-50 text-teal-700 border-teal-200';
                    let badgeLabel = 'Meta';
                    if (src.includes('whatsapp')) {
                      badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      badgeLabel = 'WhatsApp';
                    } else if (src.includes('email') || src.includes('mail')) {
                      badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      badgeLabel = 'Email';
                    } else if (src.includes('shopify')) {
                      badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                      badgeLabel = 'Shopify';
                    } else if (src.includes('daraz')) {
                      badgeBg = 'bg-orange-50 text-orange-700 border-orange-200';
                      badgeLabel = 'Daraz';
                    } else if (src.includes('csv')) {
                      badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                      badgeLabel = 'CSV';
                    } else if (lead.form_name) {
                      badgeLabel = lead.form_name;
                    }

                    return (
                      <div
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className="p-2.5 hover:bg-teal-50/80 transition cursor-pointer flex items-center justify-between text-left group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-slate-800 text-xs group-hover:text-teal-700 truncate">
                            {lead.full_name || 'Unknown Contact'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={10} className="text-slate-400" />
                            {lead.phone || 'No phone'}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide flex-shrink-0 ${badgeBg}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Display ──────────────────────────────────────────────────── */}
        <div className="w-full mb-5">
          <div className="h-16 flex items-center justify-center relative bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
            {/* Animated background when ringing */}
            {(callState === 'ringing' || callState === 'agent-answered') && (
              <div className="absolute inset-0 opacity-10 animate-pulse"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} />
            )}
            {/* Animated background when connected */}
            {callState === 'connected' && (
              <div className="absolute inset-0 opacity-10"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }} />
            )}

            {callState === 'idle' ? (
              <input
                type="text"
                className="w-full bg-transparent text-center text-2xl tracking-wider font-semibold z-10 focus:outline-none text-slate-800 placeholder-slate-300"
                placeholder="Enter Number"
                value={number}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d+*#]/g, '').slice(0, 15);
                  setState(s => ({ ...s, number: val }));
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && number.trim()) handleCall(); }}
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
            {(callState === 'ringing' || callState === 'agent-answered') && (
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1 h-1 rounded-full animate-bounce"
                    style={{ background: stateColor, animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            )}
            {callState === 'connected' && <CheckCircle2 size={13} style={{ color: stateColor }} />}
            {callState === 'ended' && <WifiOff size={13} style={{ color: stateColor }} />}
            {callState === 'error' && <AlertCircle size={13} style={{ color: stateColor }} />}

            <span className="text-sm font-medium" style={{ color: stateColor }}>
              {callState === 'connected'
                ? `${stateText} · ${formatDuration(elapsedSeconds)}`
                : callState === 'error'
                  ? errorMsg || stateText
                  : stateText}
            </span>
          </div>

          {/* Call route hint */}
          {callRoute && callState !== 'idle' && (
            <div className="mt-1 text-center text-[10px] text-slate-400 font-mono truncate px-2">
              {callRoute}
            </div>
          )}
        </div>

        {/* ── Incoming call UI (unexpected inbound INVITE) ──────────────── */}
        {callState === 'ringing' && !callRef.current.callId && !phoneRef.current.expectInvite && callRoute.startsWith('Incoming') && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col gap-2 items-center">
            <span className="text-sm font-semibold text-blue-800">{callRoute}</span>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={handleAnswerIncoming}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all"
              >
                <Phone size={15} fill="currentColor" /> Answer
              </button>
              <button
                onClick={handleRejectIncoming}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all"
              >
                <PhoneOff size={15} /> Decline
              </button>
            </div>
          </div>
        )}

        {/* ── Dial Pad — only when idle ──────────────────────────────────── */}
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

        {/* ── In-call controls ──────────────────────────────────────────── */}
        {isActive && (
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
            {/* Mute */}
            <button
              onClick={handleMute}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${isMuted
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {isMuted ? <MicOff size={20} className="mb-1" /> : <Mic size={20} className="mb-1" />}
              <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Hold */}
            <button
              onClick={handleHold}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${isOnHold
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
              {isOnHold ? <Play size={20} className="mb-1" /> : <Pause size={20} className="mb-1" />}
              <span className="text-xs font-medium">{isOnHold ? 'Unhold' : 'Hold'}</span>
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
          {isInCall ? (
            <button
              onClick={isActive ? handleHangup : (isRinging ? handleHangup : undefined)}
              disabled={isBusy && !isRinging}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-white transition-all duration-200 ${isBusy && !isRinging
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isBusy && !isRinging ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {callState === 'dialing' ? 'Connecting…' : 'Ending…'}
                </>
              ) : (
                <>
                  <PhoneOff size={18} />
                  {isRinging ? 'Cancel' : 'End Call'}
                </>
              )}
            </button>
          ) : (
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

        {/* ── Dev debug info ────────────────────────────────────────────── */}
        {process.env.NODE_ENV === 'development' && callRef.current.callId && (
          <div className="mt-3 text-[10px] text-slate-400 text-center font-mono">
            callId: {callRef.current.callId}
          </div>
        )}

      </div>
    </div>
  );
}