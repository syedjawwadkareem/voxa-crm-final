'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, Button, Chip } from '@/components/ui-components'
import { PhoneOutgoing, Filter, Download, Plus } from 'lucide-react'

const outboundCalls = [
  {
    id: '001',
    agent: 'John Smith',
    customer: 'Alice Johnson',
    number: '+1-202-555-0147',
    startTime: '09:45 AM',
    duration: '04:23',
    result: 'Connected',
    disposition: 'Follow-up',
  },
  {
    id: '002',
    agent: 'Sarah Davis',
    customer: 'Bob Wilson',
    number: '+1-202-555-0157',
    startTime: '09:32 AM',
    duration: '12:05',
    result: 'Connected',
    disposition: 'Sale',
  },
  {
    id: '003',
    agent: 'Mike Brown',
    customer: 'Carol White',
    number: '+1-202-555-0128',
    startTime: '09:10 AM',
    duration: '01:15',
    result: 'No Answer',
    disposition: 'Voicemail',
  },
  {
    id: '004',
    agent: 'Emma Wilson',
    customer: 'David Miller',
    number: '+1-202-555-0187',
    startTime: '08:55 AM',
    duration: '08:42',
    result: 'Connected',
    disposition: 'Inquiry',
  },
  {
    id: '005',
    agent: 'John Smith',
    customer: 'Eve Taylor',
    number: '+1-202-555-0192',
    startTime: '08:30 AM',
    duration: '03:58',
    result: 'Busy',
    disposition: 'Callback',
  },
]

export default function Outbound() {
  const [selectedFilter, setSelectedFilter] = useState('all')

  const resultVariants: Record<string, 'success' | 'warning' | 'error'> = {
    Connected: 'success',
    'No Answer': 'warning',
    Busy: 'error',
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <PhoneOutgoing size={32} />
              Outbound Calls
            </h1>
            <p className="text-muted-foreground mt-2">
              Track and manage outgoing calls
            </p>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            New Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Calls
            </p>
            <p className="text-2xl font-bold text-card-foreground mt-2">1,245</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Connected
            </p>
            <p className="text-2xl font-bold text-card-foreground mt-2">
              892 (72%)
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              No Answer
            </p>
            <p className="text-2xl font-bold text-card-foreground mt-2">
              247 (20%)
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Avg Duration
            </p>
            <p className="text-2xl font-bold text-card-foreground mt-2">
              6m 45s
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {['all', 'Connected', 'No Answer', 'Busy'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                selectedFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Filter size={16} />
              {filter === 'all' ? 'All Calls' : filter}
            </button>
          ))}
          <Button
            variant="outline"
            className="flex items-center gap-2 ml-auto"
          >
            <Download size={18} />
            Export
          </Button>
        </div>

        {/* Calls Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Agent
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Number
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Result
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Disposition
                  </th>
                </tr>
              </thead>
              <tbody>
                {outboundCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-card-foreground font-medium">
                      {call.agent}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.customer}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground font-mono">
                      {call.number}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {call.startTime}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {call.duration}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={call.result}
                        variant={
                          resultVariants[call.result] || 'default'
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {call.disposition}
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
