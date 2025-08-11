import { createAdminClient } from '@/lib/supabase/admin-client'

export interface StampCardFactoryOptions {
  id?: string
  business_id: string
  name?: string
  card_color?: string
  icon_emoji?: string
  total_stamps?: number
  reward_description?: string
  card_description?: string
}

export interface MembershipCardFactoryOptions {
  id?: string
  business_id: string
  name?: string
  card_color?: string
  icon_emoji?: string
  total_sessions?: number
  cost?: number
  card_description?: string
}

export const buildStampCard = (options: StampCardFactoryOptions) => {
  const timestamp = Date.now()
  
  return {
    id: options.id || `stamp-card-${timestamp}`,
    business_id: options.business_id,
    name: options.name || `Test Stamp Card ${timestamp}`,
    card_color: options.card_color || '#10b981',
    icon_emoji: options.icon_emoji || '⭐',
    total_stamps: options.total_stamps || 10,
    reward_description: options.reward_description || 'Free coffee after 10 stamps',
    card_description: options.card_description || 'Collect stamps for rewards',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export const buildMembershipCard = (options: MembershipCardFactoryOptions) => {
  const timestamp = Date.now()
  
  return {
    id: options.id || `membership-card-${timestamp}`,
    business_id: options.business_id,
    name: options.name || `Test Membership ${timestamp}`,
    card_color: options.card_color || '#3b82f6',
    icon_emoji: options.icon_emoji || '💎',
    total_sessions: options.total_sessions || 20,
    cost: options.cost || 15000, // 150.00 in cents
    card_description: options.card_description || 'Premium membership benefits',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export const createStampCard = async (options: StampCardFactoryOptions) => {
  const supabase = createAdminClient()
  const cardData = buildStampCard(options)
  
  const { data, error } = await supabase
    .from('stamp_cards')
    .insert([cardData])
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create test stamp card: ${error.message}`)
  }
  
  return data
}

export const createMembershipCard = async (options: MembershipCardFactoryOptions) => {
  const supabase = createAdminClient()
  const cardData = buildMembershipCard(options)
  
  const { data, error } = await supabase
    .from('membership_cards')
    .insert([cardData])
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create test membership card: ${error.message}`)
  }
  
  return data
}