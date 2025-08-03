# 🔧 FINAL SPEC: Debug Guide - RewardJar 4.0 Common Issues & Solutions

**Status**: ✅ **COMPREHENSIVE DEBUG GUIDE** - All Known Issues & Fixes  
**Updated**: January 2, 2025  
**Next.js Version**: 15+ with App Router  
**Supabase Integration**: Latest with MCP Layer

⸻

## 🚨 Critical Errors & Fixes

### Error 1: Next.js 15+ Params Promise Issue

#### Problem
```typescript
// ❌ BROKEN - Next.js 15+ Error
export default function Page({ params }: { params: { id: string } }) {
  const businessId = params.id // TypeError: Cannot read properties of Promise
}
```

#### Root Cause
In Next.js 15+, `params` is now a Promise and must be unwrapped before accessing properties.

#### Solution
```typescript
// ✅ FIXED - Client Component
'use client'
import { use } from 'react'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = use(params) // Unwrap Promise with React.use()
}

// ✅ FIXED - Server Component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params // Unwrap Promise with await
}
```

#### Files Fixed
- `src/app/admin/businesses/[id]/page.tsx` ✅
- `src/app/business/cards/[id]/page.tsx` (if exists)
- All dynamic route components

⸻

### Error 2: Repeated Redirects to `?error=business_not_found`

#### Problem
```
URL keeps redirecting: /admin/businesses → /admin/businesses?error=business_not_found
Console: "AdminLayoutClient Debug: isLoading: true, user: null, isAdmin: false"
```

#### Root Cause Analysis
1. **Auth Race Condition**: Supabase session hydration takes time
2. **RLS Policy Gap**: Missing admin SELECT policy on businesses table
3. **Wrong Client Usage**: Using client-side Supabase in admin context
4. **Premature Rendering**: Components render before auth state resolves

#### Solution Applied
```typescript
// ✅ FIXED - Enhanced Session Hydration
const checkAuth = async () => {
  let session = null
  let attempts = 0
  const maxAttempts = 3
  
  while (!session && attempts < maxAttempts) {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    session = currentSession
    attempts++
    
    if (!session && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for hydration
    }
  }
}

// ✅ FIXED - Enhanced Loading Guards
if (isLoading) {
  return <LoadingState />
}

if (requireAuth && isAdmin && !user) {
  return <LoadingState /> // Wait for complete auth state
}

// ✅ FIXED - Use Admin Client for Admin Operations
const supabase = createAdminClient() // Bypasses RLS
```

#### Database Fix Applied
```sql
-- ✅ FIXED - Added Missing Admin RLS Policy
CREATE POLICY "Admin can view all businesses" ON businesses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_id = 1)
  );
```

#### **Files Fixed**
- `src/lib/hooks/use-admin-auth.ts` ✅
- `src/components/layouts/AdminLayoutClient.tsx` ✅
- `src/app/admin/businesses/[id]/page.tsx` ✅
- Database RLS policies ✅

---

### **Error 3: Service Role Key Misuse in Browser**

#### **Problem**
```typescript
// ❌ SECURITY RISK - Service role key exposed to browser
'use client'
import { createAdminClient } from '@/lib/supabase/admin-client'

export default function ClientComponent() {
  const supabase = createAdminClient() // NEVER DO THIS!
}
```

#### **Root Cause**
Service role key bypasses all security and should NEVER be exposed to client-side code.

#### **Solution**
```typescript
// ✅ CORRECT - Server Component Only
import { createAdminClient } from '@/lib/supabase/admin-client'

export default async function ServerComponent() {
  const supabase = createAdminClient() // ✅ Server-side only
}

// ✅ CORRECT - API Route Only
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET() {
  const supabase = createAdminClient() // ✅ API route only
}

// ✅ CORRECT - Client Component Data Fetching
'use client'
import { useAdminBusinesses } from '@/lib/hooks/use-admin-data'

export default function ClientComponent() {
  const { data, error, isLoading } = useAdminBusinesses() // ✅ Via SWR hooks
}
```

#### **Security Enforcement**
- `createAdminClient()` only in server components and API routes
- Client components use SWR hooks that call API routes
- Service role key never exposed to browser

---

### **Error 4: Auth State Flash/Premature Redirects**

#### **Problem**
```
Flash of "Access Denied" before proper auth resolution
Premature redirects during auth state transitions
```

#### **Root Cause**
Components rendering with incomplete auth state during Supabase session hydration.

#### **Solution**
```typescript
// ✅ FIXED - Minimum Loading Time
const performAuthCheck = async () => {
  const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200))
  const authCheckPromise = checkAuth()
  
  await Promise.all([authCheckPromise, minLoadingTime]) // Prevent flash
}

// ✅ FIXED - Component Lifecycle Protection
useEffect(() => {
  let isMounted = true
  
  const authCheck = async () => {
    // Auth logic here
    if (!isMounted) return // Prevent stale updates
  }
  
  return () => {
    isMounted = false
  }
}, [])
```

---

### **Error 5: MCP Auth Layer Timing Issues**

#### **Problem**
```
MCP layer returns success but frontend shows isAdmin: false
Auth-check API succeeds but layout shows access denied
```

#### **Root Cause**
Multiple async layers (Supabase → MCP → API → Frontend) with timing mismatches.

#### **Solution**
```typescript
// ✅ FIXED - Enhanced Auth Flow
export async function getAuthContext(): Promise<MCPResponse<MCPAuthContext>> {
  const { user, error } = await getServerUser()
  
  if (error || !user) {
    return { success: false, error: 'Authentication required' }
  }
  
  // Get user role with proper error handling
  const supabase = createAdminClient()
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single()
  
  if (userError) {
    return { success: false, error: 'Failed to get user role' }
  }
  
  return {
    success: true,
    data: {
      userId: user.id,
      userRole: userData.role_id,
      // ... additional context
    }
  }
}
```

---

## 🔧 **DEBUGGING WORKFLOWS**

### **Debug Auth Issues**
```bash
# 1. Check auth state in browser console
# Look for: "AdminLayoutClient Debug: { isAdmin, isLoading, user }"

# 2. Test auth-check API directly
curl -s "http://localhost:3000/api/admin/auth-check" | jq '.'
# Expected: { "success": true, "data": { "isAdmin": true } }

# 3. Verify database user role
# In Supabase SQL Editor:
SELECT u.email, u.role_id FROM users u WHERE u.email = 'your-admin-email';
# Expected: role_id = 1 for admin users
```

### **Debug Business Data Issues**
```bash
# 1. Check if business exists
curl -s "http://localhost:3000/api/admin/businesses-simple" | jq '.data | length'
# Expected: Number > 0

# 2. Test specific business ID
curl -s "http://localhost:3000/api/admin/businesses-simple" | jq '.data[] | select(.id == "business-id-here")'
# Expected: Business object or null

# 3. Check RLS policies
# In Supabase SQL Editor:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'businesses';
# Expected: Admin policies for SELECT operations
```

### **Debug Route Params Issues**
```typescript
// Add debug logging to components
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  console.log('🔍 Raw params:', params) // Should show Promise object
  
  const { id } = use(params)
  console.log('🔍 Unwrapped ID:', id) // Should show actual ID string
  
  // Rest of component logic
}
```

---

## 🛡️ **SECURITY BEST PRACTICES**

### **Supabase Client Usage Rules**
```typescript
// ✅ CORRECT PATTERNS

// 1. Client Components - Authentication Only
'use client'
import { createClient } from '@/lib/supabase/client'

export default function AuthComponent() {
  const supabase = createClient()
  // Only use for: signIn, signOut, auth state changes
}

// 2. Server Components - User Context
import { createServerClient } from '@/lib/supabase/server-only'

export default async function ServerComponent() {
  const supabase = await createServerClient()
  // Respects RLS, has user session context
}

// 3. API Routes - Admin Operations
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function GET() {
  const supabase = createAdminClient()
  // Bypasses RLS, full database access
}

// 4. Client Data Fetching - SWR Hooks
'use client'
import { useAdminBusinesses } from '@/lib/hooks/use-admin-data'

export default function DataComponent() {
  const { data } = useAdminBusinesses()
  // Secure data fetching via API routes
}
```

### **Environment Variable Security**
```bash
# ✅ CORRECT - Server-only variables
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Never expose to client!

# ✅ CORRECT - Public variables
NEXT_PUBLIC_SUPABASE_URL=https://... # Safe for client

# ❌ NEVER DO THIS
NEXT_PUBLIC_SERVICE_ROLE_KEY=... # Security breach!
```

⸻

## 📋 Testing & Validation

### Auth Flow Testing
```bash
# Test complete auth flow
curl -s "http://localhost:3000/api/admin/auth-check" \
  -H "Cookie: sb-access-token=your-token" | jq '.'

# Expected response:
{
  "success": true,
  "data": {
    "isAdmin": true,
    "user": { "id": "...", "role": 1 }
  }
}
```

### Route Params Testing
```typescript
// Test in browser console
console.log('Testing params access...')

// Should work in Next.js 15+
const testParams = async () => {
  const params = Promise.resolve({ id: 'test-id' })
  const { id } = await params
  console.log('✅ Params unwrapped:', id)
}

testParams()
```

### Database Access Testing
```sql
-- Test admin access to businesses
SELECT COUNT(*) FROM businesses;
-- Should return total count for admin users

-- Test RLS policies
SET ROLE authenticated;
SELECT COUNT(*) FROM businesses;
-- Should respect user's access level
```

---

## 🎯 Quick Fixes Checklist

### For Next.js 15+ Params Issues
- [ ] Add `use` import from React
- [ ] Change params type to `Promise<{ id: string }>`
- [ ] Unwrap params with `use(params)` or `await params`
- [ ] Test dynamic routes work correctly

### **For Auth Redirect Loops**
- [ ] Check `useAdminAuth` has retry logic
- [ ] Verify admin RLS policies exist
- [ ] Ensure admin client used in server contexts
- [ ] Add loading guards in layouts

### **For Service Role Security**
- [ ] Audit all `createAdminClient()` usage
- [ ] Ensure only in server components/API routes
- [ ] Replace client-side admin calls with SWR hooks
- [ ] Verify environment variables are server-only

### **For MCP Integration Issues**
- [ ] Test auth-check API independently
- [ ] Verify user role in database
- [ ] Check MCP auth context flow
- [ ] Validate session hydration timing

---

## 🚀 **PRODUCTION DEPLOYMENT CHECKLIST**

### **Pre-Deployment Validation**
- [ ] All params unwrapped correctly (Next.js 15+)
- [ ] No service role keys in client code
- [ ] Auth flows tested end-to-end
- [ ] RLS policies properly configured
- [ ] MCP integration validated
- [ ] Error boundaries implemented
- [ ] Loading states prevent flashing

### **Post-Deployment Monitoring**
- [ ] Monitor auth success rates
- [ ] Track redirect loop incidents
- [ ] Validate database query performance
- [ ] Check error logs for params issues
- [ ] Verify wallet generation success rates

---

**🎉 This debug guide covers all known issues in RewardJar 4.0 with Next.js 15+ and provides comprehensive solutions for production-ready deployment.**