-- Debug Script for Test Wallet Loop Issues
-- Run this if test-wallet-loop.sql encounters problems

-- 1. Check if required tables exist
SELECT 
  table_name,
  'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'businesses', 'stamp_cards', 'customers', 'customer_cards', 'wallet_update_queue')
ORDER BY table_name;

-- 2. Check if updated_at columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'updated_at'
  AND table_name IN ('businesses', 'stamp_cards', 'customers', 'customer_cards')
ORDER BY table_name;

-- 3. Check if uuid_generate_v4() function is available
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'uuid_generate_v4'
) as uuid_function_exists;

-- 4. Test basic UUID generation
SELECT uuid_generate_v4() as test_uuid;

-- 5. Check current user permissions
SELECT 
  current_user as current_user,
  session_user as session_user,
  current_database() as current_database;

-- 6. Check if we can create a simple function
CREATE OR REPLACE FUNCTION test_function()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Function creation successful';
END;
$$ LANGUAGE plpgsql;

SELECT test_function();

-- 7. Test basic insert operations
-- Create a test table first
CREATE TABLE IF NOT EXISTS test_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test insert
INSERT INTO test_table (name) VALUES ('Test Entry');

-- Verify insert
SELECT * FROM test_table WHERE name = 'Test Entry';

-- Clean up test table
DROP TABLE IF EXISTS test_table;

-- 8. Check if wallet_update_queue table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'wallet_update_queue'
ORDER BY ordinal_position;

-- 9. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%wallet%'
ORDER BY event_object_table;

-- 10. Test a simple scenario creation (minimal version)
DO $$
DECLARE
  test_business_id UUID := uuid_generate_v4();
  test_user_id UUID := uuid_generate_v4();
  test_customer_id UUID := uuid_generate_v4();
  test_stamp_card_id UUID := uuid_generate_v4();
  test_customer_card_id UUID := uuid_generate_v4();
BEGIN
  -- Try to create a minimal test scenario
  BEGIN
    INSERT INTO users (id, email, role_id) 
    VALUES (test_user_id, 'debug-test@example.com', 3);
    
    INSERT INTO businesses (id, owner_id, name, description) 
    VALUES (test_business_id, test_user_id, 'Debug Test Business', 'Debug test');
    
    INSERT INTO stamp_cards (id, business_id, name, total_stamps, reward_description) 
    VALUES (test_stamp_card_id, test_business_id, 'Debug Test Card', 10, 'Debug reward');
    
    INSERT INTO customers (id, user_id, name, email) 
    VALUES (test_customer_id, test_user_id, 'Debug Customer', 'debug-test@example.com');
    
    INSERT INTO customer_cards (id, customer_id, stamp_card_id, current_stamps) 
    VALUES (test_customer_card_id, test_customer_id, test_stamp_card_id, 5);
    
    RAISE NOTICE 'Debug test scenario created successfully: %', test_customer_card_id;
    
    -- Clean up
    DELETE FROM customer_cards WHERE id = test_customer_card_id;
    DELETE FROM customers WHERE id = test_customer_id;
    DELETE FROM stamp_cards WHERE id = test_stamp_card_id;
    DELETE FROM businesses WHERE id = test_business_id;
    DELETE FROM users WHERE id = test_user_id;
    
    RAISE NOTICE 'Debug test scenario cleaned up successfully';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating debug test scenario: %', SQLERRM;
  END;
END $$;

-- 11. Check for existing test scenario data
SELECT 
  COUNT(*) as existing_test_scenarios
FROM customer_cards cc
JOIN customers c ON cc.customer_id = c.id
WHERE c.email LIKE '%test-scenario%';

-- 12. If test scenarios exist, show them
SELECT 
  cc.id as customer_card_id,
  c.email as customer_email,
  b.name as business_name,
  sc.name as stamp_card_name,
  cc.current_stamps,
  sc.total_stamps,
  cc.created_at
FROM customer_cards cc
JOIN customers c ON cc.customer_id = c.id
JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
JOIN businesses b ON sc.business_id = b.id
WHERE c.email LIKE '%test-scenario%'
ORDER BY cc.created_at DESC
LIMIT 10;

-- 13. Check if the generate_test_scenarios function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'generate_test_scenarios'
) as generate_function_exists;

-- 14. If function exists, try to call it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_test_scenarios') THEN
    RAISE NOTICE 'generate_test_scenarios function exists and can be called';
  ELSE
    RAISE NOTICE 'generate_test_scenarios function does not exist';
  END IF;
END $$;

-- 15. Show any error messages from recent operations
SELECT 
  'Debug complete' as message,
  NOW() as timestamp,
  'Check the output above for any errors' as next_step; 