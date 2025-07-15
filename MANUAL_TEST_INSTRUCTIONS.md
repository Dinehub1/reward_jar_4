# 🧪 Manual Testing Instructions - Customer Join Flow

## ✅ Prerequisites
- Development server running on `http://localhost:3000`
- All health checks passing (run `curl http://localhost:3000/api/health/wallet`)

## 🎯 Complete Customer Journey Test

### Step 1: Create a Business Card
1. Visit `http://localhost:3000/business/stamp-cards/new`
2. Fill out the form:
   - Name: "Test Coffee Card"
   - Total Stamps: 10
   - Reward: "Free Coffee"
3. Click "Create Card"
4. Note the card ID from the URL or success message

### Step 2: View QR Code
1. Go to `http://localhost:3000/business/stamp-cards`
2. Find your created card
3. Note the QR code displayed
4. Copy the join URL (should be `/join/[cardId]`)

### Step 3: Test Customer Join Flow
1. **Open new incognito/private window**
2. Visit the join URL: `http://localhost:3000/join/[cardId]`
3. Should see card details with "Create Account & Join" button
4. Click "Create Account & Join"

### Step 4: Customer Signup
1. Should redirect to customer signup page
2. Fill out form with test data:
   - Name: "Test Customer"
   - Email: "test@customer.com"
   - Password: "password123"
3. Click "Sign Up"

### Step 5: Expected Auto-Join Flow
**If email confirmation is disabled:**
- Should redirect back to `/join/[cardId]?autoJoin=true`
- Should see "✨ Auto-joining you to this loyalty program..."
- Should automatically join and redirect to `/customer/card/[cardId]`

**If email confirmation is enabled:**
- Should redirect to login page with confirmation message
- After confirming email, login should redirect to join page
- Auto-join should trigger

### Step 6: Verify Join Success
1. Should be on `/customer/card/[cardId]` page
2. Should see card details with wallet options (Apple, Google, PWA)
3. Visit `/customer/dashboard`
4. Should see the joined card in "Your Cards" section
5. Stats should show: Total Cards: 1, Completed: 0, Total Stamps: 0

### Step 7: Test Wallet Preview
1. Visit `/test/wallet-preview`
2. Should see the joined card in the list
3. Should be able to generate wallet passes

## 🔧 Troubleshooting

### If Auto-Join Doesn't Work:
1. Check browser console for errors
2. Look for "Auth state changed" logs
3. Verify the URL has `?autoJoin=true` parameter
4. Try manually clicking "Join Loyalty Program" button

### If Cards Don't Show in Dashboard:
1. Check if customer profile was created properly
2. Verify the join API was called successfully
3. Check database for `customer_cards` entry
4. Refresh the dashboard page

### If Wallet Preview is Empty:
1. Ensure cards are properly joined
2. Check wallet health endpoint
3. Verify customer has joined cards in database

## 🎉 Success Criteria
- ✅ Customer can scan QR and reach join page
- ✅ Customer can sign up from join page
- ✅ Auto-join works after authentication
- ✅ Card appears in customer dashboard
- ✅ Card shows in wallet preview
- ✅ All wallet types (Apple, Google, PWA) are available
- ✅ No crashes or undefined errors

## 📊 Database Verification
After successful join, check these tables:
- `users` - Should have customer entry with `role_id = 3`
- `customers` - Should have customer profile
- `customer_cards` - Should have join entry linking customer to card
- `stamp_cards` - Should have the business card

## 🚨 Common Issues
1. **"User already registered"** - Use different email or login instead
2. **"Card not found"** - Verify card ID is correct and card is active
3. **"Authentication required"** - Check if session is properly maintained
4. **Empty dashboard** - Check if auto-join actually completed

---

**Note**: This flow should work end-to-end without any manual intervention once the customer clicks "Create Account & Join". 