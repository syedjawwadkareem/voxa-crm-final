'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, KPICard, Chip } from '@/components/ui-components'
import { MessageSquare } from 'lucide-react'

const queuedCalls = [
  {
    id: '001',
    from: '+1-202-555-0191',
    waitTime: '3m 45s',
    priority: 'High',
    department: 'Support',
  },
  {
    id: '002',
    from: '+1-202-555-0156',
    waitTime: '2m 12s',
    priority: 'Normal',
    department: 'Sales',
  },
  {
    id: '003',
    from: '+1-202-555-0184',
    waitTime: '1m 58s',
    priority: 'Normal',
    department: 'Support',
  },
  {
    id: '004',
    from: '+1-202-555-0129',
    waitTime: '1m 34s',
    priority: 'Low',
    department: 'Billing',
  },
  {
    id: '005',
    from: '+1-202-555-0173',
    waitTime: '0m 45s',
    priority: 'Normal',
    department: 'Sales',
  },
]

export default function Queue() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare size={32} />
            Call Queue
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage queued calls and wait times
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Queued Calls"
            value="12"
            trend="up"
            trendValue="3 more than avg"
          />
          <KPICard
            title="Avg Wait Time"
            value="2m 26s"
            trend="down"
            trendValue="34s improvement"
          />
          <KPICard
            title="Longest Wait"
            value="5m 12s"
            trend="down"
            trendValue="18s vs peak"
          />
          <KPICard
            title="Agents Available"
            value="8/12"
            trend="up"
            trendValue="2 coming soon"
          />
        </div>

        {/* Queue Status */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Queue Distribution by Department
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Support
                </span>
                <span className="text-sm text-muted-foreground">6 calls</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Sales
                </span>
                <span className="text-sm text-muted-foreground">4 calls</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '33%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Billing
                </span>
                <span className="text-sm text-muted-foreground">2 calls</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '17%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Queued Calls Table */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Current Queue
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    From
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Wait Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Department
                  </th>
                </tr>
              </thead>
              <tbody>
                {queuedCalls.map((call, idx) => (
                  <tr
                    key={call.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-semibold text-card-foreground">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground font-mono">
                      {call.from}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.waitTime}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={call.priority}
                        variant={
                          call.priority === 'High'
                            ? 'error'
                            : call.priority === 'Normal'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {call.department}
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
