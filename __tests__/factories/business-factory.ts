import { createAdminClient } from '@/lib/supabase/admin-client'

export interface BusinessFactoryOptions {
  id?: string
  name?: string
  description?: string
  industry?: string
  phone?: string
  email?: string
  status?: 'active' | 'inactive'
  location?: string
  logo_url?: string
}

export const buildBusiness = (overrides: BusinessFactoryOptions = {}) => {
  const timestamp = Date.now()
  
  return {
    id: overrides.id || `business-${timestamp}`,
    name: overrides.name || `Test Business ${timestamp}`,
    description: overrides.description || 'A test business for integration tests',
    industry: overrides.industry || 'test',
    phone: overrides.phone || '+1234567890',
    email: overrides.email || `test${timestamp}@example.com`,
    status: overrides.status || 'active',
    location: overrides.location || 'Test City',
    logo_url: overrides.logo_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export const createBusiness = async (overrides: BusinessFactoryOptions = {}) => {
  const supabase = createAdminClient()
  const businessData = buildBusiness(overrides)
  
  const { data, error } = await supabase
    .from('businesses')
    .insert([businessData])
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create test business: ${error.message}`)
  }
  
  return data
}

export const cleanupBusiness = async (businessId: string) => {
  const supabase = createAdminClient()
  
  // Clean up related data first (cascade delete should handle this)
  await supabase.from('stamp_cards').delete().eq('business_id', businessId)
  await supabase.from('membership_cards').delete().eq('business_id', businessId)
  
  // Delete the business
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
  
  if (error) {
    console.warn(`Failed to cleanup test business ${businessId}: ${error.message}`)
  }
}