import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Analytics data interfaces
interface StampCardAnalytics {
  total_stamps: number
  average_stamps_per_card: number
  redemption_rate: number
  repeat_customer_growth: number
  revenue: number
  average_transaction_size: number
  clv_growth: number
}

interface MembershipAnalytics {
  total_sessions: number
  average_sessions_per_membership: number
  membership_revenue: number
  expired_memberships: number
  average_utilization: number
  active_memberships: number
  popular_memberships: Array<{
    name: string
    active_count: number
    utilization: number
  }>
}

interface CLVInsights {
  average_spend: number
  growth_metrics: {
    clv_growth: number
    repeat_customer_value: number
    acquisition_cost: number
  }
  recommendations: string[]
  growth_banners: Array<{
    metric: string
    subtitle: string
    trend: string
    value: string
    growth_percentage: number
  }>
}

interface ChartData {
  stamps_per_week: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
    }>
  }
  sessions_per_type: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor: string[]
    }>
  }
  revenue_growth: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }>
  }
  redemption_breakdown: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor: string[]
    }>
  }
}

interface AnalyticsFilters {
  time_range: string
  location: string
  card_type: string
  customer_segment: string
}

interface AnalyticsResponse {
  stamp_analytics: StampCardAnalytics
  membership_analytics: MembershipAnalytics
  clv_insights: CLVInsights
  chart_data: ChartData
  filters_applied: AnalyticsFilters
}

export async function GET(request: NextRequest) {
  try {
    // Set cache headers (5 minutes)
    const headers = new Headers({
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      'Content-Type': 'application/json'
    })

    const supabase = await createClient()

    // Authentication check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({
        error: 'Authentication required',
        message: 'Please log in to access analytics data'
      }, { status: 401 })
    }

    // Check user role (must be business user - role_id: 2)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData || userData.role_id !== 2) {
      return NextResponse.json({
        error: 'Unauthorized access',
        message: 'Business account required to access this endpoint'
      }, { status: 401 })
    }

    // Get business data
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('owner_id', userData.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({
        error: 'Business not found',
        message: 'No business associated with this account'
      }, { status: 404 })
    }

    // Parse query parameters for filters
    const { searchParams } = new URL(request.url)
    const filters: AnalyticsFilters = {
      time_range: searchParams.get('time_range') || '30 days',
      location: searchParams.get('location') || 'All locations',
      card_type: searchParams.get('card_type') || 'All cards',
      customer_segment: searchParams.get('customer_segment') || 'All customers'
    }

    // Validate filter values
    const validTimeRanges = ['7 days', '30 days', '90 days', 'Custom range']
    const validLocations = ['All locations', 'Main store', 'Branch locations']
    const validCardTypes = ['All cards', 'Stamp cards only', 'Membership cards only']
    const validSegments = ['All customers', 'New customers', 'Repeat customers', 'VIP customers']

    if (!validTimeRanges.includes(filters.time_range)) {
      filters.time_range = '30 days'
    }
    if (!validLocations.includes(filters.location)) {
      filters.location = 'All locations'
    }
    if (!validCardTypes.includes(filters.card_type)) {
      filters.card_type = 'All cards'
    }
    if (!validSegments.includes(filters.customer_segment)) {
      filters.customer_segment = 'All customers'
    }

    // Get actual data from Supabase for what we can
    let stampCardsCount = 0
    let membershipCardsCount = 0
    let totalCustomers = 0

    // Get stamp cards
    const { count: stampCount } = await supabase
      .from('stamp_cards')
      .select('id', { count: 'exact' })
      .eq('business_id', business.id)
      .eq('status', 'active')

    stampCardsCount = stampCount || 0

    // Get membership cards
    const { count: membershipCount } = await supabase
      .from('membership_cards')
      .select('id', { count: 'exact' })
      .eq('business_id', business.id)
      .eq('status', 'active')

    membershipCardsCount = membershipCount || 0

    // Get customer count (simplified for now)
    const { count: customerCount } = await supabase
      .from('customer_cards')
      .select('customer_id', { count: 'exact' })

    totalCustomers = customerCount || 0

    // TODO: Replace with actual MCP integration for complex analytics
    // const mcpResponse = await fetch('/mcp/query', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     tables: ['stamp_cards', 'customer_cards', 'stamp_transactions', 'session_usage'],
    //     business_id: business.id,
    //     filters: filters,
    //     queries: [
    //       'SELECT COUNT(*) as total_stamps FROM stamp_transactions WHERE created_at >= $1',
    //       'SELECT AVG(sessions_used) FROM customer_cards WHERE membership_type = "gym"',
    //       'SELECT SUM(amount) FROM stamp_transactions WHERE created_at >= $1'
    //     ]
    //   })
    // })

    // Mock analytics data based on requirements (would come from MCP queries in production)
    const stamp_analytics: StampCardAnalytics = {
      total_stamps: 2847,
      average_stamps_per_card: 4.2,
      redemption_rate: 68,
      repeat_customer_growth: 300, // 3x growth
      revenue: 280000,
      average_transaction_size: 9500,
      clv_growth: 25
    }

    const membership_analytics: MembershipAnalytics = {
      total_sessions: 347,
      average_sessions_per_membership: 11.2,
      membership_revenue: 450000,
      expired_memberships: 3,
      average_utilization: 56,
      active_memberships: 30,
      popular_memberships: [
        { name: 'Premium Gym', active_count: 12, utilization: 65 },
        { name: 'Spa Package', active_count: 8, utilization: 72 },
        { name: 'Basic Plan', active_count: 10, utilization: 45 }
      ]
    }

    const clv_insights: CLVInsights = {
      average_spend: 18500,
      growth_metrics: {
        clv_growth: 25,
        repeat_customer_value: 24000,
        acquisition_cost: 3200
      },
      recommendations: [
        "Focus on customers with 2-3 stamps (highest conversion potential)",
        "Increase membership card promotion (higher CLV)",
        "Target customers who haven't visited in 15+ days",
        "Launch bonus stamp campaign for inactive users"
      ],
      growth_banners: [
        {
          metric: "3x",
          subtitle: "Repeat Customer Growth",
          trend: "+200% from last quarter",
          value: "Customers returning within 30 days",
          growth_percentage: 200
        },
        {
          metric: "25%",
          subtitle: "CLV Increase",
          trend: "From ₩14,800 to ₩18,500",
          value: "Average customer lifetime value",
          growth_percentage: 25
        },
        {
          metric: "₩730,000",
          subtitle: "Total Revenue",
          trend: "+45% from last quarter",
          value: "Tracked through loyalty programs",
          growth_percentage: 45
        }
      ]
    }

    // Generate Chart.js formatted data based on filters
    const generateChartData = (timeRange: string): ChartData => {
      const isWeekly = timeRange === '7 days'
      const isMonthly = timeRange === '30 days'

      // Generate labels based on time range
      const generateLabels = () => {
        if (isWeekly) {
          return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        } else if (isMonthly) {
          return ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        } else {
          return ['Month 1', 'Month 2', 'Month 3']
        }
      }

      // Generate sample data based on time range
      const generateStampData = () => {
        if (isWeekly) {
          return [45, 52, 38, 67, 73, 89, 56]
        } else if (isMonthly) {
          return [320, 285, 410, 380]
        } else {
          return [1200, 1450, 1650]
        }
      }



      const generateRevenueData = () => {
        if (isWeekly) {
          return [45000, 52000, 38000, 67000, 73000, 89000, 56000]
        } else if (isMonthly) {
          return [180000, 195000, 210000, 225000]
        } else {
          return [650000, 700000, 730000]
        }
      }

      return {
        stamps_per_week: {
          labels: generateLabels(),
          datasets: [{
            label: 'Stamps Collected',
            data: generateStampData(),
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 1)'
          }]
        },
        sessions_per_type: {
          labels: ['Premium Gym', 'Spa Package', 'Basic Plan', 'Yoga Class'],
          datasets: [{
            label: 'Sessions',
            data: [120, 85, 95, 45],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(99, 102, 241, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }]
        },
        revenue_growth: {
          labels: generateLabels(),
          datasets: [{
            label: 'Revenue (₩)',
            data: generateRevenueData(),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)'
          }]
        },
        redemption_breakdown: {
          labels: ['Completed Rewards', 'Active Cards', 'Expired Cards'],
          datasets: [{
            data: [68, 25, 7],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(99, 102, 241, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ]
          }]
        }
      }
    }

    const chart_data = generateChartData(filters.time_range)

    const analyticsData: AnalyticsResponse = {
      stamp_analytics,
      membership_analytics,
      clv_insights,
      chart_data,
      filters_applied: filters
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString(),
      business_id: business.id,
      metadata: {
        total_cards: stampCardsCount + membershipCardsCount,
        stamp_cards: stampCardsCount,
        membership_cards: membershipCardsCount,
        total_customers: totalCustomers
      }
    }, { headers })

  } catch (error) {
    console.error('Analytics API error:', error)
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 