-- Create test customer card for wallet testing
-- Run this in your Supabase SQL editor or via psql

-- Insert test business (if not exists)
INSERT INTO businesses (id, owner_id, name, description, created_at) 
VALUES (
  'test-business-123',
  'test-user-123', 
  'Bella Buono Coffee',
  'Premium coffee shop with artisanal blends and cozy atmosphere',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Insert test stamp card (if not exists)
INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description, status, created_at)
VALUES (
  'test-stamp-card-123',
  'test-business-123',
  'Coffee Lover Rewards',
  10,
  'Free premium coffee of your choice',
  'active',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  total_stamps = EXCLUDED.total_stamps,
  reward_description = EXCLUDED.reward_description;

-- Insert test customer (if not exists)
INSERT INTO customers (id, user_id, name, email, created_at)
VALUES (
  'test-customer-123',
  'test-user-customer-123',
  'John Doe',
  'john.doe@example.com',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Insert test customer card (if not exists)
INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps, wallet_pass_id, created_at)
VALUES (
  'test-customer-card-123',
  'test-customer-123',
  'test-stamp-card-123',
  6,
  NULL,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  current_stamps = EXCLUDED.current_stamps;

-- Verify the test data
SELECT 
  cc.id as customer_card_id,
  cc.current_stamps,
  sc.name as stamp_card_name,
  sc.total_stamps,
  sc.reward_description,
  b.name as business_name,
  c.name as customer_name,
  c.email as customer_email
FROM customer_cards cc
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
JOIN customers c ON cc.customer_id = c.id
WHERE cc.id = 'test-customer-card-123';

-- Test URLs to try:
-- /api/wallet/apple/test-customer-card-123
-- /api/wallet/google/test-customer-card-123
-- /api/wallet/pwa/test-customer-card-123
-- /api/wallet/apple/test-customer-card-123?debug=true 