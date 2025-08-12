/**
 * 🏆 INDUSTRY BENCHMARKING SYSTEM
 * 
 * Anonymous data aggregation and comparison system
 * Provides competitive insights for business subscribers
 */

import { createAdminClient } from '@/lib/supabase/admin-client'

export interface IndustryMetrics {
  industry: 'restaurant' | 'retail' | 'service' | 'fitness' | 'beauty' | 'other'
  size: 'small' | 'medium' | 'large' // Based on customer count
  location: 'urban' | 'suburban' | 'rural'
  period: string // ISO date range
}

export interface BenchmarkData {
  customerRetentionRate: {
    value: number
    percentile: number
    industryAverage: number
    topPerformer: number
  }
  loyaltyEngagementRate: {
    value: number
    percentile: number
    industryAverage: number
    topPerformer: number
  }
  newCustomerAcquisition: {
    value: number
    percentile: number
    industryAverage: number
    topPerformer: number
  }
  averageSpendPerVisit: {
    value: number
    percentile: number
    industryAverage: number
    topPerformer: number
  }
  rewardRedemptionRate: {
    value: number
    percentile: number
    industryAverage: number
    topPerformer: number
  }
  customerLifetimeValue: {
    value: number
    percentile: number
    industryAverage: number
    topPerformer: number
  }
}

export interface BenchmarkInsights {
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  competitivePosition: 'leading' | 'above_average' | 'average' | 'below_average'
  opportunityScore: number // 0-100
}

// Business size classification based on customer count
function classifyBusinessSize(customerCount: number): 'small' | 'medium' | 'large' {
  if (customerCount < 100) return 'small'
  if (customerCount < 500) return 'medium'
  return 'large'
}

// Industry classification helper
function classifyIndustry(businessName: string, description?: string): IndustryMetrics['industry'] {
  const text = `${businessName} ${description || ''}`.toLowerCase()
  
  if (text.includes('restaurant') || text.includes('cafe') || text.includes('coffee') || 
      text.includes('food') || text.includes('dining') || text.includes('kitchen')) {
    return 'restaurant'
  }
  
  if (text.includes('retail') || text.includes('shop') || text.includes('store') || 
      text.includes('boutique') || text.includes('market')) {
    return 'retail'
  }
  
  if (text.includes('gym') || text.includes('fitness') || text.includes('yoga') || 
      text.includes('personal training') || text.includes('crossfit')) {
    return 'fitness'
  }
  
  if (text.includes('salon') || text.includes('beauty') || text.includes('spa') || 
      text.includes('nail') || text.includes('hair')) {
    return 'beauty'
  }
  
  if (text.includes('service') || text.includes('repair') || text.includes('consulting') || 
      text.includes('professional')) {
    return 'service'
  }
  
  return 'other'
}

// Anonymous data aggregation for benchmarking
export class IndustryBenchmarkingService {
  private supabase = createAdminClient()

  /**
   * Calculate industry benchmarks for a specific segment
   */
  async calculateIndustryBenchmarks(
    industry: IndustryMetrics['industry'],
    size: IndustryMetrics['size'],
    location: IndustryMetrics['location'] = 'urban',
    periodDays: number = 30
  ): Promise<BenchmarkData> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

    try {
      // Get all businesses in the same industry segment
      const { data: businesses, error: businessError } = await this.supabase
        .from('businesses')
        .select(`
          id, 
          name, 
          description,
          created_at,
          business_metrics (
            total_customers,
            total_revenue_cents,
            total_transactions,
            average_transaction_value_cents,
            customer_retention_rate,
            loyalty_engagement_rate,
            clv_cents
          )
        `)
        .eq('status', 'active')

      if (businessError) throw businessError

      // Filter businesses by industry and size
      const segmentBusinesses = businesses?.filter(business => {
        const businessIndustry = classifyIndustry(business.name, business.description)
        const metrics = business.business_metrics?.[0]
        const businessSize = metrics ? classifyBusinessSize(metrics.total_customers || 0) : 'small'
        
        return businessIndustry === industry && businessSize === size
      }) || []

      if (segmentBusinesses.length < 5) {
        // Not enough data for reliable benchmarks
        return this.getDefaultBenchmarks()
      }

      // Calculate percentiles and averages
      const metrics = segmentBusinesses
        .map(b => b.business_metrics?.[0])
        .filter(Boolean)

      const retentionRates = metrics.map(m => m.customer_retention_rate || 0).sort((a, b) => a - b)
      const engagementRates = metrics.map(m => m.loyalty_engagement_rate || 0).sort((a, b) => a - b)
      const avgSpends = metrics.map(m => (m.average_transaction_value_cents || 0) / 100).sort((a, b) => a - b)
      const clvValues = metrics.map(m => (m.clv_cents || 0) / 100).sort((a, b) => a - b)

      return {
        customerRetentionRate: {
          value: 0, // Will be filled by business-specific data
          percentile: 0,
          industryAverage: this.calculateAverage(retentionRates),
          topPerformer: this.calculatePercentile(retentionRates, 90)
        },
        loyaltyEngagementRate: {
          value: 0,
          percentile: 0,
          industryAverage: this.calculateAverage(engagementRates),
          topPerformer: this.calculatePercentile(engagementRates, 90)
        },
        newCustomerAcquisition: {
          value: 0,
          percentile: 0,
          industryAverage: 50, // Mock for now
          topPerformer: 150
        },
        averageSpendPerVisit: {
          value: 0,
          percentile: 0,
          industryAverage: this.calculateAverage(avgSpends),
          topPerformer: this.calculatePercentile(avgSpends, 90)
        },
        rewardRedemptionRate: {
          value: 0,
          percentile: 0,
          industryAverage: 65, // Mock for now
          topPerformer: 85
        },
        customerLifetimeValue: {
          value: 0,
          percentile: 0,
          industryAverage: this.calculateAverage(clvValues),
          topPerformer: this.calculatePercentile(clvValues, 90)
        }
      }

    } catch (error) {
      console.error('Error calculating industry benchmarks:', error)
      return this.getDefaultBenchmarks()
    }
  }

  /**
   * Get business-specific benchmarks with percentile rankings
   */
  async getBusinessBenchmarks(businessId: string): Promise<BenchmarkData & BenchmarkInsights> {
    try {
      // Get business details and metrics
      const { data: business, error: businessError } = await this.supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          business_metrics (
            total_customers,
            customer_retention_rate,
            loyalty_engagement_rate,
            average_transaction_value_cents,
            clv_cents,
            total_revenue_cents,
            total_transactions
          )
        `)
        .eq('id', businessId)
        .single()

      if (businessError) throw businessError

      const metrics = business.business_metrics?.[0]
      if (!metrics) {
        throw new Error('No metrics available for this business')
      }

      // Classify business
      const industry = classifyIndustry(business.name, business.description)
      const size = classifyBusinessSize(metrics.total_customers || 0)

      // Get industry benchmarks
      const industryBenchmarks = await this.calculateIndustryBenchmarks(industry, size)

      // Calculate business-specific values and percentiles
      const businessData: BenchmarkData = {
        customerRetentionRate: {
          value: metrics.customer_retention_rate || 0,
          percentile: this.calculateBusinessPercentile(
            metrics.customer_retention_rate || 0,
            industryBenchmarks.customerRetentionRate.industryAverage,
            industryBenchmarks.customerRetentionRate.topPerformer
          ),
          industryAverage: industryBenchmarks.customerRetentionRate.industryAverage,
          topPerformer: industryBenchmarks.customerRetentionRate.topPerformer
        },
        loyaltyEngagementRate: {
          value: metrics.loyalty_engagement_rate || 0,
          percentile: this.calculateBusinessPercentile(
            metrics.loyalty_engagement_rate || 0,
            industryBenchmarks.loyaltyEngagementRate.industryAverage,
            industryBenchmarks.loyaltyEngagementRate.topPerformer
          ),
          industryAverage: industryBenchmarks.loyaltyEngagementRate.industryAverage,
          topPerformer: industryBenchmarks.loyaltyEngagementRate.topPerformer
        },
        newCustomerAcquisition: {
          value: 45, // Mock - would be calculated from actual data
          percentile: 67,
          industryAverage: industryBenchmarks.newCustomerAcquisition.industryAverage,
          topPerformer: industryBenchmarks.newCustomerAcquisition.topPerformer
        },
        averageSpendPerVisit: {
          value: (metrics.average_transaction_value_cents || 0) / 100,
          percentile: this.calculateBusinessPercentile(
            (metrics.average_transaction_value_cents || 0) / 100,
            industryBenchmarks.averageSpendPerVisit.industryAverage,
            industryBenchmarks.averageSpendPerVisit.topPerformer
          ),
          industryAverage: industryBenchmarks.averageSpendPerVisit.industryAverage,
          topPerformer: industryBenchmarks.averageSpendPerVisit.topPerformer
        },
        rewardRedemptionRate: {
          value: 72, // Mock - would be calculated from card_events
          percentile: 78,
          industryAverage: industryBenchmarks.rewardRedemptionRate.industryAverage,
          topPerformer: industryBenchmarks.rewardRedemptionRate.topPerformer
        },
        customerLifetimeValue: {
          value: (metrics.clv_cents || 0) / 100,
          percentile: this.calculateBusinessPercentile(
            (metrics.clv_cents || 0) / 100,
            industryBenchmarks.customerLifetimeValue.industryAverage,
            industryBenchmarks.customerLifetimeValue.topPerformer
          ),
          industryAverage: industryBenchmarks.customerLifetimeValue.industryAverage,
          topPerformer: industryBenchmarks.customerLifetimeValue.topPerformer
        }
      }

      // Generate insights
      const insights = this.generateInsights(businessData, industry, size)

      return {
        ...businessData,
        ...insights
      }

    } catch (error) {
      console.error('Error getting business benchmarks:', error)
      throw error
    }
  }

  /**
   * Generate actionable insights based on benchmark performance
   */
  private generateInsights(data: BenchmarkData, industry: string, size: string): BenchmarkInsights {
    const strengths: string[] = []
    const improvements: string[] = []
    const recommendations: string[] = []

    // Analyze performance vs industry
    if (data.customerRetentionRate.percentile > 75) {
      strengths.push('Customer retention is a key strength')
    } else if (data.customerRetentionRate.percentile < 50) {
      improvements.push('Customer retention needs improvement')
      recommendations.push('Implement a customer win-back campaign for inactive customers')
    }

    if (data.loyaltyEngagementRate.percentile > 75) {
      strengths.push('High loyalty program engagement')
    } else if (data.loyaltyEngagementRate.percentile < 50) {
      improvements.push('Low loyalty program engagement')
      recommendations.push('Simplify your loyalty program and increase reward visibility')
    }

    if (data.averageSpendPerVisit.percentile > 75) {
      strengths.push('Strong average transaction value')
    } else if (data.averageSpendPerVisit.percentile < 50) {
      improvements.push('Below-average transaction value')
      recommendations.push('Consider upselling techniques or bundled offers')
    }

    // Industry-specific recommendations
    if (industry === 'restaurant') {
      if (data.rewardRedemptionRate.percentile < 60) {
        recommendations.push('Promote limited-time rewards to drive urgency')
      }
    } else if (industry === 'retail') {
      if (data.customerLifetimeValue.percentile < 60) {
        recommendations.push('Focus on repeat purchase incentives and cross-selling')
      }
    }

    // Overall competitive position
    const avgPercentile = Object.values(data).reduce((sum, metric) => sum + metric.percentile, 0) / 6
    let competitivePosition: BenchmarkInsights['competitivePosition']
    
    if (avgPercentile > 80) competitivePosition = 'leading'
    else if (avgPercentile > 60) competitivePosition = 'above_average'
    else if (avgPercentile > 40) competitivePosition = 'average'
    else competitivePosition = 'below_average'

    return {
      strengths,
      improvements,
      recommendations,
      competitivePosition,
      opportunityScore: Math.round(100 - avgPercentile) // Higher score = more room for improvement
    }
  }

  // Helper methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1
    return sortedValues[Math.max(0, index)]
  }

  private calculateBusinessPercentile(
    businessValue: number,
    industryAverage: number,
    topPerformer: number
  ): number {
    if (topPerformer <= industryAverage) return 50
    
    const position = (businessValue - industryAverage) / (topPerformer - industryAverage)
    return Math.max(0, Math.min(100, 50 + position * 40)) // Map to 10-90 percentile range
  }

  private getDefaultBenchmarks(): BenchmarkData {
    return {
      customerRetentionRate: {
        value: 0,
        percentile: 50,
        industryAverage: 75,
        topPerformer: 90
      },
      loyaltyEngagementRate: {
        value: 0,
        percentile: 50,
        industryAverage: 68,
        topPerformer: 85
      },
      newCustomerAcquisition: {
        value: 0,
        percentile: 50,
        industryAverage: 45,
        topPerformer: 120
      },
      averageSpendPerVisit: {
        value: 0,
        percentile: 50,
        industryAverage: 25,
        topPerformer: 45
      },
      rewardRedemptionRate: {
        value: 0,
        percentile: 50,
        industryAverage: 65,
        topPerformer: 85
      },
      customerLifetimeValue: {
        value: 0,
        percentile: 50,
        industryAverage: 185,
        topPerformer: 350
      }
    }
  }
}

// Singleton instance
export const industryBenchmarking = new IndustryBenchmarkingService()