# RewardJar 4.0 - Wallet Preview Testing Guide
**Updated**: July 22, 2025 (03:00 AM IST)  
**Status**: 🟡 In Progress - Fixing Membership Card Generation  
**Focus**: Both Stamp Cards and Membership Cards Support

## 📋 Overview

This guide provides comprehensive testing instructions for the RewardJar 4.0 wallet preview interface, supporting both **stamp cards** (loyalty type) and **membership cards** with proper theming and functionality across Apple Wallet, Google Wallet, and PWA platforms.

## 🔧 Testing Interface - /test/wallet-preview

### **Access URLs**
```bash
# Stamp Card Testing
http://localhost:3000/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe&type=loyalty

# Membership Card Testing  
http://localhost:3000/test/wallet-preview?customerCardId=90910c9c-f8cc-4e49-b53c-87863f8f30a5&type=membership
```

### **Authentication**
All API endpoints require the `NEXT_PUBLIC_TEST_TOKEN` in the Authorization header:
```bash
export NEXT_PUBLIC_TEST_TOKEN="test-token-for-wallet-preview-interface"
```

### **UI Features**
- **Tabbed Interface**: 
  - **"Stamp Card"** tab → Green theme (#10b981), 5x2 grid layout
  - **"Membership Card"** tab → Indigo theme (#6366f1), progress bar layout
- **Pass Generation Buttons**: 
  - "Generate Apple Pass" → Downloads .pkpass file with proper theme
  - "Generate Google Pass" → Opens Google Wallet save page with correct class
  - "Generate PWA Pass" → Opens HTML card with appropriate layout
- **Error Handling**: Red alert displays for generation failures
- **Success Feedback**: Green alerts confirm successful pass generation

## 🧪 API Testing Commands

### **1. Stamp Card Generation (Green Theme)**

#### **Apple Wallet - Stamp Card**
```bash
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/apple/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp"

# Expected Response: HTTP 200
# Response: {"success": true, "filename": "Stamp_Card_3e234610.pkpass", "cardType": "stamp", "backgroundColor": "rgb(16, 185, 129)"}
```

#### **Google Wallet - Stamp Card**
```bash
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/google/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp" | jq '.cardType, .loyaltyObject.hexBackgroundColor'

# Expected Response: HTTP 200
# Response: "stamp", "#10b981"
```

#### **PWA Wallet - Stamp Card**
```bash
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/pwa/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp" | grep -o "Digital Stamp Card"

# Expected Response: HTTP 200, Content-Type: text/html
# Response: HTML with 5x2 stamp grid and green gradient background
```

### **2. Membership Card Generation (Indigo Theme)**

#### **Apple Wallet - Membership Card**
```bash
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/apple/90910c9c-f8cc-4e49-b53c-87863f8f30a5?type=membership"

# Expected Response: HTTP 200
# Response: {"success": true, "filename": "Membership_Card_90910c9c.pkpass", "cardType": "membership", "backgroundColor": "rgb(99, 102, 241)"}
```

#### **Google Wallet - Membership Card**
```bash
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/google/90910c9c-f8cc-4e49-b53c-87863f8f30a5?type=membership" | jq '.cardType, .loyaltyObject.hexBackgroundColor'

# Expected Response: HTTP 200
# Response: "membership", "#6366f1"
```

#### **PWA Wallet - Membership Card**
```bash
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/pwa/90910c9c-f8cc-4e49-b53c-87863f8f30a5?type=membership" | grep -o "Digital Membership Card"

# Expected Response: HTTP 200, Content-Type: text/html
# Response: HTML with progress bar and indigo gradient background
```

## 🎯 Enhanced Test Scenarios

### **Scenario 1: Stamp Card Generation**
1. Access `/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe`
2. Select "Stamp Card" tab
3. Click "Generate Apple Pass" → Should download green-themed .pkpass
4. Click "Generate Google Pass" → Should open Google Wallet with green theme
5. Click "Generate PWA Pass" → Should open HTML with 5x2 stamp grid
6. **Expected**: All passes show green theme (#10b981), stamp progress (e.g., "3/10")

### **Scenario 2: Membership Card Generation**
1. Access `/test/wallet-preview?customerCardId=90910c9c-f8cc-4e49-b53c-87863f8f30a5`
2. Select "Membership Card" tab
3. Click "Generate Apple Pass" → Should download indigo-themed .pkpass
4. Click "Generate Google Pass" → Should open Google Wallet with indigo theme
5. Click "Generate PWA Pass" → Should open HTML with progress bar
6. **Expected**: All passes show indigo theme (#6366f1), session progress (e.g., "5/20"), cost, expiry

### **Scenario 3: Card Type Auto-Detection**
1. Access APIs without `?type=` parameter
2. System should auto-detect based on `customer_cards.membership_type`
3. **Expected**: 
   - `membership_type: 'loyalty'` → stamp card generation
   - `membership_type: 'membership'` → membership card generation

### **Scenario 4: Card Type Validation**
1. Request `?type=stamp` for a membership card ID
2. **Expected**: HTTP 400 "Card type mismatch" error
3. Request `?type=membership` for a loyalty card ID
4. **Expected**: HTTP 400 "Card type mismatch" error

## 🔍 Verification Steps

### **1. UI Verification**
- [ ] Stamp Card tab shows green theme and stamp grid preview
- [ ] Membership Card tab shows indigo theme and progress bar preview
- [ ] Error alerts appear in red with proper dismiss functionality
- [ ] Success alerts confirm generation for correct card type
- [ ] Tab badges show correct counts (loyalty vs membership)

### **2. API Verification**
- [ ] All POST endpoints accept `?type=stamp` and `?type=membership`
- [ ] Authentication check works (returns 401 without token)
- [ ] Card type validation prevents mismatched requests
- [ ] Auto-detection works when type parameter is omitted
- [ ] Cache headers set to 1-second (`max-age=1`)

### **3. Pass Content Verification**
- [ ] **Stamp Cards**: Green theme, 5x2 grid, "X/Y stamps collected"
- [ ] **Membership Cards**: Indigo theme, progress bar, "X/Y sessions used", cost, expiry
- [ ] **Apple Pass**: Correct filename format based on card type
- [ ] **Google Pass**: Uses correct v2 class IDs (loyalty vs membership)
- [ ] **PWA Pass**: Proper HTML themes and layouts

## 🚨 Troubleshooting

### **Common Issues**

**Issue**: "Card type mismatch" error  
**Solution**: Ensure requested type matches database `membership_type` field

**Issue**: "Only stamp cards supported" error  
**Solution**: Updated - APIs now support both card types with proper validation

**Issue**: Wrong theme colors  
**Solution**: 
- Stamp cards should use #10b981 (green)
- Membership cards should use #6366f1 (indigo)

**Issue**: Google Wallet "RS256" error  
**Solution**: Check `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` format, ensure `\\n` → `\n` conversion

### **Debug Commands**
```bash
# Check card type in database
curl "http://localhost:3000/api/dev-seed" | jq '.cards[] | {id, membership_type}'

# Test auto-detection (no type parameter)
curl -X POST -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/api/wallet/google/3e234610-9953-4a8b-950e-b03a1924a1fe" | jq '.cardType'

# Verify environment variables
echo $NEXT_PUBLIC_TEST_TOKEN
echo $GOOGLE_SERVICE_ACCOUNT_EMAIL
```

## 📊 Expected Results

### **Success Metrics**
- ✅ Both stamp and membership card generation works without errors
- ✅ Proper theme colors applied (green vs indigo)
- ✅ Card type validation prevents mismatched requests
- ✅ Auto-detection works based on database membership_type
- ✅ All three wallet types support both card types

### **Performance Targets**
- API response time: < 2 seconds for both card types
- Pass generation: < 5 seconds regardless of type
- UI responsiveness: Immediate feedback with proper theming

## 🔄 Next Steps

1. **Test both card types** using the provided curl commands
2. **Verify themes** match the specifications (green vs indigo)
3. **Validate error handling** for mismatched card types
4. **Update Apple_Wallet_Test_Debug_Guide.md** with dual card type support

---
**Last Updated**: July 22, 2025 (03:00 AM IST)  
**Next Review**: After implementing dual card type support 