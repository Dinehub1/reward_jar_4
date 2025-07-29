import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createAdminClient } from '@/lib/supabase/admin-client'

interface Business {
  id: string
  name: string
  contact_email: string
  created_at: string
  is_flagged?: boolean
  stamp_cards?: any[]
  customer_cards?: any[]
}

async function getBusinesses() {
  const supabase = createAdminClient()
  
  console.log('🧪 TEST BUSINESSES PAGE - Starting business data fetch...')
  
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select(`
        *,
        stamp_cards(id, name),
        customer_cards:stamp_cards(customer_cards(id))
      `)
      .order('created_at', { ascending: false })

    console.log('📊 TEST BUSINESSES PAGE - Raw business data:', businesses?.length || 0, 'businesses')
    console.log('❌ TEST BUSINESSES PAGE - Fetch error:', error)

    if (error) throw error

    // Process businesses to add card counts
    const processedBusinesses = businesses?.map(business => ({
      ...business,
      cardCount: {
        stamp_cards: business.stamp_cards?.length || 0,
        customer_cards: business.stamp_cards?.reduce((sum: number, card: any) => 
          sum + (card.customer_cards?.length || 0), 0) || 0
      }
    })) || []

    console.log('✅ TEST BUSINESSES PAGE - Processed businesses:', processedBusinesses.length)
    if (processedBusinesses.length > 0) {
      console.log('🎯 TEST BUSINESSES PAGE - First business sample:', {
        name: processedBusinesses[0].name,
        id: processedBusinesses[0].id,
        cardCount: processedBusinesses[0].cardCount
      })
    }

    return processedBusinesses
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return []
  }
}

async function getBusinessStats() {
  const supabase = createAdminClient()
  
  console.log('📈 TEST BUSINESS STATS - Starting stats fetch...')
  
  try {
    const [
      { count: totalBusinesses },
      { count: activeBusinesses },
      { count: flaggedBusinesses }
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('is_flagged', true)
    ])

    const stats = {
      totalBusinesses: totalBusinesses || 0,
      activeBusinesses: activeBusinesses || 0,
      flaggedBusinesses: flaggedBusinesses || 0,
      newThisWeek: 8 // Placeholder for demo
    }

    console.log('✅ TEST BUSINESS STATS - Processed stats:', stats)
    
    return stats
  } catch (error) {
    console.error('Error fetching business stats:', error)
    return {
      totalBusinesses: 0,
      activeBusinesses: 0,
      flaggedBusinesses: 0,
      newThisWeek: 0
    }
  }
}

function BusinessStatsCards({ stats }: { stats: any }) {
  return (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <span className="text-2xl">🏢</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            +12 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Businesses</CardTitle>
          <span className="text-2xl">✅</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.activeBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            96.3% active rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Flagged Businesses</CardTitle>
          <span className="text-2xl">🚩</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.flaggedBusinesses}</div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Week</CardTitle>
          <span className="text-2xl">🆕</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.newThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            +33% from last week
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function BusinessRow({ business }: { business: Business }) {
  const cardCount = business.cardCount?.stamp_cards || 0
  const customerCount = business.cardCount?.customer_cards || 0

  return (
    <tr className="border-b hover:bg-accent/50 dark:hover:bg-accent/20">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-foreground">{business.name}</div>
          <div className="text-sm text-muted-foreground">{business.contact_email}</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant={business.is_flagged ? "destructive" : "secondary"}>
          {business.is_flagged ? "flagged" : "active"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium text-blue-600">{cardCount}</div>
          <div className="text-muted-foreground">cards</div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="text-sm">
          <div className="font-medium text-green-600">{customerCount}</div>
          <div className="text-muted-foreground">customers</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-muted-foreground">
          {new Date(business.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-1">
          <Button variant="outline" size="sm">
            View
          </Button>
          <Button variant="outline" size="sm" className="text-blue-600">
            Impersonate
          </Button>
          <Button variant="outline" size="sm" className="text-red-600">
            Flag
          </Button>
        </div>
      </td>
    </tr>
  )
}

async function BusinessesTable() {
  const businesses = await getBusinesses()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>All Businesses ({businesses.length})</CardTitle>
            <CardDescription>
              Manage and monitor all business accounts - TEST MODE
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Input placeholder="Search businesses..." className="w-64" />
            <Button className="bg-blue-600 hover:bg-blue-700">Add Business</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Business</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Cards</th>
                <th className="px-4 py-3 text-center font-medium">Customers</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <BusinessRow key={business.id} business={business} />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No businesses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function TestBusinessManagementPage() {
  const stats = await getBusinessStats()
  
  console.log('🧪 TEST BUSINESS MANAGEMENT - Page rendering with stats:', stats)

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">🧪 Test Business Management</h1>
            <p className="text-muted-foreground">View, control, and monitor all business accounts - No Authentication Required</p>
          </div>
          <div className="flex space-x-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              ✅ Data Loading: {stats.totalBusinesses > 0 ? 'Working' : 'No Data'}
            </Badge>
            <Button variant="outline" asChild>
              <a href="/admin/test-dashboard">← Back to Test Dashboard</a>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <BusinessStatsCards stats={stats} />

        {/* Businesses Table */}
        <BusinessesTable />
      </div>
    </div>
  )
} 