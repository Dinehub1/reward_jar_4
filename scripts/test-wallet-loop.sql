-- Automated Loop Testing Script for RewardJar Wallet Functionality
-- This script generates multiple test scenarios for comprehensive edge case testing
-- Run this after add-updated-at-columns.sql to create diverse test data

-- NOTE: This script creates multiple test scenarios. Run in development only.

-- Create function to generate test scenarios
CREATE OR REPLACE FUNCTION generate_test_scenarios()
RETURNS TABLE (
  scenario_name TEXT,
  customer_card_id UUID,
  current_stamps INTEGER,
  total_stamps INTEGER,
  completion_percentage NUMERIC,
  test_urls TEXT[]
) AS $$
DECLARE
  business_uuid UUID;
  customer_user_uuid UUID;
  customer_uuid UUID;
  stamp_card_uuid UUID;
  card_uuid UUID;
  scenario_counter INTEGER := 1;
BEGIN
  -- Clean up existing test data (optional)
  DELETE FROM wallet_update_queue WHERE customer_card_id IN (
    SELECT cc.id FROM customer_cards cc 
    JOIN customers c ON cc.customer_id = c.id 
    WHERE c.email LIKE '%test-scenario%'
  );
  
  DELETE FROM customer_cards WHERE customer_id IN (
    SELECT id FROM customers WHERE email LIKE '%test-scenario%'
  );
  
  DELETE FROM customers WHERE email LIKE '%test-scenario%';
  DELETE FROM stamp_cards WHERE business_id IN (
    SELECT id FROM businesses WHERE name LIKE '%Test Scenario%'
  );
  DELETE FROM businesses WHERE name LIKE '%Test Scenario%';
  DELETE FROM users WHERE email LIKE '%test-scenario%';

  -- Scenario 1: Empty Card (0/10 stamps)
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-1@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 1 Business', 'Empty card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Empty Card Test', 10, 'Test reward for empty card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 1', 'test-scenario-1@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 0);
  
  RETURN QUERY SELECT 
    'Empty Card (0/10 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    0 as current_stamps,
    10 as total_stamps,
    0.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 2: Half Complete Card (5/10 stamps)
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-2@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 2 Business', 'Half complete card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Half Complete Test', 10, 'Test reward for half complete card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 2', 'test-scenario-2@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 5);
  
  RETURN QUERY SELECT 
    'Half Complete Card (5/10 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    5 as current_stamps,
    10 as total_stamps,
    50.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 3: Almost Complete Card (9/10 stamps)
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-3@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 3 Business', 'Almost complete card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Almost Complete Test', 10, 'Test reward for almost complete card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 3', 'test-scenario-3@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 9);
  
  RETURN QUERY SELECT 
    'Almost Complete Card (9/10 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    9 as current_stamps,
    10 as total_stamps,
    90.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 4: Completed Card (10/10 stamps)
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-4@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 4 Business', 'Completed card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Completed Test', 10, 'Test reward for completed card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 4', 'test-scenario-4@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 10);
  
  RETURN QUERY SELECT 
    'Completed Card (10/10 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    10 as current_stamps,
    10 as total_stamps,
    100.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 5: Over-Complete Card (12/10 stamps) - Edge case
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-5@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 5 Business', 'Over-complete card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Over-Complete Test', 10, 'Test reward for over-complete card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 5', 'test-scenario-5@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 12);
  
  RETURN QUERY SELECT 
    'Over-Complete Card (12/10 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    12 as current_stamps,
    10 as total_stamps,
    120.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 6: Large Stamp Card (5/50 stamps)
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-6@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 6 Business', 'Large stamp card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Large Stamp Test', 50, 'Test reward for large stamp card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 6', 'test-scenario-6@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 5);
  
  RETURN QUERY SELECT 
    'Large Stamp Card (5/50 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    5 as current_stamps,
    50 as total_stamps,
    10.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 7: Small Stamp Card (2/3 stamps)
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-7@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 7 Business', 'Small stamp card testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Small Stamp Test', 3, 'Test reward for small stamp card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 7', 'test-scenario-7@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 2);
  
  RETURN QUERY SELECT 
    'Small Stamp Card (2/3 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    2 as current_stamps,
    3 as total_stamps,
    66.7 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

  -- Scenario 8: Long Business Name Card
  business_uuid := uuid_generate_v4();
  customer_user_uuid := uuid_generate_v4();
  customer_uuid := uuid_generate_v4();
  stamp_card_uuid := uuid_generate_v4();
  card_uuid := uuid_generate_v4();
  
  INSERT INTO users (id, email, role_id) VALUES (customer_user_uuid, 'test-scenario-8@example.com', 3);
  INSERT INTO businesses (id, owner_id, name, description) VALUES (business_uuid, customer_user_uuid, 'Test Scenario 8 Super Long Business Name That Might Cause Display Issues', 'Long business name testing');
  INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) VALUES (stamp_card_uuid, business_uuid, 'Long Business Name Test Card', 10, 'Test reward for long business name card');
  INSERT INTO customers (id, user_id, name, email) VALUES (customer_uuid, customer_user_uuid, 'Test Customer 8', 'test-scenario-8@example.com');
  INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) VALUES (card_uuid, customer_uuid, stamp_card_uuid, 3);
  
  RETURN QUERY SELECT 
    'Long Business Name Card (3/10 stamps)' as scenario_name,
    card_uuid as customer_card_id,
    3 as current_stamps,
    10 as total_stamps,
    30.0 as completion_percentage,
    ARRAY[
      '/api/wallet/apple/' || card_uuid::text,
      '/api/wallet/google/' || card_uuid::text,
      '/api/wallet/pwa/' || card_uuid::text,
      '/api/wallet/apple/' || card_uuid::text || '?debug=true'
    ] as test_urls;

END;
$$ LANGUAGE plpgsql;

-- Execute the test scenario generation
SELECT * FROM generate_test_scenarios();

-- Create a summary view of all test scenarios
CREATE OR REPLACE VIEW test_scenario_summary AS
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
  cc.created_at,
  cc.updated_at
FROM customer_cards cc
JOIN customers c ON cc.customer_id = c.id
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
WHERE c.email LIKE '%test-scenario%'
ORDER BY cc.created_at DESC;

-- Display the summary
SELECT * FROM test_scenario_summary;

-- Test the wallet update triggers by updating stamps on some cards
DO $$
DECLARE
  test_card_id UUID;
BEGIN
  -- Get a test card and add a stamp to trigger wallet updates
  SELECT customer_card_id INTO test_card_id 
  FROM test_scenario_summary 
  WHERE status = 'In Progress' 
  LIMIT 1;
  
  IF test_card_id IS NOT NULL THEN
    UPDATE customer_cards 
    SET current_stamps = current_stamps + 1 
    WHERE id = test_card_id;
    
    RAISE NOTICE 'Added stamp to test card: %', test_card_id;
  END IF;
END $$;

-- Check wallet update queue after trigger
SELECT 
  wuq.id,
  wuq.customer_card_id,
  wuq.update_type,
  wuq.processed,
  wuq.created_at,
  tss.customer_name,
  tss.business_name,
  tss.current_stamps,
  tss.total_stamps
FROM wallet_update_queue wuq
JOIN test_scenario_summary tss ON wuq.customer_card_id = tss.customer_card_id
WHERE wuq.created_at > NOW() - INTERVAL '1 minute'
ORDER BY wuq.created_at DESC;

-- Generate test URLs for all scenarios
SELECT 
  customer_card_id,
  business_name,
  stamp_card_name,
  current_stamps || '/' || total_stamps as progress,
  status,
  'http://localhost:3000/api/wallet/apple/' || customer_card_id as apple_wallet_url,
  'http://localhost:3000/api/wallet/google/' || customer_card_id as google_wallet_url,
  'http://localhost:3000/api/wallet/pwa/' || customer_card_id as pwa_wallet_url,
  'http://localhost:3000/api/wallet/apple/' || customer_card_id || '?debug=true' as debug_url
FROM test_scenario_summary
ORDER BY completion_percentage;

-- Clean up function (optional - run to remove test data)
CREATE OR REPLACE FUNCTION cleanup_test_scenarios()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete in reverse order of dependencies
  DELETE FROM wallet_update_queue WHERE customer_card_id IN (
    SELECT cc.id FROM customer_cards cc 
    JOIN customers c ON cc.customer_id = c.id 
    WHERE c.email LIKE '%test-scenario%'
  );
  
  DELETE FROM customer_cards WHERE customer_id IN (
    SELECT id FROM customers WHERE email LIKE '%test-scenario%'
  );
  
  DELETE FROM customers WHERE email LIKE '%test-scenario%';
  
  DELETE FROM stamp_cards WHERE business_id IN (
    SELECT id FROM businesses WHERE name LIKE '%Test Scenario%'
  );
  
  DELETE FROM businesses WHERE name LIKE '%Test Scenario%';
  
  DELETE FROM users WHERE email LIKE '%test-scenario%';
  
  -- Drop the summary view
  DROP VIEW IF EXISTS test_scenario_summary;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Instructions for use:
-- 1. Run this script after add-updated-at-columns.sql
-- 2. Test scenarios will be created automatically
-- 3. Use the generated URLs to test wallet functionality
-- 4. Run SELECT * FROM test_scenario_summary; to see all scenarios
-- 5. Run SELECT cleanup_test_scenarios(); to remove test data

-- Example usage:
-- SELECT * FROM test_scenario_summary;
-- Test URLs are generated in the final SELECT statement above 