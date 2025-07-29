import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { createAdminClient } from '@/lib/supabase/admin-client'

// Icons (using emoji for simplicity)
const icons = {
  businesses: '🏢',
  customers: '👥',
  cards: '🎴',
  alerts: '🚨',
  support: '🛠️',
  sandbox: '🧪',
  analytics: '📊',
  activity: '⚡',
  growth: '📈',
  revenue: '💰'
}

interface AdminStats {
  totalBusinesses: number
  totalCustomers: number
  totalCards: number
  totalStampCards: number
  totalMembershipCards: number
  flaggedBusinesses: number
  recentActivity: number
}

interface Business {
  id: string
  name: string
  contact_email: string
  created_at: string
  is_flagged?: boolean
}

async function getAdminDashboardStats(): Promise<AdminStats> {
  const supabase = createAdminClient()
  
  console.log('🔍 ADMIN DASHBOARD - Starting getAdminDashboardStats()...')
  
  try {
    // Fetch all counts in parallel using exact count
    const [
      { count: totalBusinesses },
      { count: totalCustomers },
      { count: totalCards },
      { count: totalStampCards },
      { count: totalMembershipCards }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customer_cards').select('*', { count: 'exact', head: true }),
      supabase.from('stamp_cards').select('*', { count: 'exact', head: true }),
      supabase.from('membership_cards').select('*', { count: 'exact', head: true })
    ])

    const stats: AdminStats = {
      totalBusinesses: totalBusinesses || 0,
      totalCustomers: totalCustomers || 0,
      totalCards: totalCards || 0,
      totalStampCards: totalStampCards || 0,
      totalMembershipCards: totalMembershipCards || 0,
      flaggedBusinesses: 0, // Will implement later
      recentActivity: 0 // Will implement later
    }

    console.log('✅ ADMIN DASHBOARD - getAdminDashboardStats() results:', stats)

    return stats
  } catch (error) {
    console.error('💥 ADMIN DASHBOARD - Error in getAdminDashboardStats():', error)
    
    // Return safe defaults
    return {
      totalBusinesses: 0,
      totalCustomers: 0,
      totalCards: 0,
      totalStampCards: 0,
      totalMembershipCards: 0,
      flaggedBusinesses: 0,
      recentActivity: 0
    }
  }
}

async function getAllBusinesses(): Promise<Business[]> {
  const supabase = createAdminClient()
  
  console.log('🔍 ADMIN DASHBOARD - Starting getAllBusinesses()...')
  
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at, is_flagged')
      .order('created_at', { ascending: false })
      .limit(10) // Limit for dashboard display

    if (error) {
      console.error('💥 ADMIN DASHBOARD - Error in getAllBusinesses():', error)
      return []
    }

    console.log('✅ ADMIN DASHBOARD - getAllBusinesses() results:', businesses?.length || 0, 'businesses')

    return businesses || []
  } catch (error) {
    console.error('💥 ADMIN DASHBOARD - Error in getAllBusinesses():', error)
    return []
  }
}

// Dashboard Cards Component
function DashboardCards({ stats }: { stats: AdminStats }) {
  console.log('🎯 DASHBOARD CARDS - Rendering with stats:', stats)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">{icons.businesses}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalBusinesses || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active businesses registered
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <span className="text-2xl">{icons.customers}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.totalCustomers || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Registered customer accounts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
          <span className="text-2xl">{icons.cards}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.totalCards || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Customer cards in use
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Card Templates</CardTitle>
          <span className="text-2xl">{icons.analytics}</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {(stats?.totalStampCards || 0) + (stats?.totalMembershipCards || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.totalStampCards || 0} stamp + {stats?.totalMembershipCards || 0} membership
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Businesses Table Component
function BusinessesTable({ businesses }: { businesses: Business[] }) {
  console.log('🏢 BUSINESSES TABLE - Rendering with businesses:', businesses?.length || 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{icons.businesses}</span>
          <span>Recent Businesses</span>
        </CardTitle>
        <CardDescription>Latest business registrations</CardDescription>
      </CardHeader>
      <CardContent>
        {businesses && businesses.length > 0 ? (
          <div className="space-y-2">
            {businesses.slice(0, 5).map((business) => (
              <div key={business.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{business.name || 'Unknown Business'}</span>
                  <div className="text-xs text-muted-foreground">
                    {business.contact_email || 'No email'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {business.is_flagged && (
                    <Badge variant="destructive">Flagged</Badge>
                  )}
                  <Badge variant="outline">
                    {business.created_at ? new Date(business.created_at).toLocaleDateString() : 'Unknown date'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No businesses found</p>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  const actions = [
    {
      title: 'Manage Businesses',
      description: 'View, edit, and control all business accounts',
      href: '/admin/businesses',
      icon: icons.businesses,
      color: 'bg-blue-500'
    },
    {
      title: 'View All Cards',
      description: 'Manage stamp cards and membership cards',
      href: '/admin/cards',
      icon: icons.cards,
      color: 'bg-green-500'
    },
    {
      title: 'Customer Monitoring',
      description: 'Track customer activity and detect anomalies',
      href: '/admin/customers',
      icon: icons.customers,
      color: 'bg-purple-500'
    },
    {
      title: 'System Alerts',
      description: 'Monitor automated flags and anomalies',
      href: '/admin/alerts',
      icon: icons.alerts,
      color: 'bg-red-500'
    },
    {
      title: 'Support Tools',
      description: 'Manual overrides and customer support',
      href: '/admin/support',
      icon: icons.support,
      color: 'bg-orange-500'
    },
    {
      title: 'Testing Sandbox',
      description: 'Global preview mode for cards and flows',
      href: '/admin/sandbox',
      icon: icons.sandbox,
      color: 'bg-cyan-500'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white text-xl`}>
                  {action.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// Main Dashboard Component with proper data fetching
async function DashboardContent() {
  console.log('🚀 DASHBOARD CONTENT - Starting data fetch...')
  
  // Fetch data using the expected function names
  const stats = await getAdminDashboardStats()
  const businesses = await getAllBusinesses()
  
  console.log('📊 DASHBOARD CONTENT - Data fetched:', { stats, businessCount: businesses?.length })

  return (
    <div className="space-y-6">
      {/* Dashboard Stats Cards */}
      <DashboardCards stats={stats} />

      {/* Recent Activity */}
    <div className="grid gap-4 md:grid-cols-2">
        <BusinessesTable businesses={businesses} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{icons.analytics}</span>
            <span>System Overview</span>
          </CardTitle>
          <CardDescription>Platform health and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Businesses:</span>
                <Badge variant="outline">{stats?.totalBusinesses || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Active Customers:</span>
                <Badge variant="outline">{stats?.totalCustomers || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Customer Cards:</span>
                <Badge variant="outline">{stats?.totalCards || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Card Templates:</span>
                <Badge variant="outline">{(stats?.totalStampCards || 0) + (stats?.totalMembershipCards || 0)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default async function AdminDashboard() {
  console.log('🚀 ADMIN DASHBOARD - Main component rendering...')

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Centralized control center for RewardJar 4.0 platform
          </p>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Suspense fallback={
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
                      <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
                ))}
              </div>
            }>
              <DashboardContent />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-4">
            <QuickActions />
          </TabsContent>
        </Tabs>

        {/* System Status */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{icons.analytics}</span>
              <span>System Status</span>
            </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                  ✅ Database
                </Badge>
                <span className="text-sm text-muted-foreground">Operational</span>
        </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                  ✅ Wallets
                </Badge>
                <span className="text-sm text-muted-foreground">Apple, Google, PWA</span>
                      </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                  ✅ APIs
                </Badge>
                <span className="text-sm text-muted-foreground">All endpoints</span>
              </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </AdminLayout>
  )
} 