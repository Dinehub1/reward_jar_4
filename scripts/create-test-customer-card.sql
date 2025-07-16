-- Create test customer card for wallet testing
-- Run this in your Supabase SQL editor or via psql
-- NOTE: Run add-updated-at-columns.sql first to add updated_at columns

-- Generate proper UUIDs for test data
-- Using uuid_generate_v4() or fixed UUIDs in proper format

-- Insert test business (if not exists)
INSERT INTO businesses (id, owner_id, name, description, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',  -- Proper UUID format
  '550e8400-e29b-41d4-a716-446655440002',  -- Proper UUID format
  'Bella Buono Coffee',
  'Premium coffee shop with artisanal blends and cozy atmosphere',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert test stamp card (if not exists)
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

-- Insert test customer (if not exists)
INSERT INTO customers (id, user_id, name, email, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004',  -- Proper UUID format
  '550e8400-e29b-41d4-a716-446655440005',  -- Proper UUID format
  'John Doe',
  'john.doe@example.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Insert test customer card (if not exists)
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

-- Verify the test data
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
  c.updated_at as customer_updated_at
FROM customer_cards cc
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
JOIN customers c ON cc.customer_id = c.id
WHERE cc.id = '550e8400-e29b-41d4-a716-446655440006';

-- Test the wallet update trigger by adding a stamp
-- This should update the updated_at timestamp and create a wallet update queue entry
UPDATE customer_cards 
SET current_stamps = current_stamps + 1 
WHERE id = '550e8400-e29b-41d4-a716-446655440006';

-- Verify the wallet update queue was triggered
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

-- Test URLs to try (use the proper UUID):
-- /api/wallet/apple/550e8400-e29b-41d4-a716-446655440006
-- /api/wallet/google/550e8400-e29b-41d4-a716-446655440006
-- /api/wallet/pwa/550e8400-e29b-41d4-a716-446655440006
-- /api/wallet/apple/550e8400-e29b-41d4-a716-446655440006?debug=true

-- Apple Wallet update endpoint will use updated_at for Last-Modified header:
-- /api/wallet/apple/updates (POST with pass data)

-- For convenience, here's the main test customer card ID:
-- 550e8400-e29b-41d4-a716-446655440006 