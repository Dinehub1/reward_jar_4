-- Verification Script for Test Wallet Loop Scenarios
-- Run this after executing test-wallet-loop.sql to verify success

-- 1. Check if the function was created
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'generate_test_scenarios'
) as function_exists;

-- 2. Check if test scenarios were created
SELECT * FROM test_scenario_summary;

-- 3. Count test scenarios by status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(completion_percentage), 1) as avg_completion
FROM test_scenario_summary
GROUP BY status
ORDER BY avg_completion;

-- 4. Verify wallet update queue has entries
SELECT 
  COUNT(*) as queue_entries,
  COUNT(CASE WHEN processed = false THEN 1 END) as pending,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed
FROM wallet_update_queue 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 5. Check specific test scenarios
SELECT 
  scenario_name,
  customer_card_id,
  current_stamps,
  total_stamps,
  completion_percentage,
  test_urls[1] as apple_wallet_url
FROM generate_test_scenarios()
ORDER BY completion_percentage;

-- 6. Verify all 8 scenarios exist
SELECT 
  customer_card_id,
  business_name,
  stamp_card_name,
  current_stamps || '/' || total_stamps as progress,
  status,
  'Ready for testing' as test_status
FROM test_scenario_summary
ORDER BY completion_percentage;

-- 7. Generate quick test URLs for all scenarios
SELECT 
  'Test Card: ' || stamp_card_name as description,
  customer_card_id,
  'http://localhost:3000/api/wallet/apple/' || customer_card_id as apple_url,
  'http://localhost:3000/api/wallet/apple/' || customer_card_id || '?debug=true' as debug_url
FROM test_scenario_summary
ORDER BY completion_percentage;

-- 8. Test one scenario by adding a stamp (triggers wallet update)
DO $$
DECLARE
  test_card_id UUID;
  old_stamps INTEGER;
  new_stamps INTEGER;
BEGIN
  -- Get a test card that's not complete
  SELECT customer_card_id, current_stamps INTO test_card_id, old_stamps
  FROM test_scenario_summary 
  WHERE status NOT IN ('Completed', 'Over-Complete')
  LIMIT 1;
  
  IF test_card_id IS NOT NULL THEN
    -- Add a stamp
    UPDATE customer_cards 
    SET current_stamps = current_stamps + 1 
    WHERE id = test_card_id;
    
    -- Get new stamp count
    SELECT current_stamps INTO new_stamps
    FROM customer_cards
    WHERE id = test_card_id;
    
    RAISE NOTICE 'Updated test card % from % to % stamps', test_card_id, old_stamps, new_stamps;
  ELSE
    RAISE NOTICE 'No suitable test card found for stamp update';
  END IF;
END $$;

-- 9. Check if wallet update was triggered
SELECT 
  'Wallet update triggered' as message,
  customer_card_id,
  update_type,
  processed,
  created_at
FROM wallet_update_queue 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- 10. Final summary
SELECT 
  'Test Loop Execution Summary' as summary,
  (SELECT COUNT(*) FROM test_scenario_summary) as total_scenarios,
  (SELECT COUNT(*) FROM wallet_update_queue WHERE created_at > NOW() - INTERVAL '1 hour') as queue_entries,
  (SELECT COUNT(*) FROM customer_cards WHERE created_at > NOW() - INTERVAL '1 hour') as new_cards,
  'Ready for wallet testing' as status; 