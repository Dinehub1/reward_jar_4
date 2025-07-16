-- Create test customer card for wallet testing (Dynamic UUID version)
-- Run this in your Supabase SQL editor or via psql
-- NOTE: Run add-updated-at-columns.sql first to add updated_at columns

-- This version uses uuid_generate_v4() to create new UUIDs each time
-- Good for testing multiple scenarios without conflicts

-- Variables for generated UUIDs (PostgreSQL doesn't support variables in simple scripts)
-- So we'll use a WITH clause to generate UUIDs once and reuse them

WITH test_uuids AS (
  SELECT 
    uuid_generate_v4() as business_id,
    uuid_generate_v4() as owner_id,
    uuid_generate_v4() as stamp_card_id,
    uuid_generate_v4() as customer_id,
    uuid_generate_v4() as user_id,
    uuid_generate_v4() as customer_card_id
),
-- Insert test business
business_insert AS (
  INSERT INTO businesses (id, owner_id, name, description, created_at, updated_at) 
  SELECT 
    business_id,
    owner_id,
    'Bella Buono Coffee',
    'Premium coffee shop with artisanal blends and cozy atmosphere',
    NOW(),
    NOW()
  FROM test_uuids
  RETURNING id, owner_id
),
-- Insert test stamp card
stamp_card_insert AS (
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description, status, created_at, updated_at)
  SELECT 
    tu.stamp_card_id,
    tu.business_id,
    'Coffee Lover Rewards',
    10,
    'Free premium coffee of your choice',
    'active',
    NOW(),
    NOW()
  FROM test_uuids tu
  RETURNING id, business_id
),
-- Insert test customer
customer_insert AS (
  INSERT INTO customers (id, user_id, name, email, created_at, updated_at)
  SELECT 
    customer_id,
    user_id,
    'John Doe',
    'john.doe@example.com',
    NOW(),
    NOW()
  FROM test_uuids
  RETURNING id, user_id
),
-- Insert test customer card
customer_card_insert AS (
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps, wallet_pass_id, created_at, updated_at)
  SELECT 
    tu.customer_card_id,
    tu.customer_id,
    tu.stamp_card_id,
    6,
    NULL,
    NOW(),
    NOW()
  FROM test_uuids tu
  RETURNING id, customer_id, stamp_card_id, current_stamps
)
-- Return the generated UUIDs for reference
SELECT 
  'Generated test data with UUIDs:' as message,
  tu.business_id,
  tu.stamp_card_id,
  tu.customer_id,
  tu.customer_card_id as main_test_id
FROM test_uuids tu;

-- To see the created data, run this query:
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
WHERE cc.created_at > NOW() - INTERVAL '1 minute'  -- Show recently created cards
ORDER BY cc.created_at DESC
LIMIT 5;

-- To test wallet updates, first get the customer_card_id from above query, then:
-- UPDATE customer_cards SET current_stamps = current_stamps + 1 WHERE id = 'your-customer-card-id';

-- Check wallet update queue:
-- SELECT * FROM wallet_update_queue WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at DESC;

-- Test URLs format:
-- /api/wallet/apple/[customer_card_id]
-- /api/wallet/google/[customer_card_id]
-- /api/wallet/pwa/[customer_card_id]
-- /api/wallet/apple/[customer_card_id]?debug=true 