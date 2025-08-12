-- 🗄️ DATABASE SCHEMA OPTIMIZATION ANALYSIS
-- RewardJar 4.0 - Performance and Structure Review
-- Date: January 15, 2025

-- ================================
-- 1. CURRENT SCHEMA ANALYSIS
-- ================================

-- Check table sizes and row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Analyze table relationships and foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ================================
-- 2. PERFORMANCE OPTIMIZATION INDEXES
-- ================================

-- Index for businesses table (most queried)
CREATE INDEX IF NOT EXISTS idx_businesses_status_active 
ON businesses(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id 
ON businesses(owner_id);

CREATE INDEX IF NOT EXISTS idx_businesses_created_at 
ON businesses(created_at DESC);

-- Index for stamp_cards table (frequent joins)
CREATE INDEX IF NOT EXISTS idx_stamp_cards_business_id 
ON stamp_cards(business_id);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_status_active 
ON stamp_cards(status) WHERE status = 'active';

-- Index for customer_cards table (high-volume queries)
CREATE INDEX IF NOT EXISTS idx_customer_cards_customer_id 
ON customer_cards(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_cards_stamp_card_id 
ON customer_cards(stamp_card_id) WHERE stamp_card_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_cards_membership_card_id 
ON customer_cards(membership_card_id) WHERE membership_card_id IS NOT NULL;

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_customer_cards_business_lookup 
ON customer_cards(stamp_card_id, customer_id) 
WHERE stamp_card_id IS NOT NULL;

-- ================================
-- 3. DATA INTEGRITY CONSTRAINTS
-- ================================

-- Ensure customer_cards references either stamp_card OR membership_card (not both)
ALTER TABLE customer_cards 
ADD CONSTRAINT chk_customer_cards_single_card_type 
CHECK (
    (stamp_card_id IS NOT NULL AND membership_card_id IS NULL) OR
    (stamp_card_id IS NULL AND membership_card_id IS NOT NULL)
);

-- Ensure valid stamp counts
ALTER TABLE customer_cards 
ADD CONSTRAINT chk_customer_cards_valid_stamps 
CHECK (current_stamps >= 0);

-- Ensure valid card expiry
ALTER TABLE stamp_cards 
ADD CONSTRAINT chk_stamp_cards_valid_expiry 
CHECK (card_expiry_days > 0 AND card_expiry_days <= 365);

-- ================================
-- 4. PERFORMANCE VIEWS FOR ADMIN DASHBOARD
-- ================================

-- Business performance summary view
CREATE OR REPLACE VIEW business_performance AS
SELECT 
    b.id,
    b.name,
    b.status,
    b.created_at,
    COUNT(DISTINCT sc.id) as total_stamp_cards,
    COUNT(DISTINCT mc.id) as total_membership_cards,
    COUNT(DISTINCT cc.customer_id) as unique_customers,
    COUNT(cc.id) as total_customer_cards,
    ROUND(AVG(CASE 
        WHEN sc.stamps_required > 0 
        THEN (cc.current_stamps::float / sc.stamps_required * 100)
        ELSE 0 
    END), 2) as avg_completion_rate
FROM businesses b
LEFT JOIN stamp_cards sc ON b.id = sc.business_id
LEFT JOIN membership_cards mc ON b.id = mc.business_id
LEFT JOIN customer_cards cc ON (cc.stamp_card_id = sc.id OR cc.membership_card_id = mc.id)
GROUP BY b.id, b.name, b.status, b.created_at;

-- Card performance summary view
CREATE OR REPLACE VIEW card_performance AS
SELECT 
    'stamp' as card_type,
    sc.id,
    sc.card_name as name,
    sc.business_id,
    b.name as business_name,
    sc.status,
    sc.created_at,
    COUNT(cc.id) as customer_count,
    ROUND(AVG(CASE 
        WHEN sc.stamps_required > 0 
        THEN (cc.current_stamps::float / sc.stamps_required * 100)
        ELSE 0 
    END), 2) as completion_rate,
    sc.stamps_required as target_value
FROM stamp_cards sc
JOIN businesses b ON sc.business_id = b.id
LEFT JOIN customer_cards cc ON cc.stamp_card_id = sc.id
GROUP BY sc.id, sc.card_name, sc.business_id, b.name, sc.status, sc.created_at, sc.stamps_required

UNION ALL

SELECT 
    'membership' as card_type,
    mc.id,
    mc.name,
    mc.business_id,
    b.name as business_name,
    mc.status,
    mc.created_at,
    COUNT(cc.id) as customer_count,
    ROUND(AVG(CASE 
        WHEN mc.total_sessions > 0 
        THEN (cc.current_stamps::float / mc.total_sessions * 100)
        ELSE 0 
    END), 2) as completion_rate,
    mc.total_sessions as target_value
FROM membership_cards mc
JOIN businesses b ON mc.business_id = b.id
LEFT JOIN customer_cards cc ON cc.membership_card_id = mc.id
GROUP BY mc.id, mc.name, mc.business_id, b.name, mc.status, mc.created_at, mc.total_sessions;

-- ================================
-- 5. ANALYTICS OPTIMIZATION
-- ================================

-- Create materialized view for dashboard metrics (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics AS
SELECT 
    COUNT(DISTINCT b.id) as total_businesses,
    COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) as active_businesses,
    COUNT(DISTINCT CASE WHEN b.is_flagged = true THEN b.id END) as flagged_businesses,
    COUNT(DISTINCT CASE WHEN b.card_requested = true THEN b.id END) as card_requests,
    COUNT(DISTINCT CASE WHEN b.created_at >= NOW() - INTERVAL '7 days' THEN b.id END) as new_this_week,
    COUNT(DISTINCT sc.id) + COUNT(DISTINCT mc.id) as total_cards,
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT cc.id) as total_customer_cards,
    ROUND(AVG(CASE 
        WHEN sc.stamps_required > 0 
        THEN (cc.current_stamps::float / sc.stamps_required * 100)
        ELSE 0 
    END), 2) as avg_completion_rate
FROM businesses b
LEFT JOIN stamp_cards sc ON b.id = sc.business_id
LEFT JOIN membership_cards mc ON b.id = mc.business_id
LEFT JOIN customer_cards cc ON (cc.stamp_card_id = sc.id OR cc.membership_card_id = mc.id)
LEFT JOIN customers c ON cc.customer_id = c.id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_metrics_unique 
ON dashboard_metrics ((1));

-- ================================
-- 6. CLEANUP AND MAINTENANCE
-- ================================

-- Remove unused columns (after data migration)
-- ALTER TABLE stamp_cards DROP COLUMN IF EXISTS name; -- Keep legacy for now
-- ALTER TABLE stamp_cards DROP COLUMN IF EXISTS total_stamps; -- Keep legacy for now
-- ALTER TABLE stamp_cards DROP COLUMN IF EXISTS reward_description; -- Keep legacy for now

-- Update table statistics
ANALYZE businesses;
ANALYZE stamp_cards;
ANALYZE membership_cards;
ANALYZE customer_cards;
ANALYZE customers;

-- ================================
-- 7. VERIFICATION QUERIES
-- ================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Test performance views
SELECT * FROM business_performance LIMIT 5;
SELECT * FROM card_performance LIMIT 5;
SELECT * FROM dashboard_metrics;

-- ================================
-- 8. SUCCESS MESSAGE
-- ================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database Schema Optimization Complete!';
  RAISE NOTICE '📊 Added performance indexes for admin queries';
  RAISE NOTICE '🔍 Created materialized views for dashboard metrics';
  RAISE NOTICE '🛡️ Added data integrity constraints';
  RAISE NOTICE '⚡ Optimized for high-volume customer_cards operations';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '1. Monitor query performance in production';
  RAISE NOTICE '2. Set up automated REFRESH MATERIALIZED VIEW dashboard_metrics;';
  RAISE NOTICE '3. Consider partitioning customer_cards if > 1M records';
  RAISE NOTICE '4. Monitor index usage with pg_stat_user_indexes';
END $$;