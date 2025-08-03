import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Activity,
  Database
} from 'lucide-react'

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

// Quick Actions Test Component
function QuickActionsTest() {
  const [activeTab, setActiveTab] = useState<'overview' | 'quick-actions'>('overview')
  const [actionResults, setActionResults] = useState<string[]>([])
  const [isPerformingAction, setIsPerformingAction] = useState(false)

  const addResult = (result: string) => {
    setActionResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 9)])
  }

  const performQuickAction = async (action: string) => {
    setIsPerformingAction(true)
    addResult(`Starting ${action}...`)
    
    try {
      // Simulate different quick actions
      switch (action) {
        case 'refresh-all':
          await new Promise(resolve => setTimeout(resolve, 1000))
          addResult('✅ All data refreshed successfully')
          break
        case 'clear-cache':
          await new Promise(resolve => setTimeout(resolve, 500))
          addResult('✅ Cache cleared successfully')
          break
        case 'sync-wallets':
          await new Promise(resolve => setTimeout(resolve, 1500))
          addResult('✅ Wallet sync completed')
          break
        case 'generate-reports':
          await new Promise(resolve => setTimeout(resolve, 2000))
          addResult('✅ Reports generated successfully')
          break
        default:
          addResult(`❌ Unknown action: ${action}`)
      }
    } catch (error) {
      addResult(`❌ Error performing ${action}: ${error}`)
    } finally {
      setIsPerformingAction(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions Test
        </CardTitle>
        <CardDescription>Testing the Quick Actions tab functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'overview' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('quick-actions')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'quick-actions' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Quick Actions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Overview tab is active</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Status: <Badge variant="outline">Active</Badge></div>
              <div>Tab Switch: <Badge variant="outline" className="text-green-600">Working</Badge></div>
            </div>
          </div>
        )}

        {activeTab === 'quick-actions' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Quick Actions tab is active</p>
            
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => performQuickAction('refresh-all')}
                disabled={isPerformingAction}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh All
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => performQuickAction('clear-cache')}
                disabled={isPerformingAction}
              >
                <Database className="h-3 w-3 mr-1" />
                Clear Cache
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => performQuickAction('sync-wallets')}
                disabled={isPerformingAction}
              >
                <Activity className="h-3 w-3 mr-1" />
                Sync Wallets
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => performQuickAction('generate-reports')}
                disabled={isPerformingAction}
              >
                <Clock className="h-3 w-3 mr-1" />
                Generate Reports
              </Button>
            </div>

            {/* Action Results */}
            <div>
              <h4 className="text-sm font-medium mb-2">Action Results:</h4>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-32 overflow-y-auto">
                {actionResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No actions performed yet</p>
                ) : (
                  <div className="space-y-1">
                    {actionResults.map((result, index) => (
                      <div key={index} className="text-xs font-mono">{result}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Refresh Button Test Component
function RefreshButtonTest() {
  const { data: statsResponse, error: statsError, isLoading: statsLoading, mutate: refetchStats } = useAdminStats()
  const { data: businessesResponse, error: businessesError, isLoading: businessesLoading, mutate: refetchBusinesses } = useAdminBusinesses()
  
  const [refreshResults, setRefreshResults] = useState<string[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loading = statsLoading || businessesLoading
  const error = statsError || businessesError

  const addRefreshResult = (result: string) => {
    setRefreshResults(prev => [`${new Date().toLocaleTimeString()}: ${result}`, ...prev.slice(0, 9)])
  }

  const testRefreshAll = async () => {
    addRefreshResult('🔄 Starting refresh all...')
    setLastRefresh(new Date())
    
    try {
      await Promise.all([
        refetchStats(),
        refetchBusinesses()
      ])
      addRefreshResult('✅ Refresh all completed successfully')
    } catch (error) {
      addRefreshResult(`❌ Refresh all failed: ${error}`)
    }
  }

  const testRefreshStats = async () => {
    addRefreshResult('📊 Refreshing stats...')
    try {
      await refetchStats()
      addRefreshResult('✅ Stats refreshed successfully')
    } catch (error) {
      addRefreshResult(`❌ Stats refresh failed: ${error}`)
    }
  }

  const testRefreshBusinesses = async () => {
    addRefreshResult('🏢 Refreshing businesses...')
    try {
      await refetchBusinesses()
      addRefreshResult('✅ Businesses refreshed successfully')
    } catch (error) {
      addRefreshResult(`❌ Businesses refresh failed: ${error}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Refresh Button Test
        </CardTitle>
        <CardDescription>Testing all refresh functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'}`} />
            <div className="text-xs">
              {loading ? 'Loading' : error ? 'Error' : 'Ready'}
            </div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${statsLoading ? 'bg-yellow-500' : statsError ? 'bg-red-500' : 'bg-green-500'}`} />
            <div className="text-xs">Stats</div>
          </div>
          <div className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${businessesLoading ? 'bg-yellow-500' : businessesError ? 'bg-red-500' : 'bg-green-500'}`} />
            <div className="text-xs">Businesses</div>
          </div>
        </div>

        {/* Refresh Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            size="sm" 
            onClick={testRefreshAll}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh All'}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={testRefreshStats}
            disabled={statsLoading}
            className="text-xs"
          >
            📊 Stats
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={testRefreshBusinesses}
            disabled={businessesLoading}
            className="text-xs"
          >
            🏢 Businesses
          </Button>
        </div>

        {/* Last Refresh Info */}
        {lastRefresh && (
          <div className="text-xs text-muted-foreground">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="h-4 w-4" />
              Error: {typeof error === 'string' ? error : 'Unknown error'}
            </div>
          </div>
        )}

        {/* Data Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <div className="text-xs space-y-1">
            <div>Stats Response: {statsResponse ? '✅ Loaded' : '❌ No data'}</div>
            <div>Businesses Response: {businessesResponse ? '✅ Loaded' : '❌ No data'}</div>
            <div>Stats Data: {statsResponse?.data?.stats ? '✅ Available' : '❌ Missing'}</div>
            <div>Businesses Data: {businessesResponse?.data ? '✅ Available' : '❌ Missing'}</div>
          </div>
        </div>

        {/* Refresh Results */}
        <div>
          <h4 className="text-sm font-medium mb-2">Refresh Results:</h4>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-32 overflow-y-auto">
            {refreshResults.length === 0 ? (
              <p className="text-xs text-muted-foreground">No refresh actions performed yet</p>
            ) : (
              <div className="space-y-1">
                {refreshResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono">{result}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Test Dashboard
export default function TestAdminDashboard() {
  console.log('🚀 TEST ADMIN DASHBOARD - Main component rendering...')

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🧪 Enhanced Admin Dashboard Test</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of Quick Actions and Refresh button functionality
          </p>
        </div>

        {/* Test Components */}
        <div className="grid gap-6 md:grid-cols-2">
          <QuickActionsTest />
          <RefreshButtonTest />
        </div>

        {/* Original Dashboard Content */}
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