# 🔐 RLS Policy Update Instructions for RewardJar 4.0

## 📋 Current Status
- ✅ **RLS is enabled** on core tables but missing policies
- ✅ **Anonymous access is blocked** (good security)
- ❌ **No policies exist** for businesses, customer_cards, customers, membership_cards
- ⚠️  **Tables showing "No data will be selectable via Supabase APIs"**

## 🎯 Solution: Apply RLS Policies

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your RewardJar project
3. Navigate to **SQL Editor**

### Step 2: Execute RLS Policy Script
1. Copy the entire content from `scripts/rls-policies-manual.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute all policies at once

### Step 3: Verify Installation
After running the script, check:

1. **Authentication → Policies** page should show:
   - ✅ `businesses` - 1 policy
   - ✅ `customer_cards` - 1 policy  
   - ✅ `customers` - 1 policy
   - ✅ `membership_cards` - 1 policy
   - ✅ `users` - 1 policy

2. **Tables should no longer show warnings** about "No data selectable"

3. **Run verification query** (last part of the SQL script):
   ```sql
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
   ```

### Expected Results:
```
Table Name           | RLS Enabled | Policies
---------------------|-------------|----------
businesses           | ✅ Yes      | 1
customer_cards       | ✅ Yes      | 1
customers            | ✅ Yes      | 1
membership_cards     | ✅ Yes      | 1
session_usage        | ✅ Yes      | 1
stamp_cards          | ✅ Yes      | 1
users                | ✅ Yes      | 1
wallet_update_queue  | ✅ Yes      | 1
```

## 🧪 Test Authentication After Update

### Test 1: Business User Access
1. Sign up/login as a business user in your app
2. Navigate to `/business/dashboard`
3. Should see dashboard data without 401/403 errors

### Test 2: API Endpoints
```bash
# Test business dashboard API (should work when authenticated)
curl http://localhost:3000/api/business/dashboard

# Test auth status (should work)
curl http://localhost:3000/api/auth/status
```

### Test 3: Database Access Patterns
- ✅ Business owners can access their businesses
- ✅ Business owners can access their stamp cards
- ✅ Business owners can see customer cards for their cards
- ✅ Customers can access their own customer profile
- ✅ Customers can access their own customer cards
- ❌ Anonymous users cannot access any data
- ❌ Users cannot access other users' data

## 🔧 Policy Details

The RLS policies implement these access rules:

### Business Users (role_id: 2)
- Can manage their own `businesses` records
- Can manage `stamp_cards` for their businesses
- Can view `customer_cards` for their stamp cards
- Can manage `session_usage` for their businesses

### Customer Users (role_id: 3)  
- Can manage their own `customers` profile
- Can view their own `customer_cards`
- Can view their own `session_usage` records

### All Users
- Can view and update their own `users` record
- Cannot access other users' data
- Service role bypasses all restrictions (for admin operations)

## 🚨 Important Notes

1. **Service Role**: Always has full access (bypasses RLS)
2. **Anonymous Access**: Completely blocked (security feature)
3. **Auth Context**: Policies use `auth.uid()` to identify current user
4. **Dual Card Support**: Policies support both loyalty and membership cards
5. **Legacy Tables**: `stamps` and `rewards` tables also have policies

## 🔄 Troubleshooting

### If you see "No policies created yet":
1. Make sure you executed the complete SQL script
2. Refresh the Supabase dashboard
3. Check for SQL errors in the editor

### If authentication still fails:
1. Verify user has correct `role_id` (2 for business, 3 for customer)
2. Check that user exists in `users` table
3. Verify JWT token is being passed correctly
4. Check browser console for detailed error messages

### If MCP tools don't work:
- This is expected - use the manual SQL script approach
- MCP integration issues don't affect the RLS policy setup
- The manual approach is more reliable for policy updates

---

**Result**: After applying these policies, your RewardJar 4.0 authentication flow will work correctly with proper data access control. 🎯 