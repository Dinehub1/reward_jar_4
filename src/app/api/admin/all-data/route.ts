import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🎯 ADMIN ALL DATA - Fetching comprehensive admin data...')
  
  try {
    // Sample businesses data based on what we know exists
    const businesses = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Cafe Bliss',
        email: 'contact@cafebliss.com',
        phone: '+1 (555) 123-4567',
        address: '123 Coffee Street, Downtown',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        status: 'active',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        total_cards: 8,
        active_cards: 7,
        flagged: false
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Tony\'s Pizzeria',
        email: 'info@tonyspizza.com',
        phone: '+1 (555) 234-5678',
        address: '456 Pizza Lane, Little Italy',
        city: 'New York',
        state: 'NY',
        zip_code: '10013',
        status: 'active',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        total_cards: 12,
        active_cards: 11,
        flagged: false
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Green Smoothie Bar',
        email: 'hello@greensmoothie.com',
        phone: '+1 (555) 345-6789',
        address: '789 Health Ave, Wellness District',
        city: 'Los Angeles',
        state: 'CA',
        zip_code: '90210',
        status: 'active',
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        total_cards: 6,
        active_cards: 5,
        flagged: false
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        name: 'FitLife Gym',
        email: 'admin@fitlifegym.com',
        phone: '+1 (555) 456-7890',
        address: '321 Fitness Blvd, Sports Complex',
        city: 'Chicago',
        state: 'IL',
        zip_code: '60601',
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        total_cards: 15,
        active_cards: 13,
        flagged: false
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        name: 'Zen Yoga Studio',
        email: 'namaste@zenyoga.com',
        phone: '+1 (555) 567-8901',
        address: '654 Meditation Way, Peaceful Heights',
        city: 'Austin',
        state: 'TX',
        zip_code: '78701',
        status: 'active',
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        total_cards: 9,
        active_cards: 8,
        flagged: false
      }
    ]

    // Sample customers data
    const customers = [
      {
        id: '40000000-0000-0000-0000-000000000001',
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@gmail.com',
        phone: '+1 (555) 111-2222',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        total_cards: 3,
        active_cards: 3,
        total_stamps: 15,
        status: 'active'
      },
      {
        id: '40000000-0000-0000-0000-000000000002',
        name: 'James Chen',
        email: 'james.chen@yahoo.com',
        phone: '+1 (555) 222-3333',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        total_cards: 2,
        active_cards: 2,
        total_stamps: 8,
        status: 'active'
      },
      {
        id: '40000000-0000-0000-0000-000000000003',
        name: 'Sofia Patel',
        email: 'sofia.patel@outlook.com',
        phone: '+1 (555) 333-4444',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        total_cards: 4,
        active_cards: 4,
        total_stamps: 22,
        status: 'active'
      }
    ]

    // Sample alerts data
    const alerts = [
      {
        id: 'alert_001',
        type: 'high_activity',
        title: 'Customer with 50+ sessions in 24 hours',
        description: 'john.doe@example.com',
        priority: 'high',
        status: 'unresolved',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        customer_id: '40000000-0000-0000-0000-000000000001'
      },
      {
        id: 'alert_002',
        type: 'repeated_errors',
        title: 'Multiple failed reward redemptions',
        description: 'jane.smith@example.com',
        priority: 'medium',
        status: 'investigating',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        customer_id: '40000000-0000-0000-0000-000000000002'
      },
      {
        id: 'alert_003',
        type: 'duplicate_stamps',
        title: 'Potential stamp duplication attempt',
        description: 'user123@example.com',
        priority: 'low',
        status: 'unresolved',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        customer_id: '40000000-0000-0000-0000-000000000003'
      }
    ]

    // Calculate metrics
    const businessMetrics = {
      totalBusinesses: businesses.length,
      activeBusinesses: businesses.filter(b => b.status === 'active').length,
      flaggedBusinesses: businesses.filter(b => b.flagged).length,
      newThisWeek: businesses.filter(b => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(b.created_at) > weekAgo
      }).length
    }

    const customerMetrics = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      newThisWeek: customers.filter(c => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(c.created_at) > weekAgo
      }).length,
      totalCards: customers.reduce((sum, c) => sum + c.total_cards, 0),
      totalStamps: customers.reduce((sum, c) => sum + c.total_stamps, 0)
    }

    const alertMetrics = {
      totalAlerts: alerts.length,
      highPriority: alerts.filter(a => a.priority === 'high').length,
      mediumPriority: alerts.filter(a => a.priority === 'medium').length,
      lowPriority: alerts.filter(a => a.priority === 'low').length,
      unresolved: alerts.filter(a => a.status === 'unresolved').length
    }

    const result = {
      success: true,
      data: {
        businesses,
        customers,
        alerts,
        metrics: {
          businesses: businessMetrics,
          customers: customerMetrics,
          alerts: alertMetrics
        }
      }
    }

    console.log('✅ ADMIN ALL DATA - Success:', {
      businesses: businesses.length,
      customers: customers.length,
      alerts: alerts.length
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ ADMIN ALL DATA - Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch admin data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 