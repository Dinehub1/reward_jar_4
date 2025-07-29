import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createAdminClient } from '@/lib/supabase/admin-client'

// Icons (using emoji for simplicity)
const icons = {
  businesses: '🏢',
  customers: '👥',
  cards: '🎴',
  analytics: '📊',
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
  
  console.log('🔍 TEST ADMIN DASHBOARD - Starting getAdminDashboardStats()...')
  
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
      flaggedBusinesses: 0,
      recentActivity: 0
    }

    console.log('✅ TEST ADMIN DASHBOARD - getAdminDashboardStats() results:', stats)

    return stats
  } catch (error) {
    console.error('💥 TEST ADMIN DASHBOARD - Error in getAdminDashboardStats():', error)
    
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
  
  console.log('🔍 TEST ADMIN DASHBOARD - Starting getAllBusinesses()...')
  
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, contact_email, created_at, is_flagged')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('💥 TEST ADMIN DASHBOARD - Error in getAllBusinesses():', error)
      return []
    }

    console.log('✅ TEST ADMIN DASHBOARD - getAllBusinesses() results:', businesses?.length || 0, 'businesses')

    return businesses || []
  } catch (error) {
    console.error('💥 TEST ADMIN DASHBOARD - Error in getAllBusinesses():', error)
    return []
  }
}

// Dashboard Cards Component
function DashboardCards({ stats }: { stats: AdminStats }) {
  console.log('🎯 TEST DASHBOARD CARDS - Rendering with stats:', stats)

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
  console.log('🏢 TEST BUSINESSES TABLE - Rendering with businesses:', businesses?.length || 0)

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

// Main Dashboard Component with proper data fetching
async function TestDashboardContent() {
  console.log('🚀 TEST DASHBOARD CONTENT - Starting data fetch...')

  // Fetch data using the expected function names
  const stats = await getAdminDashboardStats()
  const businesses = await getAllBusinesses()

  console.log('📊 TEST DASHBOARD CONTENT - Data fetched:', { stats, businessCount: businesses?.length })

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

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Stats Object:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">Businesses Array ({businesses?.length || 0} items):</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(businesses, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function TestAdminDashboard() {
  console.log('🚀 TEST ADMIN DASHBOARD - Main component rendering...')

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🧪 Test Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Testing the admin dashboard data flow without authentication
          </p>
        </div>

        {/* Dashboard Content */}
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
          <TestDashboardContent />
        </Suspense>
      </div>
    </div>
  )
} 