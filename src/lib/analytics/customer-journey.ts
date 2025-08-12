/**
 * 🛣️ CUSTOMER JOURNEY ANALYTICS
 * 
 * Track customer lifecycle and identify engagement optimization opportunities
 * Essential for improving retention and loyalty engagement rates
 */

import { createAdminClient } from '@/lib/supabase/admin-client'

export interface CustomerJourneyStage {
  stage: 'discovery' | 'onboarding' | 'engagement' | 'loyalty' | 'advocacy' | 'churn_risk' | 'churned'
  timestamp: string
  metadata?: Record<string, any>
}

export interface CustomerLifecycle {
  customerId: string
  currentStage: CustomerJourneyStage['stage']
  totalVisits: number
  daysSinceFirstVisit: number
  daysSinceLastVisit: number
  totalStampsEarned: number
  totalRewardsRedeemed: number
  totalSpent: number
  averageSpendPerVisit: number
  engagementScore: number // 0-100
  churnRisk: 'low' | 'medium' | 'high'
  loyaltySegment: 'new' | 'regular' | 'champion' | 'at_risk'
  journey: CustomerJourneyStage[]
}

export interface JourneyAnalytics {
  totalCustomers: number
  stageDistribution: Record<CustomerJourneyStage['stage'], number>
  averageTimeToLoyalty: number // days
  churnRate: number
  retentionRate: number
  engagementTrends: {
    period: string
    newCustomers: number
    returningCustomers: number
    churnedCustomers: number
  }[]
  dropOffPoints: {
    stage: string
    dropOffRate: number
    commonReasons: string[]
  }[]
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    action: string
    expectedImpact: string
    targetSegment: string
  }[]
}

export class CustomerJourneyAnalytics {
  private supabase = createAdminClient()

  /**
   * Analyze customer lifecycle for a business
   */
  async analyzeBusinessCustomers(businessId: string, periodDays: number = 90): Promise<JourneyAnalytics> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000)

      // Get customer data with related card events
      const { data: customerCards, error } = await this.supabase
        .from('customer_cards')
        .select(`
          id,
          created_at,
          current_stamps,
          stamp_cards!inner (
            id,
            business_id,
            total_stamps
          ),
          card_events (
            id,
            event_type,
            created_at,
            metadata
          )
        `)
        .eq('stamp_cards.business_id', businessId)
        .gte('created_at', startDate.toISOString())

      if (error) throw error

      const customers = customerCards || []
      const analytics = await this.calculateJourneyAnalytics(customers, periodDays)

      return analytics

    } catch (error) {
      console.error('Error analyzing customer journey:', error)
      throw error
    }
  }

  /**
   * Get detailed customer lifecycle for individual customer
   */
  async getCustomerLifecycle(customerCardId: string): Promise<CustomerLifecycle> {
    try {
      const { data: customerCard, error } = await this.supabase
        .from('customer_cards')
        .select(`
          id,
          created_at,
          current_stamps,
          stamp_cards (
            total_stamps
          ),
          card_events (
            id,
            event_type,
            created_at,
            metadata
          )
        `)
        .eq('id', customerCardId)
        .single()

      if (error) throw error

      return this.calculateCustomerLifecycle(customerCard)

    } catch (error) {
      console.error('Error getting customer lifecycle:', error)
      throw error
    }
  }

  /**
   * Identify customers at risk of churning
   */
  async identifyChurnRiskCustomers(businessId: string): Promise<CustomerLifecycle[]> {
    try {
      // Get customers who haven't visited in 14+ days
      const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

      const { data: customerCards, error } = await this.supabase
        .from('customer_cards')
        .select(`
          id,
          created_at,
          current_stamps,
          stamp_cards!inner (
            business_id,
            total_stamps
          ),
          card_events (
            id,
            event_type,
            created_at,
            metadata
          )
        `)
        .eq('stamp_cards.business_id', businessId)
        .lt('updated_at', cutoffDate.toISOString())

      if (error) throw error

      const churnRiskCustomers = await Promise.all(
        (customerCards || []).map(async (customer) => {
          const lifecycle = await this.calculateCustomerLifecycle(customer)
          return lifecycle.churnRisk !== 'low' ? lifecycle : null
        })
      )

      return churnRiskCustomers.filter(Boolean) as CustomerLifecycle[]

    } catch (error) {
      console.error('Error identifying churn risk customers:', error)
      return []
    }
  }

  /**
   * Calculate comprehensive journey analytics
   */
  private async calculateJourneyAnalytics(customers: any[], periodDays: number): Promise<JourneyAnalytics> {
    const lifecycles = await Promise.all(
      customers.map(customer => this.calculateCustomerLifecycle(customer))
    )

    // Stage distribution
    const stageDistribution: Record<CustomerJourneyStage['stage'], number> = {
      discovery: 0,
      onboarding: 0,
      engagement: 0,
      loyalty: 0,
      advocacy: 0,
      churn_risk: 0,
      churned: 0
    }

    lifecycles.forEach(lifecycle => {
      stageDistribution[lifecycle.currentStage]++
    })

    // Calculate metrics
    const totalCustomers = lifecycles.length
    const loyalCustomers = lifecycles.filter(c => c.currentStage === 'loyalty' || c.currentStage === 'advocacy').length
    const churnedCustomers = lifecycles.filter(c => c.currentStage === 'churned').length
    const retentionRate = totalCustomers > 0 ? ((totalCustomers - churnedCustomers) / totalCustomers) * 100 : 0
    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0

    // Average time to loyalty
    const loyaltyCustomers = lifecycles.filter(c => c.currentStage === 'loyalty' || c.currentStage === 'advocacy')
    const averageTimeToLoyalty = loyaltyCustomers.length > 0 
      ? loyaltyCustomers.reduce((sum, c) => sum + c.daysSinceFirstVisit, 0) / loyaltyCustomers.length 
      : 0

    // Generate recommendations
    const recommendations = this.generateJourneyRecommendations(lifecycles, stageDistribution)

    // Mock engagement trends (would be calculated from historical data)
    const engagementTrends = this.calculateEngagementTrends(periodDays)

    // Identify drop-off points
    const dropOffPoints = this.identifyDropOffPoints(stageDistribution, totalCustomers)

    return {
      totalCustomers,
      stageDistribution,
      averageTimeToLoyalty,
      churnRate,
      retentionRate,
      engagementTrends,
      dropOffPoints,
      recommendations
    }
  }

  /**
   * Calculate individual customer lifecycle
   */
  private async calculateCustomerLifecycle(customerData: any): Promise<CustomerLifecycle> {
    const events = customerData.card_events || []
    const totalStamps = customerData.stamp_cards?.total_stamps || 10
    const currentStamps = customerData.current_stamps || 0

    // Calculate basic metrics
    const firstVisit = new Date(customerData.created_at)
    const now = new Date()
    const daysSinceFirstVisit = Math.floor((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24))

    const lastEvent = events.length > 0 ? events[events.length - 1] : null
    const lastVisit = lastEvent ? new Date(lastEvent.created_at) : firstVisit
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

    const totalVisits = events.filter(e => e.event_type === 'stamp_given').length || 1
    const totalRewardsRedeemed = events.filter(e => e.event_type === 'reward_redeemed').length

    // Mock financial data (would come from business_metrics)
    const totalSpent = totalVisits * 25 // Mock average spend
    const averageSpendPerVisit = totalSpent / Math.max(totalVisits, 1)

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore({
      daysSinceLastVisit,
      totalVisits,
      currentStamps,
      totalStamps,
      totalRewardsRedeemed,
      daysSinceFirstVisit
    })

    // Determine current stage and churn risk
    const currentStage = this.determineCustomerStage({
      daysSinceFirstVisit,
      daysSinceLastVisit,
      totalVisits,
      engagementScore,
      totalRewardsRedeemed
    })

    const churnRisk = this.assessChurnRisk(daysSinceLastVisit, engagementScore, totalVisits)
    const loyaltySegment = this.determineLoyaltySegment(totalVisits, engagementScore, daysSinceFirstVisit)

    // Build journey timeline
    const journey = this.buildJourneyTimeline(events, customerData.created_at)

    return {
      customerId: customerData.id,
      currentStage,
      totalVisits,
      daysSinceFirstVisit,
      daysSinceLastVisit,
      totalStampsEarned: currentStamps,
      totalRewardsRedeemed,
      totalSpent,
      averageSpendPerVisit,
      engagementScore,
      churnRisk,
      loyaltySegment,
      journey
    }
  }

  private calculateEngagementScore(params: {
    daysSinceLastVisit: number
    totalVisits: number
    currentStamps: number
    totalStamps: number
    totalRewardsRedeemed: number
    daysSinceFirstVisit: number
  }): number {
    const { daysSinceLastVisit, totalVisits, currentStamps, totalStamps, totalRewardsRedeemed, daysSinceFirstVisit } = params

    let score = 0

    // Recency (40% weight)
    if (daysSinceLastVisit <= 3) score += 40
    else if (daysSinceLastVisit <= 7) score += 30
    else if (daysSinceLastVisit <= 14) score += 20
    else if (daysSinceLastVisit <= 30) score += 10

    // Frequency (30% weight)
    const visitFrequency = totalVisits / Math.max(daysSinceFirstVisit / 30, 1) // visits per month
    if (visitFrequency >= 8) score += 30
    else if (visitFrequency >= 4) score += 20
    else if (visitFrequency >= 2) score += 15
    else if (visitFrequency >= 1) score += 10

    // Progress (20% weight)
    const progressPercent = (currentStamps / totalStamps) * 100
    if (progressPercent >= 80) score += 20
    else if (progressPercent >= 60) score += 15
    else if (progressPercent >= 40) score += 10
    else if (progressPercent >= 20) score += 5

    // Rewards (10% weight)
    if (totalRewardsRedeemed >= 3) score += 10
    else if (totalRewardsRedeemed >= 2) score += 8
    else if (totalRewardsRedeemed >= 1) score += 5

    return Math.min(100, score)
  }

  private determineCustomerStage(params: {
    daysSinceFirstVisit: number
    daysSinceLastVisit: number
    totalVisits: number
    engagementScore: number
    totalRewardsRedeemed: number
  }): CustomerJourneyStage['stage'] {
    const { daysSinceFirstVisit, daysSinceLastVisit, totalVisits, engagementScore, totalRewardsRedeemed } = params

    if (daysSinceLastVisit > 45) return 'churned'
    if (daysSinceLastVisit > 21 && engagementScore < 30) return 'churn_risk'
    if (totalRewardsRedeemed >= 2 && engagementScore > 70) return 'advocacy'
    if (totalRewardsRedeemed >= 1 || (totalVisits >= 5 && engagementScore > 60)) return 'loyalty'
    if (totalVisits >= 3 && daysSinceFirstVisit > 14) return 'engagement'
    if (totalVisits >= 2 || daysSinceFirstVisit > 7) return 'onboarding'
    
    return 'discovery'
  }

  private assessChurnRisk(daysSinceLastVisit: number, engagementScore: number, totalVisits: number): 'low' | 'medium' | 'high' {
    if (daysSinceLastVisit > 30 || engagementScore < 20) return 'high'
    if (daysSinceLastVisit > 14 || (engagementScore < 40 && totalVisits < 3)) return 'medium'
    return 'low'
  }

  private determineLoyaltySegment(totalVisits: number, engagementScore: number, daysSinceFirstVisit: number): CustomerLifecycle['loyaltySegment'] {
    if (totalVisits >= 8 && engagementScore > 70) return 'champion'
    if (totalVisits >= 4 && engagementScore > 50) return 'regular'
    if (engagementScore < 30 && daysSinceFirstVisit > 30) return 'at_risk'
    return 'new'
  }

  private buildJourneyTimeline(events: any[], createdAt: string): CustomerJourneyStage[] {
    const journey: CustomerJourneyStage[] = [
      { stage: 'discovery', timestamp: createdAt }
    ]

    // Add stages based on events
    let hasOnboarded = false
    let hasEngaged = false
    let hasLoyal = false

    events.forEach(event => {
      if (!hasOnboarded && event.event_type === 'stamp_given') {
        journey.push({ stage: 'onboarding', timestamp: event.created_at })
        hasOnboarded = true
      }
      
      if (!hasEngaged && hasOnboarded && event.event_type === 'stamp_given') {
        journey.push({ stage: 'engagement', timestamp: event.created_at })
        hasEngaged = true
      }
      
      if (!hasLoyal && event.event_type === 'reward_redeemed') {
        journey.push({ stage: 'loyalty', timestamp: event.created_at })
        hasLoyal = true
      }
    })

    return journey
  }

  private generateJourneyRecommendations(
    lifecycles: CustomerLifecycle[], 
    stageDistribution: Record<string, number>
  ): JourneyAnalytics['recommendations'] {
    const recommendations: JourneyAnalytics['recommendations'] = []

    // High churn risk customers
    const highChurnRisk = lifecycles.filter(c => c.churnRisk === 'high').length
    if (highChurnRisk > lifecycles.length * 0.15) {
      recommendations.push({
        priority: 'high',
        action: 'Launch a win-back campaign for inactive customers',
        expectedImpact: 'Reduce churn rate by 25-40%',
        targetSegment: 'Customers inactive for 14+ days'
      })
    }

    // Low engagement in onboarding
    const onboardingCustomers = stageDistribution.onboarding
    if (onboardingCustomers > lifecycles.length * 0.3) {
      recommendations.push({
        priority: 'high',
        action: 'Improve onboarding flow with guided first visit experience',
        expectedImpact: 'Increase engagement rate by 30%',
        targetSegment: 'New customers in first 2 weeks'
      })
    }

    // Few loyalty customers
    const loyaltyCustomers = stageDistribution.loyalty + stageDistribution.advocacy
    if (loyaltyCustomers < lifecycles.length * 0.25) {
      recommendations.push({
        priority: 'medium',
        action: 'Introduce bonus stamps for frequent visitors',
        expectedImpact: 'Increase loyalty conversion by 20%',
        targetSegment: 'Customers with 3+ visits'
      })
    }

    return recommendations
  }

  private calculateEngagementTrends(periodDays: number) {
    // Mock implementation - would calculate from historical data
    const trends = []
    const now = new Date()
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
      trends.unshift({
        period: weekStart.toISOString().split('T')[0],
        newCustomers: Math.floor(Math.random() * 20) + 10,
        returningCustomers: Math.floor(Math.random() * 50) + 30,
        churnedCustomers: Math.floor(Math.random() * 5) + 2
      })
    }
    
    return trends
  }

  private identifyDropOffPoints(stageDistribution: Record<string, number>, totalCustomers: number) {
    const dropOffPoints = []
    
    const onboardingRate = (stageDistribution.onboarding / totalCustomers) * 100
    if (onboardingRate > 40) {
      dropOffPoints.push({
        stage: 'Onboarding',
        dropOffRate: onboardingRate,
        commonReasons: ['Complex loyalty program', 'Unclear value proposition', 'Long wait times']
      })
    }

    const churnRiskRate = (stageDistribution.churn_risk / totalCustomers) * 100
    if (churnRiskRate > 20) {
      dropOffPoints.push({
        stage: 'Engagement',
        dropOffRate: churnRiskRate,
        commonReasons: ['Infrequent visits', 'Better competitor offers', 'Reward expiration']
      })
    }

    return dropOffPoints
  }
}

// Singleton instance
export const customerJourneyAnalytics = new CustomerJourneyAnalytics()