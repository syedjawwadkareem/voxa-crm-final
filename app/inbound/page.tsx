'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, Button, Chip, KPICard } from '@/components/ui-components'
import { PhoneIncoming, AlertCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const inboundData = [
  { hour: '8 AM', calls: 45, answered: 42, missed: 3 },
  { hour: '9 AM', calls: 62, answered: 58, missed: 4 },
  { hour: '10 AM', calls: 78, answered: 74, missed: 4 },
  { hour: '11 AM', calls: 55, answered: 51, missed: 4 },
  { hour: '12 PM', calls: 48, answered: 45, missed: 3 },
  { hour: '1 PM', calls: 65, answered: 62, missed: 3 },
]

const inboundCalls = [
  {
    id: '001',
    from: '+1-202-555-0173',
    receivedBy: 'John Smith',
    duration: '04:23',
    status: 'Answered',
    time: '09:45 AM',
  },
  {
    id: '002',
    from: '+1-202-555-0198',
    receivedBy: 'Sarah Davis',
    duration: '12:05',
    status: 'Answered',
    time: '09:32 AM',
  },
  {
    id: '003',
    from: '+1-202-555-0165',
    receivedBy: 'Queue',
    duration: '00:00',
    status: 'Missed',
    time: '09:10 AM',
  },
  {
    id: '004',
    from: '+1-202-555-0192',
    receivedBy: 'Mike Brown',
    duration: '08:42',
    status: 'Answered',
    time: '08:55 AM',
  },
]

export default function Inbound() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <PhoneIncoming size={32} />
            Inbound Calls
          </h1>
          <p className="text-muted-foreground mt-2">
            Incoming calls and queue management
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Inbound"
            value="353"
            trend="up"
            trendValue="8% today"
          />
          <KPICard
            title="Answer Rate"
            value="94.6%"
            trend="up"
            trendValue="2% vs avg"
          />
          <KPICard
            title="Avg Hold Time"
            value="1m 23s"
            trend="down"
            trendValue="5s improvement"
          />
          <KPICard title="Queue Depth" value="12" trend="up" trendValue="5" />
        </div>

        {/* Alert */}
        <div className="mb-8 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
              High Call Volume Alert
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Queue depth exceeds normal thresholds. Consider opening additional lines.
            </p>
          </div>
        </div>

        {/* Charts */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Call Volume Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inboundData}>
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
              <Bar dataKey="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="answered" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Calls */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Recent Inbound Calls
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    From
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Received By
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
                {inboundCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-card-foreground font-mono">
                      {call.from}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.receivedBy}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.duration}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={call.status}
                        variant={
                          call.status === 'Answered' ? 'success' : 'error'
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {call.time}
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
