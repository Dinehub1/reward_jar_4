import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import { DesignConfig, StampConfig } from '@/lib/supabase/types'

/**
 * V2 Admin Cards API
 * 
 * Enhanced API with:
 * - Unified template support for stamp/membership cards
 * - Design configuration fields
 * - Backwards compatibility with V1 payloads
 * - Template-driven card creation
 */

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// V2 Card Creation Payload (Enhanced)
interface V2CardPayload {
  // Core fields
  card_name: string
  business_id: string
  card_type: 'stamp' | 'membership'
  
  // Template fields
  template_id?: string
  industry?: string
  
  // Stamp card fields
  reward?: string
  reward_description?: string
  stamps_required?: number
  stamp_config?: StampConfig
  
  // Membership card fields
  total_sessions?: number
  cost?: number
  duration_days?: number
  membership_type?: string
  membership_mode?: string
  discount_type?: string
  discount_value?: number
  
  // Design fields (NEW)
  design_config?: DesignConfig
  
  // Visual fields
  card_color?: string
  icon_emoji?: string
  barcode_type?: 'PDF417' | 'QR_CODE'
  card_expiry_days?: number
  reward_expiry_days?: number
  
  // Information fields
  card_description?: string
  how_to_earn_stamp?: string
  reward_details?: string
  earned_stamp_message?: string
  earned_reward_message?: string
  
  // Status
  status?: string
}

// V1 Compatibility Payload (Legacy)
interface V1CardPayload {
  cardName?: string
  businessId?: string
  reward?: string
  stampsRequired?: number
  cardColor?: string
  iconEmoji?: string
  barcodeType?: string
  cardExpiryDays?: number
  rewardExpiryDays?: number
  stampConfig?: StampConfig
  cardDescription?: string
  howToEarnStamp?: string
  rewardDetails?: string
  earnedStampMessage?: string
  earnedRewardMessage?: string
  card_type?: string
  name?: string
  // ... other legacy fields
}

/**
 * Transform V1 payload to V2 format with automatic enhancement
 */
function transformV1ToV2(payload: V1CardPayload): V2CardPayload {
  // Default design config for legacy cards
  const defaultDesignConfig: DesignConfig = {
    iconStyle: 'emoji',
    gridLayout: { columns: 5, rows: 2 },
    brandLevel: 'minimal',
    countdownSettings: {
      showExpiry: true,
      urgencyThreshold: 7
    }
  }

  return {
    card_name: payload.cardName || payload.name || '',
    business_id: payload.businessId || '',
    card_type: (payload.card_type as 'stamp' | 'membership') || 'stamp',
    reward: payload.reward || '',
    stamps_required: payload.stampsRequired || 10,
    card_color: payload.cardColor || '#8B4513',
    icon_emoji: payload.iconEmoji || '⭐',
    barcode_type: (payload.barcodeType as 'PDF417' | 'QR_CODE') || 'QR_CODE',
    card_expiry_days: payload.cardExpiryDays || 60,
    reward_expiry_days: payload.rewardExpiryDays || 15,
    stamp_config: payload.stampConfig || {
      manualStampOnly: true,
      minSpendAmount: 0,
      billProofRequired: false,
      maxStampsPerDay: 1,
      duplicateVisitBuffer: '12h'
    },
    design_config: defaultDesignConfig, // Enhanced with design config
    card_description: payload.cardDescription || '',
    how_to_earn_stamp: payload.howToEarnStamp || '',
    reward_details: payload.rewardDetails || '',
    earned_stamp_message: payload.earnedStampMessage || '',
    earned_reward_message: payload.earnedRewardMessage || '',
    status: 'active'
  }
}

/**
 * Apply template data to payload (if template_id provided)
 */
function applyTemplateData(payload: V2CardPayload, templates: any[]): V2CardPayload {
  if (!payload.template_id) return payload

  const template = templates.find(t => t.id === payload.template_id)
  if (!template) return payload

  const variant = template.variants?.[payload.card_type]
  if (!variant) return payload

  // Apply template defaults, but preserve explicitly set values
  return {
    ...payload,
    card_color: payload.card_color || variant.cardColor,
    icon_emoji: payload.icon_emoji || variant.iconEmoji,
    stamps_required: payload.stamps_required || variant.stampsRequired,
    total_sessions: payload.total_sessions || variant.totalSessions,
    cost: payload.cost || variant.cost,
    duration_days: payload.duration_days || variant.durationDays,
    membership_type: payload.membership_type || variant.membershipType,
    membership_mode: payload.membership_mode || variant.membershipMode,
    reward: payload.reward || variant.reward,
    reward_description: payload.reward_description || variant.rewardDescription,
    card_description: payload.card_description || variant.cardDescription,
    how_to_earn_stamp: payload.how_to_earn_stamp || variant.howToEarnStamp,
    reward_details: payload.reward_details || variant.rewardDetails,
    stamp_config: payload.stamp_config || variant.stampConfig,
    design_config: payload.design_config || variant.designConfig,
    // Apply other template fields as needed
  }
}

/**
 * GET /api/v2/admin/cards
 * Enhanced card listing with design config support
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Verify admin access
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const cardType = url.searchParams.get('card_type') // 'stamp' | 'membership' | null
    const businessId = url.searchParams.get('business_id')
    
    // Fetch cards with enhanced fields
    let query = adminClient
      .from(cardType === 'membership' ? 'membership_cards' : 'stamp_cards')
      .select(`
        id,
        business_id,
        ${cardType === 'membership' ? 'name' : 'card_name'},
        ${cardType === 'membership' ? 'membership_type, total_sessions, cost, duration_days' : 'reward, stamps_required'},
        ${cardType === 'membership' ? '' : 'card_color, icon_emoji, stamp_config,'}
        design_config,
        status,
        created_at,
        businesses(id, name)
      `)

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data: cards, error } = await query

    if (error) {
      console.error('Error fetching cards:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch cards' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cards,
      message: 'Cards retrieved successfully'
    } as ApiResponse<typeof cards>)

  } catch (error) {
    console.error('V2 Cards API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * POST /api/v2/admin/cards
 * Enhanced card creation with template support and V1 compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Authenticate user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Verify admin access
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Detect payload format and transform if needed
    let payload: V2CardPayload
    
    if (body.card_name || body.card_type) {
      // V2 format
      payload = body as V2CardPayload
    } else {
      // V1 format - transform to V2
      payload = transformV1ToV2(body as V1CardPayload)
    }

    // Apply template if specified (simplified for Phase 1)
    // TODO: Load actual templates from database in Phase 2
    const templates: any[] = [] // Placeholder for template loading
    payload = applyTemplateData(payload, templates)

    // Validate required fields
    if (!payload.card_name || !payload.business_id) {
      return NextResponse.json(
        { success: false, error: 'Card name and business ID are required' } as ApiResponse<never>,
        { status: 400 }
      )
    }

    // Create card based on type
    let savedCard: any
    
    if (payload.card_type === 'membership') {
      // Create membership card
      const membershipPayload = {
        business_id: payload.business_id,
        name: payload.card_name,
        membership_type: payload.membership_type || 'basic',
        membership_mode: payload.membership_mode || 'sessions',
        total_sessions: payload.total_sessions || 10,
        cost: payload.cost || 1000,
        duration_days: payload.duration_days || 30,
        discount_type: payload.discount_type || null,
        discount_value: payload.discount_value || null,
        design_config: payload.design_config || {
          iconStyle: 'emoji',
          brandLevel: 'minimal',
          countdownSettings: { showExpiry: true }
        },
        status: payload.status || 'active'
      }

      const { data, error } = await adminClient
        .from('membership_cards')
        .insert([membershipPayload])
        .select()
        .single()

      if (error) throw error
      savedCard = data
      
    } else {
      // Create stamp card
      const stampPayload = {
        business_id: payload.business_id,
        card_name: payload.card_name,
        reward: payload.reward || '',
        reward_description: payload.reward_description || '',
        stamps_required: payload.stamps_required || 10,
        card_color: payload.card_color || '#8B4513',
        icon_emoji: payload.icon_emoji || '⭐',
        barcode_type: payload.barcode_type || 'QR_CODE',
        card_expiry_days: payload.card_expiry_days || 60,
        reward_expiry_days: payload.reward_expiry_days || 15,
        stamp_config: payload.stamp_config || {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '12h'
        },
        design_config: payload.design_config || {
          iconStyle: 'emoji',
          gridLayout: { columns: 5, rows: 2 },
          brandLevel: 'minimal',
          countdownSettings: { showExpiry: true, urgencyThreshold: 7 }
        },
        card_description: payload.card_description || '',
        how_to_earn_stamp: payload.how_to_earn_stamp || '',
        reward_details: payload.reward_details || '',
        earned_stamp_message: payload.earned_stamp_message || '',
        earned_reward_message: payload.earned_reward_message || '',
        status: payload.status || 'active'
      }

      const { data, error } = await adminClient
        .from('stamp_cards')
        .insert([stampPayload])
        .select()
        .single()

      if (error) throw error
      savedCard = data
    }

    return NextResponse.json({
      success: true,
      data: savedCard,
      message: `${payload.card_type} card created successfully`
    } as ApiResponse<typeof savedCard>)

  } catch (error) {
    console.error('V2 Card Creation Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create card' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}