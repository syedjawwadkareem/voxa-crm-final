'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, KPICard, Chip } from '@/components/ui-components'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Phone, Clock, Users, Activity } from 'lucide-react'

const callData = [
  { time: '00:00', calls: 24, duration: 120 },
  { time: '04:00', calls: 13, duration: 95 },
  { time: '08:00', calls: 98, duration: 480 },
  { time: '12:00', calls: 39, duration: 300 },
  { time: '16:00', calls: 48, duration: 420 },
  { time: '20:00', calls: 38, duration: 320 },
  { time: '24:00', calls: 43, duration: 380 },
]

const channelData = [
  { name: 'Voice', value: 65 },
  { name: 'Email', value: 20 },
  { name: 'Chat', value: 15 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b']

const recentCalls = [
  {
    id: '001',
    from: '+1-202-555-0173',
    to: '+1-202-555-0147',
    duration: '04:23',
    status: 'Completed',
    timestamp: '09:45 AM',
  },
  {
    id: '002',
    from: '+1-202-555-0198',
    to: '+1-202-555-0157',
    duration: '12:05',
    status: 'Completed',
    timestamp: '09:32 AM',
  },
  {
    id: '003',
    from: '+1-202-555-0165',
    to: '+1-202-555-0128',
    duration: '03:15',
    status: 'Missed',
    timestamp: '09:10 AM',
  },
  {
    id: '004',
    from: '+1-202-555-0192',
    to: '+1-202-555-0187',
    duration: '08:42',
    status: 'Completed',
    timestamp: '08:55 AM',
  },
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here&apos;s your communication overview.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Calls"
            value="2,847"
            trend="up"
            trendValue="12% vs yesterday"
          />
          <KPICard
            title="Avg Duration"
            value="5m 32s"
            trend="down"
            trendValue="2% vs yesterday"
          />
          <KPICard title="Active Users" value="127" trend="up" trendValue="5%" />
          <KPICard
            title="System Uptime"
            value="99.9%"
            trend="up"
            trendValue="0.1%"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Call Volume Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Activity size={20} />
              Call Volume
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={callData}>
                <CartesianGrid stroke="#374151" />
                <XAxis stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Channel Distribution */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Channel Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Calls Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Phone size={20} />
            Recent Calls
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    From
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    To
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.from}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.to}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.duration}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={call.status}
                        variant={
                          call.status === 'Completed' ? 'success' : 'error'
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {call.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
