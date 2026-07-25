// 'use client';

// import { useState, useEffect, useRef, useCallback } from 'react';
// import Chart from 'chart.js/auto';
// import './voxa.css';

// // ==================== ROLE-BASED ACCESS CONTROL ====================

// type UserRole = 'super_admin' | 'platform_admin' | 'tenant_admin' | 'account_manager' | 'sales_rep' | 'support_agent' | 'agent';

// interface RolePermission {
//   canAccessAdmin: boolean;
//   canManageTenants: boolean;
//   canManageDIDs: boolean;
//   canManageUsers: boolean;
//   canManageRoles: boolean;
//   canViewBilling: boolean;
//   canModifyBilling: boolean;
//   canAccessSoftphone: boolean;
//   canMakeOutbound: boolean;
//   canAnswerInbound: boolean;
//   canViewReports: boolean;
//   canManageIVR: boolean;
//   canViewSecurity: boolean;
//   canModifySettings: boolean;
// }

// const rolePermissions: Record<UserRole, RolePermission> = {
//   super_admin: {
//     canAccessAdmin: true,
//     canManageTenants: true,
//     canManageDIDs: true,
//     canManageUsers: true,
//     canManageRoles: true,
//     canViewBilling: true,
//     canModifyBilling: true,
//     canAccessSoftphone: true,
//     canMakeOutbound: true,
//     canAnswerInbound: true,
//     canViewReports: true,
//     canManageIVR: true,
//     canViewSecurity: true,
//     canModifySettings: true,
//   },
//   platform_admin: {
//     canAccessAdmin: true,
//     canManageTenants: true,
//     canManageDIDs: true,
//     canManageUsers: true,
//     canManageRoles: false,
//     canViewBilling: true,
//     canModifyBilling: false,
//     canAccessSoftphone: true,
//     canMakeOutbound: true,
//     canAnswerInbound: true,
//     canViewReports: true,
//     canManageIVR: true,
//     canViewSecurity: true,
//     canModifySettings: false,
//   },
//   tenant_admin: {
//     canAccessAdmin: false,
//     canManageTenants: false,
//     canManageDIDs: true,
//     canManageUsers: true,
//     canManageRoles: false,
//     canViewBilling: true,
//     canModifyBilling: false,
//     canAccessSoftphone: true,
//     canMakeOutbound: true,
//     canAnswerInbound: true,
//     canViewReports: true,
//     canManageIVR: true,
//     canViewSecurity: false,
//     canModifySettings: false,
//   },
//   account_manager: {
//     canAccessAdmin: false,
//     canManageTenants: false,
//     canManageDIDs: false,
//     canManageUsers: false,
//     canManageRoles: false,
//     canViewBilling: true,
//     canModifyBilling: false,
//     canAccessSoftphone: true,
//     canMakeOutbound: true,
//     canAnswerInbound: true,
//     canViewReports: true,
//     canManageIVR: false,
//     canViewSecurity: false,
//     canModifySettings: false,
//   },
//   sales_rep: {
//     canAccessAdmin: false,
//     canManageTenants: false,
//     canManageDIDs: false,
//     canManageUsers: false,
//     canManageRoles: false,
//     canViewBilling: false,
//     canModifyBilling: false,
//     canAccessSoftphone: true,
//     canMakeOutbound: true,
//     canAnswerInbound: false,
//     canViewReports: true,
//     canManageIVR: false,
//     canViewSecurity: false,
//     canModifySettings: false,
//   },
//   support_agent: {
//     canAccessAdmin: false,
//     canManageTenants: false,
//     canManageDIDs: false,
//     canManageUsers: false,
//     canManageRoles: false,
//     canViewBilling: false,
//     canModifyBilling: false,
//     canAccessSoftphone: true,
//     canMakeOutbound: false,
//     canAnswerInbound: true,
//     canViewReports: true,
//     canManageIVR: false,
//     canViewSecurity: false,
//     canModifySettings: false,
//   },
//   agent: {
//     canAccessAdmin: false,
//     canManageTenants: false,
//     canManageDIDs: false,
//     canManageUsers: false,
//     canManageRoles: false,
//     canViewBilling: false,
//     canModifyBilling: false,
//     canAccessSoftphone: true,
//     canMakeOutbound: true,
//     canAnswerInbound: true,
//     canViewReports: false,
//     canManageIVR: false,
//     canViewSecurity: false,
//     canModifySettings: false,
//   },
// };

// const roleLabels: Record<UserRole, string> = {
//   super_admin: 'Super Admin',
//   platform_admin: 'Platform Admin',
//   tenant_admin: 'Tenant Admin',
//   account_manager: 'Account Manager',
//   sales_rep: 'Sales Representative',
//   support_agent: 'Support Agent',
//   agent: 'Agent',
// };

// // =====================================================================

// interface Agent {
//   name: string;
//   color: string;
//   checked: boolean;
//   status: string;
// }

// interface QueueItem {
//   name: string;
//   num: string;
//   wait: number;
//   queue: string;
//   prio: 'High' | 'Normal';
// }

// interface IVRNode {
//   id: string;
//   icon: string;
//   title: string;
//   detail: string;
//   type: 'trigger' | 'flow' | 'input';
// }

// export default function VOXA() {
//   // Page State - declare first
//   const [activePage, setActivePage] = useState('admin');
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   // Role-Based Access Control State
//   const [userRole, setUserRole] = useState<UserRole>('platform_admin');
//   const [userTenant, setUserTenant] = useState('Phoenix Telecom Inc.');
//   const [showRoleSelector, setShowRoleSelector] = useState(false);

//   // Get current user permissions
//   const userPerms = rolePermissions[userRole];

//   // Permission checking functions
//   const hasPermission = useCallback((permission: keyof RolePermission) => {
//     return userPerms[permission];
//   }, [userPerms]);

//   const getPermittedPages = useCallback(() => {
//     const pages = [
//       { key: 'admin', label: 'Admin Panel', required: 'canAccessAdmin' },
//       { key: 'softphone', label: 'Softphone', required: 'canAccessSoftphone' },
//       { key: 'outbound', label: 'Outbound Calls', required: 'canMakeOutbound' },
//       { key: 'inbound', label: 'Inbound Calls', required: 'canAnswerInbound' },
//       { key: 'queue', label: 'Call Queue', required: 'canAnswerInbound' },
//       { key: 'billing', label: 'Global Billing', required: 'canViewBilling' },
//       { key: 'numbers', label: 'DID Management', required: 'canManageDIDs' },
//       { key: 'tenants', label: 'Tenant Management', required: 'canManageTenants' },
//       { key: 'omni', label: 'OmniChannel', required: 'canAccessSoftphone' },
//       { key: 'ivr', label: 'IVR Menu', required: 'canManageIVR' },
//       { key: 'logs', label: 'Master Logs', required: 'canViewReports' },
//       { key: 'users', label: 'Users', required: 'canManageUsers' },
//       { key: 'security', label: 'Security', required: 'canViewSecurity' },
//     ];
//     return pages.filter((p) => hasPermission(p.required as keyof RolePermission));
//   }, [hasPermission]);

//   // Ensure user can access current page
//   const permittedPages = getPermittedPages();
//   const canAccessCurrentPage = permittedPages.some((p) => p.key === activePage);
//   useEffect(() => {
//     if (!canAccessCurrentPage && permittedPages.length > 0) {
//       setActivePage(permittedPages[0].key);
//     }
//   }, [userRole, canAccessCurrentPage, permittedPages]);
//   const [callState, setCallState] = useState({
//     active: false,
//     mute: false,
//     hold: false,
//     rec: false,
//     spk: false,
//     start: 0,
//   });
//   const [spNumber, setSpNumber] = useState('');
//   const [spTimer, setSpTimer] = useState('');
//   const [recentCalls, setRecentCalls] = useState([
//     { num: '(254) 414-3453', dur: '00:48', time: '2m ago' },
//     { num: '(408) 521-1715', dur: '02:33', time: '12m ago' },
//     { num: '(657) 837-0199', dur: '02:30', time: '1h ago' },
//   ]);
//   const [toast, setToast] = useState('');
//   const [activeKpiCalls, setActiveKpiCalls] = useState(7);
//   const [inboundCalls, setInboundCalls] = useState([
//     { name: 'John Carter', num: '(555) 234-1122', wait: 12, queue: 'Sales' },
//     { name: 'Priya Shah', num: '(555) 998-7712', wait: 34, queue: 'Support' },
//     { name: 'Unknown', num: '(408) 111-8899', wait: 6, queue: 'Main' },
//   ]);
//   const [queueData, setQueueData] = useState<QueueItem[]>([
//     { name: 'Sara Kim', num: '(555) 111-0001', wait: 134, queue: 'Sales', prio: 'High' },
//     { name: 'Diego Ruiz', num: '(555) 111-0002', wait: 98, queue: 'Support', prio: 'Normal' },
//     { name: 'Anna Wu', num: '(555) 111-0003', wait: 66, queue: 'Billing', prio: 'Normal' },
//     { name: 'Marcus Lee', num: '(555) 111-0004', wait: 41, queue: 'Support', prio: 'High' },
//     { name: 'Ella Brown', num: '(555) 111-0005', wait: 15, queue: 'Sales', prio: 'Normal' },
//   ]);
  
//   const [testCallModal, setTestCallModal] = useState(false);
//   const [incomingModal, setIncomingModal] = useState(false);
//   const [incomingCallInfo, setIncomingCallInfo] = useState({ name: '', num: '', avatar: '' });
//   const [ivrEditModal, setIvrEditModal] = useState(false);
//   const [editingIvrNode, setEditingIvrNode] = useState<IVRNode | null>(null);
//   const [ivrNodes, setIvrNodes] = useState<{ trigger: IVRNode[]; flow: IVRNode[]; inputs: Array<{ key: string; node: IVRNode }> }>({
//     trigger: [
//       { id: '1', icon: '📞', title: 'Call Trigger', detail: 'Incoming Call\n(111) 222-3333', type: 'trigger' },
//       { id: '2', icon: '🕘', title: 'Business Hours', detail: 'Mon-Fri 9-5', type: 'trigger' },
//     ],
//     flow: [
//       { id: '3', icon: '🔊', title: 'Play Greeting', detail: '"Thank you for calling…"', type: 'flow' },
//       { id: '4', icon: '📣', title: 'After Hours', detail: 'Play closed message', type: 'flow' },
//       { id: '5', icon: '📼', title: 'Voicemail Group', detail: 'Main inbox', type: 'flow' },
//     ],
//     inputs: [
//       { key: '1', node: { id: '6', icon: '👥', title: 'Sales Ring Group', detail: '', type: 'input' } },
//       { key: '2', node: { id: '7', icon: '🛠', title: 'Tech Support', detail: '', type: 'input' } },
//       { key: '3', node: { id: '8', icon: '🙋', title: 'Receptionist', detail: '', type: 'input' } },
//       { key: '4', node: { id: '9', icon: '📼', title: 'Voicemail', detail: '', type: 'input' } },
//     ],
//   });
  
//   const [selectedAgent, setSelectedAgent] = useState<string>('');
//   const [bulkDialModal, setBulkDialModal] = useState(false);
//   const [bulkNumbers, setBulkNumbers] = useState('');
//   const [numberSearch, setNumberSearch] = useState('');
//   const [userSearch, setUserSearch] = useState('');
//   const [permissionsModal, setPermissionsModal] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<string>('');

//   // User Management State
//   const [users, setUsers] = useState([
//     { id: 'USER001', name: 'Aman_Smith', role: 'Global Admin', status: 'Active', owner: 'Aman_Smith', date: '19/10/22', color: '#64748b' },
//     { id: 'USER002', name: 'Kimberly_Woods', role: 'Support Manager', status: 'Active', owner: 'Kimberly_Woods', date: '29/08/22', color: '#8b5cf6' },
//     { id: 'USER003', name: 'Robert_Mendez', role: 'Account Owner', status: 'Active', owner: 'Aman_Smith', date: '07/05/22', color: '#0ea5e9' },
//   ]);
//   const [createUserModal, setCreateUserModal] = useState(false);
//   const [editUserModal, setEditUserModal] = useState(false);
//   const [selectedUserData, setSelectedUserData] = useState<typeof users[0] | null>(null);
//   const [userForm, setUserForm] = useState({ name: '', role: 'Agent', status: 'Active' });
//   const [userFilterStatus, setUserFilterStatus] = useState('All');

//   // DID Management State
//   const [dids, setDids] = useState([
//     { id: 'DID001', phone: '(345) 616-1256', type: 'Inbound', status: 'Active', tenant: 'Phoenix Telecom Inc.', extension: 'ext-001', created: '06/12/2020', provider: 'Twilio' },
//     { id: 'DID002', phone: '(408) 637-1715', type: 'Inbound', status: 'Active', tenant: 'Phoenix Telecom Inc.', extension: 'ext-002', created: '06/13/2020', provider: 'Twilio' },
//     { id: 'DID003', phone: '(254) 414-3453', type: 'Outbound', status: 'Active', tenant: 'Phoenix Telecom Inc.', extension: 'ext-003', created: '06/14/2020', provider: 'Twilio' },
//   ]);
//   const [createDidModal, setCreateDidModal] = useState(false);
//   const [editDidModal, setEditDidModal] = useState(false);
//   const [selectedDid, setSelectedDid] = useState<typeof dids[0] | null>(null);
//   const [didForm, setDidForm] = useState({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' });
//   const [didSearch, setDidSearch] = useState('');

//   // Tenant Management State
//   const [tenants, setTenants] = useState([
//     { id: 'TENANT001', name: 'Phoenix Telecom Inc.', owner: 'Aman Smith', status: 'Active', users: 12, dids: 8, created: '01/05/2022', tier: 'Enterprise' },
//     { id: 'TENANT002', name: 'Betty\'s Shop', owner: 'Betty Cooper', status: 'Active', users: 5, dids: 3, created: '15/06/2022', tier: 'Professional' },
//     { id: 'TENANT003', name: 'Tech Solutions Ltd', owner: 'Robert Mendez', status: 'Inactive', users: 0, dids: 0, created: '20/07/2022', tier: 'Starter' },
//   ]);
//   const [createTenantModal, setCreateTenantModal] = useState(false);
//   const [editTenantModal, setEditTenantModal] = useState(false);
//   const [selectedTenant, setSelectedTenant] = useState<typeof tenants[0] | null>(null);
//   const [tenantForm, setTenantForm] = useState({ name: '', owner: '', tier: 'Professional' });
//   const [tenantSearch, setTenantSearch] = useState('');

//   const waveCanvasRef = useRef<HTMLCanvasElement>(null);
//   const tcFromRef = useRef<HTMLSelectElement>(null);
//   const toNumberRef = useRef<HTMLInputElement>(null);
//   const adminChartRef = useRef<HTMLCanvasElement>(null);
//   const omniChartRef = useRef<HTMLCanvasElement>(null);
//   const adminChartInstanceRef = useRef<Chart | null>(null);
//   const omniChartInstanceRef = useRef<Chart | null>(null);

//   const agents: Agent[] = [
//     { name: 'Amy Smith', color: '#f59e0b', checked: true, status: 'available' },
//     { name: 'Robert Mendez', color: '#10b981', checked: true, status: 'on-call' },
//     { name: 'Kimberly Woods', color: '#8b5cf6', checked: true, status: 'available' },
//     { name: 'Ruth Henderson', color: '#ef4444', checked: false, status: 'away' },
//     { name: 'Gregory Medina', color: '#f97316', checked: false, status: 'available' },
//   ];

//   const numberData = [
//     { phone: '(345) 616-1256', status: 'Free', client: '—', allocated: '—', date: '', state: '' },
//     { phone: '(345) 616-1256', status: 'Assigned', client: "Betty's Shop", allocated: 'aman@x.com', date: '', state: '' },
//     { phone: '(345) 616-1256', status: 'Assigned', client: "Betty's Shop", allocated: 'robertm@x.com', date: '', state: '' },
//     { phone: '(254) 414-3453', status: 'Assigned', client: "Betty's Shop", allocated: 'kimberly@x.com', date: '', state: '' },
//     { phone: '(254) 614-3453', status: 'Assigned', client: "Betty's Shop", allocated: 'greg1@x.com', date: '', state: '' },
//   ];

//   const usersData = [
//     { name: 'Aman_Smith', role: 'Global Admin', status: 'Active', owner: 'Aman_Smith', date: '19/10/22', color: '#64748b' },
//     { name: 'Kimberly_Woods', role: 'Support Manager', status: 'Active', owner: 'Kimberly_Woods', date: '29/08/22', color: '#8b5cf6' },
//     { name: 'Robert_Mendez', role: 'Account Owner', status: 'Active', owner: 'Robert_Mendez', date: '07/05/22', color: '#0ea5e9' },
//     { name: 'Ruth_Henderson', role: 'Sub-User', status: 'Disabled', owner: 'Aman_Smith', date: '03/07/22', color: '#a78bfa' },
//     { name: 'Gregory_Medina', role: 'Agent', status: 'Active', owner: 'Aman_Smith', date: '07/09/22', color: '#f59e0b' },
//   ];

//   const obData = [
//     ['09:12', 'Amy Smith', '(254) 414-3453', '02:14', 'Connected', 'Q3 Push'],
//     ['09:14', 'Robert Mendez', '(657) 837-0199', '00:45', 'Voicemail', 'Q3 Push'],
//     ['09:16', 'Kimberly Woods', '(408) 521-1715', '03:22', 'Connected', 'Retention'],
//     ['09:18', 'Amy Smith', '(555) 111-2222', '00:00', 'Failed', 'Q3 Push'],
//     ['09:20', 'Gregory Medina', '(365) 654-3233', '01:58', 'Connected', 'Retention'],
//   ];

//   const billData = [
//     { invoice: 'INV-2026-009', date: 'Sep 01, 2026', amount: '$1,875.50', status: 'Paid' },
//     { invoice: 'INV-2026-008', date: 'Aug 01, 2026', amount: '$1,720.00', status: 'Paid' },
//     { invoice: 'INV-2026-007', date: 'Jul 01, 2026', amount: '$1,655.75', status: 'Paid' },
//     { invoice: 'INV-2026-006', date: 'Jun 01, 2026', amount: '$1,540.20', status: 'Paid' },
//     { invoice: 'INV-2026-010', date: 'Oct 01, 2026', amount: '$1,875.50', status: 'Pending' },
//   ];

//   const audit = [
//     { who: 'Amy Smith', what: 'Logged in', when: '2 min ago', ip: '192.168.1.10' },
//     { who: 'Robert Mendez', what: 'Changed permissions', when: '14 min ago', ip: '10.0.0.4' },
//     { who: 'Kimberly Woods', what: 'Downloaded recording', when: '1 hr ago', ip: '192.168.1.22' },
//     { who: 'System', what: 'Enabled 2FA for Amy Smith', when: '3 hr ago', ip: 'system' },
//     { who: 'Gregory Medina', what: 'Failed login attempt', when: '5 hr ago', ip: '88.14.5.9' },
//   ];

//   const logsData = [
//     ['02:30 AM', 'Fiona Harper', '(254) 414-3453', 'in', '00:48', 'Queue/Line', 'In progress'],
//     ['02:30 AM', 'Robert Mendez', '(254) 414-3453', 'out', '04:53', 'Customer Support', 'In progress'],
//     ['02:30 AM', 'Kimberly Woods', '(657) 837-0199', 'out', '02:30', 'You answered', 'In progress'],
//     ['02:39 AM', 'Amy Smith', '(345) 616-1266', 'out', '02:14', 'Queue/Line', 'In progress'],
//     ['02:39 AM', 'Fiona Mender', '(408) 521-1715', 'out', '02:33', 'Queue/Line', 'Missed'],
//   ];

//   const showToast = (msg: string) => {
//     setToast(msg);
//     setTimeout(() => setToast(''), 2200);
//   };

//   const switchPage = (page: string) => {
//     setActivePage(page);
//     setSidebarOpen(false);
//     window.scrollTo(0, 0);
//   };

//   const dialPad = (k: string) => {
//     setSpNumber(spNumber + k);
//     playTone();
//   };

//   const dialBackspace = () => {
//     setSpNumber(spNumber.slice(0, -1));
//   };

//   const playTone = () => {
//     try {
//       const a = new (window.AudioContext || (window as any).webkitAudioContext)();
//       const o = a.createOscillator();
//       const g = a.createGain();
//       o.connect(g);
//       g.connect(a.destination);
//       o.frequency.value = 440;
//       g.gain.value = 0.05;
//       o.start();
//       setTimeout(() => {
//         o.stop();
//         a.close();
//       }, 80);
//     } catch (e) {}
//   };

//   const fmtT = (s: number) => {
//     s = Math.floor(s);
//     return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
//   };

//   const initials = (n: string) => {
//     return n
//       .split(/\s+|_/)
//       .map((x) => x[0] || '')
//       .join('')
//       .slice(0, 2)
//       .toUpperCase();
//   };

//   const toggleCall = () => {
//     if (!callState.active) {
//       const num = spNumber.trim();
//       if (!num) {
//         showToast('Enter a number');
//         return;
//       }
//       setCallState({ ...callState, active: true, start: Date.now() });
//       showToast('Calling ' + num);
//     } else {
//       const dur = fmtT((Date.now() - callState.start) / 1000);
//       setCallState({ ...callState, active: false, mute: false, hold: false, rec: false, spk: false });
//       setRecentCalls([{ num: spNumber, dur, time: 'Just now' }, ...recentCalls]);
//       showToast('Call ended · ' + dur);
//     }
//   };

//   const toggleCtl = (k: string) => {
//     const state = callState as any;
//     state[k] = !state[k];
//     const label = k.charAt(0).toUpperCase() + k.slice(1);
//     showToast(label + ' ' + (state[k] ? 'ON' : 'OFF'));
//   };

//   // DID Management Functions
//   const createDid = () => {
//     if (!didForm.phone || !didForm.extension) {
//       showToast('Fill all required fields');
//       return;
//     }
//     const newDid = {
//       id: `DID${String(dids.length + 1).padStart(3, '0')}`,
//       phone: didForm.phone,
//       type: didForm.type as 'Inbound' | 'Outbound',
//       status: 'Active' as const,
//       tenant: didForm.tenant,
//       extension: didForm.extension,
//       created: new Date().toLocaleDateString(),
//       provider: didForm.provider,
//     };
//     setDids([...dids, newDid]);
//     setCreateDidModal(false);
//     setDidForm({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' });
//     showToast(`DID ${didForm.phone} created successfully`);
//   };

//   const updateDid = () => {
//     if (!selectedDid || !didForm.phone || !didForm.extension) {
//       showToast('Fill all required fields');
//       return;
//     }
//     setDids(dids.map(d => d.id === selectedDid.id ? { ...selectedDid, ...didForm, type: didForm.type as 'Inbound' | 'Outbound' } : d));
//     setEditDidModal(false);
//     setSelectedDid(null);
//     setDidForm({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' });
//     showToast(`DID ${didForm.phone} updated successfully`);
//   };

//   const deleteDid = (id: string) => {
//     setDids(dids.filter(d => d.id !== id));
//     showToast('DID deleted successfully');
//   };

//   const assignDidToTenant = (didId: string, tenantId: string) => {
//     const tenant = tenants.find(t => t.id === tenantId);
//     if (!tenant) return;
//     setDids(dids.map(d => d.id === didId ? { ...d, tenant: tenant.name } : d));
//     showToast(`DID assigned to ${tenant.name}`);
//   };

//   // Tenant Management Functions
//   const createTenant = () => {
//     if (!tenantForm.name || !tenantForm.owner) {
//       showToast('Fill all required fields');
//       return;
//     }
//     const newTenant = {
//       id: `TENANT${String(tenants.length + 1).padStart(3, '0')}`,
//       name: tenantForm.name,
//       owner: tenantForm.owner,
//       status: 'Active' as const,
//       users: 0,
//       dids: 0,
//       created: new Date().toLocaleDateString(),
//       tier: tenantForm.tier as 'Starter' | 'Professional' | 'Enterprise',
//     };
//     setTenants([...tenants, newTenant]);
//     setCreateTenantModal(false);
//     setTenantForm({ name: '', owner: '', tier: 'Professional' });
//     showToast(`Tenant ${tenantForm.name} created successfully`);
//   };

//   const updateTenant = () => {
//     if (!selectedTenant || !tenantForm.name || !tenantForm.owner) {
//       showToast('Fill all required fields');
//       return;
//     }
//     setTenants(tenants.map(t => t.id === selectedTenant.id ? { ...selectedTenant, ...tenantForm, tier: tenantForm.tier as 'Starter' | 'Professional' | 'Enterprise' } : t));
//     setEditTenantModal(false);
//     setSelectedTenant(null);
//     setTenantForm({ name: '', owner: '', tier: 'Professional' });
//     showToast(`Tenant ${tenantForm.name} updated successfully`);
//   };

//   const deleteTenant = (id: string) => {
//     if (dids.some(d => tenants.find(t => t.id === id)?.name === d.tenant)) {
//       showToast('Cannot delete tenant with active DIDs');
//       return;
//     }
//     setTenants(tenants.filter(t => t.id !== id));
//     showToast('Tenant deleted successfully');
//   };

//   const toggleTenantStatus = (id: string) => {
//     setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === 'Active' ? 'Inactive' : 'Active' } : t));
//     showToast('Tenant status updated');
//   };

//   // User Management Functions
//   const createUser = () => {
//     if (!userForm.name || !userForm.role) {
//       showToast('Fill all required fields');
//       return;
//     }
//     const newUser = {
//       id: `USER${String(users.length + 1).padStart(3, '0')}`,
//       name: userForm.name,
//       role: userForm.role,
//       status: 'Active' as const,
//       owner: 'Aman_Smith',
//       date: new Date().toLocaleDateString(),
//       color: ['#64748b', '#f59e0b', '#8b5cf6', '#0ea5e9', '#10b981'][Math.floor(Math.random() * 5)],
//     };
//     setUsers([...users, newUser]);
//     setCreateUserModal(false);
//     setUserForm({ name: '', role: 'Agent', status: 'Active' });
//     showToast(`User ${userForm.name} created successfully`);
//   };

//   const updateUser = () => {
//     if (!selectedUserData || !userForm.name || !userForm.role) {
//       showToast('Fill all required fields');
//       return;
//     }
//     setUsers(users.map(u => u.id === selectedUserData.id ? { ...selectedUserData, ...userForm } : u));
//     setEditUserModal(false);
//     setSelectedUserData(null);
//     setUserForm({ name: '', role: 'Agent', status: 'Active' });
//     showToast(`User ${userForm.name} updated successfully`);
//   };

//   const deleteUser = (id: string) => {
//     setUsers(users.filter(u => u.id !== id));
//     showToast('User deleted successfully');
//   };

//   const toggleUserStatus = (id: string) => {
//     setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u));
//     showToast('User status updated');
//   };

//   const filteredUsers = users.filter(u => {
//     const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
//     const matchesStatus = userFilterStatus === 'All' || u.status === userFilterStatus;
//     return matchesSearch && matchesStatus;
//   });

//   // Initialize and draw charts
//   useEffect(() => {
//     if (activePage === 'admin' && adminChartRef.current) {
//       if (adminChartInstanceRef.current) {
//         adminChartInstanceRef.current.destroy();
//       }
//       const ctx = adminChartRef.current.getContext('2d');
//       if (ctx) {
//         adminChartInstanceRef.current = new Chart(ctx, {
//           type: 'line',
//           data: {
//             labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
//             datasets: [
//               {
//                 label: 'Call Volume',
//                 data: [450, 520, 480, 610, 580, 420, 350],
//                 borderColor: '#22c1a5',
//                 backgroundColor: 'rgba(34, 193, 165, 0.1)',
//                 tension: 0.4,
//                 fill: true,
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: true,
//             plugins: { legend: { display: false } },
//             scales: {
//               y: { beginAtZero: true, max: 700 },
//             },
//           } as any,
//         });
//       }
//     }
//   }, [activePage]);

//   useEffect(() => {
//     if (activePage === 'omni' && omniChartRef.current) {
//       if (omniChartInstanceRef.current) {
//         omniChartInstanceRef.current.destroy();
//       }
//       const ctx = omniChartRef.current.getContext('2d');
//       if (ctx) {
//         omniChartInstanceRef.current = new Chart(ctx, {
//           type: 'doughnut',
//           data: {
//             labels: ['Voice', 'WhatsApp', 'SMS', 'Email'],
//             datasets: [
//               {
//                 data: [450, 320, 180, 150],
//                 backgroundColor: ['#22c1a5', '#3b82f6', '#f59e0b', '#8b5cf6'],
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: true,
//             plugins: { legend: { position: 'bottom' } },
//           } as any,
//         });
//       }
//     }
//   }, [activePage]);

//   // Timer update
//   useEffect(() => {
//     if (!callState.active) return;
//     const interval = setInterval(() => {
//       setSpTimer(fmtT((Date.now() - callState.start) / 1000));
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [callState.active, callState.start]);

//   // Waveform animation
//   useEffect(() => {
//     if (callState.active && waveCanvasRef.current) {
//       const c = waveCanvasRef.current;
//       const ctx = c.getContext('2d');
//       if (!ctx) return;
//       c.width = c.offsetWidth;
//       let x = 0;
//       const waveTimer = setInterval(() => {
//         ctx.clearRect(0, 0, c.width, c.height);
//         ctx.strokeStyle = '#0f8f7a';
//         ctx.lineWidth = 1.5;
//         ctx.beginPath();
//         for (let i = 0; i < c.width; i++) {
//           const y = c.height / 2 + Math.sin((i + x) * 0.1) * Math.random() * 20;
//           if (i) ctx.lineTo(i, y);
//           else ctx.moveTo(i, y);
//         }
//         ctx.stroke();
//         x += 3;
//       }, 60);
//       return () => clearInterval(waveTimer);
//     }
//   }, [callState.active]);

//   // Active calls update
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setActiveKpiCalls((prev) => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
//     }, 4000);
//     return () => clearInterval(timer);
//   }, []);

//   // Queue timer update
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setQueueData((prev) => prev.map((q) => ({ ...q, wait: q.wait + 1 })));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // Simulate incoming call
//   const SimulateIncoming = () => {
//     const names = ['Alex Rivera', 'Maya Chen', 'Tom Baker', 'Lila Osei'];
//     const n = names[Math.floor(Math.random() * 4)];
//     const num = `(555) ${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`;
//     setIncomingCallInfo({ name: n, num, avatar: initials(n) });
//     setIncomingModal(true);
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (!callState.active) {
//         SimulateIncoming();
//       }
//     }, 20000);
//     return () => clearTimeout(timer);
//   }, [callState.active]);

//   const AnswerIncoming = () => {
//     setIncomingModal(false);
//     if (inboundCalls.length > 0) {
//       const c = inboundCalls[0];
//       setSpNumber(c.num);
//       setInboundCalls(inboundCalls.slice(1));
//       switchPage('softphone');
//       setTimeout(() => toggleCall(), 100);
//     }
//   };

//   const DeclineIncoming = () => {
//     setIncomingModal(false);
//     if (inboundCalls.length > 0) {
//       setInboundCalls(inboundCalls.slice(1));
//       showToast('Declined');
//     }
//   };

//   const statusChip = (s: string) => {
//     if (s === 'Missed') return <span className="chip chip-red">{s}</span>;
//     if (s === 'In progress') return <span className="chip chip-green">{s}</span>;
//     return <span className="chip chip-gray">{s}</span>;
//   };

//   const statusBadge = (s: string) => {
//     return s === 'Active' ? <span className="chip chip-green">Active</span> : <span className="chip chip-gray">Disabled</span>;
//   };

//   // IVR Node Management
//   const addIVRNode = (type: 'flow' | 'input') => {
//     if (type === 'flow') {
//       const newNode = {
//         id: Date.now().toString(),
//         icon: '📞',
//         title: 'New Flow Step',
//         detail: 'Configure this step',
//         type: 'flow' as const,
//       };
//       setIvrNodes({ ...ivrNodes, flow: [...ivrNodes.flow, newNode] });
//       showToast('Flow step added');
//     }
//   };

//   const removeIVRNode = (id: string, type: 'trigger' | 'flow') => {
//     if (type === 'trigger') {
//       setIvrNodes({ ...ivrNodes, trigger: ivrNodes.trigger.filter((n) => n.id !== id) });
//     } else {
//       setIvrNodes({ ...ivrNodes, flow: ivrNodes.flow.filter((n) => n.id !== id) });
//     }
//     showToast('Node removed');
//   };

//   const addKeypadInput = () => {
//     const nextKey = String((Math.max(...ivrNodes.inputs.map((i) => parseInt(i.key) || 0)) + 1) % 10);
//     const newNode = {
//       key: nextKey,
//       node: {
//         id: Date.now().toString(),
//         icon: '📞',
//         title: 'New Input',
//         detail: '',
//         type: 'input' as const,
//       },
//     };
//     setIvrNodes({ ...ivrNodes, inputs: [...ivrNodes.inputs, newNode] });
//     showToast('Keypad input added');
//   };

//   const updateKeypadNode = (index: number, key: string, title: string, icon: string) => {
//     const updated = [...ivrNodes.inputs];
//     updated[index] = {
//       key,
//       node: {
//         ...updated[index].node,
//         title,
//         icon,
//       },
//     };
//     setIvrNodes({ ...ivrNodes, inputs: updated });
//   };

//   const removeKeypadInput = (index: number) => {
//     setIvrNodes({ ...ivrNodes, inputs: ivrNodes.inputs.filter((_, i) => i !== index) });
//     showToast('Keypad input removed');
//   };

//   const bulkDial = () => {
//     if (!bulkNumbers.trim()) {
//       showToast('Enter phone numbers');
//       return;
//     }
//     const numbers = bulkNumbers.split('\n').filter((n) => n.trim());
//     showToast(`Bulk dial queued: ${numbers.length} numbers`);
//     setBulkDialModal(false);
//     setBulkNumbers('');
//   };

//   const filteredNumbers = numberData.filter((n) => n.phone.includes(numberSearch));
//   const filteredDids = dids.filter((d) => d.phone.includes(didSearch) || d.extension.includes(didSearch));
//   const filteredTenants = tenants.filter((t) => t.name.toLowerCase().includes(tenantSearch.toLowerCase()));

//   return (
//     <div className="flex min-h-screen">
//       {/* Sidebar */}
//       <aside className={`sidebar w-64 bg-[color:var(--sidebar)] text-slate-200 flex-shrink-0 flex flex-col ${sidebarOpen ? 'open' : ''}`}>
//         <div className="px-5 py-5 flex items-center gap-2 border-b border-white/5">
//           <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
//             <path d="M6 12 L10 28 L14 12 L18 28 L22 12 L26 28 L30 12 L34 28" stroke="url(#g1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
//             <defs>
//               <linearGradient id="g1" x1="0" x2="40">
//                 <stop stopColor="#22c1a5" />
//                 <stop offset="1" stopColor="#3b82f6" />
//               </linearGradient>
//             </defs>
//           </svg>
//           <span className="logo-mark">VOXA</span>
//           <button className="ml-auto lg:hidden text-white/70" onClick={() => setSidebarOpen(false)}>
//             ✕
//           </button>
//         </div>
//         <nav className="p-3 flex-1 overflow-y-auto text-sm">
//           {permittedPages.map((item) => (
//             <div
//               key={item.key}
//               className={`sidebar-link ${activePage === item.key ? 'active' : ''}`}
//               onClick={() => switchPage(item.key)}
//               title={`Access Level: ${roleLabels[userRole]}`}
//             >
//               {item.label}
//             </div>
//           ))}
//           {permittedPages.length === 0 && <div className="text-slate-500 p-2">No pages available for this role</div>}
//         </nav>
//         <div className="p-4 border-t border-white/5 text-xs text-slate-400 flex items-center gap-2">
//           <span className="avatar" style={{ background: '#f59e0b' }}>AS</span>
//           <div>
//             <div className="text-white text-sm">Amy Smith</div>
//             <div className="text-cyan-400 font-semibold">{roleLabels[userRole]}</div>
//           </div>
//         </div>
//       </aside>

//       {/* Main */}
//       <main className="flex-1 min-w-0">
//         <div className="main-topbar">
//           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-outline">
//             ☰
//           </button>
//           <span className="logo-mark">VOXA</span>
//           <div className="ml-auto flex items-center gap-2">
//             <div className="relative">
//               <button 
//                 className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-3 py-2 rounded border-2 border-cyan-400 shadow-lg transition-all hover:shadow-cyan-400/50" 
//                 onClick={() => setShowRoleSelector(!showRoleSelector)}
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
//                   <path d="M6 12 L10 28 L14 12 L18 28 L22 12 L26 28 L30 12 L34 28" stroke="url(#g1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
//                   <defs>
//                     <linearGradient id="g1" x1="0" x2="40">
//                       <stop stopColor="#22c1a5" />
//                       <stop offset="1" stopColor="#3b82f6" />
//                     </linearGradient>
//                   </defs>
//                 </svg>
//                 <span>{roleLabels[userRole]}</span>
//                 <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
//                 </svg>
//               </button>
//               {showRoleSelector && (
//                 <div className="absolute right-0 top-full mt-2 bg-slate-900 border-2 border-cyan-400 rounded-lg shadow-2xl z-50 min-w-[220px]">
//                   <div className="p-2 border-b border-slate-700">
//                     <div className="text-xs font-bold text-cyan-400 px-2">SELECT ROLE</div>
//                   </div>
//                   {(Object.keys(roleLabels) as UserRole[]).map((role) => (
//                     <button
//                       key={role}
//                       className={`w-full text-left px-4 py-2 text-sm font-medium transition-all ${
//                         userRole === role 
//                           ? 'bg-cyan-500 text-white border-l-4 border-cyan-300' 
//                           : 'text-slate-200 hover:bg-slate-800 hover:text-cyan-300'
//                       }`}
//                       onClick={() => {
//                         setUserRole(role);
//                         setShowRoleSelector(false);
//                         showToast(`Role changed to ${roleLabels[role]}`);
//                       }}
//                     >
//                       {roleLabels[role]}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//             <button className="btn-blue" onClick={() => setTestCallModal(true)}>
//               📞 Test Call
//             </button>
//           </div>
//         </div>

//         {/* Admin Panel */}
//         {activePage === 'admin' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <div className="text-xs text-slate-500">Global Call Logs Admin Portal: VOXA</div>
//               <h1 className="text-2xl font-bold mt-1">Admin Panel — System Overview</h1>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Total Users</div>
//                 <div className="text-2xl font-bold mt-1">142</div>
//                 <div className="text-xs text-emerald-600 mt-1">▲ 12 this month</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Active Calls</div>
//                 <div className="text-2xl font-bold mt-1">{activeKpiCalls}</div>
//                 <div className="text-xs text-slate-500 mt-1">Live now</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Calls Today</div>
//                 <div className="text-2xl font-bold mt-1">3,240</div>
//                 <div className="text-xs text-emerald-600 mt-1">▲ 8.2%</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Avg Handle Time</div>
//                 <div className="text-2xl font-bold mt-1">02:34</div>
//                 <div className="text-xs text-red-600 mt-1">▼ 3s</div>
//               </div>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
//               <div className="card p-4 lg:col-span-2">
//                 <h3 className="font-semibold mb-3">Call Volume (Last 7 Days)</h3>
//                 <canvas ref={adminChartRef} height={300} />
//               </div>
//               <div className="card p-4">
//                 <h3 className="font-semibold mb-3">System Health</h3>
//                 <div className="space-y-3 text-sm">
//                   <div className="flex justify-between">
//                     <span>SIP Trunk</span>
//                     <span className="chip chip-green">● Operational</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>WhatsApp API</span>
//                     <span className="chip chip-green">● Operational</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>SMS Gateway</span>
//                     <span className="chip chip-yellow">● Degraded</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>Recording Storage</span>
//                     <span className="chip chip-green">● 42% used</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span>IVR Engine</span>
//                     <span className="chip chip-green">● Operational</span>
//                   </div>
//                 </div>
//                 <h3 className="font-semibold mt-5 mb-3">Quick Actions</h3>
//                 <div className="grid grid-cols-2 gap-2">
//                   <button className="btn-outline" onClick={() => switchPage('softphone')}>
//                     📞 Softphone
//                   </button>
//                   <button className="btn-outline" onClick={() => switchPage('users')}>
//                     👥 Add User
//                   </button>
//                   <button className="btn-outline" onClick={() => switchPage('numbers')}>
//                     📱 Numbers
//                   </button>
//                   <button className="btn-outline" onClick={() => switchPage('logs')}>
//                     📄 View Logs
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Softphone */}
//         {activePage === 'softphone' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <div className="text-xs text-slate-500">Communications</div>
//               <h1 className="text-2xl font-bold mt-1">Softphone</h1>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
//               <div className="card p-5">
//                 <div className="flex items-center justify-between mb-4">
//                   <div>
//                     <div className="text-xs text-slate-500">Line</div>
//                     <select className="select mt-1">
//                       <option>(345) 616-1256</option>
//                       <option>(408) 637-1715</option>
//                     </select>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-xs text-slate-500">Status</div>
//                     <div className={`text-sm font-semibold ${callState.active ? 'text-red-600' : 'text-emerald-600'}`}>
//                       ● {callState.active ? 'On Call' : 'Ready'}
//                     </div>
//                   </div>
//                 </div>
//                 <input
//                   className="input text-2xl text-center font-mono py-4 mb-1"
//                   placeholder="Enter number"
//                   value={spNumber}
//                   onChange={(e) => setSpNumber(e.target.value)}
//                 />
//                 <div className="text-center text-xs text-slate-500 mb-3 h-4">{spTimer}</div>
//                 <div className="grid grid-cols-3 gap-2 mb-4">
//                   {[
//                     ['1', ''],
//                     ['2', 'ABC'],
//                     ['3', 'DEF'],
//                     ['4', 'GHI'],
//                     ['5', 'JKL'],
//                     ['6', 'MNO'],
//                     ['7', 'PQRS'],
//                     ['8', 'TUV'],
//                     ['9', 'WXYZ'],
//                     ['*', ''],
//                     ['0', '+'],
//                     ['#', ''],
//                   ].map((btn) => (
//                     <button key={btn[0]} className="dial-btn" onClick={() => dialPad(btn[0])}>
//                       {btn[0]}
//                       <span className="sub">{btn[1]}</span>
//                     </button>
//                   ))}
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     className={`flex-1 py-3 ${callState.active ? 'btn-danger' : 'btn-primary'}`}
//                     onClick={toggleCall}
//                   >
//                     {callState.active ? '✕ End Call' : '📞 Call'}
//                   </button>
//                   <button className="btn-outline px-3" onClick={dialBackspace}>
//                     ⌫
//                   </button>
//                 </div>

//                 <div className={`grid grid-cols-4 gap-2 mt-4 ${callState.active ? '' : 'opacity-40 pointer-events-none'}`}>
//                   <button
//                     className={`ctrl-btn ${callState.mute ? 'on' : ''}`}
//                     onClick={() => {
//                       setCallState({ ...callState, mute: !callState.mute });
//                       toggleCtl('mute');
//                     }}
//                   >
//                     🔇<span>Mute</span>
//                   </button>
//                   <button
//                     className={`ctrl-btn ${callState.hold ? 'on' : ''}`}
//                     onClick={() => {
//                       setCallState({ ...callState, hold: !callState.hold });
//                       toggleCtl('hold');
//                     }}
//                   >
//                     ⏸<span>Hold</span>
//                   </button>
//                   <button
//                     className={`ctrl-btn ${callState.rec ? 'rec' : ''}`}
//                     onClick={() => {
//                       setCallState({ ...callState, rec: !callState.rec });
//                       toggleCtl('rec');
//                     }}
//                   >
//                     ⏺<span>Record</span>
//                   </button>
//                   <button
//                     className={`ctrl-btn ${callState.spk ? 'on' : ''}`}
//                     onClick={() => {
//                       setCallState({ ...callState, spk: !callState.spk });
//                       toggleCtl('spk');
//                     }}
//                   >
//                     🔊<span>Speaker</span>
//                   </button>
//                   <button className="ctrl-btn" onClick={() => showToast('Keypad sent')}>
//                     ⌨<span>Keypad</span>
//                   </button>
//                   <button className="ctrl-btn" onClick={() => showToast('Transferring…')}>
//                     ↪<span>Transfer</span>
//                   </button>
//                   <button className="ctrl-btn" onClick={() => showToast('Added to conference')}>
//                     👥<span>Conf</span>
//                   </button>
//                   <button className="ctrl-btn" onClick={() => showToast('Note added')}>
//                     📝<span>Note</span>
//                   </button>
//                 </div>
//               </div>

//               <div className="card p-5 lg:col-span-2">
//                 <h3 className="font-semibold mb-3">Active Call</h3>
//                 {!callState.active ? (
//                   <div className="text-center py-10 text-slate-400">No active call. Dial a number to begin.</div>
//                 ) : (
//                   <div>
//                     <div className="flex items-center gap-4 pb-4 border-b">
//                       <div
//                         className="avatar"
//                         style={{ width: '56px', height: '56px', fontSize: '1.2rem', background: '#3b82f6' }}
//                       >
//                         {spNumber.slice(-2)}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <div className="font-bold text-lg truncate">Outbound Call</div>
//                         <div className="text-sm text-slate-500">{spNumber}</div>
//                       </div>
//                       <button className="btn-danger" onClick={toggleCall}>
//                         ✕ End
//                       </button>
//                     </div>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
//                       <div>
//                         <div className="text-xs text-slate-500">Direction</div>
//                         <div className="font-semibold">Outbound</div>
//                       </div>
//                       <div>
//                         <div className="text-xs text-slate-500">Queue</div>
//                         <div className="font-semibold">Sales</div>
//                       </div>
//                       <div>
//                         <div className="text-xs text-slate-500">Codec</div>
//                         <div className="font-semibold">Opus 48k</div>
//                       </div>
//                       <div>
//                         <div className="text-xs text-slate-500">Quality</div>
//                         <div className="font-semibold text-emerald-600">Excellent</div>
//                       </div>
//                     </div>
//                     <div className="mt-4">
//                       <div className="text-xs text-slate-500 mb-1">Live Waveform</div>
//                       <canvas ref={waveCanvasRef} height={60} className="w-full border rounded" />
//                     </div>
//                   </div>
//                 )}
//                 <h3 className="font-semibold mt-6 mb-2">Recent</h3>
//                 <div className="space-y-2">
//                   {recentCalls.slice(0, 5).map((r, i) => (
//                     <div key={i} className="flex items-center justify-between p-2 border rounded">
//                       <div>
//                         <div className="font-medium text-sm">{r.num}</div>
//                         <div className="text-xs text-slate-500">
//                           {r.time} · {r.dur}
//                         </div>
//                       </div>
//                       <button
//                         className="btn-outline"
//                         onClick={() => {
//                           setSpNumber(r.num);
//                           showToast('Number set');
//                         }}
//                       >
//                         📞
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Outbound */}
//         {activePage === 'outbound' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <h1 className="text-2xl font-bold">Outbound Calls</h1>
//               <p className="text-slate-500 text-sm">Manage outbound campaigns and dialing lists.</p>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Calls Today</div>
//                 <div className="text-2xl font-bold">248</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Connected</div>
//                 <div className="text-2xl font-bold text-emerald-600">186</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Voicemail</div>
//                 <div className="text-2xl font-bold text-yellow-600">32</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Failed</div>
//                 <div className="text-2xl font-bold text-red-600">30</div>
//               </div>
//             </div>
//             <div className="px-8 mt-6 flex flex-wrap gap-2">
//               <button className="btn-primary" onClick={() => showToast('New campaign created')}>
//                 + New Campaign
//               </button>
//               <button className="btn-outline" onClick={() => switchPage('softphone')}>
//                 📞 Open Dialer
//               </button>
//               <button className="btn-outline" onClick={() => setBulkDialModal(true)}>
//                 📋 Bulk Dial
//               </button>
//               <button className="btn-outline" onClick={() => showToast('Exported CSV')}>
//                 ⬇ Export
//               </button>
//             </div>
//             <div className="px-8 mt-4 pb-8">
//               <div className="card table-wrap">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Time</th>
//                       <th>Agent</th>
//                       <th>Number</th>
//                       <th>Duration</th>
//                       <th>Outcome</th>
//                       <th>Campaign</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {obData.map((r, i) => {
//                       const chipClass =
//                         r[4] === 'Connected' ? 'chip-green' : r[4] === 'Voicemail' ? 'chip-yellow' : 'chip-red';
//                       return (
//                         <tr key={i}>
//                           <td>{r[0]}</td>
//                           <td>{r[1]}</td>
//                           <td>{r[2]}</td>
//                           <td>{r[3]}</td>
//                           <td>
//                             <span className={`chip ${chipClass}`}>{r[4]}</span>
//                           </td>
//                           <td>{r[5]}</td>
//                           <td>
//                             <button
//                               className="btn-outline"
//                               onClick={() => {
//                                 setSpNumber(r[2]);
//                                 switchPage('softphone');
//                               }}
//                             >
//                               📞 Redial
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Inbound */}
//         {activePage === 'inbound' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <h1 className="text-2xl font-bold">Inbound Calls</h1>
//               <p className="text-slate-500 text-sm">Live incoming calls and routing.</p>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Ringing</div>
//                 <div className="text-2xl font-bold text-blue-600">{inboundCalls.length}</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Answered</div>
//                 <div className="text-2xl font-bold text-emerald-600">421</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Missed</div>
//                 <div className="text-2xl font-bold text-red-600">18</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Avg Wait</div>
//                 <div className="text-2xl font-bold">00:12</div>
//               </div>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
//               <div className="card p-4 lg:col-span-2">
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="font-semibold">Live Incoming</h3>
//                   <button className="btn-outline" onClick={SimulateIncoming}>
//                     + Simulate Ring
//                   </button>
//                 </div>
//                 <div className="space-y-2">
//                   {inboundCalls.map((c, i) => (
//                     <div key={i} className="flex items-center gap-3 p-3 border rounded animate-pulse-slow">
//                       <span className="status-dot" style={{ background: '#3b82f6' }} />
//                       <div className="flex-1 min-w-0">
//                         <div className="font-semibold truncate">{c.name}</div>
//                         <div className="text-xs text-slate-500">
//                           {c.num} · {c.queue} · waiting {c.wait}s
//                         </div>
//                       </div>
//                       <button
//                         className="btn-primary"
//                         onClick={() => {
//                           setSpNumber(c.num);
//                           setInboundCalls(inboundCalls.filter((_, j) => j !== i));
//                           switchPage('softphone');
//                           setTimeout(() => toggleCall(), 100);
//                         }}
//                       >
//                         Answer
//                       </button>
//                       <button
//                         className="btn-outline"
//                         onClick={() => {
//                           setInboundCalls(inboundCalls.filter((_, j) => j !== i));
//                           showToast('Call declined');
//                         }}
//                       >
//                         Decline
//                       </button>
//                     </div>
//                   ))}
//                   {inboundCalls.length === 0 && <div className="text-center text-slate-500 py-6">No incoming calls</div>}
//                 </div>
//               </div>
//               <div className="card p-4">
//                 <h3 className="font-semibold mb-3">Routing Rules</h3>
//                 <div className="space-y-2 text-sm">
//                   {[
//                     { name: 'Auto-answer after 3 rings', def: true },
//                     { name: 'Route to IVR first', def: true },
//                     { name: 'Voicemail if no agent', def: true },
//                     { name: 'Business hours only', def: false },
//                     { name: 'Record all calls', def: true },
//                   ].map((rule, i) => (
//                     <label key={i} className="flex items-center justify-between">
//                       <span>{rule.name}</span>
//                       <label className="toggle">
//                         <input type="checkbox" defaultChecked={rule.def} />
//                         <span></span>
//                       </label>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Call Queue */}
//         {activePage === 'queue' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <h1 className="text-2xl font-bold">Call Queue</h1>
//               <p className="text-slate-500 text-sm">Waiting callers and agent availability.</p>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">In Queue</div>
//                 <div className="text-2xl font-bold">{queueData.length}</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Longest Wait</div>
//                 <div className="text-2xl font-bold text-orange-600">
//                   {queueData.length ? fmtT(Math.max(...queueData.map((q) => q.wait))) : '00:00'}
//                 </div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Available Agents</div>
//                 <div className="text-2xl font-bold text-emerald-600">4</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">SLA Today</div>
//                 <div className="text-2xl font-bold">94%</div>
//               </div>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
//               <div className="card p-4">
//                 <div className="flex items-center justify-between mb-3">
//                   <h3 className="font-semibold">Waiting Callers</h3>
//                   <button className="btn-outline" onClick={() => showToast('Queue refreshed')}>
//                     ↻ Refresh
//                   </button>
//                 </div>
//                 <div className="space-y-2">
//                   {queueData.map((q, i) => (
//                     <div key={i} className="queue-row">
//                       <span className="status-dot" style={{ background: q.prio === 'High' ? '#dc2626' : '#3b82f6' }} />
//                       <div className="flex-1 min-w-0">
//                         <div className="font-medium truncate">{q.name}</div>
//                         <div className="text-xs text-slate-500">
//                           {q.num} · {q.queue}
//                         </div>
//                       </div>
//                       <div className="text-sm font-mono">{fmtT(q.wait)}</div>
//                       <button
//                         className="btn-primary"
//                         onClick={() => {
//                           setSpNumber(q.num);
//                           setQueueData(queueData.filter((_, j) => j !== i));
//                           switchPage('softphone');
//                           setTimeout(() => toggleCall(), 100);
//                         }}
//                       >
//                         Pick
//                       </button>
//                     </div>
//                   ))}
//                   {queueData.length === 0 && <div className="text-center text-slate-500 py-4">Queue empty</div>}
//                 </div>
//               </div>
//               <div className="card p-4">
//                 <h3 className="font-semibold mb-3">Agent Status</h3>
//                 <div className="space-y-2">
//                   {agents.map((a, i) => {
//                     const col = a.status === 'available' ? '#10b981' : a.status === 'on-call' ? '#dc2626' : '#94a3b8';
//                     return (
//                       <div key={i} className="queue-row">
//                         <span className="avatar" style={{ background: a.color }}>
//                           {initials(a.name)}
//                         </span>
//                         <div className="flex-1 min-w-0">
//                           <div className="font-medium truncate">{a.name}</div>
//                           <div className="text-xs text-slate-500 capitalize">{a.status}</div>
//                         </div>
//                         <span className="status-dot" style={{ background: col }} />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Billing */}
//         {activePage === 'billing' && hasPermission('canViewBilling') && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <h1 className="text-2xl font-bold">Global Billing</h1>
//               <p className="text-slate-500 text-sm">Role: {roleLabels[userRole]} | Modify Billing: {hasPermission('canModifyBilling') ? 'Allowed' : 'Restricted'}</p>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Current Balance</div>
//                 <div className="text-2xl font-bold text-emerald-600">$4,238.10</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">This Month</div>
//                 <div className="text-2xl font-bold">$1,875.50</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Next Invoice</div>
//                 <div className="text-2xl font-bold">Oct 1</div>
//               </div>
//               <div className="kpi">
//                 <div className="text-xs text-slate-500">Plan</div>
//                 <div className="text-2xl font-bold">Enterprise</div>
//               </div>
//             </div>
//             <div className="px-8 mt-6 flex flex-wrap gap-2">
//               <button className="btn-primary" onClick={() => showToast('Redirecting to payment…')}>
//                 💳 Add Funds
//               </button>
//               <button className="btn-outline" onClick={() => showToast('Invoice downloaded')}>
//                 ⬇ Download Invoice
//               </button>
//               <button className="btn-outline" onClick={() => switchPage('users')}>
//                 Manage Plans
//               </button>
//             </div>
//             <div className="px-8 mt-4 pb-8">
//               <div className="card table-wrap">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Invoice</th>
//                       <th>Date</th>
//                       <th>Amount</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {billData.map((r, i) => (
//                       <tr key={i}>
//                         <td className="font-medium">{r.invoice}</td>
//                         <td>{r.date}</td>
//                         <td>{r.amount}</td>
//                         <td>
//                           <span className={`chip ${r.status === 'Paid' ? 'chip-green' : 'chip-yellow'}`}>
//                             {r.status}
//                           </span>
//                         </td>
//                         <td>
//                           <button className="btn-outline" onClick={() => showToast(`Invoice ${r.invoice} downloaded`)}>
//                             ⬇ PDF
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Security */}
//         {activePage === 'security' && hasPermission('canViewSecurity') && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <h1 className="text-2xl font-bold">Security</h1>
//               <p className="text-slate-500 text-sm">Role: {roleLabels[userRole]}</p>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
//               <div className="card p-4">
//                 <h3 className="font-semibold mb-3">Security Settings</h3>
//                 <div className="space-y-3 text-sm">
//                   {[
//                     { label: 'Two-Factor Authentication (2FA)', checked: true },
//                     { label: 'SSO (SAML)', checked: false },
//                     { label: 'IP Allowlist', checked: true },
//                     { label: 'End-to-end Encrypted Recordings', checked: true },
//                     { label: 'Auto-logout after 30 mins', checked: false },
//                     { label: 'Suspicious login alerts', checked: true },
//                   ].map((item, i) => (
//                     <label key={i} className="flex items-center justify-between">
//                       <span>{item.label}</span>
//                       <label className="toggle">
//                         <input type="checkbox" defaultChecked={item.checked} />
//                         <span></span>
//                       </label>
//                     </label>
//                   ))}
//                 </div>
//                 <button className="btn-primary mt-4" onClick={() => showToast('Security settings saved')}>
//                   Save Changes
//                 </button>
//               </div>
//               <div className="card p-4">
//                 <h3 className="font-semibold mb-3">Recent Audit Log</h3>
//                 <div className="space-y-2 text-sm">
//                   {audit.map((a, i) => (
//                     <div key={i} className="flex items-start gap-3 border-b pb-2">
//                       <span className="avatar" style={{ background: '#64748b' }}>
//                         {initials(a.who)}
//                       </span>
//                       <div className="flex-1 min-w-0">
//                         <div className="text-sm">
//                           <b>{a.who}</b> {a.what}
//                         </div>
//                         <div className="text-xs text-slate-500">
//                           {a.when} · {a.ip}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Users */}
//         {activePage === 'users' && hasPermission('canManageUsers') && (
//           <section className="page active">
//             <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
//               <div>
//                 <h1 className="text-2xl font-bold">User Management</h1>
//                 <p className="text-slate-500 text-sm">Manage workspace users and permissions • Role: {roleLabels[userRole]}</p>
//               </div>
//               <button className="btn-blue" onClick={() => { setCreateUserModal(true); setUserForm({ name: '', role: 'Agent', status: 'Active' }); }}>+ Add New User</button>
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi"><div className="text-xs text-slate-500">Total Users</div><div className="text-2xl font-bold">{users.length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status === 'Active').length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Disabled</div><div className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'Disabled').length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Admins</div><div className="text-2xl font-bold">{users.filter(u => u.role.includes('Admin')).length}</div></div>
//             </div>
//             <div className="px-8 mt-6 pb-8">
//               <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
//                 <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
//                 <select className="select max-w-xs" value={userFilterStatus} onChange={(e) => setUserFilterStatus(e.target.value)}>
//                   <option>All</option>
//                   <option>Active</option>
//                   <option>Disabled</option>
//                 </select>
//                 <button className="btn-outline" onClick={() => showToast('Users exported')}>⬇ Export</button>
//               </div>
//               <div className="card mt-3 table-wrap">
//                 <table>
//                   <thead><tr><th><input type="checkbox" /></th><th>Username</th><th>Role</th><th>Status</th><th>Owner</th><th>Created</th><th>Actions</th></tr></thead>
//                   <tbody>
//                     {filteredUsers.map((u, i) => (
//                       <tr key={i}>
//                         <td><input type="checkbox" /></td>
//                         <td className="font-medium"><span className="avatar mr-2" style={{ background: u.color }}>{initials(u.name)}</span>{u.name}</td>
//                         <td>{u.role}</td>
//                         <td><span className={`chip ${u.status === 'Active' ? 'chip-green' : 'chip-gray'}`}>{u.status}</span></td>
//                         <td>{u.owner}</td>
//                         <td>{u.date}</td>
//                         <td className="whitespace-nowrap">
//                           <button className="btn-outline" onClick={() => { setSelectedUserData(u); setUserForm({ name: u.name, role: u.role, status: u.status }); setEditUserModal(true); }}>✎ Edit</button>
//                           <button className="btn-outline" onClick={() => toggleUserStatus(u.id)}>{u.status === 'Active' ? 'Disable' : 'Enable'}</button>
//                           <button className="btn-outline" onClick={() => deleteUser(u.id)}>🗑 Delete</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Number Provisioning */}
//         {activePage === 'numbers' && hasPermission('canManageDIDs') && (
//           <section className="page active">
//             <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
//               <div><h1 className="text-2xl font-bold">DID Management</h1><p className="text-slate-500 text-sm">Manage Direct Inward Dial numbers and assignments • Role: {roleLabels[userRole]}</p></div>
//               {hasPermission('canManageDIDs') && (
//                 <button className="btn-blue" onClick={() => { setCreateDidModal(true); setDidForm({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' }); }}>+ Create DID</button>
//               )}
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi"><div className="text-xs text-slate-500">Total DIDs</div><div className="text-2xl font-bold">{dids.length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-emerald-600">{dids.filter(d => d.status === 'Active').length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Inbound</div><div className="text-2xl font-bold">{dids.filter(d => d.type === 'Inbound').length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Outbound</div><div className="text-2xl font-bold">{dids.filter(d => d.type === 'Outbound').length}</div></div>
//             </div>
//             <div className="px-8 mt-6 pb-8">
//               <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
//                 <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search by phone or extension..." value={didSearch} onChange={(e) => setDidSearch(e.target.value)} />
//                 <button className="btn-outline" onClick={() => showToast('DIDs exported')}>⬇ Export</button>
//               </div>
//               <div className="card mt-3 table-wrap">
//                 <table>
//                   <thead><tr><th>DID ID</th><th>Phone Number</th><th>Type</th><th>Status</th><th>Tenant</th><th>Extension</th><th>Provider</th><th>Created</th><th>Actions</th></tr></thead>
//                   <tbody>
//                     {filteredDids.map((did, i) => (
//                       <tr key={i}>
//                         <td className="font-medium whitespace-nowrap">{did.id}</td>
//                         <td className="font-semibold">{did.phone}</td>
//                         <td><span className={`chip ${did.type === 'Inbound' ? 'chip-blue' : 'chip-green'}`}>{did.type}</span></td>
//                         <td><span className="chip chip-green">Active</span></td>
//                         <td>{did.tenant}</td>
//                         <td>{did.extension}</td>
//                         <td>{did.provider}</td>
//                         <td>{did.created}</td>
//                         <td className="whitespace-nowrap">
//                           <button className="btn-outline" onClick={() => { setSelectedDid(did); setDidForm({ phone: did.phone, type: did.type, tenant: did.tenant, extension: did.extension, provider: did.provider }); setEditDidModal(true); }}>✎ Edit</button>
//                           <button className="btn-outline" onClick={() => assignDidToTenant(did.id, 'TENANT001')}>🔗 Assign</button>
//                           <button className="btn-outline" onClick={() => deleteDid(did.id)}>🗑 Delete</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}

//         {activePage === 'tenants' && hasPermission('canManageTenants') && (
//           <section className="page active">
//             <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
//               <div><h1 className="text-2xl font-bold">Tenant Management</h1><p className="text-slate-500 text-sm">Create and manage customer tenants and workspaces • Role: {roleLabels[userRole]}</p></div>
//               {hasPermission('canManageTenants') && (
//                 <button className="btn-blue" onClick={() => { setCreateTenantModal(true); setTenantForm({ name: '', owner: '', tier: 'Professional' }); }}>+ Create Tenant</button>
//               )}
//             </div>
//             <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//               <div className="kpi"><div className="text-xs text-slate-500">Total Tenants</div><div className="text-2xl font-bold">{tenants.length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-emerald-600">{tenants.filter(t => t.status === 'Active').length}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Total Users</div><div className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.users, 0)}</div></div>
//               <div className="kpi"><div className="text-xs text-slate-500">Total DIDs</div><div className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.dids, 0)}</div></div>
//             </div>
//             <div className="px-8 mt-6 pb-8">
//               <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
//                 <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search tenants..." value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} />
//                 <button className="btn-outline" onClick={() => showToast('Tenants exported')}>⬇ Export</button>
//               </div>
//               <div className="card mt-3 table-wrap">
//                 <table>
//                   <thead><tr><th>Tenant ID</th><th>Name</th><th>Owner</th><th>Status</th><th>Users</th><th>DIDs</th><th>Tier</th><th>Created</th><th>Actions</th></tr></thead>
//                   <tbody>
//                     {filteredTenants.map((tenant, i) => (
//                       <tr key={i}>
//                         <td className="font-medium whitespace-nowrap">{tenant.id}</td>
//                         <td className="font-semibold">{tenant.name}</td>
//                         <td>{tenant.owner}</td>
//                         <td><span className={`chip ${tenant.status === 'Active' ? 'chip-green' : 'chip-gray'}`}>{tenant.status}</span></td>
//                         <td>{tenant.users}</td>
//                         <td>{tenant.dids}</td>
//                         <td><span className="chip chip-blue">{tenant.tier}</span></td>
//                         <td>{tenant.created}</td>
//                         <td className="whitespace-nowrap">
//                           <button className="btn-outline" onClick={() => { setSelectedTenant(tenant); setTenantForm({ name: tenant.name, owner: tenant.owner, tier: tenant.tier }); setEditTenantModal(true); }}>✎ Edit</button>
//                           <button className="btn-outline" onClick={() => toggleTenantStatus(tenant.id)}>{tenant.status === 'Active' ? 'Disable' : 'Enable'}</button>
//                           <button className="btn-outline" onClick={() => deleteTenant(tenant.id)}>🗑 Delete</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* OmniChannel */}
//         {activePage === 'omni' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <div className="text-xs text-slate-500">Global Call Logs Admin Portal: VOXA</div>
//               <h1 className="text-2xl font-bold mt-1">Omnichannel — Main Company Hotline</h1>
//             </div>
//             <div className="px-8 mt-6">
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 {[
//                   { icon: '∞', label: 'Meta', color: '#1877f2' },
//                   { icon: '💬', label: 'WhatsApp', color: '#25d366' },
//                   { icon: '✉', label: 'SMS', color: '#334155' },
//                   { icon: '📧', label: 'Email', color: '#3b82f6' },
//                 ].map((c, i) => (
//                   <button
//                     key={i}
//                     className="card p-6 flex flex-col items-center gap-2 hover:shadow-md transition"
//                     onClick={() => showToast(c.label + ' selected')}
//                   >
//                     <div className="text-4xl" style={{ color: c.color }}>
//                       {c.icon}
//                     </div>
//                     <div className="text-lg font-semibold">{c.label}</div>
//                   </button>
//                 ))}
//               </div>
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 mb-8">
//                 <div className="card p-4">
//                   <h3 className="font-semibold mb-3">Combined Omnichannel Usage (Last 30 Days)</h3>
//                   <canvas ref={omniChartRef} height={300} />
//                 </div>
//                 <div className="card p-4">
//                   <h3 className="font-semibold mb-3">WhatsApp Performance</h3>
//                   <div className="table-wrap">
//                     <table>
//                       <thead>
//                         <tr>
//                           <th>Number</th>
//                           <th>User</th>
//                           <th>Sent</th>
//                           <th>Recv</th>
//                           <th>Rate</th>
//                           <th>Avg</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {[
//                           ['(123) 456…', 'Amy Smith', '190', '268', '98.7%', '17.2s'],
//                           ['(123) 456…', 'Amy Smith', '336', '400', '98.7%', '17.3s'],
//                           ['(123) 456…', 'Mny Number', '220', '258', '98.7%', '12.3s'],
//                         ].map((r, i) => (
//                           <tr key={i}>
//                             {r.map((c, j) => (
//                               <td key={j}>{c}</td>
//                             ))}
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* IVR Menu */}
//         {activePage === 'ivr' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <h1 className="text-2xl font-bold">IVR Menu Builder — Main Company Hotline</h1>
//             </div>
//             <div className="px-8 mt-6 pb-8">
//               <div className="card p-4">
//                 <h3 className="font-semibold mb-3">IVR Builder</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   {/* Trigger */}
//                   <div className="space-y-3">
//                     <div className="text-xs font-semibold uppercase text-slate-500">Trigger</div>
//                     {ivrNodes.trigger.map((n, i) => (
//                       <div key={n.id} className="ivr-node relative group">
//                         <button
//                           className="absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100"
//                           onClick={() => removeIVRNode(n.id, 'trigger')}
//                         >
//                           ✕
//                         </button>
//                         <button
//                           className="w-full text-left"
//                           onClick={() => {
//                             setEditingIvrNode(n);
//                             setIvrEditModal(true);
//                           }}
//                         >
//                           <div className="node-title">{n.icon} {n.title}</div>
//                           <div className="mt-2 text-xs whitespace-pre-line text-slate-600">{n.detail}</div>
//                         </button>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Flow */}
//                   <div className="space-y-3">
//                     <div className="text-xs font-semibold uppercase text-slate-500">Flow</div>
//                     {ivrNodes.flow.map((n, i) => (
//                       <div key={n.id} className="ivr-node relative group">
//                         <button
//                           className="absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100"
//                           onClick={() => removeIVRNode(n.id, 'flow')}
//                         >
//                           ✕
//                         </button>
//                         <button
//                           className="w-full text-left"
//                           onClick={() => {
//                             setEditingIvrNode(n);
//                             setIvrEditModal(true);
//                           }}
//                         >
//                           <div className="node-title">{n.icon} {n.title}</div>
//                           <div className="mt-2 text-xs whitespace-pre-line text-slate-600">{n.detail}</div>
//                         </button>
//                       </div>
//                     ))}
//                     <button className="btn-outline w-full" onClick={() => addIVRNode('flow')}>
//                       + Add flow step
//                     </button>
//                   </div>

//                   {/* Keypad Inputs */}
//                   <div className="space-y-3">
//                     <div className="text-xs font-semibold uppercase text-slate-500">Keypad Inputs</div>
//                     <div className="ivr-node bg-slate-50">
//                       <div className="node-title">☰ Keypad Inputs</div>
//                       <div className="text-xs mt-1 text-slate-500">Press digit → destination</div>
//                     </div>
//                     {ivrNodes.inputs.map((k, i) => (
//                       <div key={i} className="flex items-center gap-2">
//                         <input
//                           className="input"
//                           style={{ width: '46px', textAlign: 'center', padding: '.35rem' }}
//                           maxLength={1}
//                           value={k.key}
//                           onChange={(e) => updateKeypadNode(i, e.target.value, k.node.title, k.node.icon)}
//                         />
//                         <div className="ivr-node flex-1 relative group">
//                           <button
//                             className="absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100"
//                             onClick={() => removeKeypadInput(i)}
//                           >
//                             ✕
//                           </button>
//                           <button
//                             className="w-full text-left"
//                             onClick={() => {
//                               setEditingIvrNode(k.node);
//                               setIvrEditModal(true);
//                             }}
//                           >
//                             <div className="node-title">{k.node.icon} {k.node.title}</div>
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                     <button className="btn-outline w-full" onClick={addKeypadInput}>
//                       + Add keypad input
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}

//         {/* Master Logs */}
//         {activePage === 'logs' && (
//           <section className="page active">
//             <div className="px-8 pt-6">
//               <div className="text-xs text-slate-500">Global Call Logs</div>
//               <h1 className="text-2xl font-bold">Master Call History</h1>
//             </div>
//             <div className="px-8 mt-6 pb-8">
//               <div className="card mt-3 table-wrap">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>
//                         <input type="checkbox" />
//                       </th>
//                       <th>Date & Time</th>
//                       <th>User</th>
//                       <th>Number</th>
//                       <th>Dir</th>
//                       <th>Duration</th>
//                       <th>Queue</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {logsData.map((r, i) => {
//                       const a = agents.find((x) => x.name === r[1]) || { color: '#64748b' };
//                       return (
//                         <tr key={i}>
//                           <td>
//                             <input type="checkbox" />
//                           </td>
//                           <td className="whitespace-nowrap">
//                             Jun 01 · {r[0]}
//                           </td>
//                           <td className="whitespace-nowrap">
//                             <span className="avatar mr-2" style={{ background: a.color }}>
//                               {initials(r[1])}
//                             </span>
//                             {r[1]}
//                           </td>
//                           <td>{r[2]}</td>
//                           <td>{r[3] === 'in' ? '↙ in' : '↗ out'}</td>
//                           <td>{r[4]}</td>
//                           <td>{r[5]}</td>
//                           <td>{statusChip(r[6])}</td>
//                           <td className="whitespace-nowrap">
//                             <button className="btn-outline" onClick={() => showToast('Viewing call')}>
//                               👁
//                             </button>
//                             <button className="btn-outline" onClick={() => showToast('Listening…')}>
//                               🎧
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         )}
//       </main>

//       {/* Test Call Modal */}
//       {testCallModal && (
//         <div className="modal-backdrop open" onClick={() => setTestCallModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold">Test Call Control</h3>
//               <button onClick={() => setTestCallModal(false)} className="text-slate-500">
//                 ✕
//               </button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">From (Outgoing)</label>
//                 <select className="select" ref={tcFromRef}>
//                   <option>(345) 616-1256</option>
//                   <option>(41) 616-1256</option>
//                   <option>(3) 414-3453</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-medium">To (Customer)</label>
//                 <input className="input" ref={toNumberRef} placeholder="+1 (___) ___-____" />
//               </div>
//               <button
//                 className="w-full btn-primary py-3"
//                 onClick={() => {
//                   const toNum = toNumberRef.current?.value || 'unknown';
//                   const fromNum = tcFromRef.current?.value || '';
//                   setSpNumber(toNum);
//                   setTestCallModal(false);
//                   showToast(`Test call from ${fromNum} → ${toNum}`);
//                   switchPage('softphone');
//                 }}
//               >
//                 Initiate Test Call
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Incoming Call Modal */}
//       {incomingModal && (
//         <div className="modal-backdrop open" onClick={() => setIncomingModal(false)}>
//           <div className="modal text-center" onClick={(e) => e.stopPropagation()}>
//             <div
//               className="avatar mx-auto mb-3"
//               style={{ width: '70px', height: '70px', fontSize: '1.5rem', background: '#3b82f6' }}
//             >
//               {incomingCallInfo.avatar}
//             </div>
//             <div className="text-lg font-bold">{incomingCallInfo.name}</div>
//             <div className="text-slate-500 mb-6">{incomingCallInfo.num}</div>
//             <div className="flex gap-3 justify-center">
//               <button className="btn-primary py-3 px-6" onClick={AnswerIncoming}>
//                 📞 Answer
//               </button>
//               <button className="btn-danger py-3 px-6" onClick={DeclineIncoming}>
//                 ✕ Decline
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* IVR Edit Modal */}
//       {ivrEditModal && editingIvrNode && (
//         <div className="modal-backdrop open" onClick={() => setIvrEditModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold">Edit IVR Node</h3>
//               <button onClick={() => setIvrEditModal(false)} className="text-slate-500">
//                 ✕
//               </button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Icon</label>
//                 <input
//                   className="input"
//                   value={editingIvrNode.icon}
//                   onChange={(e) => setEditingIvrNode({ ...editingIvrNode, icon: e.target.value })}
//                 />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Title</label>
//                 <input
//                   className="input"
//                   value={editingIvrNode.title}
//                   onChange={(e) => setEditingIvrNode({ ...editingIvrNode, title: e.target.value })}
//                 />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Description</label>
//                 <textarea
//                   className="input"
//                   rows={3}
//                   value={editingIvrNode.detail}
//                   onChange={(e) => setEditingIvrNode({ ...editingIvrNode, detail: e.target.value })}
//                 />
//               </div>
//               <button
//                 className="w-full btn-primary py-3"
//                 onClick={() => {
//                   showToast('IVR Node updated');
//                   setIvrEditModal(false);
//                 }}
//               >
//                 Save Node
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Permissions Modal */}
//       {permissionsModal && (
//         <div className="modal-backdrop open" onClick={() => setPermissionsModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold">User Permissions: {selectedUser}</h3>
//               <button onClick={() => setPermissionsModal(false)} className="text-slate-500">
//                 ✕
//               </button>
//             </div>
//             <div className="space-y-3">
//               {Object.entries(userPerms).map(([key, value]) => (
//                 <label key={key} className="flex items-center justify-between">
//                   <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
//                   <label className="toggle">
//                     <input
//                       type="checkbox"
//                       checked={value}
//                       onChange={(e) => setUserPerms({ ...userPerms, [key]: e.target.checked })}
//                     />
//                     <span></span>
//                   </label>
//                 </label>
//               ))}
//               <button
//                 className="w-full btn-primary py-3"
//                 onClick={() => {
//                   showToast('Permissions saved for ' + selectedUser);
//                   setPermissionsModal(false);
//                 }}
//               >
//                 Save Permissions
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Bulk Dial Modal */}
//       {bulkDialModal && (
//         <div className="modal-backdrop open" onClick={() => setBulkDialModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold">Bulk Dial</h3>
//               <button onClick={() => setBulkDialModal(false)} className="text-slate-500">
//                 ✕
//               </button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Phone Numbers (one per line)</label>
//                 <textarea
//                   className="input"
//                   rows={6}
//                   value={bulkNumbers}
//                   onChange={(e) => setBulkNumbers(e.target.value)}
//                   placeholder="(555) 111-0001&#10;(555) 111-0002&#10;(555) 111-0003"
//                 />
//               </div>
//               <button className="w-full btn-primary py-3" onClick={bulkDial}>
//                 Queue Bulk Dial
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Create DID Modal */}
//       {createDidModal && (
//         <div className="modal-backdrop open" onClick={() => setCreateDidModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-lg">Create New DID</h3>
//               <button onClick={() => setCreateDidModal(false)} className="text-slate-500">✕</button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Phone Number *</label>
//                 <input className="input" placeholder="e.g., (555) 123-4567" value={didForm.phone} onChange={(e) => setDidForm({...didForm, phone: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Type *</label>
//                 <select className="select" value={didForm.type} onChange={(e) => setDidForm({...didForm, type: e.target.value as 'Inbound' | 'Outbound'})}>
//                   <option>Inbound</option>
//                   <option>Outbound</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Extension *</label>
//                 <input className="input" placeholder="e.g., ext-001" value={didForm.extension} onChange={(e) => setDidForm({...didForm, extension: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Tenant</label>
//                 <select className="select" value={didForm.tenant} onChange={(e) => setDidForm({...didForm, tenant: e.target.value})}>
//                   {tenants.map(t => <option key={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Provider</label>
//                 <select className="select" value={didForm.provider} onChange={(e) => setDidForm({...didForm, provider: e.target.value})}>
//                   <option>Twilio</option>
//                   <option>Vonage</option>
//                   <option>Bandwidth</option>
//                 </select>
//               </div>
//               <button className="w-full btn-primary py-3" onClick={createDid}>Create DID</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit DID Modal */}
//       {editDidModal && selectedDid && (
//         <div className="modal-backdrop open" onClick={() => setEditDidModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-lg">Edit DID {selectedDid.id}</h3>
//               <button onClick={() => setEditDidModal(false)} className="text-slate-500">✕</button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Phone Number</label>
//                 <input className="input" value={didForm.phone} onChange={(e) => setDidForm({...didForm, phone: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Type</label>
//                 <select className="select" value={didForm.type} onChange={(e) => setDidForm({...didForm, type: e.target.value as 'Inbound' | 'Outbound'})}>
//                   <option>Inbound</option>
//                   <option>Outbound</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Extension</label>
//                 <input className="input" value={didForm.extension} onChange={(e) => setDidForm({...didForm, extension: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Tenant</label>
//                 <select className="select" value={didForm.tenant} onChange={(e) => setDidForm({...didForm, tenant: e.target.value})}>
//                   {tenants.map(t => <option key={t.id}>{t.name}</option>)}
//                 </select>
//               </div>
//               <button className="w-full btn-primary py-3" onClick={updateDid}>Update DID</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Create Tenant Modal */}
//       {createTenantModal && (
//         <div className="modal-backdrop open" onClick={() => setCreateTenantModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-lg">Create New Tenant</h3>
//               <button onClick={() => setCreateTenantModal(false)} className="text-slate-500">✕</button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Tenant Name *</label>
//                 <input className="input" placeholder="e.g., Acme Corporation" value={tenantForm.name} onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Owner Email *</label>
//                 <input className="input" type="email" placeholder="owner@example.com" value={tenantForm.owner} onChange={(e) => setTenantForm({...tenantForm, owner: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Subscription Tier</label>
//                 <select className="select" value={tenantForm.tier} onChange={(e) => setTenantForm({...tenantForm, tier: e.target.value as 'Starter' | 'Professional' | 'Enterprise'})}>
//                   <option>Starter</option>
//                   <option>Professional</option>
//                   <option>Enterprise</option>
//                 </select>
//               </div>
//               <button className="w-full btn-primary py-3" onClick={createTenant}>Create Tenant</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit Tenant Modal */}
//       {editTenantModal && selectedTenant && (
//         <div className="modal-backdrop open" onClick={() => setEditTenantModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-lg">Edit Tenant {selectedTenant.id}</h3>
//               <button onClick={() => setEditTenantModal(false)} className="text-slate-500">✕</button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Tenant Name</label>
//                 <input className="input" value={tenantForm.name} onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Owner Email</label>
//                 <input className="input" type="email" value={tenantForm.owner} onChange={(e) => setTenantForm({...tenantForm, owner: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Subscription Tier</label>
//                 <select className="select" value={tenantForm.tier} onChange={(e) => setTenantForm({...tenantForm, tier: e.target.value as 'Starter' | 'Professional' | 'Enterprise'})}>
//                   <option>Starter</option>
//                   <option>Professional</option>
//                   <option>Enterprise</option>
//                 </select>
//               </div>
//               <button className="w-full btn-primary py-3" onClick={updateTenant}>Update Tenant</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Create User Modal */}
//       {createUserModal && (
//         <div className="modal-backdrop open" onClick={() => setCreateUserModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-lg">Create New User</h3>
//               <button onClick={() => setCreateUserModal(false)} className="text-slate-500">✕</button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Username *</label>
//                 <input className="input" placeholder="e.g., John_Doe" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Role *</label>
//                 <select className="select" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
//                   <option>Agent</option>
//                   <option>Support Agent</option>
//                   <option>Sales Representative</option>
//                   <option>Account Manager</option>
//                   <option>Tenant Admin</option>
//                   <option>Support Manager</option>
//                   <option>Global Admin</option>
//                 </select>
//               </div>
//               <button className="w-full btn-primary py-3" onClick={createUser}>Create User</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Edit User Modal */}
//       {editUserModal && selectedUserData && (
//         <div className="modal-backdrop open" onClick={() => setEditUserModal(false)}>
//           <div className="modal" onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-semibold text-lg">Edit User {selectedUserData.name}</h3>
//               <button onClick={() => setEditUserModal(false)} className="text-slate-500">✕</button>
//             </div>
//             <div className="space-y-3">
//               <div>
//                 <label className="text-xs font-medium">Username</label>
//                 <input className="input" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Role</label>
//                 <select className="select" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
//                   <option>Agent</option>
//                   <option>Support Agent</option>
//                   <option>Sales Representative</option>
//                   <option>Account Manager</option>
//                   <option>Tenant Admin</option>
//                   <option>Support Manager</option>
//                   <option>Global Admin</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-medium">Status</label>
//                 <select className="select" value={userForm.status} onChange={(e) => setUserForm({...userForm, status: e.target.value as 'Active' | 'Disabled'})}>
//                   <option>Active</option>
//                   <option>Disabled</option>
//                 </select>
//               </div>
//               <button className="w-full btn-primary py-3" onClick={updateUser}>Update User</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Toast */}
//       {toast && <div className="toast show">{toast}</div>}
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';
import './voxa.css';

// ==================== ROLE-BASED ACCESS CONTROL ====================

type UserRole = 'super_admin' | 'platform_admin' | 'tenant_admin' | 'account_manager' | 'sales_rep' | 'support_agent' | 'agent';

interface RolePermission {
  canAccessAdmin: boolean;
  canManageTenants: boolean;
  canManageDIDs: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewBilling: boolean;
  canModifyBilling: boolean;
  canAccessSoftphone: boolean;
  canMakeOutbound: boolean;
  canAnswerInbound: boolean;
  canViewReports: boolean;
  canManageIVR: boolean;
  canViewSecurity: boolean;
  canModifySettings: boolean;
}

const rolePermissions: Record<UserRole, RolePermission> = {
  super_admin: {
    canAccessAdmin: true,
    canManageTenants: true,
    canManageDIDs: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewBilling: true,
    canModifyBilling: true,
    canAccessSoftphone: true,
    canMakeOutbound: true,
    canAnswerInbound: true,
    canViewReports: true,
    canManageIVR: true,
    canViewSecurity: true,
    canModifySettings: true,
  },
  platform_admin: {
    canAccessAdmin: true,
    canManageTenants: true,
    canManageDIDs: true,
    canManageUsers: true,
    canManageRoles: false,
    canViewBilling: true,
    canModifyBilling: false,
    canAccessSoftphone: true,
    canMakeOutbound: true,
    canAnswerInbound: true,
    canViewReports: true,
    canManageIVR: true,
    canViewSecurity: true,
    canModifySettings: false,
  },
  tenant_admin: {
    canAccessAdmin: false,
    canManageTenants: false,
    canManageDIDs: true,
    canManageUsers: true,
    canManageRoles: false,
    canViewBilling: true,
    canModifyBilling: false,
    canAccessSoftphone: true,
    canMakeOutbound: true,
    canAnswerInbound: true,
    canViewReports: true,
    canManageIVR: true,
    canViewSecurity: false,
    canModifySettings: false,
  },
  account_manager: {
    canAccessAdmin: false,
    canManageTenants: false,
    canManageDIDs: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewBilling: true,
    canModifyBilling: false,
    canAccessSoftphone: true,
    canMakeOutbound: true,
    canAnswerInbound: true,
    canViewReports: true,
    canManageIVR: false,
    canViewSecurity: false,
    canModifySettings: false,
  },
  sales_rep: {
    canAccessAdmin: false,
    canManageTenants: false,
    canManageDIDs: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewBilling: false,
    canModifyBilling: false,
    canAccessSoftphone: true,
    canMakeOutbound: true,
    canAnswerInbound: false,
    canViewReports: true,
    canManageIVR: false,
    canViewSecurity: false,
    canModifySettings: false,
  },
  support_agent: {
    canAccessAdmin: false,
    canManageTenants: false,
    canManageDIDs: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewBilling: false,
    canModifyBilling: false,
    canAccessSoftphone: true,
    canMakeOutbound: false,
    canAnswerInbound: true,
    canViewReports: true,
    canManageIVR: false,
    canViewSecurity: false,
    canModifySettings: false,
  },
  agent: {
    canAccessAdmin: false,
    canManageTenants: false,
    canManageDIDs: false,
    canManageUsers: false,
    canManageRoles: false,
    canViewBilling: false,
    canModifyBilling: false,
    canAccessSoftphone: true,
    canMakeOutbound: true,
    canAnswerInbound: true,
    canViewReports: false,
    canManageIVR: false,
    canViewSecurity: false,
    canModifySettings: false,
  },
};

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  platform_admin: 'Platform Admin',
  tenant_admin: 'Tenant Admin',
  account_manager: 'Account Manager',
  sales_rep: 'Sales Representative',
  support_agent: 'Support Agent',
  agent: 'Agent',
};

// =====================================================================

interface Agent {
  name: string;
  color: string;
  checked: boolean;
  status: string;
}

interface QueueItem {
  name: string;
  num: string;
  wait: number;
  queue: string;
  prio: 'High' | 'Normal';
}

interface IVRNode {
  id: string;
  icon: string;
  title: string;
  detail: string;
  type: 'trigger' | 'flow' | 'input';
}

export default function VOXA() {
  // Page State - declare first
  const [activePage, setActivePage] = useState('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Role-Based Access Control State
  const [userRole, setUserRole] = useState<UserRole>('platform_admin');
  const [userTenant, setUserTenant] = useState('Phoenix Telecom Inc.');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const roleSelectorRef = useRef<HTMLDivElement>(null);

  // Get current user permissions
  const userPerms = rolePermissions[userRole];

  // Permission checking functions
  const hasPermission = useCallback((permission: keyof RolePermission) => {
    return userPerms[permission];
  }, [userPerms]);

  const getPermittedPages = useCallback(() => {
    const pages = [
      { key: 'admin', label: 'Admin Panel', required: 'canAccessAdmin' },
      { key: 'softphone', label: 'Softphone', required: 'canAccessSoftphone' },
      { key: 'outbound', label: 'Outbound Calls', required: 'canMakeOutbound' },
      { key: 'inbound', label: 'Inbound Calls', required: 'canAnswerInbound' },
      { key: 'queue', label: 'Call Queue', required: 'canAnswerInbound' },
      { key: 'billing', label: 'Global Billing', required: 'canViewBilling' },
      { key: 'numbers', label: 'DID Management', required: 'canManageDIDs' },
      { key: 'tenants', label: 'Tenant Management', required: 'canManageTenants' },
      { key: 'omni', label: 'OmniChannel', required: 'canAccessSoftphone' },
      { key: 'ivr', label: 'IVR Menu', required: 'canManageIVR' },
      { key: 'logs', label: 'Master Logs', required: 'canViewReports' },
      { key: 'users', label: 'Users', required: 'canManageUsers' },
      { key: 'security', label: 'Security', required: 'canViewSecurity' },
    ];
    return pages.filter((p) => hasPermission(p.required as keyof RolePermission));
  }, [hasPermission]);

  // Ensure user can access current page
  const permittedPages = getPermittedPages();
  const canAccessCurrentPage = permittedPages.some((p) => p.key === activePage);
  useEffect(() => {
    if (!canAccessCurrentPage && permittedPages.length > 0) {
      setActivePage(permittedPages[0].key);
    }
  }, [userRole, canAccessCurrentPage, permittedPages]);

  // Close role selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleSelectorRef.current && !roleSelectorRef.current.contains(e.target as Node)) {
        setShowRoleSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const [queueData, setQueueData] = useState<QueueItem[]>([
    { name: 'Sara Kim', num: '(555) 111-0001', wait: 134, queue: 'Sales', prio: 'High' },
    { name: 'Diego Ruiz', num: '(555) 111-0002', wait: 98, queue: 'Support', prio: 'Normal' },
    { name: 'Anna Wu', num: '(555) 111-0003', wait: 66, queue: 'Billing', prio: 'Normal' },
    { name: 'Marcus Lee', num: '(555) 111-0004', wait: 41, queue: 'Support', prio: 'High' },
    { name: 'Ella Brown', num: '(555) 111-0005', wait: 15, queue: 'Sales', prio: 'Normal' },
  ]);

  const [testCallModal, setTestCallModal] = useState(false);
  const [incomingModal, setIncomingModal] = useState(false);
  const [incomingCallInfo, setIncomingCallInfo] = useState({ name: '', num: '', avatar: '' });
  const [ivrEditModal, setIvrEditModal] = useState(false);
  const [editingIvrNode, setEditingIvrNode] = useState<IVRNode | null>(null);
  const [ivrNodes, setIvrNodes] = useState<{ trigger: IVRNode[]; flow: IVRNode[]; inputs: Array<{ key: string; node: IVRNode }> }>({
    trigger: [
      { id: '1', icon: '📞', title: 'Call Trigger', detail: 'Incoming Call\n(111) 222-3333', type: 'trigger' },
      { id: '2', icon: '🕘', title: 'Business Hours', detail: 'Mon-Fri 9-5', type: 'trigger' },
    ],
    flow: [
      { id: '3', icon: '🔊', title: 'Play Greeting', detail: '"Thank you for calling…"', type: 'flow' },
      { id: '4', icon: '📣', title: 'After Hours', detail: 'Play closed message', type: 'flow' },
      { id: '5', icon: '📼', title: 'Voicemail Group', detail: 'Main inbox', type: 'flow' },
    ],
    inputs: [
      { key: '1', node: { id: '6', icon: '👥', title: 'Sales Ring Group', detail: '', type: 'input' } },
      { key: '2', node: { id: '7', icon: '🛠', title: 'Tech Support', detail: '', type: 'input' } },
      { key: '3', node: { id: '8', icon: '🙋', title: 'Receptionist', detail: '', type: 'input' } },
      { key: '4', node: { id: '9', icon: '📼', title: 'Voicemail', detail: '', type: 'input' } },
    ],
  });

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [bulkDialModal, setBulkDialModal] = useState(false);
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [numberSearch, setNumberSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [permissionsModal, setPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');

  // User Management State
  const [users, setUsers] = useState([
    { id: 'USER001', name: 'Aman_Smith', role: 'Global Admin', status: 'Active', owner: 'Aman_Smith', date: '19/10/22', color: '#64748b' },
    { id: 'USER002', name: 'Kimberly_Woods', role: 'Support Manager', status: 'Active', owner: 'Kimberly_Woods', date: '29/08/22', color: '#8b5cf6' },
    { id: 'USER003', name: 'Robert_Mendez', role: 'Account Owner', status: 'Active', owner: 'Aman_Smith', date: '07/05/22', color: '#0ea5e9' },
  ]);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<typeof users[0] | null>(null);
  const [userForm, setUserForm] = useState({ name: '', role: 'Agent', status: 'Active' });
  const [userFilterStatus, setUserFilterStatus] = useState('All');

  // DID Management State
  const [dids, setDids] = useState([
    { id: 'DID001', phone: '(345) 616-1256', type: 'Inbound', status: 'Active', tenant: 'Phoenix Telecom Inc.', extension: 'ext-001', created: '06/12/2020', provider: 'Twilio' },
    { id: 'DID002', phone: '(408) 637-1715', type: 'Inbound', status: 'Active', tenant: 'Phoenix Telecom Inc.', extension: 'ext-002', created: '06/13/2020', provider: 'Twilio' },
    { id: 'DID003', phone: '(254) 414-3453', type: 'Outbound', status: 'Active', tenant: 'Phoenix Telecom Inc.', extension: 'ext-003', created: '06/14/2020', provider: 'Twilio' },
  ]);
  const [createDidModal, setCreateDidModal] = useState(false);
  const [editDidModal, setEditDidModal] = useState(false);
  const [selectedDid, setSelectedDid] = useState<typeof dids[0] | null>(null);
  const [didForm, setDidForm] = useState({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' });
  const [didSearch, setDidSearch] = useState('');

  // Tenant Management State
  const [tenants, setTenants] = useState([
    { id: 'TENANT001', name: 'Phoenix Telecom Inc.', owner: 'Aman Smith', status: 'Active', users: 12, dids: 8, created: '01/05/2022', tier: 'Enterprise' },
    { id: 'TENANT002', name: 'Betty\'s Shop', owner: 'Betty Cooper', status: 'Active', users: 5, dids: 3, created: '15/06/2022', tier: 'Professional' },
    { id: 'TENANT003', name: 'Tech Solutions Ltd', owner: 'Robert Mendez', status: 'Inactive', users: 0, dids: 0, created: '20/07/2022', tier: 'Starter' },
  ]);
  const [createTenantModal, setCreateTenantModal] = useState(false);
  const [editTenantModal, setEditTenantModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<typeof tenants[0] | null>(null);
  const [tenantForm, setTenantForm] = useState({ name: '', owner: '', tier: 'Professional' });
  const [tenantSearch, setTenantSearch] = useState('');

  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const tcFromRef = useRef<HTMLSelectElement>(null);
  const toNumberRef = useRef<HTMLInputElement>(null);
  const adminChartRef = useRef<HTMLCanvasElement>(null);
  const omniChartRef = useRef<HTMLCanvasElement>(null);
  const adminChartInstanceRef = useRef<Chart | null>(null);
  const omniChartInstanceRef = useRef<Chart | null>(null);

  const agents: Agent[] = [
    { name: 'Amy Smith', color: '#f59e0b', checked: true, status: 'available' },
    { name: 'Robert Mendez', color: '#10b981', checked: true, status: 'on-call' },
    { name: 'Kimberly Woods', color: '#8b5cf6', checked: true, status: 'available' },
    { name: 'Ruth Henderson', color: '#ef4444', checked: false, status: 'away' },
    { name: 'Gregory Medina', color: '#f97316', checked: false, status: 'available' },
  ];

  const numberData = [
    { phone: '(345) 616-1256', status: 'Free', client: '—', allocated: '—', date: '', state: '' },
    { phone: '(345) 616-1256', status: 'Assigned', client: "Betty's Shop", allocated: 'aman@x.com', date: '', state: '' },
    { phone: '(345) 616-1256', status: 'Assigned', client: "Betty's Shop", allocated: 'robertm@x.com', date: '', state: '' },
    { phone: '(254) 414-3453', status: 'Assigned', client: "Betty's Shop", allocated: 'kimberly@x.com', date: '', state: '' },
    { phone: '(254) 614-3453', status: 'Assigned', client: "Betty's Shop", allocated: 'greg1@x.com', date: '', state: '' },
  ];

  const usersData = [
    { name: 'Aman_Smith', role: 'Global Admin', status: 'Active', owner: 'Aman_Smith', date: '19/10/22', color: '#64748b' },
    { name: 'Kimberly_Woods', role: 'Support Manager', status: 'Active', owner: 'Kimberly_Woods', date: '29/08/22', color: '#8b5cf6' },
    { name: 'Robert_Mendez', role: 'Account Owner', status: 'Active', owner: 'Robert_Mendez', date: '07/05/22', color: '#0ea5e9' },
    { name: 'Ruth_Henderson', role: 'Sub-User', status: 'Disabled', owner: 'Aman_Smith', date: '03/07/22', color: '#a78bfa' },
    { name: 'Gregory_Medina', role: 'Agent', status: 'Active', owner: 'Aman_Smith', date: '07/09/22', color: '#f59e0b' },
  ];

  const obData = [
    ['09:12', 'Amy Smith', '(254) 414-3453', '02:14', 'Connected', 'Q3 Push'],
    ['09:14', 'Robert Mendez', '(657) 837-0199', '00:45', 'Voicemail', 'Q3 Push'],
    ['09:16', 'Kimberly Woods', '(408) 521-1715', '03:22', 'Connected', 'Retention'],
    ['09:18', 'Amy Smith', '(555) 111-2222', '00:00', 'Failed', 'Q3 Push'],
    ['09:20', 'Gregory Medina', '(365) 654-3233', '01:58', 'Connected', 'Retention'],
  ];

  const billData = [
    { invoice: 'INV-2026-009', date: 'Sep 01, 2026', amount: '$1,875.50', status: 'Paid' },
    { invoice: 'INV-2026-008', date: 'Aug 01, 2026', amount: '$1,720.00', status: 'Paid' },
    { invoice: 'INV-2026-007', date: 'Jul 01, 2026', amount: '$1,655.75', status: 'Paid' },
    { invoice: 'INV-2026-006', date: 'Jun 01, 2026', amount: '$1,540.20', status: 'Paid' },
    { invoice: 'INV-2026-010', date: 'Oct 01, 2026', amount: '$1,875.50', status: 'Pending' },
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
  ];

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

  // DID Management Functions
  const createDid = () => {
    if (!didForm.phone || !didForm.extension) {
      showToast('Fill all required fields');
      return;
    }
    const newDid = {
      id: `DID${String(dids.length + 1).padStart(3, '0')}`,
      phone: didForm.phone,
      type: didForm.type as 'Inbound' | 'Outbound',
      status: 'Active' as const,
      tenant: didForm.tenant,
      extension: didForm.extension,
      created: new Date().toLocaleDateString(),
      provider: didForm.provider,
    };
    setDids([...dids, newDid]);
    setCreateDidModal(false);
    setDidForm({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' });
    showToast(`DID ${didForm.phone} created successfully`);
  };

  const updateDid = () => {
    if (!selectedDid || !didForm.phone || !didForm.extension) {
      showToast('Fill all required fields');
      return;
    }
    setDids(dids.map(d => d.id === selectedDid.id ? { ...selectedDid, ...didForm, type: didForm.type as 'Inbound' | 'Outbound' } : d));
    setEditDidModal(false);
    setSelectedDid(null);
    setDidForm({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' });
    showToast(`DID ${didForm.phone} updated successfully`);
  };

  const deleteDid = (id: string) => {
    setDids(dids.filter(d => d.id !== id));
    showToast('DID deleted successfully');
  };

  const assignDidToTenant = (didId: string, tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;
    setDids(dids.map(d => d.id === didId ? { ...d, tenant: tenant.name } : d));
    showToast(`DID assigned to ${tenant.name}`);
  };

  // Tenant Management Functions
  const createTenant = () => {
    if (!tenantForm.name || !tenantForm.owner) {
      showToast('Fill all required fields');
      return;
    }
    const newTenant = {
      id: `TENANT${String(tenants.length + 1).padStart(3, '0')}`,
      name: tenantForm.name,
      owner: tenantForm.owner,
      status: 'Active' as const,
      users: 0,
      dids: 0,
      created: new Date().toLocaleDateString(),
      tier: tenantForm.tier as 'Starter' | 'Professional' | 'Enterprise',
    };
    setTenants([...tenants, newTenant]);
    setCreateTenantModal(false);
    setTenantForm({ name: '', owner: '', tier: 'Professional' });
    showToast(`Tenant ${tenantForm.name} created successfully`);
  };

  const updateTenant = () => {
    if (!selectedTenant || !tenantForm.name || !tenantForm.owner) {
      showToast('Fill all required fields');
      return;
    }
    setTenants(tenants.map(t => t.id === selectedTenant.id ? { ...selectedTenant, ...tenantForm, tier: tenantForm.tier as 'Starter' | 'Professional' | 'Enterprise' } : t));
    setEditTenantModal(false);
    setSelectedTenant(null);
    setTenantForm({ name: '', owner: '', tier: 'Professional' });
    showToast(`Tenant ${tenantForm.name} updated successfully`);
  };

  const deleteTenant = (id: string) => {
    if (dids.some(d => tenants.find(t => t.id === id)?.name === d.tenant)) {
      showToast('Cannot delete tenant with active DIDs');
      return;
    }
    setTenants(tenants.filter(t => t.id !== id));
    showToast('Tenant deleted successfully');
  };

  const toggleTenantStatus = (id: string) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === 'Active' ? 'Inactive' : 'Active' } : t));
    showToast('Tenant status updated');
  };

  // User Management Functions
  const createUser = () => {
    if (!userForm.name || !userForm.role) {
      showToast('Fill all required fields');
      return;
    }
    const newUser = {
      id: `USER${String(users.length + 1).padStart(3, '0')}`,
      name: userForm.name,
      role: userForm.role,
      status: 'Active' as const,
      owner: 'Aman_Smith',
      date: new Date().toLocaleDateString(),
      color: ['#64748b', '#f59e0b', '#8b5cf6', '#0ea5e9', '#10b981'][Math.floor(Math.random() * 5)],
    };
    setUsers([...users, newUser]);
    setCreateUserModal(false);
    setUserForm({ name: '', role: 'Agent', status: 'Active' });
    showToast(`User ${userForm.name} created successfully`);
  };

  const updateUser = () => {
    if (!selectedUserData || !userForm.name || !userForm.role) {
      showToast('Fill all required fields');
      return;
    }
    setUsers(users.map(u => u.id === selectedUserData.id ? { ...selectedUserData, ...userForm } : u));
    setEditUserModal(false);
    setSelectedUserData(null);
    setUserForm({ name: '', role: 'Agent', status: 'Active' });
    showToast(`User ${userForm.name} updated successfully`);
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    showToast('User deleted successfully');
  };

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u));
    showToast('User status updated');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus = userFilterStatus === 'All' || u.status === userFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // Initialize and draw charts
  useEffect(() => {
    if (activePage === 'admin' && adminChartRef.current) {
      if (adminChartInstanceRef.current) {
        adminChartInstanceRef.current.destroy();
      }
      const ctx = adminChartRef.current.getContext('2d');
      if (ctx) {
        adminChartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Call Volume',
                data: [450, 520, 480, 610, 580, 420, 350],
                borderColor: '#22c1a5',
                backgroundColor: 'rgba(34, 193, 165, 0.1)',
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 700 },
            },
          } as any,
        });
      }
    }
  }, [activePage]);

  useEffect(() => {
    if (activePage === 'omni' && omniChartRef.current) {
      if (omniChartInstanceRef.current) {
        omniChartInstanceRef.current.destroy();
      }
      const ctx = omniChartRef.current.getContext('2d');
      if (ctx) {
        omniChartInstanceRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Voice', 'WhatsApp', 'SMS', 'Email'],
            datasets: [
              {
                data: [450, 320, 180, 150],
                backgroundColor: ['#22c1a5', '#3b82f6', '#f59e0b', '#8b5cf6'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } },
          } as any,
        });
      }
    }
  }, [activePage]);

  // Timer update
  useEffect(() => {
    if (!callState.active) return;
    const interval = setInterval(() => {
      setSpTimer(fmtT((Date.now() - callState.start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [callState.active, callState.start]);

  // Waveform animation
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

  // Active calls update
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveKpiCalls((prev) => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Queue timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setQueueData((prev) => prev.map((q) => ({ ...q, wait: q.wait + 1 })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate incoming call
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

  // IVR Node Management
  const addIVRNode = (type: 'flow' | 'input') => {
    if (type === 'flow') {
      const newNode = {
        id: Date.now().toString(),
        icon: '📞',
        title: 'New Flow Step',
        detail: 'Configure this step',
        type: 'flow' as const,
      };
      setIvrNodes({ ...ivrNodes, flow: [...ivrNodes.flow, newNode] });
      showToast('Flow step added');
    }
  };

  const removeIVRNode = (id: string, type: 'trigger' | 'flow') => {
    if (type === 'trigger') {
      setIvrNodes({ ...ivrNodes, trigger: ivrNodes.trigger.filter((n) => n.id !== id) });
    } else {
      setIvrNodes({ ...ivrNodes, flow: ivrNodes.flow.filter((n) => n.id !== id) });
    }
    showToast('Node removed');
  };

  const addKeypadInput = () => {
    const nextKey = String((Math.max(...ivrNodes.inputs.map((i) => parseInt(i.key) || 0)) + 1) % 10);
    const newNode = {
      key: nextKey,
      node: {
        id: Date.now().toString(),
        icon: '📞',
        title: 'New Input',
        detail: '',
        type: 'input' as const,
      },
    };
    setIvrNodes({ ...ivrNodes, inputs: [...ivrNodes.inputs, newNode] });
    showToast('Keypad input added');
  };

  const updateKeypadNode = (index: number, key: string, title: string, icon: string) => {
    const updated = [...ivrNodes.inputs];
    updated[index] = {
      key,
      node: {
        ...updated[index].node,
        title,
        icon,
      },
    };
    setIvrNodes({ ...ivrNodes, inputs: updated });
  };

  const removeKeypadInput = (index: number) => {
    setIvrNodes({ ...ivrNodes, inputs: ivrNodes.inputs.filter((_, i) => i !== index) });
    showToast('Keypad input removed');
  };

  const bulkDial = () => {
    if (!bulkNumbers.trim()) {
      showToast('Enter phone numbers');
      return;
    }
    const numbers = bulkNumbers.split('\n').filter((n) => n.trim());
    showToast(`Bulk dial queued: ${numbers.length} numbers`);
    setBulkDialModal(false);
    setBulkNumbers('');
  };

  const filteredNumbers = numberData.filter((n) => n.phone.includes(numberSearch));
  const filteredDids = dids.filter((d) => d.phone.includes(didSearch) || d.extension.includes(didSearch));
  const filteredTenants = tenants.filter((t) => t.name.toLowerCase().includes(tenantSearch.toLowerCase()));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`sidebar w-64 bg-[color:var(--sidebar)] text-slate-200 flex-shrink-0 flex flex-col ${sidebarOpen ? 'open' : ''}`}>
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
          <button className="ml-auto lg:hidden text-white/70" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>
        <nav className="p-3 flex-1 overflow-y-auto text-sm">
          {permittedPages.map((item) => (
            <div
              key={item.key}
              className={`sidebar-link ${activePage === item.key ? 'active' : ''}`}
              onClick={() => switchPage(item.key)}
              title={`Access Level: ${roleLabels[userRole]}`}
            >
              {item.label}
            </div>
          ))}
          {permittedPages.length === 0 && <div className="text-slate-500 p-2">No pages available for this role</div>}
        </nav>
        <div className="p-4 border-t border-white/5 text-xs text-slate-400 flex items-center gap-2">
          <span className="avatar" style={{ background: '#f59e0b' }}>AS</span>
          <div>
            <div className="text-white text-sm">Amy Smith</div>
            <div className="text-cyan-400 font-semibold">{roleLabels[userRole]}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="main-topbar flex items-center gap-2 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-outline">
            ☰
          </button>
          <span className="logo-mark">VOXA</span>
          <div className="ml-auto flex items-center gap-2 min-w-0">
            {/* Minimalistic role selector - responsive */}
            <div className="relative" ref={roleSelectorRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={showRoleSelector}
                className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium pl-2 pr-2 sm:pl-3 sm:pr-2.5 py-1.5 rounded-full border border-slate-200 transition-colors"
                onClick={() => setShowRoleSelector(!showRoleSelector)}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                <span className="hidden sm:inline max-w-[140px] truncate">{roleLabels[userRole]}</span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${showRoleSelector ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showRoleSelector && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 tracking-wider">SWITCH ROLE</div>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                      <button
                        key={role}
                        role="option"
                        aria-selected={userRole === role}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          userRole === role
                            ? 'bg-cyan-50 text-cyan-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          setUserRole(role);
                          setShowRoleSelector(false);
                          showToast(`Role changed to ${roleLabels[role]}`);
                        }}
                      >
                        {roleLabels[role]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="btn-blue whitespace-nowrap px-2.5 sm:px-3" onClick={() => setTestCallModal(true)}>
              <span className="sm:hidden">📞</span>
              <span className="hidden sm:inline">📞 Test Call</span>
            </button>
          </div>
        </div>

        {/* Admin Panel */}
        {activePage === 'admin' && (
          <section className="page active">
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
                <canvas ref={adminChartRef} height={300} />
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">System Health</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>SIP Trunk</span>
                    <span className="chip chip-green">● Operational</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp API</span>
                    <span className="chip chip-green">● Operational</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMS Gateway</span>
                    <span className="chip chip-yellow">● Degraded</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recording Storage</span>
                    <span className="chip chip-green">● 42% used</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVR Engine</span>
                    <span className="chip chip-green">● Operational</span>
                  </div>
                </div>
                <h3 className="font-semibold mt-5 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-outline" onClick={() => switchPage('softphone')}>
                    📞 Softphone
                  </button>
                  <button className="btn-outline" onClick={() => switchPage('users')}>
                    👥 Add User
                  </button>
                  <button className="btn-outline" onClick={() => switchPage('numbers')}>
                    📱 Numbers
                  </button>
                  <button className="btn-outline" onClick={() => switchPage('logs')}>
                    📄 View Logs
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Softphone */}
        {activePage === 'softphone' && (
          <section className="page active">
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
                  className="input text-2xl text-center font-mono py-4 mb-1"
                  placeholder="Enter number"
                  value={spNumber}
                  onChange={(e) => setSpNumber(e.target.value)}
                />
                <div className="text-center text-xs text-slate-500 mb-3 h-4">{spTimer}</div>
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
                      {btn[0]}
                      <span className="sub">{btn[1]}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-3 ${callState.active ? 'btn-danger' : 'btn-primary'}`}
                    onClick={toggleCall}
                  >
                    {callState.active ? '✕ End Call' : '📞 Call'}
                  </button>
                  <button className="btn-outline px-3" onClick={dialBackspace}>
                    ⌫
                  </button>
                </div>

                <div className={`grid grid-cols-4 gap-2 mt-4 ${callState.active ? '' : 'opacity-40 pointer-events-none'}`}>
                  <button
                    className={`ctrl-btn ${callState.mute ? 'on' : ''}`}
                    onClick={() => {
                      setCallState({ ...callState, mute: !callState.mute });
                      toggleCtl('mute');
                    }}
                  >
                    🔇<span>Mute</span>
                  </button>
                  <button
                    className={`ctrl-btn ${callState.hold ? 'on' : ''}`}
                    onClick={() => {
                      setCallState({ ...callState, hold: !callState.hold });
                      toggleCtl('hold');
                    }}
                  >
                    ⏸<span>Hold</span>
                  </button>
                  <button
                    className={`ctrl-btn ${callState.rec ? 'rec' : ''}`}
                    onClick={() => {
                      setCallState({ ...callState, rec: !callState.rec });
                      toggleCtl('rec');
                    }}
                  >
                    ⏺<span>Record</span>
                  </button>
                  <button
                    className={`ctrl-btn ${callState.spk ? 'on' : ''}`}
                    onClick={() => {
                      setCallState({ ...callState, spk: !callState.spk });
                      toggleCtl('spk');
                    }}
                  >
                    🔊<span>Speaker</span>
                  </button>
                  <button className="ctrl-btn" onClick={() => showToast('Keypad sent')}>
                    ⌨<span>Keypad</span>
                  </button>
                  <button className="ctrl-btn" onClick={() => showToast('Transferring…')}>
                    ↪<span>Transfer</span>
                  </button>
                  <button className="ctrl-btn" onClick={() => showToast('Added to conference')}>
                    👥<span>Conf</span>
                  </button>
                  <button className="ctrl-btn" onClick={() => showToast('Note added')}>
                    📝<span>Note</span>
                  </button>
                </div>
              </div>

              <div className="card p-5 lg:col-span-2">
                <h3 className="font-semibold mb-3">Active Call</h3>
                {!callState.active ? (
                  <div className="text-center py-10 text-slate-400">No active call. Dial a number to begin.</div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 pb-4 border-b">
                      <div
                        className="avatar"
                        style={{ width: '56px', height: '56px', fontSize: '1.2rem', background: '#3b82f6' }}
                      >
                        {spNumber.slice(-2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg truncate">Outbound Call</div>
                        <div className="text-sm text-slate-500">{spNumber}</div>
                      </div>
                      <button className="btn-danger" onClick={toggleCall}>
                        ✕ End
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">Direction</div>
                        <div className="font-semibold">Outbound</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Queue</div>
                        <div className="font-semibold">Sales</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Codec</div>
                        <div className="font-semibold">Opus 48k</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Quality</div>
                        <div className="font-semibold text-emerald-600">Excellent</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 mb-1">Live Waveform</div>
                      <canvas ref={waveCanvasRef} height={60} className="w-full border rounded" />
                    </div>
                  </div>
                )}
                <h3 className="font-semibold mt-6 mb-2">Recent</h3>
                <div className="space-y-2">
                  {recentCalls.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium text-sm">{r.num}</div>
                        <div className="text-xs text-slate-500">
                          {r.time} · {r.dur}
                        </div>
                      </div>
                      <button
                        className="btn-outline"
                        onClick={() => {
                          setSpNumber(r.num);
                          showToast('Number set');
                        }}
                      >
                        📞
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Outbound */}
        {activePage === 'outbound' && (
          <section className="page active">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">Outbound Calls</h1>
              <p className="text-slate-500 text-sm">Manage outbound campaigns and dialing lists.</p>
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi">
                <div className="text-xs text-slate-500">Calls Today</div>
                <div className="text-2xl font-bold">248</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Connected</div>
                <div className="text-2xl font-bold text-emerald-600">186</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Voicemail</div>
                <div className="text-2xl font-bold text-yellow-600">32</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Failed</div>
                <div className="text-2xl font-bold text-red-600">30</div>
              </div>
            </div>
            <div className="px-8 mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => showToast('New campaign created')}>
                + New Campaign
              </button>
              <button className="btn-outline" onClick={() => switchPage('softphone')}>
                📞 Open Dialer
              </button>
              <button className="btn-outline" onClick={() => setBulkDialModal(true)}>
                📋 Bulk Dial
              </button>
              <button className="btn-outline" onClick={() => showToast('Exported CSV')}>
                ⬇ Export
              </button>
            </div>
            <div className="px-8 mt-4 pb-8">
              <div className="card table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Agent</th>
                      <th>Number</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Campaign</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obData.map((r, i) => {
                      const chipClass =
                        r[4] === 'Connected' ? 'chip-green' : r[4] === 'Voicemail' ? 'chip-yellow' : 'chip-red';
                      return (
                        <tr key={i}>
                          <td>{r[0]}</td>
                          <td>{r[1]}</td>
                          <td>{r[2]}</td>
                          <td>{r[3]}</td>
                          <td>
                            <span className={`chip ${chipClass}`}>{r[4]}</span>
                          </td>
                          <td>{r[5]}</td>
                          <td>
                            <button
                              className="btn-outline"
                              onClick={() => {
                                setSpNumber(r[2]);
                                switchPage('softphone');
                              }}
                            >
                              📞 Redial
                            </button>
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

        {/* Inbound */}
        {activePage === 'inbound' && (
          <section className="page active">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">Inbound Calls</h1>
              <p className="text-slate-500 text-sm">Live incoming calls and routing.</p>
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi">
                <div className="text-xs text-slate-500">Ringing</div>
                <div className="text-2xl font-bold text-blue-600">{inboundCalls.length}</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Answered</div>
                <div className="text-2xl font-bold text-emerald-600">421</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Missed</div>
                <div className="text-2xl font-bold text-red-600">18</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Avg Wait</div>
                <div className="text-2xl font-bold">00:12</div>
              </div>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 pb-8">
              <div className="card p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Live Incoming</h3>
                  <button className="btn-outline" onClick={SimulateIncoming}>
                    + Simulate Ring
                  </button>
                </div>
                <div className="space-y-2">
                  {inboundCalls.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded animate-pulse-slow">
                      <span className="status-dot" style={{ background: '#3b82f6' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{c.name}</div>
                        <div className="text-xs text-slate-500">
                          {c.num} · {c.queue} · waiting {c.wait}s
                        </div>
                      </div>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setSpNumber(c.num);
                          setInboundCalls(inboundCalls.filter((_, j) => j !== i));
                          switchPage('softphone');
                          setTimeout(() => toggleCall(), 100);
                        }}
                      >
                        Answer
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => {
                          setInboundCalls(inboundCalls.filter((_, j) => j !== i));
                          showToast('Call declined');
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  ))}
                  {inboundCalls.length === 0 && <div className="text-center text-slate-500 py-6">No incoming calls</div>}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Routing Rules</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { name: 'Auto-answer after 3 rings', def: true },
                    { name: 'Route to IVR first', def: true },
                    { name: 'Voicemail if no agent', def: true },
                    { name: 'Business hours only', def: false },
                    { name: 'Record all calls', def: true },
                  ].map((rule, i) => (
                    <label key={i} className="flex items-center justify-between">
                      <span>{rule.name}</span>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked={rule.def} />
                        <span></span>
                      </label>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Call Queue */}
        {activePage === 'queue' && (
          <section className="page active">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">Call Queue</h1>
              <p className="text-slate-500 text-sm">Waiting callers and agent availability.</p>
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi">
                <div className="text-xs text-slate-500">In Queue</div>
                <div className="text-2xl font-bold">{queueData.length}</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Longest Wait</div>
                <div className="text-2xl font-bold text-orange-600">
                  {queueData.length ? fmtT(Math.max(...queueData.map((q) => q.wait))) : '00:00'}
                </div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Available Agents</div>
                <div className="text-2xl font-bold text-emerald-600">4</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">SLA Today</div>
                <div className="text-2xl font-bold">94%</div>
              </div>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Waiting Callers</h3>
                  <button className="btn-outline" onClick={() => showToast('Queue refreshed')}>
                    ↻ Refresh
                  </button>
                </div>
                <div className="space-y-2">
                  {queueData.map((q, i) => (
                    <div key={i} className="queue-row">
                      <span className="status-dot" style={{ background: q.prio === 'High' ? '#dc2626' : '#3b82f6' }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{q.name}</div>
                        <div className="text-xs text-slate-500">
                          {q.num} · {q.queue}
                        </div>
                      </div>
                      <div className="text-sm font-mono">{fmtT(q.wait)}</div>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setSpNumber(q.num);
                          setQueueData(queueData.filter((_, j) => j !== i));
                          switchPage('softphone');
                          setTimeout(() => toggleCall(), 100);
                        }}
                      >
                        Pick
                      </button>
                    </div>
                  ))}
                  {queueData.length === 0 && <div className="text-center text-slate-500 py-4">Queue empty</div>}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Agent Status</h3>
                <div className="space-y-2">
                  {agents.map((a, i) => {
                    const col = a.status === 'available' ? '#10b981' : a.status === 'on-call' ? '#dc2626' : '#94a3b8';
                    return (
                      <div key={i} className="queue-row">
                        <span className="avatar" style={{ background: a.color }}>
                          {initials(a.name)}
                        </span>
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
        {activePage === 'billing' && hasPermission('canViewBilling') && (
          <section className="page active">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">Global Billing</h1>
              <p className="text-slate-500 text-sm">Role: {roleLabels[userRole]} | Modify Billing: {hasPermission('canModifyBilling') ? 'Allowed' : 'Restricted'}</p>
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi">
                <div className="text-xs text-slate-500">Current Balance</div>
                <div className="text-2xl font-bold text-emerald-600">$4,238.10</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">This Month</div>
                <div className="text-2xl font-bold">$1,875.50</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Next Invoice</div>
                <div className="text-2xl font-bold">Oct 1</div>
              </div>
              <div className="kpi">
                <div className="text-xs text-slate-500">Plan</div>
                <div className="text-2xl font-bold">Enterprise</div>
              </div>
            </div>
            <div className="px-8 mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => showToast('Redirecting to payment…')}>
                💳 Add Funds
              </button>
              <button className="btn-outline" onClick={() => showToast('Invoice downloaded')}>
                ⬇ Download Invoice
              </button>
              <button className="btn-outline" onClick={() => switchPage('users')}>
                Manage Plans
              </button>
            </div>
            <div className="px-8 mt-4 pb-8">
              <div className="card table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.map((r, i) => (
                      <tr key={i}>
                        <td className="font-medium">{r.invoice}</td>
                        <td>{r.date}</td>
                        <td>{r.amount}</td>
                        <td>
                          <span className={`chip ${r.status === 'Paid' ? 'chip-green' : 'chip-yellow'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn-outline" onClick={() => showToast(`Invoice ${r.invoice} downloaded`)}>
                            ⬇ PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Security */}
        {activePage === 'security' && hasPermission('canViewSecurity') && (
          <section className="page active">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">Security</h1>
              <p className="text-slate-500 text-sm">Role: {roleLabels[userRole]}</p>
            </div>
            <div className="px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Security Settings</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Two-Factor Authentication (2FA)', checked: true },
                    { label: 'SSO (SAML)', checked: false },
                    { label: 'IP Allowlist', checked: true },
                    { label: 'End-to-end Encrypted Recordings', checked: true },
                    { label: 'Auto-logout after 30 mins', checked: false },
                    { label: 'Suspicious login alerts', checked: true },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked={item.checked} />
                        <span></span>
                      </label>
                    </label>
                  ))}
                </div>
                <button className="btn-primary mt-4" onClick={() => showToast('Security settings saved')}>
                  Save Changes
                </button>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold mb-3">Recent Audit Log</h3>
                <div className="space-y-2 text-sm">
                  {audit.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 border-b pb-2">
                      <span className="avatar" style={{ background: '#64748b' }}>
                        {initials(a.who)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          <b>{a.who}</b> {a.what}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.when} · {a.ip}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Users */}
        {activePage === 'users' && hasPermission('canManageUsers') && (
          <section className="page active">
            <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold">User Management</h1>
                <p className="text-slate-500 text-sm">Manage workspace users and permissions • Role: {roleLabels[userRole]}</p>
              </div>
              <button className="btn-blue" onClick={() => { setCreateUserModal(true); setUserForm({ name: '', role: 'Agent', status: 'Active' }); }}>+ Add New User</button>
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">Total Users</div><div className="text-2xl font-bold">{users.length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-emerald-600">{users.filter(u => u.status === 'Active').length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Disabled</div><div className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'Disabled').length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Admins</div><div className="text-2xl font-bold">{users.filter(u => u.role.includes('Admin')).length}</div></div>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
                <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <select className="select max-w-xs" value={userFilterStatus} onChange={(e) => setUserFilterStatus(e.target.value)}>
                  <option>All</option>
                  <option>Active</option>
                  <option>Disabled</option>
                </select>
                <button className="btn-outline" onClick={() => showToast('Users exported')}>⬇ Export</button>
              </div>
              <div className="card mt-3 table-wrap">
                <table>
                  <thead><tr><th><input type="checkbox" /></th><th>Username</th><th>Role</th><th>Status</th><th>Owner</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={i}>
                        <td><input type="checkbox" /></td>
                        <td className="font-medium"><span className="avatar mr-2" style={{ background: u.color }}>{initials(u.name)}</span>{u.name}</td>
                        <td>{u.role}</td>
                        <td><span className={`chip ${u.status === 'Active' ? 'chip-green' : 'chip-gray'}`}>{u.status}</span></td>
                        <td>{u.owner}</td>
                        <td>{u.date}</td>
                        <td className="whitespace-nowrap">
                          <button className="btn-outline" onClick={() => { setSelectedUserData(u); setUserForm({ name: u.name, role: u.role, status: u.status }); setEditUserModal(true); }}>✎ Edit</button>
                          <button className="btn-outline" onClick={() => toggleUserStatus(u.id)}>{u.status === 'Active' ? 'Disable' : 'Enable'}</button>
                          <button className="btn-outline" onClick={() => deleteUser(u.id)}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Number Provisioning */}
        {activePage === 'numbers' && hasPermission('canManageDIDs') && (
          <section className="page active">
            <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
              <div><h1 className="text-2xl font-bold">DID Management</h1><p className="text-slate-500 text-sm">Manage Direct Inward Dial numbers and assignments • Role: {roleLabels[userRole]}</p></div>
              {hasPermission('canManageDIDs') && (
                <button className="btn-blue" onClick={() => { setCreateDidModal(true); setDidForm({ phone: '', type: 'Inbound', tenant: 'Phoenix Telecom Inc.', extension: '', provider: 'Twilio' }); }}>+ Create DID</button>
              )}
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">Total DIDs</div><div className="text-2xl font-bold">{dids.length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-emerald-600">{dids.filter(d => d.status === 'Active').length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Inbound</div><div className="text-2xl font-bold">{dids.filter(d => d.type === 'Inbound').length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Outbound</div><div className="text-2xl font-bold">{dids.filter(d => d.type === 'Outbound').length}</div></div>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
                <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search by phone or extension..." value={didSearch} onChange={(e) => setDidSearch(e.target.value)} />
                <button className="btn-outline" onClick={() => showToast('DIDs exported')}>⬇ Export</button>
              </div>
              <div className="card mt-3 table-wrap">
                <table>
                  <thead><tr><th>DID ID</th><th>Phone Number</th><th>Type</th><th>Status</th><th>Tenant</th><th>Extension</th><th>Provider</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredDids.map((did, i) => (
                      <tr key={i}>
                        <td className="font-medium whitespace-nowrap">{did.id}</td>
                        <td className="font-semibold">{did.phone}</td>
                        <td><span className={`chip ${did.type === 'Inbound' ? 'chip-blue' : 'chip-green'}`}>{did.type}</span></td>
                        <td><span className="chip chip-green">Active</span></td>
                        <td>{did.tenant}</td>
                        <td>{did.extension}</td>
                        <td>{did.provider}</td>
                        <td>{did.created}</td>
                        <td className="whitespace-nowrap">
                          <button className="btn-outline" onClick={() => { setSelectedDid(did); setDidForm({ phone: did.phone, type: did.type, tenant: did.tenant, extension: did.extension, provider: did.provider }); setEditDidModal(true); }}>✎ Edit</button>
                          <button className="btn-outline" onClick={() => assignDidToTenant(did.id, 'TENANT001')}>🔗 Assign</button>
                          <button className="btn-outline" onClick={() => deleteDid(did.id)}>🗑 Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activePage === 'tenants' && hasPermission('canManageTenants') && (
          <section className="page active">
            <div className="px-8 pt-6 flex items-start justify-between flex-wrap gap-2">
              <div><h1 className="text-2xl font-bold">Tenant Management</h1><p className="text-slate-500 text-sm">Create and manage customer tenants and workspaces • Role: {roleLabels[userRole]}</p></div>
              {hasPermission('canManageTenants') && (
                <button className="btn-blue" onClick={() => { setCreateTenantModal(true); setTenantForm({ name: '', owner: '', tier: 'Professional' }); }}>+ Create Tenant</button>
              )}
            </div>
            <div className="px-8 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="kpi"><div className="text-xs text-slate-500">Total Tenants</div><div className="text-2xl font-bold">{tenants.length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Active</div><div className="text-2xl font-bold text-emerald-600">{tenants.filter(t => t.status === 'Active').length}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Total Users</div><div className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.users, 0)}</div></div>
              <div className="kpi"><div className="text-xs text-slate-500">Total DIDs</div><div className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.dids, 0)}</div></div>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card mt-4 p-3 flex flex-wrap gap-3 items-center">
                <input className="input flex-1 min-w-[180px] max-w-md" placeholder="Search tenants..." value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} />
                <button className="btn-outline" onClick={() => showToast('Tenants exported')}>⬇ Export</button>
              </div>
              <div className="card mt-3 table-wrap">
                <table>
                  <thead><tr><th>Tenant ID</th><th>Name</th><th>Owner</th><th>Status</th><th>Users</th><th>DIDs</th><th>Tier</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredTenants.map((tenant, i) => (
                      <tr key={i}>
                        <td className="font-medium whitespace-nowrap">{tenant.id}</td>
                        <td className="font-semibold">{tenant.name}</td>
                        <td>{tenant.owner}</td>
                        <td><span className={`chip ${tenant.status === 'Active' ? 'chip-green' : 'chip-gray'}`}>{tenant.status}</span></td>
                        <td>{tenant.users}</td>
                        <td>{tenant.dids}</td>
                        <td><span className="chip chip-blue">{tenant.tier}</span></td>
                        <td>{tenant.created}</td>
                        <td className="whitespace-nowrap">
                          <button className="btn-outline" onClick={() => { setSelectedTenant(tenant); setTenantForm({ name: tenant.name, owner: tenant.owner, tier: tenant.tier }); setEditTenantModal(true); }}>✎ Edit</button>
                          <button className="btn-outline" onClick={() => toggleTenantStatus(tenant.id)}>{tenant.status === 'Active' ? 'Disable' : 'Enable'}</button>
                          <button className="btn-outline" onClick={() => deleteTenant(tenant.id)}>🗑 Delete</button>
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
          <section className="page active">
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
                  <button
                    key={i}
                    className="card p-6 flex flex-col items-center gap-2 hover:shadow-md transition"
                    onClick={() => showToast(c.label + ' selected')}
                  >
                    <div className="text-4xl" style={{ color: c.color }}>
                      {c.icon}
                    </div>
                    <div className="text-lg font-semibold">{c.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6 mb-8">
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">Combined Omnichannel Usage (Last 30 Days)</h3>
                  <canvas ref={omniChartRef} height={300} />
                </div>
                <div className="card p-4">
                  <h3 className="font-semibold mb-3">WhatsApp Performance</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Number</th>
                          <th>User</th>
                          <th>Sent</th>
                          <th>Recv</th>
                          <th>Rate</th>
                          <th>Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['(123) 456…', 'Amy Smith', '190', '268', '98.7%', '17.2s'],
                          ['(123) 456…', 'Amy Smith', '336', '400', '98.7%', '17.3s'],
                          ['(123) 456…', 'Mny Number', '220', '258', '98.7%', '12.3s'],
                        ].map((r, i) => (
                          <tr key={i}>
                            {r.map((c, j) => (
                              <td key={j}>{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* IVR Menu */}
        {activePage === 'ivr' && (
          <section className="page active">
            <div className="px-8 pt-6">
              <h1 className="text-2xl font-bold">IVR Menu Builder — Main Company Hotline</h1>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card p-4">
                <h3 className="font-semibold mb-3">IVR Builder</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Trigger */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Trigger</div>
                    {ivrNodes.trigger.map((n, i) => (
                      <div key={n.id} className="ivr-node relative group">
                        <button
                          className="absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100"
                          onClick={() => removeIVRNode(n.id, 'trigger')}
                        >
                          ✕
                        </button>
                        <button
                          className="w-full text-left"
                          onClick={() => {
                            setEditingIvrNode(n);
                            setIvrEditModal(true);
                          }}
                        >
                          <div className="node-title">{n.icon} {n.title}</div>
                          <div className="mt-2 text-xs whitespace-pre-line text-slate-600">{n.detail}</div>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Flow */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Flow</div>
                    {ivrNodes.flow.map((n, i) => (
                      <div key={n.id} className="ivr-node relative group">
                        <button
                          className="absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100"
                          onClick={() => removeIVRNode(n.id, 'flow')}
                        >
                          ✕
                        </button>
                        <button
                          className="w-full text-left"
                          onClick={() => {
                            setEditingIvrNode(n);
                            setIvrEditModal(true);
                          }}
                        >
                          <div className="node-title">{n.icon} {n.title}</div>
                          <div className="mt-2 text-xs whitespace-pre-line text-slate-600">{n.detail}</div>
                        </button>
                      </div>
                    ))}
                    <button className="btn-outline w-full" onClick={() => addIVRNode('flow')}>
                      + Add flow step
                    </button>
                  </div>

                  {/* Keypad Inputs */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">Keypad Inputs</div>
                    <div className="ivr-node bg-slate-50">
                      <div className="node-title">☰ Keypad Inputs</div>
                      <div className="text-xs mt-1 text-slate-500">Press digit → destination</div>
                    </div>
                    {ivrNodes.inputs.map((k, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className="input"
                          style={{ width: '46px', textAlign: 'center', padding: '.35rem' }}
                          maxLength={1}
                          value={k.key}
                          onChange={(e) => updateKeypadNode(i, e.target.value, k.node.title, k.node.icon)}
                        />
                        <div className="ivr-node flex-1 relative group">
                          <button
                            className="absolute top-1 right-1 text-xs opacity-0 group-hover:opacity-100"
                            onClick={() => removeKeypadInput(i)}
                          >
                            ✕
                          </button>
                          <button
                            className="w-full text-left"
                            onClick={() => {
                              setEditingIvrNode(k.node);
                              setIvrEditModal(true);
                            }}
                          >
                            <div className="node-title">{k.node.icon} {k.node.title}</div>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="btn-outline w-full" onClick={addKeypadInput}>
                      + Add keypad input
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Master Logs */}
        {activePage === 'logs' && (
          <section className="page active">
            <div className="px-8 pt-6">
              <div className="text-xs text-slate-500">Global Call Logs</div>
              <h1 className="text-2xl font-bold">Master Call History</h1>
            </div>
            <div className="px-8 mt-6 pb-8">
              <div className="card mt-3 table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input type="checkbox" />
                      </th>
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
                  <tbody>
                    {logsData.map((r, i) => {
                      const a = agents.find((x) => x.name === r[1]) || { color: '#64748b' };
                      return (
                        <tr key={i}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td className="whitespace-nowrap">
                            Jun 01 · {r[0]}
                          </td>
                          <td className="whitespace-nowrap">
                            <span className="avatar mr-2" style={{ background: a.color }}>
                              {initials(r[1])}
                            </span>
                            {r[1]}
                          </td>
                          <td>{r[2]}</td>
                          <td>{r[3] === 'in' ? '↙ in' : '↗ out'}</td>
                          <td>{r[4]}</td>
                          <td>{r[5]}</td>
                          <td>{statusChip(r[6])}</td>
                          <td className="whitespace-nowrap">
                            <button className="btn-outline" onClick={() => showToast('Viewing call')}>
                              👁
                            </button>
                            <button className="btn-outline" onClick={() => showToast('Listening…')}>
                              🎧
                            </button>
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
        <div className="modal-backdrop open" onClick={() => setTestCallModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Test Call Control</h3>
              <button onClick={() => setTestCallModal(false)} className="text-slate-500">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">From (Outgoing)</label>
                <select className="select" ref={tcFromRef}>
                  <option>(345) 616-1256</option>
                  <option>(41) 616-1256</option>
                  <option>(3) 414-3453</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">To (Customer)</label>
                <input className="input" ref={toNumberRef} placeholder="+1 (___) ___-____" />
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
            <div
              className="avatar mx-auto mb-3"
              style={{ width: '70px', height: '70px', fontSize: '1.5rem', background: '#3b82f6' }}
            >
              {incomingCallInfo.avatar}
            </div>
            <div className="text-lg font-bold">{incomingCallInfo.name}</div>
            <div className="text-slate-500 mb-6">{incomingCallInfo.num}</div>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary py-3 px-6" onClick={AnswerIncoming}>
                📞 Answer
              </button>
              <button className="btn-danger py-3 px-6" onClick={DeclineIncoming}>
                ✕ Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IVR Edit Modal */}
      {ivrEditModal && editingIvrNode && (
        <div className="modal-backdrop open" onClick={() => setIvrEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Edit IVR Node</h3>
              <button onClick={() => setIvrEditModal(false)} className="text-slate-500">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Icon</label>
                <input
                  className="input"
                  value={editingIvrNode.icon}
                  onChange={(e) => setEditingIvrNode({ ...editingIvrNode, icon: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Title</label>
                <input
                  className="input"
                  value={editingIvrNode.title}
                  onChange={(e) => setEditingIvrNode({ ...editingIvrNode, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={editingIvrNode.detail}
                  onChange={(e) => setEditingIvrNode({ ...editingIvrNode, detail: e.target.value })}
                />
              </div>
              <button
                className="w-full btn-primary py-3"
                onClick={() => {
                  showToast('IVR Node updated');
                  setIvrEditModal(false);
                }}
              >
                Save Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsModal && (
        <div className="modal-backdrop open" onClick={() => setPermissionsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">User Permissions: {selectedUser}</h3>
              <button onClick={() => setPermissionsModal(false)} className="text-slate-500">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(userPerms).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between">
                  <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={() => {}}
                    />
                    <span></span>
                  </label>
                </label>
              ))}
              <button
                className="w-full btn-primary py-3"
                onClick={() => {
                  showToast('Permissions saved for ' + selectedUser);
                  setPermissionsModal(false);
                }}
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Dial Modal */}
      {bulkDialModal && (
        <div className="modal-backdrop open" onClick={() => setBulkDialModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Bulk Dial</h3>
              <button onClick={() => setBulkDialModal(false)} className="text-slate-500">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Phone Numbers (one per line)</label>
                <textarea
                  className="input"
                  rows={6}
                  value={bulkNumbers}
                  onChange={(e) => setBulkNumbers(e.target.value)}
                  placeholder="(555) 111-0001&#10;(555) 111-0002&#10;(555) 111-0003"
                />
              </div>
              <button className="w-full btn-primary py-3" onClick={bulkDial}>
                Queue Bulk Dial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create DID Modal */}
      {createDidModal && (
        <div className="modal-backdrop open" onClick={() => setCreateDidModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create New DID</h3>
              <button onClick={() => setCreateDidModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Phone Number *</label>
                <input className="input" placeholder="e.g., (555) 123-4567" value={didForm.phone} onChange={(e) => setDidForm({...didForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Type *</label>
                <select className="select" value={didForm.type} onChange={(e) => setDidForm({...didForm, type: e.target.value as 'Inbound' | 'Outbound'})}>
                  <option>Inbound</option>
                  <option>Outbound</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Extension *</label>
                <input className="input" placeholder="e.g., ext-001" value={didForm.extension} onChange={(e) => setDidForm({...didForm, extension: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Tenant</label>
                <select className="select" value={didForm.tenant} onChange={(e) => setDidForm({...didForm, tenant: e.target.value})}>
                  {tenants.map(t => <option key={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Provider</label>
                <select className="select" value={didForm.provider} onChange={(e) => setDidForm({...didForm, provider: e.target.value})}>
                  <option>Twilio</option>
                  <option>Vonage</option>
                  <option>Bandwidth</option>
                </select>
              </div>
              <button className="w-full btn-primary py-3" onClick={createDid}>Create DID</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit DID Modal */}
      {editDidModal && selectedDid && (
        <div className="modal-backdrop open" onClick={() => setEditDidModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Edit DID {selectedDid.id}</h3>
              <button onClick={() => setEditDidModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Phone Number</label>
                <input className="input" value={didForm.phone} onChange={(e) => setDidForm({...didForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Type</label>
                <select className="select" value={didForm.type} onChange={(e) => setDidForm({...didForm, type: e.target.value as 'Inbound' | 'Outbound'})}>
                  <option>Inbound</option>
                  <option>Outbound</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Extension</label>
                <input className="input" value={didForm.extension} onChange={(e) => setDidForm({...didForm, extension: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Tenant</label>
                <select className="select" value={didForm.tenant} onChange={(e) => setDidForm({...didForm, tenant: e.target.value})}>
                  {tenants.map(t => <option key={t.id}>{t.name}</option>)}
                </select>
              </div>
              <button className="w-full btn-primary py-3" onClick={updateDid}>Update DID</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {createTenantModal && (
        <div className="modal-backdrop open" onClick={() => setCreateTenantModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create New Tenant</h3>
              <button onClick={() => setCreateTenantModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Tenant Name *</label>
                <input className="input" placeholder="e.g., Acme Corporation" value={tenantForm.name} onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Owner Email *</label>
                <input className="input" type="email" placeholder="owner@example.com" value={tenantForm.owner} onChange={(e) => setTenantForm({...tenantForm, owner: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Subscription Tier</label>
                <select className="select" value={tenantForm.tier} onChange={(e) => setTenantForm({...tenantForm, tier: e.target.value as 'Starter' | 'Professional' | 'Enterprise'})}>
                  <option>Starter</option>
                  <option>Professional</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <button className="w-full btn-primary py-3" onClick={createTenant}>Create Tenant</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editTenantModal && selectedTenant && (
        <div className="modal-backdrop open" onClick={() => setEditTenantModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Edit Tenant {selectedTenant.id}</h3>
              <button onClick={() => setEditTenantModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Tenant Name</label>
                <input className="input" value={tenantForm.name} onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Owner Email</label>
                <input className="input" type="email" value={tenantForm.owner} onChange={(e) => setTenantForm({...tenantForm, owner: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Subscription Tier</label>
                <select className="select" value={tenantForm.tier} onChange={(e) => setTenantForm({...tenantForm, tier: e.target.value as 'Starter' | 'Professional' | 'Enterprise'})}>
                  <option>Starter</option>
                  <option>Professional</option>
                  <option>Enterprise</option>
                </select>
              </div>
              <button className="w-full btn-primary py-3" onClick={updateTenant}>Update Tenant</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createUserModal && (
        <div className="modal-backdrop open" onClick={() => setCreateUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create New User</h3>
              <button onClick={() => setCreateUserModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Username *</label>
                <input className="input" placeholder="e.g., John_Doe" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Role *</label>
                <select className="select" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
                  <option>Agent</option>
                  <option>Support Agent</option>
                  <option>Sales Representative</option>
                  <option>Account Manager</option>
                  <option>Tenant Admin</option>
                  <option>Support Manager</option>
                  <option>Global Admin</option>
                </select>
              </div>
              <button className="w-full btn-primary py-3" onClick={createUser}>Create User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal && selectedUserData && (
        <div className="modal-backdrop open" onClick={() => setEditUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Edit User {selectedUserData.name}</h3>
              <button onClick={() => setEditUserModal(false)} className="text-slate-500">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Username</label>
                <input className="input" value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-medium">Role</label>
                <select className="select" value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}>
                  <option>Agent</option>
                  <option>Support Agent</option>
                  <option>Sales Representative</option>
                  <option>Account Manager</option>
                  <option>Tenant Admin</option>
                  <option>Support Manager</option>
                  <option>Global Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Status</label>
                <select className="select" value={userForm.status} onChange={(e) => setUserForm({...userForm, status: e.target.value as 'Active' | 'Disabled'})}>
                  <option>Active</option>
                  <option>Disabled</option>
                </select>
              </div>
              <button className="w-full btn-primary py-3" onClick={updateUser}>Update User</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast show">{toast}</div>}
    </div>
  );
}
