'use client'

import Link from 'next/link'
import AdminLayout from '@/components/layouts/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, CreditCard, Users, Settings, Plus, Target, Dumbbell } from 'lucide-react'

export default function AdminDashboard() {
  const adminActions = [
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
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
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

        {/* Tabs Section */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cards" className="flex items-center space-x-2">
              <span>🎴</span>
              <span>Cards</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Management</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Card Management</h2>
              
              {/* View All Cards Section */}
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-indigo-600" />
                    All Cards Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-indigo-700 mb-4">
                    View and manage all stamp cards and membership cards across all businesses
                  </p>
                  <Link href="/admin/cards">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <CreditCard className="h-4 w-4 mr-2" />
                      View All Cards
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Create Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-500">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-base">Create Stamp Card</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-500 mb-4">
                      Create a new loyalty stamp card for a business
                    </p>
                    <Link href="/admin/cards/stamp/new">
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Stamp Card
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-500">
                        <Dumbbell className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-base">Create Membership Card</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-500 mb-4">
                      Create a new membership card for a business
                    </p>
                    <Link href="/admin/cards/membership/new">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Membership Card
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="management" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">System Management</h2>
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
                            Manage
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 