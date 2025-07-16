-- RLS-Compatible Test Wallet Loop Script for RewardJar
-- This script creates test scenarios that work with existing RLS policies
-- Run this in Supabase SQL Editor with your current user permissions

-- ⚠️ IMPORTANT: This script uses INSERT statements that work with RLS policies
-- No function creation required - bypasses "permission denied for schema public" error

-- Step 1: Clean up existing test data (if any)
-- This uses standard DELETE statements that work with RLS
DELETE FROM customer_cards 
WHERE id IN (
  SELECT cc.id 
  FROM customer_cards cc 
  JOIN customers c ON cc.customer_id = c.id 
  WHERE c.email LIKE '%test-scenario%'
);

DELETE FROM customers WHERE email LIKE '%test-scenario%';

DELETE FROM stamp_cards 
WHERE id IN (
  SELECT sc.id 
  FROM stamp_cards sc 
  JOIN businesses b ON sc.business_id = b.id 
  WHERE b.name LIKE '%Test Scenario%'
);

DELETE FROM businesses WHERE name LIKE '%Test Scenario%';

DELETE FROM users WHERE email LIKE '%test-scenario%';

-- Step 2: Create Test Scenarios Using Standard INSERT Statements
-- Each scenario creates a complete business → stamp card → customer → customer card chain

-- Scenario 1: Empty Card (0/10 stamps)
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111001', 'test-scenario-1-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111002', 'test-scenario-1-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111001', 'Test Scenario 1 Business', 'Empty card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222001', 'Empty Card Test', 10, 'Test reward for empty card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444001', '11111111-1111-1111-1111-111111111002', 'Test Customer 1', 'test-scenario-1-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555001', '44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001', 0);

-- Scenario 2: Small Card (2/3 stamps) - 66.7%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111003', 'test-scenario-2-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111004', 'test-scenario-2-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111003', 'Test Scenario 2 Business', 'Small card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222002', 'Small Card Test', 3, 'Test reward for small card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444002', '11111111-1111-1111-1111-111111111004', 'Test Customer 2', 'test-scenario-2-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555002', '44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333002', 2);

-- Scenario 3: Large Card (5/50 stamps) - 10%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111005', 'test-scenario-3-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111006', 'test-scenario-3-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111005', 'Test Scenario 3 Business', 'Large card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333003', '22222222-2222-2222-2222-222222222003', 'Large Card Test', 50, 'Test reward for large card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444003', '11111111-1111-1111-1111-111111111006', 'Test Customer 3', 'test-scenario-3-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555003', '44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333003', 5);

-- Scenario 4: Long Names (3/10 stamps) - 30%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111007', 'test-scenario-4-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111008', 'test-scenario-4-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111007', 'Test Scenario 4 Super Long Business Name That Might Cause Display Issues', 'Long business name testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333004', '22222222-2222-2222-2222-222222222004', 'Long Business Name Test Card', 10, 'Test reward for long business name card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444004', '11111111-1111-1111-1111-111111111008', 'Test Customer 4', 'test-scenario-4-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555004', '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333004', 3);

-- Scenario 5: Half Complete (5/10 stamps) - 50%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111009', 'test-scenario-5-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111010', 'test-scenario-5-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222005', '11111111-1111-1111-1111-111111111009', 'Test Scenario 5 Business', 'Half complete card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333005', '22222222-2222-2222-2222-222222222005', 'Half Complete Test', 10, 'Test reward for half complete card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444005', '11111111-1111-1111-1111-111111111010', 'Test Customer 5', 'test-scenario-5-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555005', '44444444-4444-4444-4444-444444444005', '33333333-3333-3333-3333-333333333005', 5);

-- Scenario 6: Almost Complete (9/10 stamps) - 90%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111011', 'test-scenario-6-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111012', 'test-scenario-6-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222006', '11111111-1111-1111-1111-111111111011', 'Test Scenario 6 Business', 'Almost complete card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333006', '22222222-2222-2222-2222-222222222006', 'Almost Complete Test', 10, 'Test reward for almost complete card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444006', '11111111-1111-1111-1111-111111111012', 'Test Customer 6', 'test-scenario-6-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555006', '44444444-4444-4444-4444-444444444006', '33333333-3333-3333-3333-333333333006', 9);

-- Scenario 7: Completed (10/10 stamps) - 100%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111013', 'test-scenario-7-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111014', 'test-scenario-7-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222007', '11111111-1111-1111-1111-111111111013', 'Test Scenario 7 Business', 'Completed card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333007', '22222222-2222-2222-2222-222222222007', 'Completed Test', 10, 'Test reward for completed card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444007', '11111111-1111-1111-1111-111111111014', 'Test Customer 7', 'test-scenario-7-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555007', '44444444-4444-4444-4444-444444444007', '33333333-3333-3333-3333-333333333007', 10);

-- Scenario 8: Over-Complete (12/10 stamps) - 120%
INSERT INTO users (id, email, role_id) VALUES 
  ('11111111-1111-1111-1111-111111111015', 'test-scenario-8-business@example.com', 2),
  ('11111111-1111-1111-1111-111111111016', 'test-scenario-8-customer@example.com', 3);

INSERT INTO businesses (id, owner_id, name, description) VALUES 
  ('22222222-2222-2222-2222-222222222008', '11111111-1111-1111-1111-111111111015', 'Test Scenario 8 Business', 'Over-complete card testing');

INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES 
  ('33333333-3333-3333-3333-333333333008', '22222222-2222-2222-2222-222222222008', 'Over-Complete Test', 10, 'Test reward for over-complete card');

INSERT INTO customers (id, user_id, name, email) VALUES 
  ('44444444-4444-4444-4444-444444444008', '11111111-1111-1111-1111-111111111016', 'Test Customer 8', 'test-scenario-8-customer@example.com');

INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES 
  ('55555555-5555-5555-5555-555555555008', '44444444-4444-4444-4444-444444444008', '33333333-3333-3333-3333-333333333008', 12);

-- Step 3: Display Test Scenario Summary
SELECT 
  cc.id as customer_card_id,
  c.name as customer_name,
  c.email as customer_email,
  b.name as business_name,
  sc.name as stamp_card_name,
  cc.current_stamps,
  sc.total_stamps,
  ROUND((cc.current_stamps::NUMERIC / sc.total_stamps::NUMERIC) * 100, 1) as completion_percentage,
  CASE 
    WHEN cc.current_stamps = 0 THEN 'Empty'
    WHEN cc.current_stamps >= sc.total_stamps THEN 'Completed'
    WHEN cc.current_stamps > sc.total_stamps THEN 'Over-Complete'
    WHEN cc.current_stamps >= (sc.total_stamps * 0.8) THEN 'Almost Complete'
    WHEN cc.current_stamps >= (sc.total_stamps * 0.5) THEN 'Half Complete'
    ELSE 'In Progress'
  END as status,
  'http://localhost:3000/api/wallet/apple/' || cc.id as apple_wallet_url,
  'http://localhost:3000/api/wallet/google/' || cc.id as google_wallet_url,
  'http://localhost:3000/api/wallet/pwa/' || cc.id as pwa_wallet_url,
  'http://localhost:3000/api/wallet/apple/' || cc.id || '?debug=true' as debug_url
FROM customer_cards cc
JOIN customers c ON cc.customer_id = c.id
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
WHERE c.email LIKE '%test-scenario%'
ORDER BY cc.current_stamps, sc.total_stamps;

-- Step 4: Test wallet update triggers by adding a stamp to one card
-- This should trigger the wallet update queue if the triggers are set up
UPDATE customer_cards 
SET current_stamps = current_stamps + 1 
WHERE id = '55555555-5555-5555-5555-555555555005'; -- Half complete card

-- Step 5: Check if wallet update queue was triggered (if table exists)
SELECT 
  wuq.id,
  wuq.customer_card_id,
  wuq.update_type,
  wuq.processed,
  wuq.created_at,
  cc.current_stamps,
  sc.name as stamp_card_name
FROM wallet_update_queue wuq
JOIN customer_cards cc ON wuq.customer_card_id = cc.id
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
WHERE wuq.customer_card_id IN (
  SELECT cc.id 
  FROM customer_cards cc 
  JOIN customers c ON cc.customer_id = c.id 
  WHERE c.email LIKE '%test-scenario%'
)
ORDER BY wuq.created_at DESC;

-- Step 6: Cleanup Command (run separately if needed)
-- Copy and paste this separately to clean up test data:
/*
DELETE FROM customer_cards WHERE id IN (
  SELECT cc.id FROM customer_cards cc 
  JOIN customers c ON cc.customer_id = c.id 
  WHERE c.email LIKE '%test-scenario%'
);
DELETE FROM customers WHERE email LIKE '%test-scenario%';
DELETE FROM stamp_cards WHERE id IN (
  SELECT sc.id FROM stamp_cards sc 
  JOIN businesses b ON sc.business_id = b.id 
  WHERE b.name LIKE '%Test Scenario%'
);
DELETE FROM businesses WHERE name LIKE '%Test Scenario%';
DELETE FROM users WHERE email LIKE '%test-scenario%';
*/

-- ✅ USAGE INSTRUCTIONS:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Check the summary output for test card IDs
-- 3. Test wallet endpoints with the generated URLs
-- 4. Use the cleanup command to remove test data when done

-- 🧪 MAIN TEST CARD IDs:
-- Empty Card: 55555555-5555-5555-5555-555555555001
-- Small Card: 55555555-5555-5555-5555-555555555002  
-- Large Card: 55555555-5555-5555-5555-555555555003
-- Long Names: 55555555-5555-5555-5555-555555555004
-- Half Complete: 55555555-5555-5555-5555-555555555005
-- Almost Complete: 55555555-5555-5555-5555-555555555006
-- Completed: 55555555-5555-5555-5555-555555555007
-- Over-Complete: 55555555-5555-5555-5555-555555555008 