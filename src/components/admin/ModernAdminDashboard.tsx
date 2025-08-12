'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Activity,
  AlertTriangle,
  TrendingUp,
  Database,
  Shield,
  Settings,
  Bell,
  RefreshCw,
  Plus,
  Eye,
  Zap,
  Monitor,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

/**
 * 🛡️ MODERN ADMIN DASHBOARD
 * 
 * Phase 4 redesign for admin interface (Role 1)
 * Professional, data-dense interface for system management
 */

interface AdminStats {
  totalBusinesses: number
  totalCustomers: number
  totalCards: number
  systemHealth: number
  recentActivity: number
  pendingReviews: number
  monthlyGrowth: number
  errorRate: number
}

interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  resolved: boolean
}

interface QuickAdminAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  badge?: string
  permissions?: string[]
}

interface ModernAdminDashboardProps {
  stats?: AdminStats
  loading?: boolean
  className?: string
}

export default function ModernAdminDashboard({ 
  stats, 
  loading = false,
  className 
}: ModernAdminDashboardProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  
  // Mock data - in real implementation, this would come from API
  const defaultStats: AdminStats = {
    totalBusinesses: 47,
    totalCustomers: 12847,
    totalCards: 189,
    systemHealth: 98.7,
    recentActivity: 234,
    pendingReviews: 7,
    monthlyGrowth: 15.3,
    errorRate: 0.02
  }

  const adminStats = stats || defaultStats

  const quickActions: QuickAdminAction[] = [
    {
      id: 'create-business',
      title: 'Add Business',
      description: 'Onboard new business partner',
      icon: Building2,
      href: '/admin/businesses',
      color: 'bg-blue-500',
      badge: 'Essential'
    },
    {
      id: 'create-card',
      title: 'Create Card',
      description: 'Design new loyalty card template',
      icon: CreditCard,
      href: '/admin/cards/new',
      color: 'bg-purple-500'
    },
    {
      id: 'system-monitor',
      title: 'System Monitor',
      description: 'View system health and performance',
      icon: Monitor,
      href: '/admin/dev-tools/system-monitor',
      color: 'bg-green-500',
      badge: 'Live'
    },
    {
      id: 'business-review',
      title: 'Review Queue',
      description: 'Pending business applications',
      icon: FileText,
      href: '/admin/support',
      color: 'bg-orange-500',
      badge: adminStats.pendingReviews > 0 ? adminStats.pendingReviews.toString() : undefined
    }
  ]

  const systemAlerts: SystemAlert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'High API Usage',
      description: 'API calls increased by 45% in the last hour',
      timestamp: '5 minutes ago',
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Database Backup Complete',
      description: 'Scheduled backup completed successfully',
      timestamp: '1 hour ago',
      resolved: true
    }
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <div className={`${modernStyles.layout.container} ${className}`}>
      <div className={modernStyles.layout.section}>
        
        {/* Admin Header */}
        <AdminHeader 
          onRefresh={handleRefresh} 
          refreshing={refreshing}
          systemHealth={adminStats.systemHealth}
        />

        {/* System Status Cards */}
        <SystemStatusGrid stats={adminStats} />

        {/* Quick Admin Actions */}
        <QuickAdminActions actions={quickActions} />

        {/* Analytics and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BusinessOverview />
          </div>
          <div>
            <SystemAlerts alerts={systemAlerts} />
          </div>
        </div>

        {/* Performance Metrics */}
        <PerformanceMetricsCard stats={adminStats} />

      </div>
    </div>
  )
}

// Admin Header Component
function AdminHeader({ 
  onRefresh, 
  refreshing, 
  systemHealth 
}: { 
  onRefresh: () => void
  refreshing: boolean
  systemHealth: number 
}) {
  const getHealthStatus = (health: number) => {
    if (health >= 95) return { label: 'Excellent', color: 'bg-green-500' }
    if (health >= 90) return { label: 'Good', color: 'bg-blue-500' }
    if (health >= 80) return { label: 'Fair', color: 'bg-yellow-500' }
    return { label: 'Poor', color: 'bg-red-500' }
  }

  const healthStatus = getHealthStatus(systemHealth)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            System overview and management controls
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <Badge 
            className={`${healthStatus.color} text-white`}
          >
            <Shield className="w-4 h-4 mr-1" />
            System {healthStatus.label} ({systemHealth}%)
          </Badge>
          <Button 
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// System Status Grid
function SystemStatusGrid({ stats }: { stats: AdminStats }) {
  const statusCards = [
    {
      id: 'businesses',
      label: 'Active Businesses',
      value: stats.totalBusinesses.toLocaleString(),
      change: `+${stats.monthlyGrowth}%`,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/businesses'
    },
    {
      id: 'customers',
      label: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      change: '+12.4%',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/admin/customers'
    },
    {
      id: 'cards',
      label: 'Loyalty Cards',
      value: stats.totalCards.toString(),
      change: '+5 this week',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/admin/cards'
    },
    {
      id: 'activity',
      label: 'Recent Activity',
      value: stats.recentActivity.toString(),
      change: 'Last 24h',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/admin/activity'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statusCards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={card.href}>
            <Card className={`${roleStyles.admin.card} hover:scale-105 transition-all duration-200 cursor-pointer group`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {card.label}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {card.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

// Quick Admin Actions
function QuickAdminActions({ actions }: { actions: QuickAdminAction[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <Badge variant="outline">
          <Zap className="w-4 h-4 mr-1" />
          Admin Tools
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
                      variant={action.badge === 'Live' ? "default" : "secondary"}
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
                  
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    Open
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

// Business Overview Component
function BusinessOverview() {
  // Mock data for business metrics
  const businessMetrics = [
    { label: 'New This Week', value: 5, change: '+25%' },
    { label: 'Pending Review', value: 3, change: '-40%' },
    { label: 'Active Premium', value: 28, change: '+18%' },
    { label: 'Trial Users', value: 14, change: '+12%' }
  ]

  return (
    <Card className={roleStyles.admin.card}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Business Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {businessMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 bg-gray-50 rounded-lg"
            >
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {metric.label}
              </div>
              <Badge 
                variant={metric.change.startsWith('+') ? 'default' : 'secondary'}
                className="text-xs"
              >
                {metric.change}
              </Badge>
            </motion.div>
          ))}
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>System Capacity</span>
              <span>78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>API Performance</span>
              <span>95%</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>
        </div>

        <div className="mt-6">
          <Link href="/admin/businesses">
            <Button className={roleStyles.admin.button.primary} size="sm">
              Manage All Businesses
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// System Alerts Component
function SystemAlerts({ alerts }: { alerts: SystemAlert[] }) {
  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <Card className={roleStyles.admin.card}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-600" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                alert.resolved ? 'bg-gray-50' : 'bg-yellow-50 hover:bg-yellow-100'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${alert.resolved ? 'text-gray-500' : 'text-gray-900'}`}>
                  {alert.title}
                </p>
                <p className={`text-sm ${alert.resolved ? 'text-gray-400' : 'text-gray-600'}`}>
                  {alert.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {alert.timestamp}
                </p>
              </div>
              {alert.resolved && (
                <Badge variant="secondary" className="text-xs">
                  Resolved
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6">
          <Link href="/admin/alerts">
            <Button variant="outline" className="w-full">
              View All Alerts
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Performance Metrics Card
function PerformanceMetricsCard({ stats }: { stats: AdminStats }) {
  return (
    <Card className={`${roleStyles.admin.card} border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          System Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.systemHealth}%
            </div>
            <div className="text-sm text-gray-600">System Health</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.errorRate}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              234ms
            </div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function AdminDashboardSkeleton() {
  return (
    <div className={modernStyles.layout.container}>
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        {/* Status cards skeleton */}
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
        
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-pulse">
            <Card>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="animate-pulse">
            <Card>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}