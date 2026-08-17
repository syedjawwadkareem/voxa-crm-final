import { useState } from 'react';
import { Search, Filter, Download, Calendar, Phone, Hash } from 'lucide-react';

interface CDR {
  id: string;
  agent_extension: string;
  destination: string;
  start_time: string;
  duration: string;
  billsec: string;
  disposition: string;
}

export function IVRHistory() {
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    extension: '',
    number: '',
    status: ''
  });

  // Mock data to simulate API response from CMS
  const mockData: CDR[] = [
    { id: '1', agent_extension: '1001', destination: '+1234567890', start_time: '2026-08-16 10:00:00', duration: '120', billsec: '115', disposition: 'ANSWERED' },
    { id: '2', agent_extension: '1002', destination: '+0987654321', start_time: '2026-08-16 10:05:00', duration: '45', billsec: '0', disposition: 'NO ANSWER' },
    { id: '3', agent_extension: '1001', destination: '+1122334455', start_time: '2026-08-16 10:10:00', duration: '300', billsec: '290', disposition: 'ANSWERED' },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Call History & Reports</h2>
          <p className="text-sm text-slate-500">View detailed call records from your campaigns and IVR systems.</p>
        </div>
        <button className="btn-outline flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">From Date</label>
          <div className="relative">
            <input type="date" className="input text-sm pl-9" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">To Date</label>
          <div className="relative">
            <input type="date" className="input text-sm pl-9" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Extension</label>
          <div className="relative">
            <input type="text" placeholder="e.g. 1001" className="input text-sm pl-9" value={filters.extension} onChange={e => setFilters({ ...filters, extension: e.target.value })} />
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Destination Number</label>
          <div className="relative">
            <input type="text" placeholder="Search number..." className="input text-sm pl-9" value={filters.number} onChange={e => setFilters({ ...filters, number: e.target.value })} />
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
          <select className="input text-sm" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="ANSWERED">ANSWERED</option>
            <option value="NO ANSWER">NO ANSWER</option>
            <option value="BUSY">BUSY</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div className="md:col-span-5 flex justify-end gap-2 mt-2">
          <button className="btn-outline text-sm py-1.5" onClick={() => setFilters({ from: '', to: '', extension: '', number: '', status: '' })}>Reset</button>
          <button className="btn-primary flex items-center gap-2 text-sm py-1.5">
            <Filter size={14} /> Filter Results
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="flex flex-wrap gap-6 mb-6 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
        <div>
          <div className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wide">Total Calls</div>
          <div className="text-2xl font-bold text-blue-900">3</div>
        </div>
        <div className="w-px bg-blue-200"></div>
        <div>
          <div className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">Answered</div>
          <div className="text-2xl font-bold text-emerald-900">2</div>
        </div>
        <div className="w-px bg-blue-200"></div>
        <div>
          <div className="text-xs text-red-600 font-semibold mb-1 uppercase tracking-wide">Failed / No Answer</div>
          <div className="text-2xl font-bold text-red-900">1</div>
        </div>
        <div className="w-px bg-blue-200"></div>
        <div>
          <div className="text-xs text-indigo-600 font-semibold mb-1 uppercase tracking-wide">Total Talk Time</div>
          <div className="text-2xl font-bold text-indigo-900">00:06:45</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Extension</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Destination</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Start Time</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Duration (s)</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Billsec (s)</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-600">{row.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.agent_extension}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.destination}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.start_time}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.duration}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.billsec}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`chip ${row.disposition === 'ANSWERED' ? 'chip-green' : 'chip-red'}`}>
                    {row.disposition}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mockData.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">No call records found matching your filters.</div>
        )}
      </div>
    </div>
  );
}
