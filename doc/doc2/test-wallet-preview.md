# Test Wallet Preview - Admin Card Management

**Updated**: July 25, 2025  
**Status**: ✅ Enhanced for Admin-Created Cards  
**Route**: `/test/wallet-preview`

---

## 🎯 Admin Card Creation Testing

### Test Cases for Admin-Created Cards

The `/test/wallet-preview` interface now supports testing cards created via the admin panel across multiple businesses.

#### Test Scenario 1: Admin-Created Stamp Cards
```bash
# Test stamp card created by admin for Business A
curl -s "http://localhost:3000/test/wallet-preview?customerCardId=admin-stamp-card-uuid&businessId=business-a-uuid" | grep "stamp"

# Expected: Green theme, stamp progress, business A branding
```

#### Test Scenario 2: Admin-Created Membership Cards
```bash
# Test membership card created by admin for Business B
curl -s "http://localhost:3000/test/wallet-preview?customerCardId=admin-membership-card-uuid&businessId=business-b-uuid" | grep "membership"

# Expected: Indigo theme, session progress, business B branding
```

#### Test Scenario 3: Multi-Business Card Testing
```bash
# Test cards from different businesses created by same admin
curl -s "http://localhost:3000/test/wallet-preview?testMode=multi-business" 

# Expected: Dropdown to select from multiple businesses with admin-created cards
```

---

## 🧪 Enhanced Testing Interface

### Multi-Business Simulation ✅ ACTIVE

The test interface now includes:

1. **Business Selector**: Dropdown to choose from businesses with admin-created cards
2. **Card Type Tabs**: Separate tabs for stamp cards and membership cards per business
3. **Admin Context**: Shows which admin created each card
4. **Cross-Business Testing**: Test wallet generation across different business contexts

### Test Data Generation

```bash
# Generate test data for admin card testing
curl -X POST http://localhost:3000/api/dev-seed/admin-cards \
  -H "Content-Type: application/json" \
  -d '{
    "businesses": 3,
    "stampCardsPerBusiness": 2,
    "membershipCardsPerBusiness": 1,
    "customersPerCard": 5
  }'

# Expected: Creates test ecosystem with admin-created cards across multiple businesses
```

### Validation Checks

The test interface now validates:
- ✅ Cards are created by admin users (role_id = 1)
- ✅ Cards are properly assigned to businesses
- ✅ Business owners can manage assigned cards
- ✅ Customers can join cards from any business
- ✅ Wallet generation works across all business contexts

---

## 📱 Cross-Business Wallet Testing

### Apple Wallet Testing
```bash
# Test Apple Wallet generation for admin-created cards across businesses
for business in business-a business-b business-c; do
  curl -I "http://localhost:3000/api/wallet/apple/admin-card-${business}-uuid"
  # Expected: HTTP 200, proper business branding in PKPass
done
```

### Google Wallet Testing
```bash
# Test Google Wallet generation for admin-created cards across businesses
for business in business-a business-b business-c; do
  curl -s "http://localhost:3000/api/wallet/google/admin-card-${business}-uuid" | jq '.loyaltyObject.localizedIssuerName'
  # Expected: Correct business name in Google Wallet
done
```

### PWA Wallet Testing
```bash
# Test PWA wallet generation for admin-created cards across businesses
curl -s "http://localhost:3000/api/wallet/pwa/admin-card-multi-business-uuid" | grep -o "business-name"
# Expected: Proper business name in PWA interface
```

---

## 🔧 Debug Features

### Admin Card Validation
The test interface includes debug features to validate:

1. **Card Origin**: Verify cards were created by admin users
2. **Business Assignment**: Confirm proper business assignment
3. **Permission Checks**: Validate RLS policies work correctly
4. **Cross-Business Access**: Test access patterns across businesses

### Test Commands
```bash
# Validate admin card creation permissions
curl -s "http://localhost:3000/test/wallet-preview/debug?check=admin-permissions" | jq '.adminCardCreation'

# Test cross-business card access
curl -s "http://localhost:3000/test/wallet-preview/debug?check=cross-business" | jq '.businessAccess'

# Verify RLS policy enforcement
curl -s "http://localhost:3000/test/wallet-preview/debug?check=rls-policies" | jq '.policyEnforcement'
```

---

## ✅ Status

**Test Interface**: ✅ Enhanced for admin card management  
**Multi-Business Support**: ✅ Active with business selector  
**Cross-Business Validation**: ✅ Wallet generation tested across businesses  
**Admin Context**: ✅ Proper admin card creation validation  
**Legacy Support**: ✅ Backward compatibility maintained for existing cards 