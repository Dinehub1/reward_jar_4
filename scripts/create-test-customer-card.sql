-- Create test customer card for wallet testing
-- Run this in your Supabase SQL editor or via psql
-- NOTE: Run add-updated-at-columns.sql first to add updated_at columns

-- Insert test business (if not exists)
INSERT INTO businesses (id, owner_id, name, description, created_at, updated_at) 
VALUES (
  'test-business-123',
  'test-user-123', 
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
  'test-stamp-card-123',
  'test-business-123',
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
  'test-customer-123',
  'test-user-customer-123',
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
  'test-customer-card-123',
  'test-customer-123',
  'test-stamp-card-123',
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
WHERE cc.id = 'test-customer-card-123';

-- Test the wallet update trigger by adding a stamp
-- This should update the updated_at timestamp and create a wallet update queue entry
UPDATE customer_cards 
SET current_stamps = current_stamps + 1 
WHERE id = 'test-customer-card-123';

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
WHERE wuq.customer_card_id = 'test-customer-card-123'
ORDER BY wuq.created_at DESC;

-- Test URLs to try:
-- /api/wallet/apple/test-customer-card-123
-- /api/wallet/google/test-customer-card-123
-- /api/wallet/pwa/test-customer-card-123
-- /api/wallet/apple/test-customer-card-123?debug=true

-- Apple Wallet update endpoint will use updated_at for Last-Modified header:
-- /api/wallet/apple/updates (POST with pass data) 