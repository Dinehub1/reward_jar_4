import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import envelope from '@/lib/api/envelope'

export async function GET(request: NextRequest) {
  const started = Date.now()
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(envelope(undefined, 'Authentication required'), { status: 401 })
    }

    const admin = createAdminClient()
    const { data: userRow, error: roleErr } = await admin
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()
    if (roleErr || userRow?.role_id !== 1) {
      return NextResponse.json(envelope(undefined, 'Admin access required'), { status: 403 })
    }

    const url = new URL(request.url)
    const section = url.searchParams.get('section') || 'summary'
    const includeDetails = url.searchParams.get('details') === 'true'

    // Parallel queries reused from legacy unified endpoint
    const [businesses, customers, customerCards, stampCards, membershipCards, flaggedBusinesses, recentActivity, walletQueue] = await Promise.all([
      admin.from('businesses').select('id,name,description,contact_email,owner_id,status,is_flagged,admin_notes,card_requested,created_at,updated_at,stamp_cards(id,status),membership_cards(id,status)').order('created_at', { ascending: false }),
      admin.from('customers').select('id,name,email,created_at,updated_at,customer_cards(id,created_at)').order('created_at', { ascending: false }),
      admin.from('customer_cards').select('id,customer_id,stamp_card_id,membership_card_id,current_stamps,sessions_used,wallet_type,wallet_pass_id,created_at,updated_at,customers(name,email),stamp_cards(name,business_id,businesses(name)),membership_cards(name,business_id,businesses(name))').order('updated_at', { ascending: false }),
      admin.from('stamp_cards').select('id,business_id,card_name,stamps_required,status,created_at,businesses(name),customer_cards(id)').order('created_at', { ascending: false }),
      admin.from('membership_cards').select('id,business_id,name,total_sessions,cost,status,created_at,businesses(name),customer_cards(id)').order('created_at', { ascending: false }),
      admin.from('businesses').select('id,name,admin_notes,created_at').eq('is_flagged', true),
      admin.from('customer_cards').select('id,created_at,updated_at,current_stamps,sessions_used,customers(name),stamp_cards(card_name,businesses(name)),membership_cards(name,businesses(name))').gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).order('updated_at', { ascending: false }).limit(50),
      admin.from('wallet_update_queue').select('id,processed,failed,created_at').eq('processed', false).eq('failed', false)
    ])

    const err = [businesses.error, customers.error, customerCards.error, stampCards.error, membershipCards.error, flaggedBusinesses.error, recentActivity.error, walletQueue.error].filter(Boolean)
    if (err.length) {
      return NextResponse.json(envelope(undefined, 'Database query failed'), { status: 500 })
    }

    const data = {
      stats: {
        totalBusinesses: (businesses.data || []).length,
        totalCustomers: (customers.data || []).length,
        totalCards: (customerCards.data || []).length,
        totalStampCards: (stampCards.data || []).length,
        totalMembershipCards: (membershipCards.data || []).length,
        activeCards: (customerCards.data || []).filter((c: any) => c.stamp_card_id || c.membership_card_id).length,
        flaggedBusinesses: (flaggedBusinesses.data || []).length,
        recentActivity: (recentActivity.data || []).length,
        newThisWeek: (customers.data || []).filter((c: any) => c.created_at >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).length
      },
      businesses: businesses.data || [],
      customers: customers.data || [],
      cards: {
        stampCards: stampCards.data || [],
        membershipCards: membershipCards.data || [],
        customerCards: customerCards.data || []
      },
      recentActivity: recentActivity.data || [],
      systemHealth: { database: 'healthy', walletQueue: (walletQueue.data || []).length, lastSync: new Date().toISOString() }
    }

    if (section && section !== 'summary') {
      if (section === 'businesses') return NextResponse.json(envelope(data.businesses))
      if (section === 'customers') return NextResponse.json(envelope(data.customers))
      if (section === 'cards') return NextResponse.json(envelope(data.cards))
      return NextResponse.json(envelope(undefined, 'Invalid section parameter'), { status: 400 })
    }

    const res = NextResponse.json(envelope({ ...data, queryTime: Date.now() - started }))
    res.headers.set('X-Data-Source', 'admin-dashboard')
    return res
  } catch (e) {
    return NextResponse.json(envelope(undefined, 'Internal server error'), { status: 500 })
  }
}

