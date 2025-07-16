-- Create test customer card for wallet testing
-- Run this in your Supabase SQL editor or via psql
-- NOTE: Run add-updated-at-columns.sql first to add updated_at columns

-- Generate proper UUIDs for test data
-- Using uuid_generate_v4() or fixed UUIDs in proper format

-- Step 1: Create users table if it doesn't exist (required for foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id INTEGER NOT NULL CHECK (role_id IN (2, 3)), -- 2=business, 3=customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create test users in auth.users (simulated - these would normally be created via signup)
-- For testing, we'll insert directly into our users table with proper UUIDs
INSERT INTO users (id, email, role_id, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',  -- Business owner user ID
  'business@test.com',
  2, -- Business role
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

INSERT INTO users (id, email, role_id, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440005',  -- Customer user ID
  'customer@test.com',
  3, -- Customer role
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 3: Insert test business (if not exists)
INSERT INTO businesses (id, owner_id, name, description, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',  -- Proper UUID format
  '550e8400-e29b-41d4-a716-446655440002',  -- References business user above
  'Bella Buono Coffee',
  'Premium coffee shop with artisanal blends and cozy atmosphere',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Step 4: Insert test stamp card (if not exists)
INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',  -- Proper UUID format
  '550e8400-e29b-41d4-a716-446655440001',  -- References business above
  'Coffee Lover Rewards',
  10,
  'Free premium coffee of your choice',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  total_stamps = EXCLUDED.total_stamps,
  reward_description = EXCLUDED.reward_description,
  updated_at = NOW();

-- Step 5: Insert test customer (if not exists)
INSERT INTO customers (id, user_id, name, email, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004',  -- Proper UUID format
  '550e8400-e29b-41d4-a716-446655440005',  -- References customer user above
  'John Doe',
  'john.doe@example.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 6: Insert test customer card (if not exists)
INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps, wallet_pass_id, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440006',  -- Proper UUID format (this is the main test ID)
  '550e8400-e29b-41d4-a716-446655440004',  -- References customer above
  '550e8400-e29b-41d4-a716-446655440003',  -- References stamp card above
  6,
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  current_stamps = EXCLUDED.current_stamps,
  updated_at = NOW();

-- Step 7: Verify the test data
SELECT 
  cc.id as customer_card_id,
  cc.current_stamps,
  cc.updated_at as card_updated_at,
  sc.name as stamp_card_name,
  sc.total_stamps,
  sc.reward_description,
  sc.updated_at as stamp_card_updated_at,
  b.name as business_name,
  b.updated_at as business_updated_at,
  c.name as customer_name,
  c.email as customer_email,
  c.updated_at as customer_updated_at,
  u_business.email as business_owner_email,
  u_customer.email as customer_user_email
FROM customer_cards cc
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
JOIN customers c ON cc.customer_id = c.id
JOIN users u_business ON b.owner_id = u_business.id
JOIN users u_customer ON c.user_id = u_customer.id
WHERE cc.id = '550e8400-e29b-41d4-a716-446655440006';

-- Step 8: Test the wallet update trigger by adding a stamp
-- This should update the updated_at timestamp and create a wallet update queue entry
UPDATE customer_cards 
SET current_stamps = current_stamps + 1 
WHERE id = '550e8400-e29b-41d4-a716-446655440006';

-- Step 9: Verify the wallet update queue was triggered
SELECT 
  wuq.id,
  wuq.customer_card_id,
  wuq.update_type,
  wuq.processed,
  wuq.created_at,
  cc.current_stamps,
  cc.updated_at as card_updated_at
FROM wallet_update_queue wuq
JOIN customer_cards cc ON wuq.customer_card_id = cc.id
WHERE wuq.customer_card_id = '550e8400-e29b-41d4-a716-446655440006'
ORDER BY wuq.created_at DESC;

-- Step 10: Verify all tables exist and have data
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 
  'businesses' as table_name, 
  COUNT(*) as record_count 
FROM businesses
UNION ALL
SELECT 
  'stamp_cards' as table_name, 
  COUNT(*) as record_count 
FROM stamp_cards
UNION ALL
SELECT 
  'customers' as table_name, 
  COUNT(*) as record_count 
FROM customers
UNION ALL
SELECT 
  'customer_cards' as table_name, 
  COUNT(*) as record_count 
FROM customer_cards;

-- Test URLs to try (use the proper UUID):
-- /api/wallet/apple/550e8400-e29b-41d4-a716-446655440006
-- /api/wallet/google/550e8400-e29b-41d4-a716-446655440006
-- /api/wallet/pwa/550e8400-e29b-41d4-a716-446655440006
-- /api/wallet/apple/550e8400-e29b-41d4-a716-446655440006?debug=true

-- Apple Wallet update endpoint will use updated_at for Last-Modified header:
-- /api/wallet/apple/updates (POST with pass data)

-- For convenience, here's the main test customer card ID:
-- 550e8400-e29b-41d4-a716-446655440006

-- Test user credentials created:
-- Business user: business@test.com (role_id: 2)
-- Customer user: customer@test.com (role_id: 3) 