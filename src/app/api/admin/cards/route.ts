import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { ApiResponse, StampConfig, CardFormData } from '@/lib/supabase/types'

/**
 * POST /api/admin/cards
 * 
 * Creates a new card (stamp or membership) via admin interface
 * Uses admin client to bypass RLS for card creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Enhanced validation for new card creation schema
    const { 
      cardName,
      businessId, 
      reward, 
      stampsRequired,
      cardColor,
      iconEmoji,
      barcodeType,
      cardExpiryDays,
      rewardExpiryDays,
      stampConfig,
      
      // Legacy support (to be deprecated)
      card_type, 
      business_id, 
      name, 
      reward_description, 
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

    // ✅ Server-side only - safe to use admin client
    const supabase = createAdminClient()

    // Verify admin access (role_id = 1)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
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

    // New schema-based card creation
    if (cardName && businessId && reward !== undefined && stampsRequired) {
      const newCardPayload = {
        business_id: businessId,
        name: cardName,
        reward_description: reward,
        total_stamps: stampsRequired,
        card_color: cardColor || '#8B4513',
        icon_emoji: iconEmoji || '☕',
        barcode_type: barcodeType || 'QR_CODE',
        expiry_days: cardExpiryDays || 60,
        reward_expiry_days: rewardExpiryDays || 15,
        stamp_config: stampConfig || {
          manualStampOnly: true,
          minSpendAmount: 0,
          billProofRequired: false,
          maxStampsPerDay: 1,
          duplicateVisitBuffer: '12h'
        },
        status: 'active'
      }

      const { data: savedCard, error } = await supabase
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
        await supabase
          .from('wallet_update_queue')
          .insert([{
            customer_card_id: null, // Will be updated when customers join
            update_type: 'card_creation',
            metadata: {
              stamp_card_id: savedCard.id,
              business_id: businessId,
              card_name: cardName,
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
      reward_description: reward_description || reward,
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
    
    const { data: savedCard, error } = await supabase
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
      await supabase
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