'use client'

import Link from 'next/link'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, CreditCard, Users, Settings, Plus } from 'lucide-react'

export default function AdminDashboard() {
  const adminActions = [
    {
      title: 'View All Cards',
      description: 'View and manage all stamp cards and membership cards',
      href: '/admin/cards',
      icon: CreditCard,
      color: 'bg-indigo-500'
    },
    {
      title: 'Create Stamp Card',
      description: 'Create a new loyalty stamp card for a business',
      href: '/admin/cards/stamp/new',
      icon: CreditCard,
      color: 'bg-green-500'
    },
    {
      title: 'Create Membership Card',
      description: 'Create a new membership card for a business',
      href: '/admin/cards/membership/new',
      icon: CreditCard,
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Businesses',
      description: 'View and manage all businesses in the system',
      href: '/admin/businesses',
      icon: Building,
      color: 'bg-purple-500'
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts and roles',
      href: '/admin/users',
      icon: Users,
      color: 'bg-orange-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500'
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            Welcome to the RewardJar admin panel. Manage businesses, users, and system settings from here.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10+</div>
              <p className="text-xs text-muted-foreground">Active businesses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stamp Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25+</div>
              <p className="text-xs text-muted-foreground">Active loyalty programs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membership Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15+</div>
              <p className="text-xs text-muted-foreground">Active memberships</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">50+</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminActions.map((action) => {
              const Icon = action.icon
              return (
                <Card key={action.title} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-500 mb-4">{action.description}</p>
                    <Link href={action.href}>
                      <Button size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        {action.title.includes('Create') ? 'Create' : 'Manage'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-sm">
                  Activity monitoring will be implemented in future updates
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
} 