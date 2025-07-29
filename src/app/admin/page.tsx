import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  Activity,
  BarChart3,
  TrendingUp,
  Calendar
} from 'lucide-react'

// Icons for the dashboard
const icons = {
  businesses: <Building2 className="h-4 w-4" />,
  customers: <Users className="h-4 w-4" />,
  cards: <CreditCard className="h-4 w-4" />,
  alerts: <AlertTriangle className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  activity: <Activity className="h-4 w-4" />
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
  email: string
  created_at: string
}

// Fetch dashboard stats using the working API endpoint
async function getAdminDashboardStats(): Promise<AdminStats> {
  console.log('🔍 ADMIN DASHBOARD - Starting getAdminDashboardStats()...')
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/dashboard-stats`, {
      cache: 'no-store' // Ensure fresh data
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch dashboard stats')
    }
    
    const stats = data.data.stats
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

// Fetch businesses using the working API endpoint
async function getAllBusinesses(): Promise<Business[]> {
  console.log('🔍 ADMIN DASHBOARD - Starting getAllBusinesses()...')
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/dashboard-stats`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch businesses')
    }
    
    const businesses = data.data.recentBusinesses || []
    console.log('✅ ADMIN DASHBOARD - getAllBusinesses() results:', businesses.length, 'businesses')
    
    return businesses
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
  console.log('🏢 BUSINESSES TABLE - Rendering with businesses:', businesses?.length)

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
          <div className="space-y-3">
            {businesses.slice(0, 5).map((business) => (
              <div key={business.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{business.name}</p>
                  <p className="text-sm text-muted-foreground">{business.email}</p>
                </div>
                <Badge variant="outline">
                  {new Date(business.created_at).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No recent businesses found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Dashboard Component with proper data fetching
async function DashboardContent() {
  console.log('🚀 DASHBOARD CONTENT - Starting data fetch...')
  
  // Fetch data using the working API endpoint
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

// Main Admin Dashboard Page
export default async function AdminDashboard() {
  console.log('🚀 ADMIN DASHBOARD - Main component rendering...')

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Centralized control center for RewardJar 4.0 platform
          </p>
        </div>

        <div className="flex space-x-2 border-b">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500">
            Overview
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            Quick Actions
          </button>
        </div>

        <DashboardContent />
      </div>
    </AdminLayout>
  )
} 