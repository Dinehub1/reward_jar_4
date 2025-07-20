-- RewardJar 4.0 - Essential Test Data for Gym Membership Functionality
-- Run this script in Supabase SQL Editor to enable membership testing

-- 1. Add test users to custom users table (bypassing auth.users for simplicity)
INSERT INTO users (id, email, role_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'test-business@example.com', 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'testcust@rewardjar.test', 3)
ON CONFLICT (id) DO NOTHING;

-- 2. Add test business
INSERT INTO businesses (id, name, contact_email, owner_id, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Test Gym & Fitness', 'test-business@example.com', '550e8400-e29b-41d4-a716-446655440000', 'Premium fitness center for testing')
ON CONFLICT (id) DO NOTHING;

-- 3. Add test customer
INSERT INTO customers (id, user_id, name, email) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Test Customer', 'testcust@rewardjar.test')
ON CONFLICT (id) DO NOTHING;

-- 4. Add test membership card template
INSERT INTO membership_cards (id, business_id, name, total_sessions, cost, duration_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Premium Gym Membership', 20, 15000.00, 365)
ON CONFLICT (id) DO NOTHING;

-- 5. Add test stamp card for loyalty testing
INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Coffee Loyalty Card', 10, 'Free premium coffee')
ON CONFLICT (id) DO NOTHING;

-- 6. Verify data was inserted
SELECT 'Test data verification:' as status;
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'businesses' as table_name, COUNT(*) as record_count FROM businesses
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'membership_cards' as table_name, COUNT(*) as record_count FROM membership_cards
UNION ALL
SELECT 'stamp_cards' as table_name, COUNT(*) as record_count FROM stamp_cards; 