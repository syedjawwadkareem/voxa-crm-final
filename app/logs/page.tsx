'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, Chip } from '@/components/ui-components'
import { LogsIcon, Download, Filter } from 'lucide-react'

const logs = [
  {
    id: '001',
    timestamp: '09:45:32',
    level: 'INFO',
    component: 'Call Manager',
    message: 'Outbound call initiated from extension 2001 to +1-202-555-0147',
  },
  {
    id: '002',
    timestamp: '09:44:15',
    level: 'INFO',
    component: 'Authentication',
    message: 'User John Smith logged in successfully',
  },
  {
    id: '003',
    timestamp: '09:42:48',
    level: 'WARNING',
    component: 'IVR Engine',
    message: 'High queue depth detected: 12 calls waiting',
  },
  {
    id: '004',
    timestamp: '09:41:22',
    level: 'ERROR',
    component: 'SIP Gateway',
    message: 'Failed to connect to upstream SIP peer: timeout after 30s',
  },
  {
    id: '005',
    timestamp: '09:39:55',
    level: 'INFO',
    component: 'CDR',
    message: 'Call record stored for ID: call_2024_09_001',
  },
  {
    id: '006',
    timestamp: '09:38:12',
    level: 'INFO',
    component: 'Provisioning',
    message: 'Device config pushed to extension 2003',
  },
  {
    id: '007',
    timestamp: '09:36:44',
    level: 'WARNING',
    component: 'System',
    message: 'CPU usage exceeding 75%',
  },
  {
    id: '008',
    timestamp: '09:35:18',
    level: 'INFO',
    component: 'Recording',
    message: 'Call recording completed: 8m 42s',
  },
]

const levelColors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'default',
}

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState('all')

  const filteredLogs =
    levelFilter === 'all'
      ? logs
      : logs.filter((log) => log.level === levelFilter)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <LogsIcon size={32} />
              System Logs
            </h1>
            <p className="text-muted-foreground mt-2">
              View system events and activity logs
            </p>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium">
            <Download size={18} />
            Export Logs
          </button>
        </div>

        {/* Log Levels Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
            <p className="text-2xl font-bold text-card-foreground mt-2">24,582</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Info Events</p>
            <p className="text-2xl font-bold text-blue-500 mt-2">23,145</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Warnings</p>
            <p className="text-2xl font-bold text-yellow-500 mt-2">1,247</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Errors</p>
            <p className="text-2xl font-bold text-red-500 mt-2">190</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {['all', 'INFO', 'WARNING', 'ERROR'].map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                levelFilter === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-sidebar-accent'
              }`}
            >
              {level === 'all' ? 'All Levels' : level}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Level
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Component
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={log.level}
                        variant={levelColors[log.level]}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground font-medium">
                      {log.component}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {log.message}
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
