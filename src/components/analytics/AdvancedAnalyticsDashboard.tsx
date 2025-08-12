'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  DollarSign, 
  Award,
  BarChart3,
  Lightbulb,
  Trophy,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  Download,
  Share2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BenchmarkData, BenchmarkInsights } from '@/lib/analytics/industry-benchmarking'

/**
 * 🚀 ADVANCED ANALYTICS DASHBOARD
 * 
 * Premium analytics with industry benchmarking
 * Key differentiator for subscription revenue
 */

interface AdvancedAnalyticsProps {
  businessId?: string
  timeRange?: '7d' | '30d' | '90d'
  className?: string
}

interface BenchmarkResponse extends BenchmarkData, BenchmarkInsights {
  industryContext?: {
    industry: string
    size: string
    sampleSize: number
  }
}

export default function AdvancedAnalyticsDashboard({ 
  businessId, 
  timeRange = '30d',
  className 
}: AdvancedAnalyticsProps) {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  // Fetch benchmark data
  const fetchBenchmarks = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        timeRange,
        ...(businessId && { businessId })
      })

      const response = await fetch(`/api/analytics/benchmarks?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch benchmarks')
      }

      setBenchmarkData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBenchmarks()
  }, [businessId, timeRange])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBenchmarks()
    setRefreshing(false)
  }

  if (loading) {
    return <AnalyticsSkeleton />
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Analytics Unavailable</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (!benchmarkData) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with competitive position */}
      <CompetitivePositionHeader 
        position={benchmarkData.competitivePosition}
        opportunityScore={benchmarkData.opportunityScore}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Key Metrics Grid */}
      <BenchmarkMetricsGrid 
        data={benchmarkData}
        onMetricSelect={setSelectedMetric}
        selectedMetric={selectedMetric}
      />

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceInsights 
          strengths={benchmarkData.strengths}
          improvements={benchmarkData.improvements}
        />
        <ActionableRecommendations 
          recommendations={benchmarkData.recommendations}
          opportunityScore={benchmarkData.opportunityScore}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <DetailedAnalyticsTabs 
        data={benchmarkData}
        selectedMetric={selectedMetric}
      />
    </div>
  )
}

// Competitive Position Header
function CompetitivePositionHeader({ 
  position, 
  opportunityScore, 
  onRefresh, 
  refreshing 
}: {
  position: BenchmarkInsights['competitivePosition']
  opportunityScore: number
  onRefresh: () => void
  refreshing: boolean
}) {
  const positionConfig = {
    leading: { 
      icon: Trophy, 
      color: 'bg-green-100 text-green-800 border-green-200',
      title: 'Market Leader',
      description: 'Your business outperforms most competitors'
    },
    above_average: { 
      icon: TrendingUp, 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      title: 'Above Average',
      description: 'Strong performance with room for growth'
    },
    average: { 
      icon: BarChart3, 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      title: 'Industry Average',
      description: 'Meeting standard industry benchmarks'
    },
    below_average: { 
      icon: TrendingDown, 
      color: 'bg-red-100 text-red-800 border-red-200',
      title: 'Below Average',
      description: 'Significant opportunity for improvement'
    }
  }

  const config = positionConfig[position]
  const Icon = config.icon

  return (
    <Card className={`border-2 ${config.color}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <p className="text-sm opacity-80">{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{100 - opportunityScore}%</div>
            <div className="text-xs">Performance Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span>Growth Opportunity:</span>
              <Badge variant={opportunityScore > 50 ? "destructive" : "secondary"}>
                {opportunityScore}% upside
              </Badge>
            </div>
            <Progress value={100 - opportunityScore} className="mt-2" />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={refreshing}
            className="ml-4"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Benchmark Metrics Grid
function BenchmarkMetricsGrid({ 
  data, 
  onMetricSelect, 
  selectedMetric 
}: {
  data: BenchmarkData
  onMetricSelect: (metric: string | null) => void
  selectedMetric: string | null
}) {
  const metrics = [
    {
      key: 'customerRetentionRate',
      title: 'Customer Retention',
      icon: Users,
      data: data.customerRetentionRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      description: 'Customers returning within timeframe'
    },
    {
      key: 'loyaltyEngagementRate',
      title: 'Loyalty Engagement',
      icon: Target,
      data: data.loyaltyEngagementRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      description: 'Active loyalty program usage'
    },
    {
      key: 'averageSpendPerVisit',
      title: 'Avg. Spend Per Visit',
      icon: DollarSign,
      data: data.averageSpendPerVisit,
      format: (val: number) => `$${val.toFixed(2)}`,
      description: 'Average transaction value'
    },
    {
      key: 'customerLifetimeValue',
      title: 'Customer Lifetime Value',
      icon: Award,
      data: data.customerLifetimeValue,
      format: (val: number) => `$${val.toFixed(0)}`,
      description: 'Total customer value over time'
    },
    {
      key: 'newCustomerAcquisition',
      title: 'New Customer Acquisition',
      icon: TrendingUp,
      data: data.newCustomerAcquisition,
      format: (val: number) => `${val.toFixed(0)}`,
      description: 'New customers in period'
    },
    {
      key: 'rewardRedemptionRate',
      title: 'Reward Redemption',
      icon: Award,
      data: data.rewardRedemptionRate,
      format: (val: number) => `${val.toFixed(1)}%`,
      description: 'Percentage of rewards claimed'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <BenchmarkMetricCard
          key={metric.key}
          metric={metric}
          isSelected={selectedMetric === metric.key}
          onSelect={() => onMetricSelect(
            selectedMetric === metric.key ? null : metric.key
          )}
        />
      ))}
    </div>
  )
}

// Individual Metric Card
function BenchmarkMetricCard({ 
  metric, 
  isSelected, 
  onSelect 
}: {
  metric: any
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = metric.icon
  const percentile = metric.data.percentile
  const isAboveAverage = metric.data.value > metric.data.industryAverage

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-gray-600" />
            <Badge 
              variant={percentile > 50 ? "default" : "secondary"}
              className="text-xs"
            >
              {percentile.toFixed(0)}th percentile
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-900">{metric.title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {metric.format(metric.data.value)}
              </span>
              {isAboveAverage ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Industry avg: {metric.format(metric.data.industryAverage)}</div>
              <div>Top performer: {metric.format(metric.data.topPerformer)}</div>
            </div>
            <Progress value={percentile} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Performance Insights
function PerformanceInsights({ 
  strengths, 
  improvements 
}: {
  strengths: string[]
  improvements: string[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {strengths.length > 0 && (
          <div>
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-700 flex items-start gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Actionable Recommendations
function ActionableRecommendations({ 
  recommendations, 
  opportunityScore 
}: {
  recommendations: string[]
  opportunityScore: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Based on your industry benchmarks, here are prioritized actions to improve performance:
        </div>
        
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-900">{recommendation}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            </motion.div>
          ))}
        </div>

        {opportunityScore > 30 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">Growth Opportunity</span>
            </div>
            <p className="text-sm text-purple-800">
              You have {opportunityScore}% upside potential. Implementing these recommendations 
              could significantly improve your competitive position.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Detailed Analytics Tabs
function DetailedAnalyticsTabs({ 
  data, 
  selectedMetric 
}: {
  data: BenchmarkData
  selectedMetric: string | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Detailed overview charts coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="mt-4">
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Historical trend analysis coming soon...</p>
            </div>
          </TabsContent>
          
          <TabsContent value="benchmarks" className="mt-4">
            <div className="space-y-4">
              {selectedMetric ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed benchmark analysis for {selectedMetric} coming soon...</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Select a metric above to see detailed benchmark analysis</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report (PDF)
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Insights
                </Button>
              </div>
              <div className="text-sm text-gray-500 text-center">
                Export functionality available in premium plans
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Loading skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}