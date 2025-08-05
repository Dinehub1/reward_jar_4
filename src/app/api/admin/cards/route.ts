import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createServerClient } from '@/lib/supabase/server-only'
import type { ApiResponse, StampConfig, CardFormData } from '@/lib/supabase/types'
import { normalizeCardData, createDatabasePayload, validateCardData } from '@/lib/utils/field-mapping'

/**
 * POST /api/admin/cards
 * 
 * Creates a new card (stamp or membership) via admin interface
 * Uses admin client to bypass RLS for card creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Canonical card creation schema (matches form data)
    const { 
      card_name,
      business_id, 
      reward, 
      reward_description, // NEW: Detailed reward description
      stamps_required,
      card_color,
      icon_emoji,
      barcode_type,
      card_expiry_days,
      reward_expiry_days,
      stamp_config,
      card_description,
      how_to_earn_stamp,
      reward_details,
      earned_stamp_message,
      earned_reward_message,
      
      // Legacy support for older forms
      cardName,
      businessId,
      stampsRequired,
      cardColor,
      iconEmoji,
      barcodeType,
      cardExpiryDays,
      rewardExpiryDays,
      stampConfig,
      card_type,
      name, 
      reward_description: legacy_reward_description, // Rename to avoid conflict
      status,
      values,
      stamp_condition,
      min_bill_amount
    } = body

    console.log('🔍 Admin API: Creating card:', { 
      cardName: cardName || name, 
      businessId: businessId || business_id, 
      stampsRequired: stampsRequired || values?.total_stamps 
    })

    // Use server client to authenticate the user
    const supabase = await createServerClient()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Admin API: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role using admin client (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Admin API: Access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' } as ApiResponse<never>,
        { status: 403 }
      )
    }

    // Canonical card creation (matches database schema)
    const finalCardName = card_name || cardName || name
    const finalBusinessId = business_id || businessId
    const finalStampsRequired = stamps_required || stampsRequired || values?.total_stamps
    
    if (finalCardName && finalBusinessId && reward !== undefined && finalStampsRequired) {
      const newCardPayload = {
        business_id: finalBusinessId,
        // ✅ FIX: Populate BOTH old and new name fields to satisfy database constraints
        name: finalCardName, // Required by database constraint
        card_name: finalCardName, // New canonical field
        // ✅ FIX: Populate BOTH old and new stamp fields
        total_stamps: finalStampsRequired, // Legacy field required by database
        stamps_required: finalStampsRequired, // New canonical field
        // ✅ FIX: Populate BOTH old and new expiry fields  
        expiry_days: card_expiry_days || cardExpiryDays || 60, // Legacy field
        card_expiry_days: card_expiry_days || cardExpiryDays || 60, // New canonical field
        reward: reward,
        reward_description: reward_description || '', // Include reward description
        card_color: card_color || cardColor || '#8B4513',
        icon_emoji: icon_emoji || iconEmoji || '☕',
        barcode_type: barcode_type || barcodeType || 'QR_CODE',
        reward_expiry_days: reward_expiry_days || rewardExpiryDays || 15,
        stamp_config: stamp_config || stampConfig || {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '12h'
        },
        card_description: card_description || 'Collect stamps to get rewards',
        how_to_earn_stamp: how_to_earn_stamp || 'Buy anything to get a stamp',
        reward_details: reward_details || '',
        earned_stamp_message: earned_stamp_message || 'Just [#] more stamps to get your reward!',
        earned_reward_message: earned_reward_message || 'Reward is earned and waiting for you!',
        status: 'active'
      }

      const { data: savedCard, error } = await adminClient
        .from('stamp_cards')
        .insert([newCardPayload])
        .select()
        .single()

      if (error) {
        console.error('❌ Admin API: Error saving card:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to save card: ' + error.message } as ApiResponse<never>,
          { status: 500 }
        )
      }

      console.log('✅ Admin API: Card saved successfully:', savedCard)

      // Add to wallet update queue for provisioning
      try {
        await adminClient
          .from('wallet_update_queue')
          .insert([{
            customer_card_id: null, // Will be updated when customers join
            update_type: 'card_creation',
            metadata: {
              stamp_card_id: savedCard.id,
              business_id: finalBusinessId,
              card_name: finalCardName,
              created_by: 'admin'
            },
            processed: false,
            failed: false
          }])
          
        console.log('✅ Admin API: Added to wallet update queue')
      } catch (queueError) {
        console.warn('⚠️ Admin API: Failed to add to wallet queue (non-critical):', queueError)
      }

      return NextResponse.json({
        success: true,
        data: savedCard,
        message: 'Stamp card created successfully'
      } as ApiResponse<typeof savedCard>)
    }

    // Legacy support - prepare card payload based on type
    const cardPayload = {
      business_id: business_id || businessId,
      name: name || cardName,
      reward_description: legacy_reward_description || reward,
      status: status || 'active',
      ...(card_type === 'stamp' ? {
        total_stamps: values?.total_stamps || stampsRequired,
        stamp_condition: stamp_condition || 'per_visit',
        min_bill_amount: stamp_condition === 'min_bill_amount' ? min_bill_amount : null,
        card_color: cardColor || '#8B4513',
        icon_emoji: iconEmoji || '☕',
        expiry_days: cardExpiryDays || 60,
        reward_expiry_days: rewardExpiryDays || 15,
        stamp_config: stampConfig || {
          manualStampOnly: true,
          minSpendAmount: min_bill_amount || 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '12h'
        }
      } : {
        total_sessions: values?.total_sessions,
        cost: values?.cost,
        duration_days: values?.duration_days,
        membership_type: values?.tier?.toLowerCase() || 'bronze'
      })
    }

    const tableName = card_type === 'stamp' ? 'stamp_cards' : 'membership_cards'
    
    console.log(`💾 Admin API: Saving ${card_type} card to ${tableName}:`, cardPayload)
    
    const { data: savedCard, error } = await adminClient
      .from(tableName)
      .insert([cardPayload])
      .select()
      .single()

      if (error) {
      console.error('❌ Admin API: Error saving card:', error)
        return NextResponse.json(
        { success: false, error: 'Failed to save card' } as ApiResponse<never>,
          { status: 500 }
        )
      }

    console.log('✅ Admin API: Card saved successfully:', savedCard)

    // Add to wallet update queue for initial setup
    try {
      await adminClient
        .from('wallet_update_queue')
        .insert([{
          customer_card_id: savedCard.id, // This will be null initially, updated when customers join
          update_type: 'card_update',
          metadata: {
            card_type,
            business_id,
            card_name: name,
            created_by: 'admin'
          },
          processed: false,
          failed: false
        }])
        
      console.log('✅ Admin API: Added to wallet update queue')
    } catch (queueError) {
      console.warn('⚠️ Admin API: Failed to add to wallet queue (non-critical):', queueError)
      // Don't fail the card creation for queue issues
    }

      return NextResponse.json({
        success: true,
      data: savedCard,
      message: `${card_type} card created successfully`
    } as ApiResponse<typeof savedCard>)

  } catch (error) {
    console.error('❌ Admin API: Error in card creation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
} 