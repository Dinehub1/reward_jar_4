# 📱 Google Wallet Integration Guide

## Overview

RewardJar's Google Wallet integration allows customers to save their loyalty cards directly to Google Wallet for convenient access. This guide covers the complete implementation, from setup to troubleshooting.

## 🔧 How Google Wallet Works in RewardJar

### Architecture Overview

```
Customer Registration → Loyalty Object Creation → JWT Generation → Google Wallet Save URL
```

1. **Customer Registration**: Customer signs up for a loyalty card via `/join/[cardId]`
2. **Card Generation**: System creates a `customer_cards` record linking customer to business card
3. **Wallet Request**: Customer clicks "Google Wallet" button
4. **Object Creation**: System builds a Google Wallet loyalty object with current progress
5. **JWT Signing**: Object is signed with service account private key
6. **Save URL**: JWT is used to create a `https://pay.google.com/gp/v/save/[JWT]` URL
7. **User Redirect**: Customer is redirected to Google Wallet to save the card

## 🚀 Step-by-Step Flow

### 1. User Registration Flow

**Frontend: `/join/[cardId]`**
```typescript
// Customer fills registration form
const registrationData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  dateOfBirth: '1990-01-01'
}

// POST to customer registration API
const response = await fetch('/api/customer/card/join', {
  method: 'POST',
  body: JSON.stringify({
    cardId: 'card-uuid',
    customer: registrationData
  })
})

const result = await response.json()
// Returns: { success: true, data: { customerCardId: 'uuid' } }
```

### 2. Google Wallet Integration

**Frontend: Wallet Button Click**
```typescript
const addToWallet = async (walletType: 'google') => {
  const response = await fetch(`/api/wallet/google/${customerCardId}`)
  const result = await response.json()
  
  if (result.success && result.saveUrl) {
    window.open(result.saveUrl, '_blank')
  }
}
```

**Backend: Google Wallet API (`/api/wallet/google/[customerCardId]`)**
```typescript
// 1. Fetch customer card data
const customerCard = await adminClient
  .from('customer_cards')
  .select(`
    id, current_stamps, sessions_used,
    stamp_card:stamp_cards(...),
    membership_card:membership_cards(...),
    customer:customers(...)
  `)
  .eq('id', customerCardId)
  .single()

// 2. Build Google Wallet IDs
const googleIds = buildGoogleIds(customerCardId)

// 3. Create loyalty object
const loyaltyObject = createLoyaltyObject({
  ids: googleIds,
  current: customerCard.current_stamps || 0,
  total: cardData.total_stamps,
  displayName: customerCard.customer.name,
  objectDisplayId: customerCardId
})

// 4. Create JWT and save URL
const jwt = createSaveToWalletJwt(loyaltyObject)
const saveUrl = buildSaveUrl(jwt)

return { success: true, saveUrl }
```

## 🔑 API Endpoints and Keys

### Required Environment Variables

```bash
# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"

# Google Wallet Configuration  
GOOGLE_WALLET_ISSUER_ID=3388000000022940702
GOOGLE_WALLET_CLASS_SUFFIX=rewardjar_loyalty_1
GOOGLE_WALLET_CLASS_SUFFIX_STAMP=rewardjar_stamp_1
GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP=rewardjar_membership_1
```

### API Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|---------------|
| `/api/customer/card/join` | POST | Register customer for card | None (public) |
| `/api/wallet/google/[customerCardId]` | GET | Generate Google Wallet pass | None (public) |
| `/api/wallet/google/[customerCardId]?debug=true` | GET | Debug wallet generation | None (public) |

## 🏗️ JWT Generation and Validation

### JWT Structure

```typescript
const payload = {
  iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,      // Issuer (service account)
  aud: 'google',                                      // Audience (Google)
  typ: 'savetowallet',                               // Type (save to wallet)
  iat: Math.floor(Date.now() / 1000),               // Issued at
  exp: Math.floor(Date.now() / 1000) + 3600,        // Expires in 1 hour
  payload: {
    loyaltyObjects: [loyaltyObject]                  // The loyalty card object
  }
}
```

### Loyalty Object Schema

```typescript
interface LoyaltyObject {
  id: string                    // e.g., "3388000000022940702.rewardjar_stamp_1.abc123"
  classId: string              // e.g., "3388000000022940702.rewardjar_stamp_1"
  state: 'ACTIVE'              // Card state
  loyaltyPoints: {
    label: string              // e.g., "Stamps"
    balance: { string: string } // e.g., "3/10"
  }
  accountName: string          // Customer name
  accountId: string            // Customer card ID (truncated)
  barcode: {
    type: 'QR_CODE'
    value: string              // Customer card ID for scanning
    alternateText: string      // Fallback text
  }
  textModulesData?: {
    header: string             // e.g., "Business"
    body: string              // e.g., "Coffee Shop XYZ"
  }[]
}
```

### JWT Signing Process

```typescript
// 1. Create header and payload
const headerB64 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

// 2. Sign with private key
const signatureInput = `${headerB64}.${payloadB64}`
const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), privateKey).toString('base64url')

// 3. Build final JWT
const jwt = `${signatureInput}.${signature}`

// 4. Create save URL
const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`
```

## 🐛 Common Errors and Debugging

### 1. **"Google Wallet not configured"**

**Cause**: Missing environment variables
**Debug**:
```bash
# Check if environment variables are set
echo $GOOGLE_SERVICE_ACCOUNT_EMAIL
echo $GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
```

**Solution**: 
- Ensure all required environment variables are set
- Verify private key format (should include `-----BEGIN PRIVATE KEY-----`)
- Check service account has Google Wallet API access

### 2. **"Failed to create Google Wallet JWT"**

**Cause**: Invalid private key or JWT signing error
**Debug**:
```typescript
// Test JWT creation
try {
  const testObject = createLoyaltyObject({...})
  const jwt = createSaveToWalletJwt(testObject)
  console.log('JWT created successfully:', jwt.substring(0, 50))
} catch (error) {
  console.error('JWT creation failed:', error.message)
}
```

**Solutions**:
- Verify private key format (no extra quotes, proper line breaks)
- Check service account permissions
- Ensure loyalty object has all required fields

### 3. **"Something went wrong. Please try again."**

**Cause**: Generic error in Google Wallet generation
**Debug Steps**:
1. Use debug endpoint: `/api/wallet/google/[customerCardId]?debug=true`
2. Check browser console for detailed error messages
3. Verify customer card exists in database
4. Check loyalty object validation

### 4. **Google Wallet Save Page Shows Error**

**Cause**: Invalid JWT or Google Wallet class not found
**Debug**:
- Verify class ID format: `{issuerId}.{suffix}`
- Check Google Wallet Console for class configuration
- Validate JWT payload structure

## 🧪 Testing Integration

### Local Testing

1. **Environment Setup**
```bash
# Copy environment variables
cp .env.example .env.local

# Set Google Wallet credentials
export GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service@project.iam.gserviceaccount.com"
export GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

2. **Test Card Registration**
```bash
# Start development server
npm run dev

# Navigate to join page
http://localhost:3000/join/[valid-card-id]?guest=true

# Complete registration flow
# Click "Google Wallet" button
# Verify redirect to Google Wallet
```

3. **Debug Mode Testing**
```bash
# Test with debug endpoint
curl "http://localhost:3000/api/wallet/google/[customerCardId]?debug=true"

# Should return:
{
  "message": "Google Wallet endpoint working",
  "customerCard": {...},
  "loyaltyObject": {...},
  "environment": {
    "hasServiceAccountEmail": true,
    "hasPrivateKey": true,
    "privateKeyLength": 1679
  }
}
```

### Production Testing

1. **Health Check**
```bash
# Test API endpoints
curl -X GET "https://yourdomain.com/api/wallet/google/test-id?debug=true"
```

2. **End-to-End Flow**
- Create test customer account
- Register for loyalty card
- Click Google Wallet button
- Verify card appears in Google Wallet app

## 🔒 Security Considerations

### Service Account Security

1. **Private Key Protection**
   - Never commit private keys to version control
   - Use environment variables or secure secret management
   - Rotate keys regularly (recommended: every 90 days)

2. **Service Account Permissions**
   - Grant minimal required permissions
   - Use dedicated service account for Google Wallet only
   - Monitor service account usage

### JWT Security

1. **Token Expiration**
   - JWTs expire after 1 hour (configurable)
   - Short expiration reduces security risk
   - No refresh mechanism needed (generate new JWT for each request)

2. **Payload Validation**
   - Validate all input data before JWT creation
   - Sanitize customer data in loyalty objects
   - Ensure proper object ID format

### API Security

1. **Rate Limiting**
   - Implement rate limiting on wallet endpoints
   - Prevent abuse of JWT generation
   - Monitor for suspicious activity

2. **Input Validation**
   - Validate customer card IDs
   - Check card ownership/permissions
   - Sanitize all user inputs

## 📊 Monitoring and Analytics

### Key Metrics to Track

1. **Success Rates**
   - JWT generation success rate
   - Google Wallet save completion rate
   - Customer registration to wallet completion rate

2. **Error Monitoring**
   - JWT creation failures
   - API endpoint errors
   - Google Wallet save failures

3. **Performance Metrics**
   - JWT generation time
   - API response times
   - Database query performance

### Logging Strategy

```typescript
// Log successful wallet generation
console.log(`[GOOGLE_WALLET] JWT created for customer ${customerCardId}`)

// Log errors with context
console.error(`[GOOGLE_WALLET] JWT creation failed for ${customerCardId}:`, error.message)

// Log performance metrics
console.log(`[GOOGLE_WALLET] Generation time: ${duration}ms`)
```

## 🔄 Troubleshooting Checklist

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Service account has Google Wallet API access
- [ ] Private key format validated
- [ ] JWT generation tested locally
- [ ] End-to-end flow tested
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting enabled

### Common Issues Resolution

| Issue | Check | Solution |
|-------|-------|----------|
| Missing credentials | Environment variables | Set all required env vars |
| Invalid private key | Key format | Ensure proper PEM format |
| JWT creation fails | Service account | Verify permissions |
| Save URL doesn't work | Class configuration | Check Google Wallet Console |
| Customer card not found | Database query | Verify card exists |
| Barcode doesn't scan | QR code value | Use customer card ID |

## 📚 Additional Resources

- [Google Wallet API Documentation](https://developers.google.com/wallet)
- [Google Wallet Console](https://pay.google.com/business/console)
- [JWT.io Debugger](https://jwt.io/)
- [RewardJar Environment Setup](./docs/ENVIRONMENT_SETUP.md)

## 🆕 Recent Updates

- **2025-01-XX**: Fixed JWT generation in `/api/wallet/google/[customerCardId]/route.ts`
- **2025-01-XX**: Added comprehensive error handling and debug mode
- **2025-01-XX**: Improved frontend error messages in join page
- **2025-01-XX**: Added environment variable validation

---

For additional support or questions, please refer to the [main documentation](./README.md) or contact the development team.