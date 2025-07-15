# Manual Test Guide - Customer Card Visibility Fix

## Test Data Created
- **Test Customer**: testcust@rewardjar.test / TestCust123!
- **Test Business**: testbiz@rewardjar.test / TestBiz123!
- **Test QR Code**: http://localhost:3000/join/40a834a2-88b0-48af-9573-ece1d491c2bc

## Test Steps

### Step 1: Test Customer Dashboard
1. Open http://localhost:3000/auth/login
2. Login as customer: testcust@rewardjar.test / TestCust123!
3. Should redirect to `/customer/dashboard`
4. **Expected**: Should see "Coffee Loyalty Card" from "Test Coffee Shop" with 3/10 stamps
5. **Previous Issue**: Was showing "No Loyalty Cards Yet"

### Step 2: Test Individual Card View
1. From customer dashboard, click "View Card" on the coffee card
2. Should redirect to `/customer/card/[cardId]`
3. **Expected**: Should see detailed card view with progress bar, wallet options, and business info
4. **Previous Issue**: Was showing "Error - Something went wrong"

### Step 3: Test QR Join Flow
1. Open new incognito window
2. Go to: http://localhost:3000/join/40a834a2-88b0-48af-9573-ece1d491c2bc
3. Click "Create Account & Join"
4. Create new customer account
5. Should auto-join the card and redirect to card view
6. **Expected**: Seamless flow from QR → signup → card view

### Step 4: Test Business Dashboard
1. Open http://localhost:3000/auth/login
2. Login as business: testbiz@rewardjar.test / TestBiz123!
3. Should redirect to `/business/dashboard`
4. **Expected**: Should see analytics and stamp card management

## What Was Fixed

### Issue 1: Data Structure Mismatch
**Problem**: React components expected `stamp_cards` and `businesses` to be arrays, but Supabase returns objects.

**Fix**: Updated both files to handle the correct structure:
```javascript
// Before (incorrect)
const stampCard = card.stamp_cards[0]
const business = stampCard.businesses[0]

// After (correct)
const stampCard = card.stamp_cards
const business = stampCard.businesses
```

### Issue 2: Database Query Structure
**Problem**: The Supabase query with `!inner` joins returns nested objects, not arrays.

**Fix**: Updated the data handling in:
- `src/app/customer/dashboard/page.tsx`
- `src/app/customer/card/[cardId]/page.tsx`

## Expected Results After Fix

1. **Customer Dashboard**: Shows all joined loyalty cards with progress bars
2. **Individual Card View**: Shows detailed card information with wallet options
3. **QR Join Flow**: Works seamlessly from scan to card visibility
4. **No More Errors**: "Cannot read properties of undefined" errors eliminated

## Verification Commands

```bash
# Test the database query directly
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testQuery() {
  const { data } = await supabase
    .from('customer_cards')
    .select(\`
      id,
      current_stamps,
      created_at,
      stamp_cards!inner (
        id,
        name,
        total_stamps,
        reward_description,
        businesses!inner (
          name
        )
      )
    \`)
    .limit(1);
  
  console.log('Query result:', JSON.stringify(data[0], null, 2));
}

testQuery();
"
```

## Success Criteria

✅ Customer dashboard shows loyalty cards instead of empty state
✅ Individual card pages load without errors
✅ QR join flow works end-to-end
✅ All wallet options are available
✅ Business dashboard remains functional 