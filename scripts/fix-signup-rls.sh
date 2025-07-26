#!/bin/bash

# Fix RLS Policies for RewardJar 4.0 Signup Issues
# This script fixes the Row Level Security policies preventing user registration

echo "🔧 Fixing Supabase RLS Policies for User Signup..."

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Supabase environment variables not found"
    echo "Please ensure .env.local contains:"
    echo "NEXT_PUBLIC_SUPABASE_URL=..."
    echo "SUPABASE_SERVICE_ROLE_KEY=..."
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql_query="$1"
    local response
    
    response=$(curl -s -X POST \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$sql_query\"}")
    
    echo "$response"
}

# Alternative method using psql if available
execute_sql_direct() {
    local sql_query="$1"
    
    # Extract project ID from URL
    PROJECT_ID=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's/.*\/\/\([^.]*\).*/\1/')
    
    echo "Executing SQL: $sql_query"
    
    # Use curl to execute SQL via Supabase API
    curl -X POST \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/query" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": \"$sql_query\"}" || {
        
        # Fallback: Try with different endpoint
        curl -X POST \
            "$NEXT_PUBLIC_SUPABASE_URL/sql" \
            -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$sql_query\"}"
    }
}

echo "🔍 Step 1: Checking current RLS status..."

# Check current tables and RLS status
execute_sql_direct "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'businesses', 'roles');"

echo "🛠️  Step 2: Fixing users table RLS policies..."

# Fix users table policies
execute_sql_direct "
-- Drop existing restrictive policies
DROP POLICY IF EXISTS \"Users can view and update their own data\" ON public.users;
DROP POLICY IF EXISTS \"Users can manage their own data\" ON public.users;

-- Create permissive signup policy
CREATE POLICY \"allow_user_signup\" ON public.users
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY \"allow_user_read_own\" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data  
CREATE POLICY \"allow_user_update_own\" ON public.users
    FOR UPDATE USING (auth.uid() = id);
"

echo "🏢 Step 3: Fixing businesses table RLS policies..."

# Fix businesses table policies
execute_sql_direct "
-- Drop existing restrictive policies
DROP POLICY IF EXISTS \"Business owners manage their business\" ON public.businesses;

-- Allow users to create businesses
CREATE POLICY \"allow_business_creation\" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow business owners to manage their business
CREATE POLICY \"allow_business_owner_access\" ON public.businesses
    FOR ALL USING (auth.uid() = owner_id);
"

echo "👥 Step 4: Fixing roles table RLS policies..."

# Fix roles table policies
execute_sql_direct "
-- Make sure roles can be read by anyone (needed for signup)
DROP POLICY IF EXISTS \"allow_roles_read\" ON public.roles;
CREATE POLICY \"allow_roles_read\" ON public.roles
    FOR SELECT USING (true);
"

echo "✅ Step 5: Verifying the fix..."

# Verify the policies are in place
execute_sql_direct "
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'businesses', 'roles')
ORDER BY tablename, policyname;
"

echo "🎉 RLS Policy fixes completed!"
echo ""
echo "🚀 You can now try signing up again:"
echo "   1. Go to http://localhost:3000/auth/reset"
echo "   2. Clear your data and retry signup"
echo "   3. Or try http://localhost:3000/auth/signup directly"
echo ""
echo "📋 If issues persist, check the console output above for any errors." 