# Apple Wallet Test Debug Guide - RewardJar 4.0

**Updated**: July 22, 2025 (03:30 AM IST)  
**Status**: 🟡 In Progress - QR Scanning Enhancement and Wallet Sync  
**Version**: RewardJar 4.0 with Dual Card Type Support

## 📋 Overview

This guide provides comprehensive testing and debugging instructions for Apple Wallet integration in RewardJar 4.0, including both stamp cards and membership cards with enhanced QR scanning functionality and real-time wallet synchronization.

## 🔄 Recent Fixes

- ✅ **Membership Card Fix**: Added support for membership cards in Google Wallet with proper indigo theme (#6366f1)
- ✅ **Dual Card Type Support**: All wallet APIs now support both stamp and membership cards with proper validation
- ✅ **Theme Consistency**: Green theme (#10b981) for stamp cards, Indigo theme (#6366f1) for membership cards
- ✅ **QR Scanning Enhancement**: Added wallet sync and real-time updates with queue management
- ✅ **Pass Generation Fix**: Implemented POST endpoints for all wallet types with authentication
- ✅ **Error Handling**: Enhanced error alerts with proper card type context and dismissible UI
- ✅ **Platform Detection Test**: Added debug mode and consistency checks for wallet generation

## 🧪 Testing Interface - /test/wallet-preview

### **Access URLs**
```bash
# Stamp Card Testing
http://localhost:3000/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe&type=loyalty

# Membership Card Testing
http://localhost:3000/test/wallet-preview?customerCardId=90910c9c-f8cc-4e49-b53c-87863f8f30a5&type=membership
```

### **QR Scanning Test**

The enhanced QR scanning functionality now includes:
- ✅ **Real-time stamp/session count updates**
- ✅ **Wallet sync queue management**
- ✅ **Success/error alerts with proper feedback**
- ✅ **Multi-platform wallet synchronization**

```bash
# Test QR Scan API directly
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/mark-session/3e234610-9953-4a8b-950e-b03a1924a1fe" \
  -d '{"usageType": "auto", "testMode": true}' | jq '.success, .message'

# Expected Response:
# true
# "Stamp added! 6 more stamps needed for your reward."
```

### **Wallet Queue Test**
```bash
# Test wallet update queue
curl -X POST \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/wallet/update-queue/3e234610-9953-4a8b-950e-b03a1924a1fe" \
  -d '{"platform": "all", "updateType": "stamp_update", "testMode": true}' | jq '.success, .queuedUpdates'

# Expected Response:
# true
# [{"platform": "apple", "id": "uuid", "status": "queued"}, ...]
```

### **Platform Detection Test**

The enhanced platform detection functionality now includes:
- ✅ **Debug mode toggle** with real-time platform detection
- ✅ **User-Agent analysis** with detailed reasoning
- ✅ **Platform consistency checks** between detected and requested platforms
- ✅ **API response validation** for stamp count and theme consistency

```bash
# Test platform detection with different User-Agent headers
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)" \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe"
# Expected: Apple Pass generation prioritized

curl -H "User-Agent: Mozilla/5.0 (Linux; Android 11; SM-G975F)" \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe"
# Expected: Google Pass generation prioritized

curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe"
# Expected: PWA Pass generation prioritized
```

### **Consistency Validation**
The debug mode validates:
- **Stamp Count Consistency**: Ensures all platforms show same count (e.g., "3/10")
- **Theme Consistency**: Validates color schemes (Green #10b981 for stamp, Indigo #6366f1 for membership)
- **Platform Matching**: Warns when requested platform differs from detected platform
- **API Response Integrity**: Logs detailed response data for debugging

## 🎯 Enhanced Test Scenario Matrix

| Scenario | Wallet Type | Card Type | Current Progress | Total Progress | Expected Result | Test Priority |
|----------|-------------|-----------|------------------|----------------|-----------------|---------------|
| New Stamp Card | Apple | Stamp | 0 stamps | 10 stamps | ✅ PKPass downloads, green theme | High |
| In Progress Stamp | Apple | Stamp | 3 stamps | 10 stamps | ✅ PKPass downloads, 30% progress | High |
| QR Scan Stamp | Apple | Stamp | 3→4 stamps | 10 stamps | ✅ Real-time update + wallet sync | Critical |
| New Membership | Apple | Membership | 0 sessions | 20 sessions | ✅ PKPass downloads, indigo theme | High |
| In Progress Membership | Apple | Membership | 5 sessions | 20 sessions | ✅ PKPass downloads, 25% progress | High |
| QR Scan Membership | Apple | Membership | 5→6 sessions | 20 sessions | ✅ Real-time update + wallet sync | Critical |
| New Stamp Card | Google | Stamp | 0 stamps | 10 stamps | ✅ Wallet opens, green theme | High |
| In Progress Stamp | Google | Stamp | 3 stamps | 10 stamps | ✅ Wallet opens, 30% progress | High |
| QR Scan Stamp | Google | Stamp | 3→4 stamps | 10 stamps | ✅ Real-time update + wallet sync | Critical |
| New Membership | Google | Membership | 0 sessions | 20 sessions | ✅ Wallet opens, indigo theme | High |
| In Progress Membership | Google | Membership | 5 sessions | 20 sessions | ✅ Wallet opens, 25% progress | High |
| QR Scan Membership | Google | Membership | 5→6 sessions | 20 sessions | ✅ Real-time update + wallet sync | Critical |

## 🔧 Quick Start Guide - Enhanced

### **1. Environment Setup**
```bash
# Set required environment variables
export NEXT_PUBLIC_TEST_TOKEN="test-token-for-wallet-preview-interface"
export APPLE_TEAM_IDENTIFIER="ABC1234DEF"
export APPLE_PASS_TYPE_IDENTIFIER="pass.com.yourdomain.rewards"
export GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@your-project.iam.gserviceaccount.com"
export GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### **2. Start Development Server**
```bash
cd /path/to/rewardjar_4.0
npm run dev
```

### **3. Test QR Scanning with Wallet Sync**
```bash
# Access test interface
open "http://localhost:3000/test/wallet-preview?customerCardId=3e234610-9953-4a8b-950e-b03a1924a1fe"

# Click "Simulate QR Scan (Add Stamp + Sync Wallets)" button
# Expected Results:
# 1. Stamp count increases (e.g., 3/10 → 4/10)
# 2. Success alert appears: "✅ QR Scan Success: Stamp added!"
# 3. Console logs show wallet sync queued
# 4. No red error alerts
```

### **4. Verify Pass Generation**
```bash
# Test Apple Wallet
curl -I -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/api/wallet/apple/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp"
# Expected: HTTP 200, application/json

# Test Google Wallet
curl -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/api/wallet/google/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp" | jq '.cardType'
# Expected: "stamp"

# Test PWA Wallet
curl -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/api/wallet/pwa/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp" | grep -o "Digital Stamp Card"
# Expected: "Digital Stamp Card"
```

### **5. Debug Wallet Queue**
```bash
# Check wallet update queue status
curl -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  "http://localhost:3000/api/wallet/process-updates" | jq '.processedUpdates'

# Expected: Array of processed wallet updates
```

## 🚨 Common Issues and Solutions

### **Issue**: QR Scan doesn't update stamp count
**Solution**: 
1. Check `/api/wallet/mark-session/[customerCardId]` endpoint logs
2. Verify `NEXT_PUBLIC_TEST_TOKEN` is set correctly
3. Ensure customer card exists in database

### **Issue**: Wallet sync fails after QR scan
**Solution**:
1. Check `/api/wallet/update-queue/[customerCardId]` endpoint
2. Verify `wallet_update_queue` table exists in Supabase
3. Check `process-updates` endpoint functionality

### **Issue**: "Card type mismatch" errors
**Solution**:
1. Ensure requested type matches database `membership_type`
2. Use `?type=stamp` for loyalty cards, `?type=membership` for membership cards
3. Check database schema consistency

### **Issue**: Wrong theme colors
**Solution**:
- Stamp cards should use #10b981 (green)
- Membership cards should use #6366f1 (indigo)
- Clear browser cache and restart server

## 📊 Expected Results Summary

### **QR Scanning Enhancement**
- ✅ **Real-time Updates**: Stamp/session counts update immediately
- ✅ **Wallet Sync**: All platforms (Apple, Google, PWA) sync automatically
- ✅ **User Feedback**: Success alerts confirm scan completion
- ✅ **Error Handling**: Clear error messages for failures
- ✅ **Queue Management**: Updates queued properly in database

### **Pass Generation**
- ✅ **Dual Card Support**: Both stamp and membership cards work
- ✅ **Proper Themes**: Green for stamp, indigo for membership
- ✅ **Authentication**: All endpoints require proper tokens
- ✅ **Validation**: Card type mismatches prevented

### **Performance Targets**
- QR scan processing: < 2 seconds
- Wallet sync queuing: < 1 second
- Pass generation: < 3 seconds
- UI responsiveness: Immediate feedback

## 🔄 Next Steps

1. **Test QR scanning** with both card types
2. **Verify wallet synchronization** across all platforms
3. **Monitor queue processing** in database
4. **Test error scenarios** for robustness
5. **Performance optimization** if needed

---
**Last Updated**: July 22, 2025 (03:30 AM IST)  
**Next Review**: After QR scanning and wallet sync testing completion 