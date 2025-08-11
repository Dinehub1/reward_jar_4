-- =====================================
-- REWARDJAR AUTH PERFORMANCE OPTIMIZATION
-- =====================================
-- This script creates indexes and optimizations for faster auth queries

-- 1. Primary user role lookup optimization
-- Used by: /api/auth/get-role, MCP auth layer
CREATE INDEX IF NOT EXISTS idx_users_id_role ON users(id, role_id);

-- 2. Email lookup optimization  
-- Used by: dev login, user registration
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Performance optimized user roles view
-- Simplifies queries that need role name mapping
CREATE OR REPLACE VIEW public.user_roles_optimized AS
SELECT
    id,
    email,
    role_id,
    CASE
        WHEN role_id = 1 THEN 'admin'
        WHEN role_id = 2 THEN 'business'
        WHEN role_id = 3 THEN 'customer'
        ELSE 'unknown'
    END AS role_name,
    created_at,
    updated_at
FROM
    public.users;

-- 4. Composite index for customer card queries
-- Used by: wallet API routes that need card + user data
CREATE INDEX IF NOT EXISTS idx_customer_cards_user_card ON customer_cards(user_id, id);

-- 5. Business owner lookup optimization
-- Used by: business dashboard, owner verification
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);

-- 6. Auth session optimization for Supabase
-- Helps with session refresh and token validation
CREATE INDEX IF NOT EXISTS idx_users_auth_meta ON users(id, role_id, created_at) WHERE role_id IS NOT NULL;

-- =====================================
-- RLS PERFORMANCE OPTIMIZATIONS
-- =====================================

-- Wrap auth.uid() in subquery for better performance
-- This creates an initPlan that caches the result vs calling on each row

-- Example optimized RLS policy (comment - don't execute)
/*
-- BEFORE (slow):
-- CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

-- AFTER (fast):
-- CREATE POLICY "Users can read own data" ON users FOR SELECT USING (id = (SELECT auth.uid()));
*/

-- =====================================
-- MONITORING QUERIES
-- =====================================

-- Query to check index usage
-- Run this to verify indexes are being used:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename IN ('users', 'customer_cards', 'businesses')
ORDER BY idx_scan DESC;
*/

-- Query to find slow auth-related queries
-- Enable and run this to identify performance issues:
/*
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query ILIKE '%users%' 
   OR query ILIKE '%auth%'
   OR query ILIKE '%role%'
ORDER BY mean_exec_time DESC 
LIMIT 10;
*/

-- =====================================
-- PERFORMANCE TESTING
-- =====================================

-- Test role lookup performance
-- This should be <10ms with proper indexes:
/*
EXPLAIN (ANALYZE, BUFFERS) 
SELECT role_id 
FROM users 
WHERE id = 'ba3615c6-9be6-4714-b4d6-e686b6e44308';
*/

-- Test customer card lookup performance  
-- This should be <50ms with proper indexes:
/*
EXPLAIN (ANALYZE, BUFFERS)
SELECT cc.*, sc.name, b.name as business_name
FROM customer_cards cc
LEFT JOIN stamp_cards sc ON cc.stamp_card_id = sc.id  
LEFT JOIN businesses b ON sc.business_id = b.id
WHERE cc.id = 'test-card-id';
*/