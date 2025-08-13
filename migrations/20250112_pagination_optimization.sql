-- Pagination Performance Optimization Migration
-- Following Supabase best practices for efficient pagination

-- ==================================================
-- INDEXES FOR EFFICIENT PAGINATION
-- ==================================================

-- Businesses table indexes
CREATE INDEX IF NOT EXISTS idx_businesses_created_at_desc 
ON businesses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_status_created_at 
ON businesses (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_businesses_name_search 
ON businesses USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_businesses_email_search 
ON businesses USING gin(to_tsvector('english', contact_email));

-- Stamp cards table indexes
CREATE INDEX IF NOT EXISTS idx_stamp_cards_created_at_desc 
ON stamp_cards (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_status_created_at 
ON stamp_cards (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_business_id_created_at 
ON stamp_cards (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stamp_cards_name_search 
ON stamp_cards USING gin(to_tsvector('english', card_name));

-- Membership cards table indexes
CREATE INDEX IF NOT EXISTS idx_membership_cards_created_at_desc 
ON membership_cards (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_cards_status_created_at 
ON membership_cards (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_cards_business_id_created_at 
ON membership_cards (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_cards_name_search 
ON membership_cards USING gin(to_tsvector('english', name));

-- Customer cards table indexes (for customer management pagination)
CREATE INDEX IF NOT EXISTS idx_customer_cards_created_at_desc 
ON customer_cards (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_cards_business_id_created_at 
ON customer_cards (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_cards_user_id_created_at 
ON customer_cards (user_id, created_at DESC);

-- Profiles table indexes (for user management)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc 
ON profiles (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at 
ON profiles (role_id, created_at DESC);

-- ==================================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS
-- ==================================================

-- Index only active businesses for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_businesses_active_created_at 
ON businesses (created_at DESC) 
WHERE status = 'active';

-- Index only active cards
CREATE INDEX IF NOT EXISTS idx_stamp_cards_active_created_at 
ON stamp_cards (created_at DESC) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_membership_cards_active_created_at 
ON membership_cards (created_at DESC) 
WHERE status = 'active';

-- Index flagged businesses for quick admin access
CREATE INDEX IF NOT EXISTS idx_businesses_flagged_created_at 
ON businesses (created_at DESC) 
WHERE is_flagged = true;

-- ==================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==================================================

-- Business + status + flagged combination
CREATE INDEX IF NOT EXISTS idx_businesses_status_flagged_created_at 
ON businesses (status, is_flagged, created_at DESC);

-- Card + business + status combination  
CREATE INDEX IF NOT EXISTS idx_stamp_cards_business_status_created_at 
ON stamp_cards (business_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_cards_business_status_created_at 
ON membership_cards (business_id, status, created_at DESC);

-- Customer cards with card type filtering
CREATE INDEX IF NOT EXISTS idx_customer_cards_stamp_card_created_at 
ON customer_cards (stamp_card_id, created_at DESC) 
WHERE stamp_card_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_cards_membership_card_created_at 
ON customer_cards (membership_card_id, created_at DESC) 
WHERE membership_card_id IS NOT NULL;

-- ==================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ==================================================

ANALYZE businesses;
ANALYZE stamp_cards; 
ANALYZE membership_cards;
ANALYZE customer_cards;
ANALYZE profiles;

-- ==================================================
-- CREATE PAGINATION HELPER FUNCTIONS
-- ==================================================

-- Function to get total count estimate for large tables (faster than exact count)
CREATE OR REPLACE FUNCTION get_table_estimate(table_name text)
RETURNS bigint AS $$
DECLARE
    row_estimate bigint;
BEGIN
    EXECUTE format('SELECT reltuples::bigint FROM pg_class WHERE relname = %L', table_name)
    INTO row_estimate;
    
    RETURN COALESCE(row_estimate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get paginated results with cursor-based navigation
CREATE OR REPLACE FUNCTION get_cursor_page(
    table_name text,
    cursor_column text DEFAULT 'id',
    cursor_value text DEFAULT NULL,
    page_size int DEFAULT 25,
    direction text DEFAULT 'next'
)
RETURNS TABLE(query_sql text) AS $$
BEGIN
    IF cursor_value IS NULL THEN
        -- First page
        RETURN QUERY SELECT format(
            'SELECT * FROM %I ORDER BY %I %s LIMIT %s',
            table_name,
            cursor_column,
            CASE WHEN direction = 'next' THEN 'ASC' ELSE 'DESC' END,
            page_size
        );
    ELSE
        -- Subsequent pages
        RETURN QUERY SELECT format(
            'SELECT * FROM %I WHERE %I %s %L ORDER BY %I %s LIMIT %s',
            table_name,
            cursor_column,
            CASE WHEN direction = 'next' THEN '>' ELSE '<' END,
            cursor_value,
            cursor_column,
            CASE WHEN direction = 'next' THEN 'ASC' ELSE 'DESC' END,
            page_size
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- PERFORMANCE MONITORING VIEWS
-- ==================================================

-- View to monitor pagination query performance
CREATE OR REPLACE VIEW pagination_performance AS
SELECT 
    schemaname,
    tablename,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexrelname LIKE 'idx_%created_at%'
ORDER BY idx_scan DESC;

-- View to monitor slow pagination queries
CREATE OR REPLACE VIEW slow_pagination_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%LIMIT%'
   OR query LIKE '%OFFSET%'
   OR query LIKE '%range%'
ORDER BY mean_time DESC;

-- ==================================================
-- COMMENTS FOR DOCUMENTATION
-- ==================================================

COMMENT ON INDEX idx_businesses_created_at_desc IS 'Primary index for business pagination by creation date';
COMMENT ON INDEX idx_stamp_cards_created_at_desc IS 'Primary index for stamp card pagination by creation date';
COMMENT ON INDEX idx_membership_cards_created_at_desc IS 'Primary index for membership card pagination by creation date';
COMMENT ON INDEX idx_customer_cards_created_at_desc IS 'Primary index for customer card pagination by creation date';

COMMENT ON FUNCTION get_table_estimate(text) IS 'Returns estimated row count for large tables to avoid slow COUNT(*) queries';
COMMENT ON FUNCTION get_cursor_page(text, text, text, int, text) IS 'Generates cursor-based pagination SQL for better performance on large datasets';

COMMENT ON VIEW pagination_performance IS 'Monitor pagination index usage and performance';
COMMENT ON VIEW slow_pagination_queries IS 'Identify slow pagination queries for optimization';