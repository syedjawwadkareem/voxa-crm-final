'use client';

import { useState, useEffect, useRef } from 'react';
import './voxa.css';

export default function VOXA() {
  const [activePage, setActivePage] = useState('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [callState, setCallState] = useState({
    active: false,
    mute: false,
    hold: false,
    rec: false,
    spk: false,
    start: 0,
  });
  const [spNumber, setSpNumber] = useState('');
  const [spTimer, setSpTimer] = useState('');
  const [recentCalls, setRecentCalls] = useState([
    { num: '(254) 414-3453', dur: '00:48', time: '2m ago' },
    { num: '(408) 521-1715', dur: '02:33', time: '12m ago' },
    { num: '(657) 837-0199', dur: '02:30', time: '1h ago' },
  ]);
  const [toast, setToast] = useState('');
  const [activeKpiCalls, setActiveKpiCalls] = useState(7);
  const [inboundCalls, setInboundCalls] = useState([
    { name: 'John Carter', num: '(555) 234-1122', wait: 12, queue: 'Sales' },
    { name: 'Priya Shah', num: '(555) 998-7712', wait: 34, queue: 'Support' },
    { name: 'Unknown', num: '(408) 111-8899', wait: 6, queue: 'Main' },
  ]);
  const [queueData, setQueueData] = useState([
    { name: 'Sara Kim', num: '(555) 111-0001', wait: 134, queue: 'Sales', prio: 'High' },
    { name: 'Diego Ruiz', num: '(555) 111-0002', wait: 98, queue: 'Support', prio: 'Normal' },
    { name: 'Anna Wu', num: '(555) 111-0003', wait: 66, queue: 'Billing', prio: 'Normal' },
    { name: 'Marcus Lee', num: '(555) 111-0004', wait: 41, queue: 'Support', prio: 'High' },
    { name: 'Ella Brown', num: '(555) 111-0005', wait: 15, queue: 'Sales', prio: 'Normal' },
  ]);
  const [testCallModal, setTestCallModal] = useState(false);
  const [incomingModal, setIncomingModal] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState({ name: '', num: '', avatar: '' });
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const tcFromRef = useRef<HTMLSelectElement>(null);
  const toNumberRef = useRef<HTMLInputElement>(null);

  const agents = [
    { name: 'Amy Smith', color: '#f59e0b', checked: true, status: 'available' },
    { name: 'Robert Mendez', color: '#10b981', checked: true, status: 'on-call' },
    { name: 'Kimberly Woods', color: '#8b5cf6', checked: true, status: 'available' },
    { name: 'Ruth Henderson', color: '#ef4444', checked: false, status: 'away' },
    { name: 'Gregory Medina', color: '#f97316', checked: false, status: 'available' },
  ];

  const numberData = [
    ['(345) 616-1256', 'Free', '—', '—', '', ''],
    ["(345) 616-1256", 'Assigned', "Betty's Shop", 'aman@x.com', '', ''],
    ["(345) 616-1256", 'Assigned', "Betty's Shop", 'robertm@x.com', '', ''],
    ['(254) 414-3453', 'Assigned', "Betty's Shop", 'kimberly@x.com', '', ''],
    ['(254) 614-3453', 'Assigned', "Betty's Shop", 'greg1@x.com', '', ''],
    ['(255) 616-1256', 'Assigned', "Betty's Shop", 'betty@x.com', '', ''],
    ['(345) 616-1256', 'Free', '—', '—', '06/12/2020', 'Provisioning'],
    ['(408) 637-1715', 'Free', '—', '—', '06/13/2020', 'Provisioning'],
    ['(345) 614-1236', 'Free', '—', '—', '06/13/2020', 'Provisioning'],
  ];

  const usersData = [
    { name: 'Aman_Smith', role: 'Global Admin', status: 'Active', owner: 'Aman_Smith', date: '19/10/22', color: '#64748b' },
    { name: 'Kimberly_Woods', role: 'Support Manager', status: 'Active', owner: 'Kimberly_Woods', date: '29/08/22', color: '#8b5cf6' },
    { name: 'Aman_Smith', role: 'Account Owner', status: 'Active', owner: 'Aman_Smith', date: '07/05/22', color: '#0ea5e9' },
    { name: 'Kimberly_Woods', role: 'Account Owner', status: 'Disabled', owner: 'Kimberly_Woods', date: '03/07/22', color: '#a78bfa' },
    { name: 'Tenant_Billing_1', role: 'Sub-User', status: 'Active', owner: 'Aman_Smith', date: '07/09/22', color: '#f59e0b' },
  ];

  const obData = [
    ['09:12', 'Amy Smith', '(254) 414-3453', '02:14', 'Connected', 'Q3 Push'],
    ['09:14', 'Robert Mendez', '(657) 837-0199', '00:45', 'Voicemail', 'Q3 Push'],
    ['09:16', 'Kimberly Woods', '(408) 521-1715', '03:22', 'Connected', 'Retention'],
    ['09:18', 'Amy Smith', '(555) 111-2222', '00:00', 'Failed', 'Q3 Push'],
    ['09:20', 'Gregory Medina', '(365) 654-3233', '01:58', 'Connected', 'Retention'],
  ];

  const billData = [
    ['INV-2026-009', 'Sep 01, 2026', '$1,875.50', 'Paid'],
    ['INV-2026-008', 'Aug 01, 2026', '$1,720.00', 'Paid'],
    ['INV-2026-007', 'Jul 01, 2026', '$1,655.75', 'Paid'],
    ['INV-2026-006', 'Jun 01, 2026', '$1,540.20', 'Paid'],
    ['INV-2026-010', 'Oct 01, 2026', '$1,875.50', 'Pending'],
  ];

  const audit = [
    { who: 'Amy Smith', what: 'Logged in', when: '2 min ago', ip: '192.168.1.10' },
    { who: 'Robert Mendez', what: 'Changed permissions', when: '14 min ago', ip: '10.0.0.4' },
    { who: 'Kimberly Woods', what: 'Downloaded recording', when: '1 hr ago', ip: '192.168.1.22' },
    { who: 'System', what: 'Enabled 2FA for Amy Smith', when: '3 hr ago', ip: 'system' },
    { who: 'Gregory Medina', what: 'Failed login attempt', when: '5 hr ago', ip: '88.14.5.9' },
  ];

  const logsData = [
    ['02:30 AM', 'Fiona Harper', '(254) 414-3453', 'in', '00:48', 'Queue/Line', 'In progress'],
    ['02:30 AM', 'Robert Mendez', '(254) 414-3453', 'out', '04:53', 'Customer Support', 'In progress'],
    ['02:30 AM', 'Kimberly Woods', '(657) 837-0199', 'out', '02:30', 'You answered', 'In progress'],
    ['02:39 AM', 'Amy Smith', '(345) 616-1266', 'out', '02:14', 'Queue/Line', 'In progress'],
    ['02:39 AM', 'Fiona Mender', '(408) 521-1715', 'out', '02:33', 'Queue/Line', 'Missed'],
    ['02:39 AM', 'Kimberly Woods', '(428) 521-1715', 'in', '03:15', 'Queue/Line', 'Missed'],
    ['02:09 AM', 'Gregory Medina', '(365) 654-3233', 'out', '02:15', 'Queue/Line', 'In progress'],
    ['02:00 AM', 'Chris Smith', '(657) 837-0570', 'out', '02:31', 'Queue/Line', 'In progress'],
    ['06:00 AM', 'Sam Bowman', '(365) 654-3233', 'out', '04:33', 'You answered', 'In progress'],
    ['09:00 AM', 'Amy Smith', '(410) 703-3326', 'out', '02:45', 'Queue/Line', 'In progress'],
    ['09:00 AM', 'Kimberly Woods', '(408) 521-1715', 'in', '02:37', 'Queue/Line', 'In progress'],
    ['05:00 AM', 'Gregory Medina', '(530) 451-1715', 'out', '02:36', 'You answered', 'In progress'],
    ['08:00 AM', 'Betty Cooper', '(555) 654-5701', 'out', '02:32', 'You answered', 'In progress'],
  ];

  const ivrToolbox = [
    { icon: '👥', label: 'Ring Group', detail: 'Route to a group' },
    { icon: '📞', label: 'Route to User', detail: 'Assign specific agent' },
    { icon: '📁', label: 'Sub-Menu', detail: 'Nested IVR' },
    { icon: '📧', label: 'VM-to-Email', detail: 'Send voicemail' },
    { icon: '➜', label: 'Forward External', detail: 'Forward outside' },
    { icon: '🕘', label: 'Hours Splitter', detail: 'Business hours' },
  ];

  const [ivr, setIvr] = useState({
    trigger: [
      { icon: '📞', title: 'Call Trigger', detail: 'Incoming Call\n(111) 222-3333' },
      { icon: '🕘', title: 'Business Hours', detail: 'Mon-Fri 9-5' },
    ],
    flow: [
      { icon: '🔊', title: 'Play Greeting', detail: '"Thank you for calling…"' },
      { icon: '📣', title: 'After Hours', detail: 'Play closed message' },
      { icon: '📼', title: 'Voicemail Group', detail: 'Main inbox' },
    ],
    inputs: [
      { key: '1', icon: '👥', title: 'Sales Ring Group' },
      { key: '2', icon: '🛠', title: 'Tech Support' },
      { key: '3', icon: '🙋', title: 'Receptionist' },
      { key: '4', icon: '📼', title: 'Voicemail' },
    ],
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const switchPage = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const dialPad = (k: string) => {
    setSpNumber(spNumber + k);
    playTone();
  };

  const dialBackspace = () => {
    setSpNumber(spNumber.slice(0, -1));
  };

  const playTone = () => {
    try {
      const a = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = a.createOscillator();
      const g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.value = 440;
      g.gain.value = 0.05;
      o.start();
      setTimeout(() => {
        o.stop();
        a.close();
      }, 80);
    } catch (e) {}
  };

  const fmtT = (s: number) => {
    s = Math.floor(s);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const initials = (n: string) => {
    return n
      .split(/\s+|_/)
      .map((x) => x[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const toggleCall = () => {
    if (!callState.active) {
      const num = spNumber.trim();
      if (!num) {
        showToast('Enter a number');
        return;
      }
      setCallState({ ...callState, active: true, start: Date.now() });
      showToast('Calling ' + num);
    } else {
      const dur = fmtT((Date.now() - callState.start) / 1000);
      setCallState({ ...callState, active: false, mute: false, hold: false, rec: false, spk: false });
      setRecentCalls([{ num: spNumber, dur, time: 'Just now' }, ...recentCalls]);
      showToast('Call ended · ' + dur);
    }
  };

  const toggleCtl = (k: string) => {
    const state = callState as any;
    state[k] = !state[k];
    const label = k.charAt(0).toUpperCase() + k.slice(1);
    showToast(label + ' ' + (state[k] ? 'ON' : 'OFF'));
  };

  useEffect(() => {
    if (!callState.active) return;
    const interval = setInterval(() => {
      setSpTimer(fmtT((Date.now() - callState.start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [callState.active, callState.start]);

  useEffect(() => {
    if (callState.active && waveCanvasRef.current) {
      const c = waveCanvasRef.current;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      c.width = c.offsetWidth;
      let x = 0;
      const waveTimer = setInterval(() => {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.strokeStyle = '#0f8f7a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < c.width; i++) {
          const y = c.height / 2 + Math.sin((i + x) * 0.1) * Math.random() * 20;
          if (i) ctx.lineTo(i, y);
          else ctx.moveTo(i, y);
        }
        ctx.stroke();
        x += 3;
      }, 60);
      return () => clearInterval(waveTimer);
    }
  }, [callState.active]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveKpiCalls((prev) => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setQueueData((prev) =>
        prev.map((q) => ({
          ...q,
          wait: q.wait + 1,
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const SimulateIncoming = () => {
    const names = ['Alex Rivera', 'Maya Chen', 'Tom Baker', 'Lila Osei'];
    const n = names[Math.floor(Math.random() * 4)];
    const num = `(555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;
    setIncomingCallInfo({ name: n, num, avatar: initials(n) });
    setIncomingModal(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!callState.active) {
        SimulateIncoming();
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [callState.active]);

  const AnswerIncoming = () => {
    setIncomingModal(false);
    if (inboundCalls.length > 0) {
      const c = inboundCalls[0];
      setSpNumber(c.num);
      setInboundCalls(inboundCalls.slice(1));
      switchPage('softphone');
      setTimeout(() => toggleCall(), 100);
    }
  };

  const DeclineIncoming = () => {
    setIncomingModal(false);
    if (inboundCalls.length > 0) {
      setInboundCalls(inboundCalls.slice(1));
      showToast('Declined');
    }
  };

  const statusChip = (s: string) => {
    if (s === 'Missed') return <span className="chip chip-red">{s}</span>;
    if (s === 'In progress') return <span className="chip chip-green">{s}</span>;
    return <span className="chip chip-gray">{s}</span>;
  };

  const statusBadge = (s: string) => {
    return s === 'Active' ? <span className="chip chip-green">Active</span> : <span className="chip chip-gray">Disabled</span>;
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`sidebar w-64 bg-[color:var(--sidebar)] text-slate-200 flex-shrink-0 flex flex-col ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
          <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
            <path d="M6 12 L10 28 L14 12 L18 28 L22 12 L26 28 L30 12 L34 28" stroke="url(#g1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="g1" x1="0" x2="40">
                <stop stopColor="#22c1a5" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-mark">VOXA</span>
          <button className="ml-auto lg:hidden text-white/70" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="p-3 flex-1 overflow-y-auto text-sm">
          {[
            { key: 'admin', label: 'Admin Panel' },
            { key: 'softphone', label: 'Softphone' },
            { key: 'outbound', label: 'Outbound Calls' },
            { key: 'inbound', label: 'Inbound Calls' },
            { key: 'queue', label: 'Call Queue' },
            { key: 'billing', label: 'Global Billing' },
            { key: 'numbers', label: 'Number Provisioning' },
            { key: 'omni', label: 'OmniChannel' },
            { key: 'ivr', label: 'IVR Menu' },
            { key: 'logs', label: 'Master Logs' },
            { key: 'users', label: 'Users' },
            { key: 'security', label: 'Security' },
          ].map((item) => (
            <div
              key={item.key}
              className={`sidebar-link ${activePage === item.key ? 'active' : ''}`}
              onClick={() => switchPage(item.key)}
            >
              {item.label}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5 text-xs text-slate-400 flex items-center gap-2">
          <span className="avatar" style={{ background: '#f59e0b' }}>AS</span>
          <div>
            <div className="text-white text-sm">Amy Smith</div>
            <div>Global Admin</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="main-topbar">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-outline">☰</button>
          <span className="logo-mark">VOXA</span>
          <button className="ml-auto btn-blue" onClick={() => setTestCallModal(true)}>📞 Test Call</button>
        </div>

        {/* Admin Panel */}
        {activePage === 'admin' && (
          <section className="page active" data-page="admin">
            <div className="px-8 pt-6">
              <div className="text-xs text-slate-500">Global Call Logs Admin Portal: VOXA</div>
              <h1 className="text-2xl font-bold mt-1">Admin Panel — System Overview</h1>
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="kpi">
                <div className="text-xs text-slate-500">Total Users</div>
                <div className="text-2xl font-bold mt-1">142</div>
                <div className="text-xs text-emerald-600 mt-1">▲ 12 this month</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Active Calls</div>
                <div className="text-2xl font-bold mt-1">{activeKpiCalls}</div>
                <div className="text-xs text-slate-500 mt-1">Live now</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Calls Today</div>
                <div className="text-2xl font-bold mt-1">3,240</div>
                <div className="text-xs text-emerald-600 mt-1">▲ 8.2%</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Avg Handle Time</div>
                <div className="text-2xl font-bold mt-1">02:34</div>
                <div className="text-xs text-red-600 mt-1">▼ 3s</div>
              </div>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
              <div className="card p-4 lg:col-span-2">
                <h3 className="font-semibold mb-3">Call Volume (Last 7 Days)</h3>
                <div className="chart-wrap"><canvas id="adminChart"></canvas></div>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">System Health</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>SIP Trunk</span><span className="chip chip-green">● Operational</span></div>
                  <div className="flex justify-between"><span>WhatsApp API</span><span className="chip chip-green">● Operational</span></div>
                  <div className="flex justify-between"><span>SMS Gateway</span><span className="chip chip-yellow">● Degraded</span></div>
                  <div className="flex justify-between"><span>Recording Storage</span><span className="chip chip-green">● 42% used</span></div>
                  <div className="flex justify-between"><span>IVR Engine</span><span className="chip chip-green">● Operational</span></div>
                </div>
                <h3 className="font-semibold mt-5 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-outline" onClick={() => switchPage('softphone')}>📞 Softphone</button>
                  <button className="btn-outline" onClick={() => switchPage('users')}>👥 Add User</button>
                  <button className="btn-outline" onClick={() => switchPage('numbers')}>📱 Numbers</button>
                  <button className="btn-outline" onClick={() => switchPage('logs')}>📄 View Logs</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Softphone */}
        {activePage === 'softphone' && (
          <section className="page active" data-page="softphone">
            <div className="px-8 pt-6">
              <div className="text-xs text-slate-500">Communications</div>
              <h1 className="text-2xl font-bold mt-1">Softphone</h1>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-slate-500">Line</div>
                    <select className="select mt-1">
                      <option>(345) 616-1256</option>
                      <option>(408) 637-1715</option>
                    </select>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Status</div>
                    <div className={`text-sm font-semibold ${callState.active ? 'text-red-600' : 'text-emerald-600'}`}>
                      ● {callState.active ? 'On Call' : 'Ready'}
                    </div>
                  </div>
                </div>
                <input
                  id="sp-number"
                  className="input text-2xl text-center font-mono py-4 mb-1"
                  placeholder="Enter number"
                  value={spNumber}
                  onChange={(e) => setSpNumber(e.target.value)}
                />
                <div id="sp-timer" className="text-center text-xs text-slate-500 mb-3 h-4">{spTimer}</div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    ['1', ''],
                    ['2', 'ABC'],
                    ['3', 'DEF'],
                    ['4', 'GHI'],
                    ['5', 'JKL'],
                    ['6', 'MNO'],
                    ['7', 'PQRS'],
                    ['8', 'TUV'],
                    ['9', 'WXYZ'],
                    ['*', ''],
                    ['0', '+'],
                    ['#', ''],
                  ].map((btn) => (
                    <button key={btn[0]} className="dial-btn" onClick={() => dialPad(btn[0])}>
                      {btn[0]}<span className="sub">{btn[1]}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    id="sp-call-btn"
                    className={`flex-1 py-3 ${callState.active ? 'btn-danger' : 'btn-primary'}`}
                    onClick={toggleCall}
                  >
                    {callState.active ? '✕ End Call' : '📞 Call'}
                  </button>
                  <button className="btn-outline px-3" onClick={dialBackspace}>⌫</button>
                </div>

                <div id="sp-controls" className={`grid grid-cols-4 gap-2 mt-4 ${callState.active ? '' : 'opacity-40 pointer-events-none'}`}>
                  <button className={`ctrl-btn ${callState.mute ? 'on' : ''}`} id="btn-mute" onClick={() => { setCallState({...callState, mute: !callState.mute}); toggleCtl('mute'); }}>
                    🔇<span>Mute</span>
                  </button>
                  <button className={`ctrl-btn ${callState.hold ? 'on' : ''}`} id="btn-hold" onClick={() => { setCallState({...callState, hold: !callState.hold}); toggleCtl('hold'); }}>
                    ⏸<span>Hold</span>
                  </button>
                  <button className={`ctrl-btn ${callState.rec ? 'rec' : ''}`} id="btn-rec" onClick={() => { setCallState({...callState, rec: !callState.rec}); toggleCtl('rec'); }}>
                    ⏺<span>Record</span>
                  </button>
                  <button className={`ctrl-btn ${callState.spk ? 'on' : ''}`} id="btn-spk" onClick={() => { setCallState({...callState, spk: !callState.spk}); toggleCtl('spk'); }}>
                    🔊<span>Speaker</span>
                  </button>
                  <button className="ctrl-btn" onClick={() => showToast('Keypad sent')}>⌨<span>Keypad</span></button>
                  <button className="ctrl-btn" onClick={() => showToast('Transferring…')}>↪<span>Transfer</span></button>
                  <button className="ctrl-btn" onClick={() => showToast('Added to conference')}>👥<span>Conf</span></button>
                  <button className="ctrl-btn" onClick={() => showToast('Note added')}>📝<span>Note</span></button>
                </div>
              </div>

              <div className="card p-5 lg:col-span-2">
                <h3 className="font-semibold mb-3">Active Call</h3>
                {!callState.active ? (
                  <div id="sp-active" className="text-center py-10 text-slate-400">No active call. Dial a number to begin.</div>
                ) : (
                  <div id="sp-active-info">
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '1.2rem', background: '#3b82f6' }} id="ac-avatar">
                        {spNumber.slice(-2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg truncate" id="ac-name">Outbound Call</div>
                        <div className="text-sm text-slate-500" id="ac-num">{spNumber}</div>
                      </div>
                      <button className="btn-danger" onClick={toggleCall}>✕ End</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                      <div><div className="text-xs text-slate-500">Direction</div><div className="font-semibold">Outbound</div></div>
                      <div><div className="text-xs text-slate-500">Queue</div><div className="font-semibold">Sales</div></div>
                      <div><div className="text-xs text-slate-500">Codec</div><div className="font-semibold">Opus 48k</div></div>
                      <div><div className="text-xs text-slate-500">Quality</div><div className="font-semibold text-emerald-600">Excellent</div></div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 mb-1">Live Waveform</div>
                      <canvas ref={waveCanvasRef} id="waveCanvas" height={60} className="w-full border rounded" />
                    </div>
                  </div>
                )}
                <h3 className="font-semibold mt-6 mb-2">Recent</h3>
                <div id="sp-recent" className="space-y-2">
                  {recentCalls.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{r.num}</div>
                        <div className="text-xs text-slate-500">{r.time} · {r.dur}</div>
                      </div>
                      <button className="btn-outline" onClick={() => { setSpNumber(r.num); showToast('Number set'); }}>📞</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Outbound */}
        {activePage === 'outbound' && (
          <section className="page active" data-page="outbound">
            <div className="px-8 pt-6"><h1 className="text-2xl font-bold">Outbound Calls</h1><p className="text-slate-500 text-sm">Manage outbound campaigns and dialing lists.</p></div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">Calls Today</div><div className="text-2xl font-bold" id="ob-today">248</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Connected</div><div className="text-2xl font-bold text-emerald-600">186</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Voicemail</div><div className="text-2xl font-bold text-yellow-600">32</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Failed</div><div className="text-2xl font-bold text-red-600">30</div></div>
            </div>
            <div className="px-8 mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => showToast('New campaign')}>+ New Campaign</button>
              <button className="btn-outline" onClick={() => switchPage('softphone')}>📞 Open Dialer</button>
              <button className="btn-outline" onClick={() => showToast('Exported CSV')}>⬇ Export</button>
            </div>
            <div className="px-8 mt-4 pb-8">
              <div className="card table-wrap">
                <table>
                  <thead><tr><th>Time</th><th>Agent</th><th>Number</th><th>Duration</th><th>Outcome</th><th>Campaign</th><th>Actions</th></tr></thead>
                  <tbody id="obTable">
                    {obData.map((r, i) => {
                      const chipClass = r[4] === 'Connected' ? 'chip-green' : r[4] === 'Voicemail' ? 'chip-yellow' : 'chip-red';
                      return (
                        <tr key={i}>
                          <td>{r[0]}</td>
                          <td>{r[1]}</td>
                          <td>{r[2]}</td>
                          <td>{r[3]}</td>
                          <td><span className={`chip ${chipClass}`}>{r[4]}</span></td>
                          <td>{r[5]}</td>
                          <td><button className="btn-outline" onClick={() => { setSpNumber(r[2]); switchPage('softphone'); }}>📞 Redial</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Inbound */}
        {activePage === 'inbound' && (
          <section className="page active" data-page="inbound">
            <div className="px-8 pt-6"><h1 className="text-2xl font-bold">Inbound Calls</h1><p className="text-slate-500 text-sm">Live incoming calls and routing.</p></div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">Ringing</div><div className="text-2xl font-bold text-blue-600" id="ib-ring">{inboundCalls.length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Answered</div><div className="text-2xl font-bold text-emerald-600">421</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Missed</div><div className="text-2xl font-bold text-red-600">18</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Avg Wait</div><div className="text-2xl font-bold">00:12</div></div>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
              <div className="card p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Live Incoming</h3>
                  <button className="btn-outline" onClick={SimulateIncoming}>+ Simulate Ring</button>
                </div>
                <div id="ibLive" className="space-y-2">
                  {inboundCalls.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded animate-pulse-slow">
                      <span className="status-dot" style={{ background: '#3b82f6' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.num} · {c.queue} · waiting {c.wait}s</div>
                      </div>
                      <button className="btn-primary" onClick={() => {
                        setSpNumber(c.num);
                        setInboundCalls(inboundCalls.filter((_, j) => j !== i));
                        switchPage('softphone');
                        setTimeout(() => toggleCall(), 100);
                      }}>Answer</button>
                      <button className="btn-outline" onClick={() => {
                        setInboundCalls(inboundCalls.filter((_, j) => j !== i));
                        showToast('Call declined');
                      }}>Decline</button>
                    </div>
                  ))}
                  {inboundCalls.length === 0 && <div className="text-center text-slate-500 py-6">No incoming calls</div>}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Routing Rules</h3>
                <div className="space-y-2 text-sm">
                  {[{name: 'Auto-answer after 3 rings', def: true}, {name: 'Route to IVR first', def: true}, {name: 'Voicemail if no agent', def: true}, {name: 'Business hours only', def: false}, {name: 'Record all calls', def: true}].map((rule, i) => (
                    <label key={i} className="flex items-center justify-between"><span>{rule.name}</span><label className="toggle"><input type="checkbox" defaultChecked={rule.def} /><span></span></label></label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Call Queue */}
        {activePage === 'queue' && (
          <section className="page active" data-page="queue">
            <div className="px-8 pt-6"><h1 className="text-2xl font-bold">Call Queue</h1><p className="text-slate-500 text-sm">Waiting callers and agent availability.</p></div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">In Queue</div><div className="text-2xl font-bold" id="q-waiting">{queueData.length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Longest Wait</div><div className="text-2xl font-bold text-orange-600" id="q-long">{queueData.length ? fmtT(Math.max(...queueData.map((q) => q.wait))) : '00:00'}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Available Agents</div><div className="text-2xl font-bold text-emerald-600">4</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">SLA Today</div><div className="text-2xl font-bold">94%</div></div>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Waiting Callers</h3>
                  <button className="btn-outline" onClick={() => { /* refresh */ }}>↻ Refresh</button>
                </div>
                <div id="queueList" className="space-y-2">
                  {queueData.map((q, i) => (
                    <div key={i} className="queue-row">
                      <span className="status-dot" style={{ background: q.prio === 'High' ? '#dc2626' : '#3b82f6' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{q.name}</div>
                        <div className="text-xs text-slate-500">{q.num} · {q.queue}</div>
                      </div>
                      <div className="text-sm font-mono">{fmtT(q.wait)}</div>
                      <button className="btn-primary" onClick={() => {
                        setSpNumber(q.num);
                        setQueueData(queueData.filter((_, j) => j !== i));
                        switchPage('softphone');
                        setTimeout(() => toggleCall(), 100);
                      }}>Pick</button>
                    </div>
                  ))}
                  {queueData.length === 0 && <div className="text-center text-slate-500 py-4">Queue empty</div>}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Agent Status</h3>
                <div id="agentStatus" className="space-y-2">
                  {agents.map((a, i) => {
                    const col = a.status === 'available' ? '#10b981' : a.status === 'on-call' ? '#dc2626' : '#94a3b8';
                    return (
                      <div key={i} className="queue-row">
                        <span className="avatar" style={{ background: a.color }}>{initials(a.name)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{a.name}</div>
                          <div className="text-xs text-slate-500 capitalize">{a.status}</div>
                        </div>
                        <span className="status-dot" style={{ background: col }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Billing */}
        {activePage === 'billing' && (
          <section className="page active" data-page="billing">
            <div className="px-8 pt-6"><h1 className="text-2xl font-bold">Global Billing</h1></div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">Current Balance</div><div className="text-2xl font-bold text-emerald-600">$4,238.10</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">This Month</div><div className="text-2xl font-bold">$1,875.50</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Next Invoice</div><div className="text-2xl font-bold">Oct 1</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Plan</div><div className="text-2xl font-bold">Enterprise</div></div>
            </div>
            <div className="px-8 mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => showToast('Redirecting to payment…')}>💳 Add Funds</button>
              <button className="btn-outline" onClick={() => showToast('Invoice downloaded')}>⬇ Download Invoice</button>
              <button className="btn-outline" onClick={() => switchPage('users')}>Manage Plans</button>
            </div>
            <div className="px-8 mt-4 pb-8">
              <div className="card table-wrap">
                <table>
                  <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody id="billTable">
                    {billData.map((r, i) => (
                      <tr key={i}>
                        <td className="font-medium">{r[0]}</td>
                        <td>{r[1]}</td>
                        <td>{r[2]}</td>
                        <td><span className={`chip ${r[3] === 'Paid' ? 'chip-green' : 'chip-yellow'}`}>{r[3]}</span></td>
                        <td><button className="btn-outline" onClick={() => showToast(`Invoice ${r[0]} downloaded`)}>⬇ PDF</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Security */}
        {activePage === 'security' && (
          <section className="page active" data-page="security">
            <div className="px-8 pt-6"><h1 className="text-2xl font-bold">Security</h1></div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Security Settings</h3>
                <div className="space-y-3 text-sm">
                  {[{label: 'Two-Factor Authentication (2FA)', checked: true}, {label: 'SSO (SAML)', checked: false}, {label: 'IP Allowlist', checked: true}, {label: 'End-to-end Encrypted Recordings', checked: true}, {label: 'Auto-logout after 30 mins', checked: false}, {label: 'Suspicious login alerts', checked: true}].map((item, i) => (
                    <label key={i} className="flex items-center justify-between"><span>{item.label}</span><label className="toggle"><input type="checkbox" defaultChecked={item.checked} /><span></span></label></label>
                  ))}
                </div>
                <button className="btn-primary mt-4" onClick={() => showToast('Security settings saved')}>Save Changes</button>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Recent Audit Log</h3>
                <div id="auditLog" className="space-y-2 text-sm">
                  {audit.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 border-b pb-2">
                      <span className="avatar" style={{ background: '#64748b' }}>{initials(a.who)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm"><b>{a.who}</b> {a.what}</div>
                        <div className="text-xs text-slate-500">{a.when} · {a.ip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Users */}
        {activePage === 'users' && (
          <section className="page active" data-page="users">
            <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs text-slate-500">Workspace Admin</div>
                <h1 className="text-xl md:text-2xl font-bold mt-1">User Management — Multi-Tenant Workspace</h1>
              </div>
              <button className="btn-blue" onClick={() => showToast('New test call')}>New Test Call</button>
            </div>
            <div className="px-8 mt-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold">Global Workspace Overview</h2>
                <button className="btn-blue" onClick={() => showToast('Add user dialog')}>+ Add New Global User</button>
              </div>
              <div className="card mt-4 table-wrap pb-8">
                <table>
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th>Avatar</th>
                      <th>Global Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="usersTable">
                    {usersData.map((u, i) => (
                      <tr key={i}>
                        <td><input type="checkbox" /></td>
                        <td><span className="avatar" style={{ background: u.color }}>{initials(u.name)}</span></td>
                        <td>{u.name}</td>
                        <td>{u.role}</td>
                        <td>{statusBadge(u.status)}</td>
                        <td>{u.owner}</td>
                        <td>{u.date}</td>
                        <td className="whitespace-nowrap">
                          <button className="btn-outline" onClick={() => showToast('Edit user')}>Edit</button>
                          <button className="btn-outline" onClick={() => showToast('User ' + (u.status === 'Active' ? 'disabled' : 'enabled'))}>
                            {u.status === 'Active' ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn-blue" onClick={() => showToast('Permissions panel opened')}>Perms</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Numbers Provisioning */}
        {activePage === 'numbers' && (
          <section className="page active" data-page="numbers">
            <div className="px-8 pt-6">
              <div className="text-xs text-slate-500">Global Call Logs Admin Portal</div>
              <h1 className="text-xl md:text-2xl font-bold mt-1">Number Provisioning Dashboard</h1>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-sm font-semibold">Number Status</div><div className="text-xs text-slate-500 mt-1">Incoming: 111-222-3333 (1/1)</div><div className="text-xs text-slate-500">Outgoing: (4) 616-1256</div></div>
              <div className="kpi"><div className="text-sm font-semibold">Organization</div><div className="text-sm mt-1 font-bold">Phoenix Telecom Inc.</div></div>
              <div className="kpi"><div className="text-sm font-semibold">SIP Trunk</div><div className="text-sm mt-1">Twilio - Connect</div><div className="text-xs text-slate-500">(345) 616-1256</div></div>
              <div className="kpi"><div className="text-sm font-semibold">Next Billable</div><div className="text-xl mt-1 font-bold">Oct 1 — $875.50</div></div>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
                <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search Area Code (e.g. 406)" id="numSearch" />
                <select className="select max-w-xs"><option>Filter by Country/Region</option></select>
              </div>
              <div className="card mt-3 table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th><input type="checkbox" /></th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Client</th>
                      <th>Allocated To</th>
                      <th>Date</th>
                      <th>State</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="numbersTable">
                    {numberData.map((r, i) => (
                      <tr key={i}>
                        <td><input type="checkbox" /></td>
                        <td className="font-medium whitespace-nowrap">{r[0]}</td>
                        <td>{r[1] === 'Free' ? <span className="chip chip-gray">Free</span> : <span className="chip chip-blue">Assigned</span>}</td>
                        <td>{r[2]}</td>
                        <td>{r[3]}</td>
                        <td>{r[4] || '—'}</td>
                        <td>{r[5] || '—'}</td>
                        <td className="whitespace-nowrap">
                          <button className="btn-outline" onClick={() => showToast(`Edit ${r[0]}`)}>✎</button>
                          <button className="btn-outline" onClick={() => showToast('Assign')}>👤+</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* OmniChannel */}
        {activePage === 'omni' && (
          <section className="page active" data-page="omni">
            <div className="px-8 pt-6">
              <div className="text-xs text-slate-500">Global Call Logs Admin Portal: VOXA</div>
              <h1 className="text-2xl font-bold mt-1">Omnichannel — Main Company Hotline</h1>
            </div>
            <div className="px-8 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '∞', label: 'Meta', color: '#1877f2' },
                  { icon: '💬', label: 'WhatsApp', color: '#25d366' },
                  { icon: '✉', label: 'SMS', color: '#334155' },
                  { icon: '📧', label: 'Email', color: '#3b82f6' },
                ].map((c, i) => (
                  <button key={i} className="card p-6 flex flex-col items-center gap-2 hover:shadow-md transition">
                    <div className="text-4xl" style={{ color: c.color }}>{c.icon}</div>
                    <div className="text-lg font-semibold">{c.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 mb-8">
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Combined Omnichannel Usage (Last 30 Days)</h3>
                  <div className="chart-wrap"><canvas id="omniChart"></canvas></div>
                </div>
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">WhatsApp Performance</h3>
                  <div className="table-wrap"><table>
                    <thead><tr><th>Number</th><th>User</th><th>Sent</th><th>Recv</th><th>Rate</th><th>Avg</th></tr></thead>
                    <tbody id="waTable">
                      {[
                        ['(123) 456…', 'Amy Smith', 190, 268, '98.7%', '17.2s'],
                        ['(123) 456…', 'Amy Smith', 336, 400, '98.7%', '17.3s'],
                        ['(123) 456…', 'Mny Number', 220, 258, '98.7%', '12.3s'],
                      ].map((r, i) => (
                        <tr key={i}>
                          {r.map((c, j) => <td key={j}>{c}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* IVR Menu */}
        {activePage === 'ivr' && (
          <section className="page active" data-page="ivr">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">IVR Menu Builder — Main Company Hotline</h1>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card p-4">
                <h3 className="font-semibold mb-3">IVR Builder</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Trigger</div>
                    {ivr.trigger.map((n, i) => (
                      <div key={i} className="ivr-node">
                        <div className="node-title">{n.icon} {n.title}</div>
                        <div className="mt-2 text-xs whitespace-pre-line text-slate-600">{n.detail}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Flow</div>
                    {ivr.flow.map((n, i) => (
                      <div key={i} className="ivr-node">
                        <div className="node-title">{n.icon} {n.title}</div>
                        <div className="mt-2 text-xs whitespace-pre-line text-slate-600">{n.detail}</div>
                      </div>
                    ))}
                    <button className="btn-outline w-full" onClick={() => showToast('Add flow step')}>+ Add flow step</button>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Keypad Inputs</div>
                    <div className="ivr-node bg-slate-50">
                      <div className="node-title">☰ Keypad Inputs</div>
                      <div className="text-xs mt-1 text-slate-500">Press digit → destination</div>
                    </div>
                    {ivr.inputs.map((k, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input className="input" style={{ width: '46px', textAlign: 'center', padding: '.35rem' }} maxLength={1} defaultValue={k.key} />
                        <div className="ivr-node flex-1">
                          <div className="node-title">{k.icon} {k.title}</div>
                        </div>
                      </div>
                    ))}
                    <button className="btn-outline w-full" onClick={() => showToast('Add keypad input')}>+ Add keypad input</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Master Logs */}
        {activePage === 'logs' && (
          <section className="page active" data-page="logs">
            <div className="px-8 pt-6">
              <div className="text-xs text-slate-500">Global Call Logs</div>
              <h1 className="text-2xl font-bold">Master Call History</h1>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card mt-3 table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th><input type="checkbox" id="selAll" /></th>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Number</th>
                      <th>Dir</th>
                      <th>Duration</th>
                      <th>Queue</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="logsTable">
                    {logsData.map((r, i) => {
                      const a = agents.find((x) => x.name === r[1]) || { color: '#64748b' };
                      return (
                        <tr key={i}>
                          <td><input type="checkbox" className="rowSel" /></td>
                          <td className="whitespace-nowrap">Jun 01 · {r[0]}</td>
                          <td className="whitespace-nowrap">
                            <span className="avatar mr-2" style={{ background: a.color }}>{initials(r[1])}</span>
                            {r[1]}
                          </td>
                          <td>{r[2]}</td>
                          <td>{r[3] === 'in' ? '↙ in' : '↗ out'}</td>
                          <td>{r[4]}</td>
                          <td>{r[5]}</td>
                          <td>{statusChip(r[6])}</td>
                          <td className="whitespace-nowrap">
                            <button className="btn-outline" onClick={() => showToast('Viewing call')}>👁</button>
                            <button className="btn-outline" onClick={() => showToast('Listening…')}>🎧</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Test Call Modal */}
      {testCallModal && (
        <div className="modal-backdrop open" id="testCallModal" onClick={() => setTestCallModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Test Call Control</h3>
              <button onClick={() => setTestCallModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">From (Outgoing)</label>
                <select className="select" ref={tcFromRef} id="tcFrom">
                  <option>(345) 616-1256</option>
                  <option>(41) 616-1256</option>
                  <option>(3) 414-3453</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">To (Customer)</label>
                <input className="input" ref={toNumberRef} id="toNumber" placeholder="+1 (___) ___-____" />
              </div>
              <button
                className="w-full btn-primary py-3"
                onClick={() => {
                  const toNum = toNumberRef.current?.value || 'unknown';
                  const fromNum = tcFromRef.current?.value || '';
                  setSpNumber(toNum);
                  setTestCallModal(false);
                  showToast(`Test call from ${fromNum} → ${toNum}`);
                  switchPage('softphone');
                }}
              >
                Initiate Test Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {incomingModal && (
        <div className="modal-backdrop open" onClick={() => setIncomingModal(false)}>
          <div className="modal text-center" onClick={(e) => e.stopPropagation()}>
            <div className="avatar mx-auto mb-3" style={{ width: '70px', height: '70px', fontSize: '1.5rem', background: '#3b82f6' }} id="in-avatar">
              {incomingCallInfo.avatar}
            </div>
            <div className="text-lg font-bold" id="in-name">{incomingCallInfo.name}</div>
            <div className="text-slate-500 mb-6" id="in-num">{incomingCallInfo.num}</div>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary py-3 px-6" onClick={AnswerIncoming}>📞 Answer</button>
              <button className="btn-danger py-3 px-6" onClick={DeclineIncoming}>✕ Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast show`}>{toast}</div>}
    </div>
  );
}
