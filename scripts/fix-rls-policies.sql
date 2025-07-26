-- Fix RLS Policies for User Signup
-- This script fixes the Row Level Security policies that are preventing user registration

-- First, let's check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'businesses', 'roles')
ORDER BY tablename;

-- Check existing policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Temporarily disable RLS on users table for signup process
-- We'll create a more permissive policy for user creation
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view and update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for own data" ON public.users;

-- Create new permissive policies for user signup
-- Allow users to insert their own data during signup
CREATE POLICY "allow_user_signup" ON public.users
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "allow_user_read_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "allow_user_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Re-enable RLS with new policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify businesses table RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'businesses';

-- Update businesses policies to be more permissive for creation
DROP POLICY IF EXISTS "Business owners manage their business" ON public.businesses;

-- Allow users to create businesses
CREATE POLICY "allow_business_creation" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow business owners to manage their business
CREATE POLICY "allow_business_owner_access" ON public.businesses
    FOR ALL USING (auth.uid() = owner_id);

-- Check that roles table doesn't have restrictive RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'roles';

-- Make sure roles can be read by anyone (needed for signup)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_roles_read" ON public.roles;
CREATE POLICY "allow_roles_read" ON public.roles
    FOR SELECT USING (true);

-- Verify the fix by checking table permissions
SELECT 
    t.table_name,
    t.is_insertable_into,
    r.rowsecurity
FROM information_schema.tables t
LEFT JOIN pg_tables r ON t.table_name = r.tablename
WHERE t.table_schema = 'public' 
AND t.table_name IN ('users', 'businesses', 'roles');

-- Show final policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'businesses', 'roles')
ORDER BY tablename, policyname; 