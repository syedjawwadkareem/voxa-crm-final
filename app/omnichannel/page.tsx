'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, KPICard, Chip, Toggle } from '@/components/ui-components'
import { Radio } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const channelData = [
  { time: '8 AM', voice: 45, email: 12, chat: 8, sms: 5 },
  { time: '9 AM', voice: 62, email: 18, chat: 14, sms: 9 },
  { time: '10 AM', voice: 78, email: 25, chat: 22, sms: 12 },
  { time: '11 AM', voice: 55, email: 16, chat: 18, sms: 8 },
  { time: '12 PM', voice: 48, email: 22, chat: 19, sms: 11 },
  { time: '1 PM', voice: 65, email: 28, chat: 24, sms: 14 },
]

const channels = [
  { name: 'Voice', enabled: true, volume: 2156, status: 'Active' },
  { name: 'Email', enabled: true, volume: 892, status: 'Active' },
  { name: 'Chat', enabled: true, volume: 654, status: 'Active' },
  { name: 'SMS', enabled: false, volume: 145, status: 'Inactive' },
  { name: 'Social Media', enabled: false, volume: 78, status: 'Inactive' },
]

export default function Omnichannel() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Radio size={32} />
            Omnichannel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage communications across all channels
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Total Interactions" value="3,725" />
          <KPICard
            title="Voice Share"
            value="57.8%"
            trend="up"
            trendValue="3% growth"
          />
          <KPICard
            title="Email Share"
            value="23.9%"
            trend="up"
            trendValue="2% growth"
          />
          <KPICard
            title="Chat Share"
            value="17.5%"
            trend="down"
            trendValue="1% decline"
          />
        </div>

        {/* Channel Volume Chart */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Channel Volume Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={channelData}>
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
                dataKey="voice"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Voice"
              />
              <Line
                type="monotone"
                dataKey="email"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Email"
              />
              <Line
                type="monotone"
                dataKey="chat"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Chat"
              />
              <Line
                type="monotone"
                dataKey="sms"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="SMS"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Channel Management */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Channel Status
          </h2>
          <div className="space-y-4">
            {channels.map((channel) => (
              <div
                key={channel.name}
                className="flex justify-between items-center p-4 bg-muted/50 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {channel.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {channel.volume} interactions today
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Chip
                    label={channel.status}
                    variant={
                      channel.enabled
                        ? 'success'
                        : 'default'
                    }
                  />
                  <Toggle
                    checked={channel.enabled}
                    onChange={() => {}}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
