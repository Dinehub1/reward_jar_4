'use client'

import { useState } from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bug, 
  TestTube, 
  Map, 
  Database, 
  Zap, 
  Settings, 
  Monitor, 
  Code, 
  PlayCircle,
  FileText,
  Users,
  CreditCard,
  Building,
  Activity,
  ExternalLink,
  Wrench,
  Gauge,
  Shield,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface DevTool {
  id: string
  title: string
  description: string
  path: string
  icon: React.ReactNode
  category: 'testing' | 'debug' | 'utilities' | 'monitoring'
  status: 'active' | 'beta' | 'deprecated'
  lastUpdated?: string
}

const devTools: DevTool[] = [
  // Testing Tools
  {
    id: 'sandbox',
    title: 'Testing Sandbox',
    description: 'Global preview mode for cards, wallets, and system flows',
    path: '/admin/sandbox',
    icon: <TestTube className="h-5 w-5" />,
    category: 'testing',
    status: 'active',
    lastUpdated: 'Recently updated'
  },
  {
    id: 'test-dashboard',
    title: 'Test Dashboard',
    description: 'Comprehensive testing interface for admin operations',
    path: '/admin/test-dashboard',
    icon: <Monitor className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-cards',
    title: 'Card Testing',
    description: 'Card functionality and wallet integration testing',
    path: '/admin/test-cards',
    icon: <CreditCard className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-business',
    title: 'Business Management Testing',
    description: 'Business operations and management flow testing',
    path: '/admin/test-business-management',
    icon: <Building className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-customer',
    title: 'Customer Monitoring Testing',
    description: 'Customer analytics and monitoring system testing',
    path: '/admin/test-customer-monitoring',
    icon: <Users className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'demo-card-creation',
    title: 'Card Creation Demo',
    description: 'Interactive demo of card creation workflow',
    path: '/admin/demo/card-creation',
    icon: <PlayCircle className="h-5 w-5" />,
    category: 'testing',
    status: 'active'
  },
  {
    id: 'test-automation',
    title: 'Test Automation',
    description: 'Automated testing and manual test page management',
    path: '/admin/dev-tools/test-automation',
    icon: <TestTube className="h-5 w-5" />,
    category: 'testing',
    status: 'active',
    lastUpdated: 'Just created'
  },

  // Debug Tools
  {
    id: 'debug-maps',
    title: 'Google Maps Debug',
    description: 'Debug Google Maps API integration and loading issues',
    path: '/debug-maps',
    icon: <Map className="h-5 w-5" />,
    category: 'debug',
    status: 'active',
    lastUpdated: 'Just updated'
  },
  {
    id: 'debug-client',
    title: 'Client Debug',
    description: 'Client-side debugging and diagnostics',
    path: '/admin/debug-client',
    icon: <Bug className="h-5 w-5" />,
    category: 'debug',
    status: 'beta'
  },
  {
    id: 'test-auth-debug',
    title: 'Auth Debug',
    description: 'Authentication system debugging and testing',
    path: '/admin/test-auth-debug',
    icon: <Shield className="h-5 w-5" />,
    category: 'debug',
    status: 'active'
  },
  {
    id: 'test-login',
    title: 'Login Testing',
    description: 'Login flow testing and validation',
    path: '/admin/test-login',
    icon: <Users className="h-5 w-5" />,
    category: 'debug',
    status: 'active'
  },

  // Utilities
  {
    id: 'api-health',
    title: 'API Health Check',
    description: 'Check status of all API endpoints and services',
    path: '/api/health',
    icon: <Activity className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },
  {
    id: 'env-check',
    title: 'Environment Check',
    description: 'Validate environment variables and configuration',
    path: '/api/health/env',
    icon: <Settings className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },
  {
    id: 'wallet-health',
    title: 'Wallet Health',
    description: 'Check wallet provisioning and update services',
    path: '/api/health/wallet',
    icon: <CreditCard className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },
  {
    id: 'centralized-arch',
    title: 'Architecture Test',
    description: 'Test centralized architecture and data flow',
    path: '/api/test/centralized-architecture',
    icon: <Database className="h-5 w-5" />,
    category: 'utilities',
    status: 'active'
  },

  // Monitoring
  {
    id: 'system-monitor',
    title: 'System Monitor',
    description: 'Real-time system health and performance monitoring dashboard',
    path: '/admin/dev-tools/system-monitor',
    icon: <Gauge className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active',
    lastUpdated: 'Just created'
  },
  {
    id: 'api-health-dashboard',
    title: 'API Health Dashboard',
    description: 'Comprehensive API endpoint testing and monitoring',
    path: '/admin/dev-tools/api-health',
    icon: <Activity className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active',
    lastUpdated: 'Just created'
  },
  {
    id: 'system-alerts',
    title: 'System Alerts',
    description: 'System alerts and notifications monitoring',
    path: '/admin/alerts',
    icon: <AlertTriangle className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active'
  },
  {
    id: 'support-tools',
    title: 'Support Tools',
    description: 'Customer support and manual operation tools',
    path: '/admin/support',
    icon: <Wrench className="h-5 w-5" />,
    category: 'monitoring',
    status: 'active'
  }
]

export default function DevToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { id: 'all', label: 'All Tools', count: devTools.length },
    { id: 'testing', label: 'Testing', count: devTools.filter(t => t.category === 'testing').length },
    { id: 'debug', label: 'Debug', count: devTools.filter(t => t.category === 'debug').length },
    { id: 'utilities', label: 'Utilities', count: devTools.filter(t => t.category === 'utilities').length },
    { id: 'monitoring', label: 'Monitoring', count: devTools.filter(t => t.category === 'monitoring').length }
  ]

  const filteredTools = devTools.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory
    const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'beta': return 'secondary'
      case 'deprecated': return 'destructive'
      default: return 'outline'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'testing': return <TestTube className="h-4 w-4" />
      case 'debug': return <Bug className="h-4 w-4" />
      case 'utilities': return <Wrench className="h-4 w-4" />
      case 'monitoring': return <Monitor className="h-4 w-4" />
      default: return <Code className="h-4 w-4" />
    }
  }

  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🛠️ Developer Tools</h1>
            <p className="text-muted-foreground">
              Testing, debugging, and development utilities for RewardJar 4.0
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              {devTools.length} Tools Available
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {categories.slice(1).map((category) => (
            <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveCategory(category.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.id)}
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search developer tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center gap-1"
              >
                {category.id !== 'all' && getCategoryIcon(category.id)}
                {category.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {tool.icon}
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getStatusColor(tool.status) as any}>
                      {tool.status}
                    </Badge>
                    {tool.lastUpdated && (
                      <span className="text-xs text-muted-foreground">
                        {tool.lastUpdated}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getCategoryIcon(tool.category)}
                    <span className="capitalize">{tool.category}</span>
                  </div>
                  <Link href={tool.path}>
                    <Button size="sm" className="flex items-center gap-1">
                      Open Tool
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tools found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/dev-tools/system-monitor">
                <Button variant="outline" className="w-full justify-start">
                  <Gauge className="h-4 w-4 mr-2" />
                  System Monitor
                </Button>
              </Link>
              <Link href="/admin/dev-tools/api-health">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  API Health Dashboard
                </Button>
              </Link>
              <Link href="/debug-maps">
                <Button variant="outline" className="w-full justify-start">
                  <Map className="h-4 w-4 mr-2" />
                  Debug Google Maps
                </Button>
              </Link>
              <Link href="/admin/sandbox">
                <Button variant="outline" className="w-full justify-start">
                  <TestTube className="h-4 w-4 mr-2" />
                  Testing Sandbox
                </Button>
              </Link>
              <Link href="/api/health">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Raw Health API
                </Button>
              </Link>
              <Link href="/admin/alerts">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  System Alerts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentation & Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Debug Guide - Common Issues & Solutions</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Admin Dashboard Documentation</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Card Creation & Wallet Setup Guide</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>MCP Integration Summary</span>
                <Badge variant="outline">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutClient>
  )
}