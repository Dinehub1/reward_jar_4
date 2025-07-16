-- Create test customer card for wallet testing (Dynamic UUID version)
-- Run this in your Supabase SQL editor or via psql
-- NOTE: Run add-updated-at-columns.sql first to add updated_at columns

-- This version uses uuid_generate_v4() to create new UUIDs each time
-- Good for testing multiple scenarios without conflicts

-- Step 1: Create users table if it doesn't exist (required for foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id INTEGER NOT NULL CHECK (role_id IN (2, 3)), -- 2=business, 3=customer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Generate UUIDs and create test data
WITH test_uuids AS (
  SELECT 
    uuid_generate_v4() as business_id,
    uuid_generate_v4() as business_owner_id,
    uuid_generate_v4() as stamp_card_id,
    uuid_generate_v4() as customer_id,
    uuid_generate_v4() as customer_user_id,
    uuid_generate_v4() as customer_card_id
),
-- Insert test business owner user
business_user_insert AS (
  INSERT INTO users (id, email, role_id, created_at, updated_at) 
  SELECT 
    business_owner_id,
    'business-' || SUBSTRING(business_owner_id::text, 1, 8) || '@test.com',
    2, -- Business role
    NOW(),
    NOW()
  FROM test_uuids
  RETURNING id, email
),
-- Insert test customer user
customer_user_insert AS (
  INSERT INTO users (id, email, role_id, created_at, updated_at) 
  SELECT 
    customer_user_id,
    'customer-' || SUBSTRING(customer_user_id::text, 1, 8) || '@test.com',
    3, -- Customer role
    NOW(),
    NOW()
  FROM test_uuids
  RETURNING id, email
),
-- Insert test business
business_insert AS (
  INSERT INTO businesses (id, owner_id, name, description, created_at, updated_at) 
  SELECT 
    business_id,
    business_owner_id,
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
    customer_user_id,
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
  tu.business_owner_id,
  tu.stamp_card_id,
  tu.customer_id,
  tu.customer_user_id,
  tu.customer_card_id as main_test_id,
  bu.email as business_email,
  cu.email as customer_email
FROM test_uuids tu
JOIN business_user_insert bu ON tu.business_owner_id = bu.id
JOIN customer_user_insert cu ON tu.customer_user_id = cu.id;

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
  c.updated_at as customer_updated_at,
  u_business.email as business_owner_email,
  u_customer.email as customer_user_email
FROM customer_cards cc
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
JOIN customers c ON cc.customer_id = c.id
JOIN users u_business ON b.owner_id = u_business.id
JOIN users u_customer ON c.user_id = u_customer.id
WHERE cc.created_at > NOW() - INTERVAL '1 minute'  -- Show recently created cards
ORDER BY cc.created_at DESC
LIMIT 5;

-- To test wallet updates, first get the customer_card_id from above query, then:
-- UPDATE customer_cards SET current_stamps = current_stamps + 1 WHERE id = 'your-customer-card-id';

-- Check wallet update queue:
-- SELECT * FROM wallet_update_queue WHERE created_at > NOW() - INTERVAL '1 minute' ORDER BY created_at DESC;

-- Verify all tables have data:
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

-- Test URLs format:
-- /api/wallet/apple/[customer_card_id]
-- /api/wallet/google/[customer_card_id]
-- /api/wallet/pwa/[customer_card_id]
-- /api/wallet/apple/[customer_card_id]?debug=true 