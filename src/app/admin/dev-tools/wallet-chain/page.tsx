'use client'

import React from 'react'
import { AdminLayoutClient } from '@/components/layouts/AdminLayoutClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Search, 
  Download, 
  BarChart3, 
  TestTube,
  Wallet,
  Database,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { WalletChainHealthDashboard } from '@/components/admin/wallet-chain/WalletChainHealthDashboard'
import { CardDataValidator } from '@/components/admin/wallet-chain/CardDataValidator'
import { OneClickWalletPreview } from '@/components/admin/wallet-chain/OneClickWalletPreview'
import { QueueInspector } from '@/components/admin/wallet-chain/QueueInspector'
import { TestCustomerSimulator } from '@/components/admin/wallet-chain/TestCustomerSimulator'

export default function WalletChainToolsPage() {
  return (
    <AdminLayoutClient>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Wallet Chain Diagnostics</h1>
              <p className="text-muted-foreground">
                Comprehensive tools for debugging and maintaining the unified card → wallet → PWA chain
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Developer Tools
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Monitor</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Real-time system health monitoring
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Validator</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Validate card data compliance
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Preview</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Generate instant wallet passes
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queue Inspector</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Monitor and manage queue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Simulator</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                End-to-end simulation testing
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tools Tabs */}
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="health" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Health
            </TabsTrigger>
            <TabsTrigger value="validator" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Validator
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center">
              <TestTube className="h-4 w-4 mr-2" />
              Simulator
            </TabsTrigger>
          </TabsList>

          {/* Health Dashboard Tab */}
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Wallet Chain Health Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor Supabase connectivity, queue status, environment configuration, and platform health.
                </p>
                <WalletChainHealthDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Card Data Validator Tab */}
          <TabsContent value="validator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Card Data Validator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Validate customer card data against Apple Wallet, Google Wallet, and PWA requirements.
                </p>
                <CardDataValidator />
              </CardContent>
            </Card>
          </TabsContent>

          {/* One-Click Wallet Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  One-Click Wallet Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate and download wallet passes for Apple, Google, and PWA platforms instantly.
                </p>
                <OneClickWalletPreview />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Inspector Tab */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Queue Inspector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor wallet generation queue with retry, force, and fail actions for comprehensive queue management.
                </p>
                <QueueInspector />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Customer Simulator Tab */}
          <TabsContent value="simulator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Test Customer Simulator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create test customers and cards, trigger wallet generation, and run complete end-to-end simulations.
                </p>
                <TestCustomerSimulator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">System Health</h4>
                <p className="text-sm text-muted-foreground">
                  Check overall wallet chain system health and get recommendations for optimal performance.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Quick Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Validate any card data quickly against all platform requirements with detailed compliance reporting.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Test & Debug</h4>
                <p className="text-sm text-muted-foreground">
                  Run end-to-end simulations and inspect queue operations for debugging and optimization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Database className="h-5 w-5 mr-2" />
              Technical Implementation Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <strong>Real-time Updates:</strong> All tools use SWR for automatic data refreshing and optimal performance.
            </div>
            <div>
              <strong>Type Safety:</strong> Full TypeScript integration with the unified wallet chain data structures.
            </div>
            <div>
              <strong>Security:</strong> All operations require admin authentication and follow proper security patterns.
            </div>
            <div>
              <strong>Feature Flags:</strong> Wallet generation respects environment configuration and feature toggles.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutClient>
  )
}