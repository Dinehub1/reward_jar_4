-- RewardJar 4.0 - Admin User Setup Script
-- Run this AFTER the admin users have signed up through the normal auth system

-- Step 1: Ensure admin role exists
INSERT INTO roles (id, name) VALUES (1, 'admin') 
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update role constraint to allow admin role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_id_check;
ALTER TABLE users ADD CONSTRAINT users_role_id_check CHECK (role_id IN (1, 2, 3));

-- Step 3: Update existing users to admin role (run after they sign up)
-- Replace the email addresses with actual admin emails after signup

UPDATE users 
SET role_id = 1 
WHERE email IN (
  'palaknagar1994@gmail.com',
  'kukrejajaydeep@gmail.com'
);

-- Step 4: Verify admin users
SELECT 
  id,
  email,
  role_id,
  created_at,
  CASE 
    WHEN role_id = 1 THEN 'Admin'
    WHEN role_id = 2 THEN 'Business'
    WHEN role_id = 3 THEN 'Customer'
  END as role_name
FROM users 
WHERE role_id = 1
ORDER BY created_at;

-- Step 5: Check roles table
SELECT * FROM roles ORDER BY id; 