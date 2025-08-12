'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useMobileDashboard } from '@/lib/hooks/use-unified-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Award,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react'
import { designTokens } from '@/lib/design-tokens'
import { MobileMetricsSkeleton, QuickActionsSkeleton, LoadingBoundary } from '@/components/shared/UnifiedLoading'
import UnifiedError from '@/components/shared/UnifiedError'

/**
 * 📱 MOBILE-FIRST DASHBOARD
 * 
 * Optimized for 70% mobile usage with:
 * - Touch-friendly interactions
 * - Progressive disclosure
 * - Key KPIs prominently displayed
 * - Quick actions for common tasks
 */

interface MobileDashboardProps {
  className?: string
}

// Mobile-optimized time range selector
const TIME_RANGES = [
  { value: '7d', label: '7 Days', mobile: '7D' },
  { value: '30d', label: '30 Days', mobile: '30D' },
  { value: '90d', label: '90 Days', mobile: '90D' }
] as const

export default function MobileDashboard({ className }: MobileDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [refreshing, setRefreshing] = useState(false)
  
  const { 
    stats, 
    quickActions, 
    recentActivity, 
    alerts,
    isLoading, 
    error, 
    refresh 
  } = useMobileDashboard(timeRange)

  // Handle manual refresh with haptic feedback
  const handleRefresh = async () => {
    setRefreshing(true)
    
    // Haptic feedback on mobile
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }

  // Loading skeleton for mobile
  if (isLoading && !stats) {
    return <MobileDashboardSkeleton />
  }

  // Error state with enhanced retry
  if (error) {
    return (
      <UnifiedError
        error={error}
        variant="fullscreen"
        onRetry={handleRefresh}
        className="min-h-screen"
      />
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Time Range Selector - Mobile optimized */}
          <div className="flex gap-1 mt-3">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range.mobile}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Alerts */}
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-3 rounded-md border ${
                alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {alert.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {alert.type === 'warning' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                {alert.type === 'info' && <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.action && (
                    <button className="text-xs underline mt-1">{alert.action}</button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Key KPIs - Mobile-first layout with loading boundary */}
        <LoadingBoundary 
          isLoading={isLoading}
          fallback={<MobileMetricsSkeleton />}
        >
          {stats && <KeyMetricsSection stats={stats} />}
        </LoadingBoundary>

        {/* Industry Comparison */}
        {stats?.industryComparison && (
          <IndustryComparisonSection comparison={stats.industryComparison} />
        )}

        {/* Quick Actions Grid with loading */}
        <LoadingBoundary
          isLoading={isLoading && quickActions.length === 0}
          fallback={<QuickActionsSkeleton />}
        >
          <QuickActionsSection actions={quickActions} />
        </LoadingBoundary>

        {/* Recent Activity */}
        <RecentActivitySection activities={recentActivity} />
      </div>
    </div>
  )
}

// Key Metrics Section - Mobile optimized
function KeyMetricsSection({ stats }: { stats: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h2 className="text-sm font-medium text-gray-900 mb-3">Key Performance</h2>
      
      {/* Primary KPIs - Stack on mobile */}
      <div className="grid grid-cols-1 gap-3">
        <MetricCard
          title="Customer Retention"
          value={`${stats.customerRetentionRate}%`}
          change={+5}
          icon={<Users className="h-5 w-5" />}
          description="Customers returning this period"
          color="green"
        />
        
        <MetricCard
          title="Engagement Rate"
          value={`${stats.loyaltyEngagementRate}%`}
          change={+3}
          icon={<Target className="h-5 w-5" />}
          description="Active loyalty program usage"
          color="blue"
        />
        
        <MetricCard
          title="New Customers"
          value={stats.newCustomerAcquisition.toString()}
          change={+12}
          icon={<Award className="h-5 w-5" />}
          description="First-time visitors this period"
          color="purple"
        />
      </div>

      {/* Secondary metrics in compact row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-xs text-gray-600">Avg. Spend</div>
          <div className="text-lg font-semibold">${stats.averageSpendPerVisit}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-xs text-gray-600">Weekly Growth</div>
          <div className="text-lg font-semibold text-green-600">+{stats.weeklyGrowth}%</div>
        </div>
      </div>
    </motion.div>
  )
}

// Individual Metric Card
function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  color 
}: {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  description: string
  color: 'green' | 'blue' | 'purple'
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200', 
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  }

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {icon}
              <span className="text-sm font-medium">{title}</span>
            </div>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-xs opacity-80">{description}</div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Industry Comparison Section
function IndustryComparisonSection({ comparison }: { comparison: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">vs Industry Average</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Retention</span>
          <Badge variant={comparison.retentionPercentile > 50 ? "default" : "secondary"}>
            {comparison.retentionPercentile}th percentile
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Engagement</span>
          <Badge variant={comparison.engagementPercentile > 50 ? "default" : "secondary"}>
            {comparison.engagementPercentile}th percentile
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Acquisition</span>
          <Badge variant={comparison.acquisitionPercentile > 50 ? "default" : "secondary"}>
            {comparison.acquisitionPercentile}th percentile
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Section
function QuickActionsSection({ actions }: { actions: any[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white p-4 rounded-lg border hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{action.icon}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-sm font-medium text-gray-900">{action.label}</div>
              {action.count !== undefined && (
                <div className="text-xs text-gray-600 mt-1">{action.count} items</div>
              )}
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Recent Activity Section
function RecentActivitySection({ activities }: { activities: any[] }) {
  if (activities.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3 py-2">
            <div className={`h-2 w-2 rounded-full ${
              activity.type === 'stamp' ? 'bg-blue-500' :
              activity.type === 'redemption' ? 'bg-green-500' :
              'bg-purple-500'
            }`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{activity.customer}</div>
              <div className="text-xs text-gray-600">{activity.details}</div>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(activity.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Loading skeleton for mobile
function MobileDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="h-6 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded w-12"></div>
          ))}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-lg border">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </div>
        ))}
      </div>
    </div>
  )
}