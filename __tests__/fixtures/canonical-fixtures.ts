/**
 * Canonical fixtures for unit tests
 * These provide deterministic, stable data for fast unit tests
 */

export const CANONICAL_BUSINESS_FIXTURE = {
  id: '44444444-4444-4444-4444-444444444444',
  name: 'Test Business Fixture',
  description: 'Canonical test business for unit tests',
  industry: 'test',
  phone: '+1234567890',
  email: 'test@fixture.example.com',
  status: 'active' as const,
  location: 'Test City',
  logo_url: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

export const CANONICAL_STAMP_CARD_FIXTURE = {
  id: '55555555-5555-5555-5555-555555555555',
  business_id: CANONICAL_BUSINESS_FIXTURE.id,
  name: 'Test Stamp Card Fixture',
  card_color: '#10b981',
  icon_emoji: '⭐',
  total_stamps: 10,
  reward_description: 'Free coffee after 10 stamps',
  card_description: 'Collect stamps for rewards',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

export const CANONICAL_MEMBERSHIP_CARD_FIXTURE = {
  id: '66666666-6666-6666-6666-666666666666',
  business_id: CANONICAL_BUSINESS_FIXTURE.id,
  name: 'Test Membership Fixture',
  card_color: '#3b82f6',
  icon_emoji: '💎',
  total_sessions: 20,
  cost: 15000, // 150.00 in cents
  card_description: 'Premium membership benefits',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

export const CANONICAL_CUSTOMER_FIXTURE = {
  id: '77777777-7777-7777-7777-777777777777',
  name: 'Test Customer',
  email: 'customer@fixture.example.com',
  phone: '+1987654321',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

export const CANONICAL_CUSTOMER_CARD_FIXTURE = {
  id: '88888888-8888-8888-8888-888888888888',
  customer_id: CANONICAL_CUSTOMER_FIXTURE.id,
  stamp_card_id: CANONICAL_STAMP_CARD_FIXTURE.id,
  membership_card_id: null,
  current_stamps: 5,
  sessions_used: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
}

/**
 * Setup canonical fixtures in database for unit tests
 */
export const setupCanonicalFixtures = async (supabase: any) => {
  // Insert in dependency order
  await supabase.from('businesses').upsert([CANONICAL_BUSINESS_FIXTURE])
  await supabase.from('stamp_cards').upsert([CANONICAL_STAMP_CARD_FIXTURE])
  await supabase.from('membership_cards').upsert([CANONICAL_MEMBERSHIP_CARD_FIXTURE])
  await supabase.from('customers').upsert([CANONICAL_CUSTOMER_FIXTURE])
  await supabase.from('customer_cards').upsert([CANONICAL_CUSTOMER_CARD_FIXTURE])
}

/**
 * Cleanup canonical fixtures from database
 */
export const cleanupCanonicalFixtures = async (supabase: any) => {
  // Delete in reverse dependency order
  await supabase.from('customer_cards').delete().eq('id', CANONICAL_CUSTOMER_CARD_FIXTURE.id)
  await supabase.from('customers').delete().eq('id', CANONICAL_CUSTOMER_FIXTURE.id)
  await supabase.from('stamp_cards').delete().eq('id', CANONICAL_STAMP_CARD_FIXTURE.id)
  await supabase.from('membership_cards').delete().eq('id', CANONICAL_MEMBERSHIP_CARD_FIXTURE.id)
  await supabase.from('businesses').delete().eq('id', CANONICAL_BUSINESS_FIXTURE.id)
}