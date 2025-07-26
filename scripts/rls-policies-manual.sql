-- ============================================================================
-- RewardJar 4.0 - Complete RLS Policy Setup
-- ============================================================================
-- Reference: doc/doc1/3_SUPABASE_SETUP.md
-- This script should be executed in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Step 1: Enable RLS on all tables
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_update_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies to avoid conflicts
-- ============================================================================
DROP POLICY IF EXISTS "Users can view and update their own data" ON users;
DROP POLICY IF EXISTS "Business owners manage their business" ON businesses;
DROP POLICY IF EXISTS "Business owners manage their stamp cards" ON stamp_cards;
DROP POLICY IF EXISTS "Customers manage their own data" ON customers;
DROP POLICY IF EXISTS "Customer cards access" ON customer_cards;
DROP POLICY IF EXISTS "membership_cards_business_access" ON membership_cards;
DROP POLICY IF EXISTS "session_usage_access" ON session_usage;
DROP POLICY IF EXISTS "wallet_update_queue_access" ON wallet_update_queue;
DROP POLICY IF EXISTS "Stamps access" ON stamps;
DROP POLICY IF EXISTS "Rewards access" ON rewards;

-- Step 3: Create comprehensive RLS policies
-- ============================================================================

-- USERS TABLE: Users can manage their own data
CREATE POLICY "Users can view and update their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- BUSINESSES TABLE: Business owners manage their business
CREATE POLICY "Business owners manage their business" ON businesses
  FOR ALL USING (owner_id = auth.uid());

-- STAMP_CARDS TABLE: Business owners manage their stamp cards
CREATE POLICY "Business owners manage their stamp cards" ON stamp_cards
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- CUSTOMERS TABLE: Customers manage their own data
CREATE POLICY "Customers manage their own data" ON customers
  FOR ALL USING (user_id = auth.uid());

-- CUSTOMER_CARDS TABLE: Enhanced dual card type access
CREATE POLICY "Customer cards access" ON customer_cards
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- MEMBERSHIP_CARDS TABLE: Business access
CREATE POLICY "membership_cards_business_access" ON membership_cards
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- SESSION_USAGE TABLE: Enhanced dual card type support
CREATE POLICY "session_usage_access" ON session_usage
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN customers c ON cc.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- WALLET_UPDATE_QUEUE TABLE: Comprehensive access
CREATE POLICY "wallet_update_queue_access" ON wallet_update_queue
  FOR ALL USING (
    customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN customers c ON cc.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
    OR customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- STAMPS TABLE: Legacy table support
CREATE POLICY "Stamps access" ON stamps
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- REWARDS TABLE: Legacy table support
CREATE POLICY "Rewards access" ON rewards
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Step 4: Verification Query
-- ============================================================================
-- Run this to verify RLS status after applying policies

SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'businesses', 'stamp_cards', 'customers', 'customer_cards', 
    'membership_cards', 'session_usage', 'wallet_update_queue', 'stamps', 'rewards'
  )
ORDER BY tablename;

-- Expected results:
-- All tables should have rowsecurity = true
-- All tables should have policy_count >= 1

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. This script enables RLS on all RewardJar 4.0 tables
-- 2. Policies allow users to access their own data based on auth.uid()
-- 3. Business owners can access their businesses, cards, and customer data
-- 4. Customers can access their own profile and cards
-- 5. Both loyalty and membership card types are supported
-- 6. Run the verification query at the end to confirm setup
-- ============================================================================ 