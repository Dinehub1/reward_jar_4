-- RewardJar 4.0 - Database Verification and Initial Seed Data
-- This script verifies the database state and adds essential test data

-- 1. VERIFY DATABASE SCHEMA
SELECT 'Checking table existence...' as status;

SELECT table_name, 
       CASE WHEN table_name IN (
         'users', 'businesses', 'customers', 'customer_cards', 
         'membership_cards', 'session_usage', 'wallet_update_queue'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'businesses', 'customers', 'customer_cards', 
  'membership_cards', 'session_usage', 'wallet_update_queue'
)
ORDER BY table_name;

-- 2. CHECK RLS POLICIES
SELECT 'Checking RLS policies...' as status;

SELECT schemaname, tablename, 
       CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'businesses', 'customers', 'customer_cards', 
  'membership_cards', 'session_usage', 'wallet_update_queue'
)
ORDER BY tablename;

-- 3. CHECK EXISTING DATA
SELECT 'Checking existing data...' as status;

SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'businesses' as table_name, COUNT(*) as record_count FROM businesses
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'membership_cards' as table_name, COUNT(*) as record_count FROM membership_cards
UNION ALL
SELECT 'customer_cards' as table_name, COUNT(*) as record_count FROM customer_cards;

-- 4. ADD INITIAL TEST DATA (Safe with ON CONFLICT DO NOTHING)
SELECT 'Adding initial test data...' as status;

-- Test business user (required for auth.users table first)
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test-business@example.com',
  '$2a$10$example_hash',
  NOW(),
  NOW(),
  NOW(),
  '{}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Test customer user  
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'testcust@rewardjar.test',
  '$2a$10$example_hash',
  NOW(),
  NOW(),
  NOW(),
  '{}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Now add to our users table
INSERT INTO users (id, email, role_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'test-business@example.com', 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'testcust@rewardjar.test', 3)
ON CONFLICT (id) DO NOTHING;

-- Add test business
INSERT INTO businesses (id, name, contact_email, owner_id, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Test Gym & Fitness', 'test-business@example.com', '550e8400-e29b-41d4-a716-446655440000', 'Premium fitness center for testing')
ON CONFLICT (id) DO NOTHING;

-- Add test customer
INSERT INTO customers (id, user_id, name, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Test Customer', 'testcust@rewardjar.test')
ON CONFLICT (id) DO NOTHING;

-- Add test membership card template
INSERT INTO membership_cards (id, business_id, name, total_sessions, cost, duration_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Premium Gym Membership', 20, 15000.00, 365)
ON CONFLICT (id) DO NOTHING;

-- Add test stamp card for loyalty testing
INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Coffee Loyalty Card', 10, 'Free premium coffee')
ON CONFLICT (id) DO NOTHING;

-- 5. VERIFY INSERTION
SELECT 'Verifying test data insertion...' as status;

SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'businesses' as table_name, COUNT(*) as record_count FROM businesses
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'membership_cards' as table_name, COUNT(*) as record_count FROM membership_cards
UNION ALL
SELECT 'stamp_cards' as table_name, COUNT(*) as record_count FROM stamp_cards;

-- 6. CHECK FUNCTIONS AND TRIGGERS
SELECT 'Checking functions and triggers...' as status;

SELECT proname as function_name, 
       CASE WHEN proname IN ('update_membership_wallet_passes', 'mark_session_usage') 
       THEN '✅ EXISTS' ELSE '❌ CHECK' END as status
FROM pg_proc 
WHERE proname IN ('update_membership_wallet_passes', 'mark_session_usage');

SELECT tgname as trigger_name,
       CASE WHEN tgname = 'trigger_membership_wallet_updates' 
       THEN '✅ EXISTS' ELSE '❌ CHECK' END as status
FROM pg_trigger 
WHERE tgname = 'trigger_membership_wallet_updates';

SELECT 'Database verification and seeding complete!' as final_status; 