# Admin User Setup Instructions

## Overview
The card creation pages have been moved to the admin section (`/admin/cards/stamp/new` and `/admin/cards/membership/new`) and now include business selection functionality.

## Required Admin Users for Testing
- **palaknagar1994@gmail.com** 
- **kukrejajaydeep@gmail.com**

## Setup Steps

### Step 1: Create Admin Accounts via Auth System
Both admin users need to sign up through the normal RewardJar auth system first:

1. Go to `/auth/signup`
2. Sign up with the email addresses above
3. Complete email verification
4. Initial signup will create them as regular users (role_id: 3)

### Step 2: Upgrade to Admin Role
After both users have successfully signed up, run the admin setup script:

```bash
# Execute the admin user script in Supabase SQL Editor or via MCP
psql -f scripts/create-admin-users.sql

# OR via MCP
mcp_supabase_execute_sql --query="$(cat scripts/create-admin-users.sql)"
```

### Step 3: Verification
Check that admin users were created successfully:

```sql
-- Should return both admin users with role_id = 1
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
WHERE email IN ('palaknagar1994@gmail.com', 'kukrejajaydeep@gmail.com')
ORDER BY email;
```

## Admin Card Creation Features

### New Features Added:
1. **Business Selection Dropdown**: Admins can select which business to create cards for
2. **Live Business List**: Fetches all active businesses from database
3. **Visual Validation**: Green/red indicators for business selection
4. **Enhanced Form Validation**: Includes business selection in form validation

### Usage:
1. Login as admin user (role_id: 1)
2. Navigate to `/admin/cards/stamp/new` or `/admin/cards/membership/new`
3. Select a business from the dropdown
4. Fill out card details
5. Create card for the selected business

### Routes Updated:
- **Old**: `/business/stamp-cards/new` → **New**: `/admin/cards/stamp/new`
- **Old**: `/business/memberships/new` → **New**: `/admin/cards/membership/new`

### All Internal Links Updated:
- Business dashboard dropdown
- Business onboarding flow
- Stamp cards management page
- Memberships management page
- Documentation files

## Testing the Business Selection

### Verify Business Dropdown:
```sql
-- Should return list of active businesses
SELECT id, name, status, logo_url 
FROM businesses 
WHERE status = 'active' 
ORDER BY name;
```

### Test Card Creation:
1. Login as admin
2. Go to admin card creation page
3. Select business from dropdown (should show business name and logo)
4. Create card
5. Verify card is associated with selected business:

```sql
-- For stamp cards
SELECT sc.*, b.name as business_name 
FROM stamp_cards sc
JOIN businesses b ON sc.business_id = b.id
ORDER BY sc.created_at DESC
LIMIT 5;

-- For membership cards  
SELECT mc.*, b.name as business_name
FROM membership_cards mc  
JOIN businesses b ON mc.business_id = b.id
ORDER BY mc.created_at DESC
LIMIT 5;
```

## Troubleshooting

### Issue: Admin users showing as regular users
**Solution**: Make sure the role constraint was updated and run the UPDATE query to set role_id = 1

### Issue: No businesses showing in dropdown
**Solution**: Check that there are active businesses in the database:
```sql
SELECT COUNT(*) as active_businesses FROM businesses WHERE status = 'active';
```

### Issue: Business selection not working
**Solution**: Check browser console for errors and verify the Select component is properly imported

## Security Notes
- Admin users have full access to create cards for any business
- Business selection is validated on both client and server side
- All admin actions should be logged for audit purposes (future enhancement)

---

**Status**: ✅ Admin card creation pages ready for testing  
**Next**: Implement proper admin layout and additional admin features 