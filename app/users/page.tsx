'use client'

import { Sidebar } from '@/components/sidebar'
import { Card, Button, Chip } from '@/components/ui-components'
import { Users, Plus, Search } from 'lucide-react'
import { useState } from 'react'

const usersList = [
  {
    id: '001',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Senior Agent',
    department: 'Support',
    status: 'Active',
    lastLogin: '2 hours ago',
  },
  {
    id: '002',
    name: 'Sarah Davis',
    email: 'sarah.davis@company.com',
    role: 'Agent',
    department: 'Sales',
    status: 'Active',
    lastLogin: '30 mins ago',
  },
  {
    id: '003',
    name: 'Mike Brown',
    email: 'mike.brown@company.com',
    role: 'Team Lead',
    department: 'Support',
    status: 'Active',
    lastLogin: '1 hour ago',
  },
  {
    id: '004',
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    role: 'Agent',
    department: 'Billing',
    status: 'Away',
    lastLogin: '3 hours ago',
  },
  {
    id: '005',
    name: 'James Taylor',
    email: 'james.taylor@company.com',
    role: 'Supervisor',
    department: 'Support',
    status: 'Offline',
    lastLogin: '1 day ago',
  },
]

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users size={32} />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage team members and permissions
            </p>
          </div>
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-card-foreground mt-2">127</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Active Now</p>
            <p className="text-2xl font-bold text-green-500 mt-2">42</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Away</p>
            <p className="text-2xl font-bold text-yellow-500 mt-2">18</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Offline</p>
            <p className="text-2xl font-bold text-red-500 mt-2">67</p>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Last Login
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-card-foreground font-medium">
                      {user.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-card-foreground">
                      {user.role}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {user.department}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Chip
                        label={user.status}
                        variant={
                          user.status === 'Active'
                            ? 'success'
                            : user.status === 'Away'
                              ? 'warning'
                              : 'error'
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {user.lastLogin}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
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
