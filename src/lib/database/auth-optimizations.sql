-- Auth Performance Optimizations
-- Run this in Supabase SQL Editor to improve authentication performance

-- 1. Ensure users table has proper indexing
CREATE INDEX IF NOT EXISTS idx_users_id_role 
ON users(id, role_id);

-- 2. Add index for email lookups (used in dev login)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- 3. Create partial index for active users only (if you have a status field)
-- CREATE INDEX IF NOT EXISTS idx_users_active 
-- ON users(id, role_id) 
-- WHERE status = 'active';

-- 4. Add RLS policy optimization comment
COMMENT ON TABLE users IS 'Auth table with optimized indexes for role lookups. Last optimized: 2025-08-11';

-- 5. Optional: Create a view for faster role resolution
CREATE OR REPLACE VIEW user_roles_fast AS
SELECT 
  u.id,
  u.email,
  u.role_id,
  CASE 
    WHEN u.role_id = 1 THEN 'admin'
    WHEN u.role_id = 2 THEN 'business'
    WHEN u.role_id = 3 THEN 'customer'
    ELSE 'unknown'
  END as role_name
FROM users u
WHERE u.role_id IS NOT NULL;

-- Grant necessary permissions
GRANT SELECT ON user_roles_fast TO authenticated;
GRANT SELECT ON user_roles_fast TO service_role;