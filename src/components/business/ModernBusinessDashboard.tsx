'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Plus,
  QrCode,
  BarChart3,
  Star,
  ArrowUpRight,
  Zap,
  Target,
  Award,
  Activity,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

/**
 * 🎨 MODERN BUSINESS DASHBOARD
 * 
 * Phase 4 redesign with mobile-first approach and role-based theming
 * Replaces complex legacy dashboard with clean, modern interface
 */

interface DashboardStats {
  totalCustomers: number
  activeCards: number
  monthlyGrowth: number
  totalRewards: number
  revenueGrowth: number
  engagementRate: number
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  badge?: string
}

interface RecentActivity {
  id: string
  type: 'stamp' | 'reward' | 'signup'
  customer: string
  action: string
  timestamp: string
  amount?: number
}

interface ModernBusinessDashboardProps {
  stats?: DashboardStats
  loading?: boolean
  className?: string
}

export default function ModernBusinessDashboard({ 
  stats, 
  loading = false,
  className 
}: ModernBusinessDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  
  // Mock data - in real implementation, this would come from props or API
  const defaultStats: DashboardStats = {
    totalCustomers: 342,
    activeCards: 8,
    monthlyGrowth: 23.5,
    totalRewards: 127,
    revenueGrowth: 18.2,
    engagementRate: 67.3
  }

  const dashboardStats = stats || defaultStats

  const quickActions: QuickAction[] = [
    {
      id: 'scan-qr',
      title: 'Scan QR Code',
      description: 'Add stamps to customer cards',
      icon: QrCode,
      href: '/business/scan',
      color: 'bg-emerald-500',
      badge: 'Popular'
    },
    {
      id: 'view-cards',
      title: 'Manage Cards',
      description: 'View and edit loyalty cards',
      icon: CreditCard,
      href: '/business/stamp-cards',
      color: 'bg-blue-500'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Business performance insights',
      icon: BarChart3,
      href: '/business/analytics',
      color: 'bg-purple-500',
      badge: 'New'
    },
    {
      id: 'customers',
      title: 'Customers',
      description: 'View customer activity',
      icon: Users,
      href: '/business/customers',
      color: 'bg-orange-500'
    }
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'stamp',
      customer: 'Sarah M.',
      action: 'Earned 2 stamps',
      timestamp: '5 minutes ago'
    },
    {
      id: '2',
      type: 'reward',
      customer: 'Mike D.',
      action: 'Redeemed free coffee',
      timestamp: '1 hour ago'
    },
    {
      id: '3',
      type: 'signup',
      customer: 'Jessica L.',
      action: 'Joined loyalty program',
      timestamp: '2 hours ago'
    }
  ]

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className={`${modernStyles.layout.container} ${className}`}>
      <div className={modernStyles.layout.section}>
        
        {/* Welcome Header */}
        <WelcomeHeader />

        {/* Key Metrics Grid */}
        <MetricsGrid stats={dashboardStats} />

        {/* Quick Actions */}
        <QuickActionsGrid actions={quickActions} />

        {/* Recent Activity & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityCard activities={recentActivity} />
          <BusinessInsightsCard stats={dashboardStats} />
        </div>

        {/* Growth Opportunities */}
        <GrowthOpportunitiesCard />

      </div>
    </div>
  )
}

// Welcome Header Component
function WelcomeHeader() {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {greeting}! 👋
          </h1>
          <p className="text-gray-600">
            Here's how your loyalty program is performing today
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
            <Activity className="w-4 h-4 mr-1" />
            Live Dashboard
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}

// Metrics Grid Component
function MetricsGrid({ stats }: { stats: DashboardStats }) {
  const metrics = [
    {
      id: 'customers',
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: `+${stats.monthlyGrowth}%`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      positive: true
    },
    {
      id: 'cards',
      label: 'Active Cards',
      value: stats.activeCards.toString(),
      change: '+2 this week',
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      positive: true
    },
    {
      id: 'rewards',
      label: 'Rewards Given',
      value: stats.totalRewards.toString(),
      change: `+${stats.revenueGrowth}%`,
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      positive: true
    },
    {
      id: 'engagement',
      label: 'Engagement Rate',
      value: `${stats.engagementRate}%`,
      change: '+5.2% vs last month',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      positive: true
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${roleStyles.business.card} hover:scale-105 transition-transform duration-200`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <Badge 
                  variant={metric.positive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {metric.change}
                </Badge>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">
                  {metric.label}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// Quick Actions Grid Component
function QuickActionsGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <Badge variant="outline">
          <Zap className="w-4 h-4 mr-1" />
          Most Used
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={action.href}>
              <Card className={`${modernStyles.card.interactive} group relative overflow-hidden`}>
                <CardContent className="p-6">
                  {action.badge && (
                    <Badge 
                      className="absolute top-2 right-2 text-xs"
                      variant={action.badge === 'New' ? "default" : "secondary"}
                    >
                      {action.badge}
                    </Badge>
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {action.description}
                  </p>
                  
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    Get started
                    <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Recent Activity Card
function RecentActivityCard({ activities }: { activities: RecentActivity[] }) {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'stamp': return <Sparkles className="w-5 h-5 text-blue-500" />
      case 'reward': return <Award className="w-5 h-5 text-purple-500" />
      case 'signup': return <Users className="w-5 h-5 text-green-500" />
    }
  }

  return (
    <Card className={roleStyles.business.card}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2 text-emerald-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.customer}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.action}
                </p>
              </div>
              <div className="text-xs text-gray-400">
                {activity.timestamp}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6">
          <Link href="/business/activity">
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Business Insights Card
function BusinessInsightsCard({ stats }: { stats: DashboardStats }) {
  const insights = [
    {
      title: 'Peak Hours',
      value: '2-4 PM',
      description: 'Highest customer activity',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Top Day',
      value: 'Friday',
      description: 'Most rewards redeemed',
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      title: 'Growth Trend',
      value: '+23%',
      description: 'Customer retention',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ]

  return (
    <Card className={roleStyles.business.card}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
          Business Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4"
            >
              <div className={`p-2 rounded-lg bg-gray-50`}>
                <insight.icon className={`w-5 h-5 ${insight.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {insight.value}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {insight.title}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {insight.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/business/analytics">
            <Button className={roleStyles.business.button.primary} size="sm">
              View Full Analytics
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Growth Opportunities Card
function GrowthOpportunitiesCard() {
  const opportunities = [
    {
      title: 'Increase stamp rewards',
      description: 'Add bonus stamps for referrals to boost customer acquisition',
      impact: 'High',
      effort: 'Low',
      icon: Star
    },
    {
      title: 'Social media integration',
      description: 'Allow customers to share rewards on social platforms',
      impact: 'Medium',
      effort: 'Medium',
      icon: Sparkles
    }
  ]

  return (
    <Card className={`${roleStyles.business.card} border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="w-5 h-5 mr-2 text-emerald-600" />
          Growth Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-emerald-100"
            >
              <div className="p-2 bg-emerald-100 rounded-lg">
                <opportunity.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {opportunity.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {opportunity.description}
                </p>
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={opportunity.impact === 'High' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {opportunity.impact} Impact
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {opportunity.effort} Effort
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className={modernStyles.layout.container}>
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        {/* Metrics skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardContent className="p-6">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <Card>
                <CardContent className="p-6">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}