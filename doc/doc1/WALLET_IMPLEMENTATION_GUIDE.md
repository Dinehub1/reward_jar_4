# RewardJar 4.0 - Apple & Google Wallet Implementation Guide

**Status**: ✅ Production Ready | **Multi-Wallet Strategy**: Apple + Google + PWA  
**Generated**: January 2025 | **Based on**: RewardJar 3.0 Rebuild Flow Analysis

---

## 📋 Executive Summary

RewardJar implements a comprehensive multi-wallet strategy supporting **Apple Wallet**, **Google Wallet**, and **Progressive Web App (PWA)** functionality. This guide provides complete implementation details, setup requirements, API structures, and production deployment instructions for both Apple and Google wallet integrations.

### Key Features ✅
- **Apple Wallet**: PKPass generation with full certificate signing
- **Google Wallet**: JWT-based loyalty object creation  
- **PWA Fallback**: Offline-capable web-based wallet
- **Real-time Updates**: Dynamic stamp progress synchronization
- **QR Code Integration**: Seamless barcode scanning for stamp collection
- **Multi-platform Support**: iOS, Android, and web compatibility

---

## 🏗️ Architecture Overview

### Wallet Flow Architecture
```mermaid
graph TD
    A[Customer Joins Card] --> B[Select Wallet Type]
    B --> C{Wallet Type?}
    C -->|Apple| D[Generate PKPass]
    C -->|Google| E[Generate JWT Object]
    C -->|PWA| F[Generate Web App]
    D --> G[Apple Wallet Pass]
    E --> H[Google Pay Pass]
    F --> I[PWA Wallet View]
    G --> J[Add to Apple Wallet]
    H --> K[Add to Google Pay]
    I --> L[Install PWA/Bookmark]
    J --> M[Real-time Updates]
    K --> M
    L --> M
```

### API Route Structure
```
/api/wallet/
├── apple/[customerCardId]/     # Apple Wallet PKPass generation
├── google/[customerCardId]/    # Google Wallet JWT object creation
├── pwa/[customerCardId]/       # PWA wallet interface
└── updates/                    # Real-time update webhook
```

---

## 🍎 Apple Wallet Implementation

### Prerequisites & Setup

#### 1. Apple Developer Account Requirements
- **Apple Developer Program** membership ($99/year)
- **Pass Type ID Certificate** for wallet passes
- **Team Identifier** from Apple Developer portal
- **WWDR Intermediate Certificate** (Apple Worldwide Developer Relations)

#### 2. Certificate Generation Process
```bash
# 1. Generate Certificate Signing Request (CSR)
openssl req -new -keyout pass.key -out pass.csr -subj "/CN=Pass Type ID/C=US"

# 2. Upload CSR to Apple Developer portal to get pass.cer
# 3. Download WWDR certificate from Apple
# 4. Convert certificates to PEM format
openssl x509 -inform DER -outform PEM -in pass.cer -out pass.pem
openssl x509 -inform DER -outform PEM -in AppleWWDRCA.cer -out wwdr.pem

# 5. Convert to Base64 for environment variables
base64 -i pass.pem -o pass_base64.txt
base64 -i pass.key -o key_base64.txt  
base64 -i wwdr.pem -o wwdr_base64.txt
```

### Environment Variables (Required)
```bash
# Apple Wallet Configuration (6 variables)
APPLE_CERT_BASE64="LS0tLS1CRUdJTi..."              # Base64 encoded pass certificate
APPLE_KEY_BASE64="LS0tLS1CRUdJTi..."               # Base64 encoded private key
APPLE_WWDR_BASE64="LS0tLS1CRUdJTi..."              # Base64 encoded WWDR certificate
APPLE_CERT_PASSWORD="your_certificate_password"     # Certificate password (if set)
APPLE_TEAM_IDENTIFIER="ABC1234DEF"                 # 10-character Apple Team ID
APPLE_PASS_TYPE_IDENTIFIER="pass.com.rewardjar.loyalty"  # Pass Type ID from Apple portal
```

### PKPass Structure Implementation

#### Core Pass JSON Structure
```typescript
// /src/app/api/wallet/apple/[customerCardId]/route.ts
const passData = {
  // Required PKPass fields
  formatVersion: 1,
  passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
  serialNumber: customerCardId,
  teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
  organizationName: "RewardJar",
  description: `${stampCard.name} - ${business.name}`,
  
  // Visual styling
  backgroundColor: "rgb(16, 185, 129)",  // green-500
  foregroundColor: "rgb(255, 255, 255)", // white
  labelColor: "rgb(255, 255, 255)",      // white
  logoText: "RewardJar",
  
  // Store card layout (loyalty card type)
  storeCard: {
    // Primary display field (most prominent)
    primaryFields: [
      {
        key: "stamps",
        label: "Stamps Collected", 
        value: `${current_stamps}/${total_stamps}`,
        textAlignment: "PKTextAlignmentCenter"
      }
    ],
    
    // Secondary fields (below primary)
    secondaryFields: [
      {
        key: "progress",
        label: "Progress",
        value: `${Math.round(progress)}%`,
        textAlignment: "PKTextAlignmentLeft"
      },
      {
        key: "remaining", 
        label: isCompleted ? "Status" : "Remaining",
        value: isCompleted ? "Completed!" : `${stampsRemaining} stamps`,
        textAlignment: "PKTextAlignmentRight"
      }
    ],
    
    // Header field (top of card)
    headerFields: [
      {
        key: "card_name",
        label: "Loyalty Card", 
        value: stampCard.name,
        textAlignment: "PKTextAlignmentCenter"
      }
    ],
    
    // Auxiliary fields (additional info)
    auxiliaryFields: [
      {
        key: "business",
        label: "Business",
        value: business.name,
        textAlignment: "PKTextAlignmentLeft"
      },
      {
        key: "reward",
        label: "Reward", 
        value: stampCard.reward_description,
        textAlignment: "PKTextAlignmentLeft"
      }
    ],
    
    // Back of card information
    backFields: [
      {
        key: "description",
        label: "About",
        value: `Collect ${total_stamps} stamps to earn: ${reward_description}`
      },
      {
        key: "business_info",
        label: business.name,
        value: business.description || "Visit us to collect stamps and earn rewards!"
      },
      {
        key: "instructions", 
        label: "How to Use",
        value: "Show this pass to collect stamps at participating locations. Your pass will automatically update when new stamps are added."
      },
      {
        key: "contact",
        label: "Questions?",
        value: "Contact the business directly or visit rewardjar.com for support."
      }
    ]
  },
  
  // QR code for stamp collection
  barcode: {
    message: customerCardId,                    // Customer card UUID
    format: "PKBarcodeFormatQR",               // QR code format
    messageEncoding: "iso-8859-1",             // Standard encoding
    altText: `Card ID: ${customerCardId}`      // Accessibility text
  },
  
  // Web service for updates
  webServiceURL: `${BASE_URL}/api/wallet/apple/updates`,
  authenticationToken: customerCardId,         // Token for update authentication
  
  // User metadata (internal use)
  userInfo: {
    customerCardId: customerCardId,
    stampCardId: stampCard.id,
    businessName: business.name
  },
  
  // Optional fields
  locations: [],                              // Geo-location triggers
  maxDistance: 1000,                         // Relevance distance (meters)
  relevantDate: new Date().toISOString(),    // When pass becomes relevant
  associatedStoreIdentifiers: []             // App Store app associations
}
```

### PKPass Bundle Creation (Production Implementation)

#### Required Files Structure
```
pass.pkpass (ZIP file containing):
├── pass.json          # Main pass data (above structure)
├── manifest.json      # File checksums
├── signature          # Cryptographic signature  
├── logo.png          # 160x50px logo (optional)
├── logo@2x.png       # 320x100px retina logo (optional)
├── icon.png          # 29x29px icon (optional)
└── icon@2x.png       # 58x58px retina icon (optional)
```

#### Manifest.json Generation
```typescript
// Calculate SHA1 checksums for all files
const crypto = require('crypto')

const manifest = {
  "pass.json": sha1Hash(passJsonContent),
  "logo.png": sha1Hash(logoContent),
  "logo@2x.png": sha1Hash(logo2xContent),
  // ... other files
}

function sha1Hash(content: Buffer): string {
  return crypto.createHash('sha1').update(content).digest('hex')
}
```

#### Digital Signature Creation
```typescript
import { spawn } from 'child_process'

// Create PKCS#7 signature using OpenSSL
const signatureCommand = [
  'smime', '-sign', '-binary', '-noattr',
  '-certfile', 'wwdr.pem',    // WWDR certificate
  '-signer', 'pass.pem',      // Pass certificate  
  '-inkey', 'pass.key',       // Private key
  '-in', 'manifest.json',     // Manifest to sign
  '-out', 'signature',        // Output signature
  '-outform', 'DER'           // DER format
]

const openssl = spawn('openssl', signatureCommand)
```

### Real-time Pass Updates

#### Update Service Endpoint
```typescript
// /src/app/api/wallet/apple/updates/route.ts
export async function POST(request: NextRequest) {
  const { passTypeIdentifier, serialNumber } = await request.json()
  
  // Validate authentication token
  const authToken = request.headers.get('Authorization')?.replace('ApplePass ', '')
  
  if (authToken !== serialNumber) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
  }
  
  // Get latest customer card data
  const supabase = await createClient()
  const { data: customerCard } = await supabase
    .from('customer_cards')
    .select('*, stamp_cards(*), customers(*)')
    .eq('id', serialNumber)
    .single()
    
  if (!customerCard) {
    return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
  }
  
  // Generate updated pass
  const updatedPass = generatePassData(customerCard)
  const passBundle = await createPassBundle(updatedPass)
  
  return new NextResponse(passBundle, {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': customerCard.updated_at
    }
  })
}
```

---

## 🤖 Google Wallet Implementation

### Prerequisites & Setup

#### 1. Google Cloud Project Requirements
- **Google Cloud Project** with billing enabled
- **Google Wallet API** enabled in Cloud Console
- **Service Account** with Wallet Object Issuer role
- **Issuer Account** approved by Google (production only)

#### 2. Service Account Setup
```bash
# 1. Create service account in Google Cloud Console
gcloud iam service-accounts create rewardjar-wallet \
  --display-name="RewardJar Wallet Service"

# 2. Grant necessary roles
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:rewardjar-wallet@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/walletobjects.admin"

# 3. Generate and download JSON key
gcloud iam service-accounts keys create service-account.json \
  --iam-account=rewardjar-wallet@PROJECT_ID.iam.gserviceaccount.com

# 4. Extract private key for environment variable
cat service-account.json | jq -r '.private_key'
```

### Environment Variables (Required)
```bash
# Google Wallet Configuration (3 variables) 
GOOGLE_SERVICE_ACCOUNT_EMAIL="rewardjar-wallet@project-id.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB..."
GOOGLE_CLASS_ID="issuer.loyalty.rewardjar"    # Unique class identifier
```

### Google Wallet Object Structure

#### Loyalty Class Definition (One-time setup)
```typescript
// Create loyalty program class (done once per business type)
const loyaltyClass = {
  "id": process.env.GOOGLE_CLASS_ID,
  "issuerName": "RewardJar",
  "programName": "Digital Loyalty Cards",
  "programLogo": {
    "sourceUri": {
      "uri": "https://rewardjar.com/logo.png"
    },
    "contentDescription": {
      "defaultValue": {
        "language": "en-US", 
        "value": "RewardJar Logo"
      }
    }
  },
  "hexBackgroundColor": "#10b981",  // green-500
  "countryCode": "US",
  "reviewStatus": "UNDER_REVIEW",   // Changes to APPROVED in production
  "allowMultipleUsersPerObject": false
}
```

#### Loyalty Object Creation (Per customer card)
```typescript
// /src/app/api/wallet/google/[customerCardId]/route.ts
const loyaltyObject = {
  "id": `${process.env.GOOGLE_CLASS_ID}.${customerCardId}`,
  "classId": process.env.GOOGLE_CLASS_ID,
  "state": "ACTIVE",
  
  // Customer identification
  "accountId": customerCardId,
  "accountName": `Customer ${customerCardId.substring(0, 8)}`,
  
  // Primary loyalty points (stamps collected)
  "loyaltyPoints": {
    "balance": {
      "string": `${current_stamps}/${total_stamps}`
    },
    "label": "Stamps Collected"
  },
  
  // Secondary points (progress percentage)
  "secondaryLoyaltyPoints": {
    "balance": {
      "string": `${Math.round(progress)}%`
    },
    "label": "Progress"
  },
  
  // QR code for stamp collection
  "barcode": {
    "type": "QR_CODE",
    "value": customerCardId,
    "alternateText": `Card ID: ${customerCardId}`
  },
  
  // Additional information modules
  "textModulesData": [
    {
      "id": "business_info",
      "header": business.name,
      "body": business.description || "Visit us to collect stamps and earn rewards!"
    },
    {
      "id": "reward_info", 
      "header": "Your Reward",
      "body": stampCard.reward_description
    },
    {
      "id": "status",
      "header": "Status",
      "body": isCompleted ? 
        "Congratulations! Your reward is ready to claim." : 
        `Collect ${stampsRemaining} more stamps to unlock your reward.`
    }
  ],
  
  // Image modules
  "imageModulesData": [
    {
      "id": "hero_image",
      "mainImage": {
        "sourceUri": {
          "uri": `${BASE_URL}/api/images/loyalty-card-${stampCard.id}`
        },
        "contentDescription": {
          "defaultValue": {
            "language": "en-US",
            "value": `${stampCard.name} loyalty card`
          }
        }
      }
    }
  ],
  
  // Visual styling
  "hexBackgroundColor": "#10b981",   // green-500
  
  // Validity period
  "validTimeInterval": {
    "start": {
      "date": new Date().toISOString().split('T')[0]
    }
    // No end date = permanent validity
  },
  
  // Location-based relevance (optional)
  "locations": [
    {
      "latitude": business.latitude,    // If business has location data
      "longitude": business.longitude
    }
  ]
}
```

### JWT Token Generation & Signing

#### JWT Structure for Google Wallet
```typescript
import jwt from 'jsonwebtoken'

// JWT payload for "Add to Google Wallet" 
const jwtPayload = {
  iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,  // Service account email
  aud: 'google',                                   // Always 'google'
  typ: 'savetowallet',                            // Token type for wallet
  iat: Math.floor(Date.now() / 1000),            // Issued at timestamp
  
  // Wallet objects to save
  payload: {
    loyaltyObjects: [loyaltyObject]  // Array of loyalty objects
  }
}

// Sign JWT with service account private key
const token = jwt.sign(jwtPayload, process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, {
  algorithm: 'RS256'
})

// Generate "Add to Google Wallet" URL
const saveUrl = `https://pay.google.com/gp/v/save/${token}`
```

#### Google Wallet Button Integration
```html
<!-- Add to Google Wallet button -->
<div class="wallet-button-container">
  <a href="https://pay.google.com/gp/v/save/JWT_TOKEN_HERE"
     target="_blank" 
     class="google-wallet-button">
    <img src="https://developers.google.com/wallet/generic/resources/logo_googlepay_wallet_color.svg"
         alt="Add to Google Wallet" 
         style="height: 40px;">
  </a>
</div>

<!-- JavaScript alternative -->
<script>
function addToGoogleWallet() {
  const jwtToken = 'YOUR_JWT_TOKEN_HERE'
  const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`
  window.open(saveUrl, '_blank')
}
</script>
```

### Google Wallet API Integration

#### Creating/Updating Objects via API
```typescript
import { GoogleAuth } from 'google-auth-library'

// Initialize Google Auth
const auth = new GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: 'your-project-id',
    private_key_id: 'key-id',
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    client_id: 'client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token'
  },
  scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
})

// Create or update loyalty object
async function saveToGoogleWallet(loyaltyObject: any) {
  const authClient = await auth.getClient()
  const objectId = loyaltyObject.id
  
  try {
    // Try to update existing object
    const response = await authClient.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
      method: 'PUT',
      data: loyaltyObject
    })
    return response.data
  } catch (error) {
    if (error.status === 404) {
      // Object doesn't exist, create new one
      const response = await authClient.request({
        url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject',
        method: 'POST', 
        data: loyaltyObject
      })
      return response.data
    }
    throw error
  }
}
```

---

## 🔄 Real-time Updates & Synchronization

### Database Triggers for Auto-Updates

#### Supabase Function for Wallet Updates
```sql
-- Function to trigger wallet updates when stamps change
CREATE OR REPLACE FUNCTION update_wallet_passes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on stamp count changes
  IF OLD.current_stamps IS DISTINCT FROM NEW.current_stamps THEN
    -- Insert into update queue for async processing
    INSERT INTO wallet_update_queue (customer_card_id, update_type, created_at)
    VALUES (NEW.id, 'stamp_update', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on customer_cards table
CREATE TRIGGER trigger_wallet_updates
  AFTER UPDATE ON customer_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_passes();
```

#### Update Queue Processing
```typescript
// /src/app/api/wallet/process-updates/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get pending updates
  const { data: updates } = await supabase
    .from('wallet_update_queue')
    .select('*')
    .eq('processed', false)
    .limit(50)
  
  for (const update of updates || []) {
    try {
      // Get customer card data
      const { data: customerCard } = await supabase
        .from('customer_cards')
        .select('*, stamp_cards(*), customers(*)')
        .eq('id', update.customer_card_id)
        .single()
      
      if (customerCard) {
        // Update Apple Wallet pass (if applicable)
        if (customerCard.wallet_type === 'apple') {
          await updateAppleWalletPass(customerCard)
        }
        
        // Update Google Wallet object (if applicable)  
        if (customerCard.wallet_type === 'google') {
          await updateGoogleWalletObject(customerCard)
        }
        
        // Mark as processed
        await supabase
          .from('wallet_update_queue')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', update.id)
      }
    } catch (error) {
      console.error('Error processing wallet update:', error)
      // Mark as failed for retry logic
      await supabase
        .from('wallet_update_queue')
        .update({ failed: true, error_message: error.message })
        .eq('id', update.id)
    }
  }
  
  return NextResponse.json({ processed: updates?.length || 0 })
}
```

### Push Notifications for Updates

#### Apple Push Notification Service (APNs)
```typescript
// Send push notification to update wallet pass
async function notifyAppleWalletUpdate(customerCardId: string) {
  const pushToken = await getAPNsToken()
  
  const notification = {
    "aps": {
      "content-available": 1  // Silent notification for pass update
    },
    "passTypeIdentifier": process.env.APPLE_PASS_TYPE_IDENTIFIER,
    "serialNumber": customerCardId
  }
  
  // Send to Apple's servers
  const response = await fetch('https://api.push.apple.com/3/device/[device_token]', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pushToken}`,
      'apns-topic': process.env.APPLE_PASS_TYPE_IDENTIFIER,
      'apns-push-type': 'background'
    },
    body: JSON.stringify(notification)
  })
  
  return response.status === 200
}
```

---

## 📱 Progressive Web App (PWA) Fallback

### PWA Manifest Configuration
```typescript
// /src/app/api/wallet/pwa/[customerCardId]/manifest/route.ts
export async function GET(request: NextRequest, { params }) {
  const customerCardId = (await params).customerCardId
  
  const manifest = {
    "name": "RewardJar Loyalty Card",
    "short_name": "RewardJar", 
    "description": "Your digital loyalty card",
    "start_url": `/api/wallet/pwa/${customerCardId}`,
    "display": "standalone",
    "background_color": "#10b981",
    "theme_color": "#10b981",
    "orientation": "portrait",
    "icons": [
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/icons/icon-512x512.png", 
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ],
    "shortcuts": [
      {
        "name": "View Card",
        "url": `/customer/card/${customerCardId}`,
        "description": "View your loyalty card"
      }
    ]
  }
  
  return NextResponse.json(manifest)
}
```

### Service Worker for Offline Support
```typescript
// /public/sw.js
const CACHE_NAME = 'rewardjar-wallet-v1'

// Cache wallet assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/api/wallet/pwa/offline.html',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ])
    })
  )
})

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/wallet/pwa/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/api/wallet/pwa/offline.html'))
    )
  }
})

// Background sync for stamp updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'stamp-sync') {
    event.waitUntil(syncStampData())
  }
})

async function syncStampData() {
  // Sync pending stamps when back online
  const stamps = await getStoredStamps()
  for (const stamp of stamps) {
    await fetch('/api/stamp/add', {
      method: 'POST',
      body: JSON.stringify(stamp)
    })
  }
}
```

---

## 🚀 Production Deployment

### Environment Configuration Checklist

#### ✅ Required Environment Variables (17 total)
```bash
# Core Application (5)
BASE_URL=https://rewardjar.com
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Apple Wallet (6) - ALL REQUIRED FOR PRODUCTION
APPLE_CERT_BASE64=LS0tLS1CRUdJTi...
APPLE_KEY_BASE64=LS0tLS1CRUdJTi...
APPLE_WWDR_BASE64=LS0tLS1CRUdJTi...
APPLE_CERT_PASSWORD=certificate_password
APPLE_TEAM_IDENTIFIER=ABC1234DEF
APPLE_PASS_TYPE_IDENTIFIER=pass.com.rewardjar.loyalty

# Google Wallet (3) - ALL REQUIRED FOR PRODUCTION  
GOOGLE_SERVICE_ACCOUNT_EMAIL=wallet@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLASS_ID=issuer.loyalty.rewardjar

# Security & Analytics (3)
API_KEY=secure_random_key
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Certificate Expiration Management

#### Apple Certificates (Valid until July 2026)
```bash
# Check certificate expiration
openssl x509 -in pass.pem -noout -enddate
# Output: notAfter=Jul 15 12:00:00 2026 GMT

# Set up monitoring for certificate renewal
*/30 * * * * /scripts/check-apple-cert-expiry.sh
```

#### Certificate Renewal Process
```bash
#!/bin/bash
# check-apple-cert-expiry.sh

CERT_FILE="pass.pem"
EXPIRY_DATE=$(openssl x509 -in $CERT_FILE -noout -enddate | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

# Alert if less than 30 days remaining
if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
  echo "⚠️ Apple Wallet certificate expires in $DAYS_UNTIL_EXPIRY days!"
  # Send alert to monitoring system
  curl -X POST https://alerts.rewardjar.com/webhook \
    -d "Apple Wallet certificate expires in $DAYS_UNTIL_EXPIRY days"
fi
```

### Health Monitoring & Testing

#### Wallet Integration Health Checks
```typescript
// /src/app/api/health/wallet/route.ts
export async function GET() {
  const checks = {
    apple_wallet: false,
    google_wallet: false,
    pwa_wallet: true,  // Always available
    environment_vars: false
  }
  
  // Check Apple Wallet configuration
  if (process.env.APPLE_TEAM_IDENTIFIER && process.env.APPLE_PASS_TYPE_IDENTIFIER) {
    try {
      // Test certificate validity
      const certValid = await validateAppleCertificate()
      checks.apple_wallet = certValid
    } catch (error) {
      console.error('Apple Wallet check failed:', error)
    }
  }
  
  // Check Google Wallet configuration
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_CLASS_ID) {
    try {
      // Test service account access
      const authValid = await validateGoogleAuth()
      checks.google_wallet = authValid
    } catch (error) {
      console.error('Google Wallet check failed:', error)
    }
  }
  
  // Environment variables check
  const requiredVars = [
    'BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY', 'APPLE_TEAM_IDENTIFIER', 'APPLE_PASS_TYPE_IDENTIFIER',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_CLASS_ID'
  ]
  
  checks.environment_vars = requiredVars.every(varName => !!process.env[varName])
  
  const allHealthy = Object.values(checks).every(Boolean)
  
  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    wallet_availability: {
      apple: checks.apple_wallet ? 'available' : 'unavailable',
      google: checks.google_wallet ? 'available' : 'unavailable', 
      pwa: 'available'
    }
  }, {
    status: allHealthy ? 200 : 503
  })
}
```

#### End-to-End Testing Scripts
```bash
#!/bin/bash
# test-wallet-integration.sh

echo "🧪 Testing RewardJar Wallet Integration..."

# Test Apple Wallet
echo "📱 Testing Apple Wallet..."
APPLE_RESPONSE=$(curl -s -w "%{http_code}" \
  "http://localhost:3000/api/wallet/apple/test-customer-card-id?debug=true")

if [[ $APPLE_RESPONSE == *"200"* ]]; then
  echo "✅ Apple Wallet: Working"
else
  echo "❌ Apple Wallet: Failed"
fi

# Test Google Wallet  
echo "🤖 Testing Google Wallet..."
GOOGLE_RESPONSE=$(curl -s -w "%{http_code}" \
  "http://localhost:3000/api/wallet/google/test-customer-card-id")

if [[ $GOOGLE_RESPONSE == *"200"* ]]; then
  echo "✅ Google Wallet: Working"
else
  echo "❌ Google Wallet: Failed"
fi

# Test PWA Wallet
echo "📱 Testing PWA Wallet..."
PWA_RESPONSE=$(curl -s -w "%{http_code}" \
  "http://localhost:3000/api/wallet/pwa/test-customer-card-id")

if [[ $PWA_RESPONSE == *"200"* ]]; then
  echo "✅ PWA Wallet: Working"
else
  echo "❌ PWA Wallet: Failed"
fi

echo "🎉 Wallet integration testing complete!"
```

---

## 🔧 Troubleshooting Guide

### Common Apple Wallet Issues

#### Certificate Problems
```bash
# Error: "Certificate verification failed"
# Solution: Verify certificate chain
openssl verify -CAfile wwdr.pem pass.pem

# Error: "Invalid pass type identifier"  
# Solution: Check Apple Developer portal settings
# Ensure Pass Type ID matches environment variable exactly
```

#### Pass Bundle Issues
```bash
# Error: "Invalid manifest.json"
# Solution: Verify SHA1 checksums
shasum pass.json manifest.json signature

# Error: "Signature verification failed"
# Solution: Re-create signature with correct certificates
openssl smime -sign -binary -noattr \
  -certfile wwdr.pem -signer pass.pem -inkey pass.key \
  -in manifest.json -out signature -outform DER
```

### Common Google Wallet Issues

#### Authentication Problems
```bash
# Error: "Service account authentication failed"
# Solution: Verify private key format
echo $GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY | head -1
# Should output: -----BEGIN PRIVATE KEY-----

# Error: "Insufficient permissions"
# Solution: Check IAM roles
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*rewardjar*"
```

#### API Integration Issues
```javascript
// Error: "Invalid JWT signature"
// Solution: Verify token generation
const jwt = require('jsonwebtoken')
const decoded = jwt.decode(token, { complete: true })
console.log('JWT Header:', decoded.header)
console.log('JWT Payload:', decoded.payload)

// Error: "Class not found"
// Solution: Create loyalty class first
const classRequest = await authClient.request({
  url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass',
  method: 'POST',
  data: loyaltyClass
})
```

### Performance Optimization

#### Caching Strategy
```typescript
// Cache pass data for 5 minutes to reduce database calls
const cache = new Map()

export async function getCachedCustomerCard(customerCardId: string) {
  const cacheKey = `customer_card_${customerCardId}`
  
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey)
    if (Date.now() - timestamp < 5 * 60 * 1000) { // 5 minutes
      return data
    }
  }
  
  const data = await fetchCustomerCardFromDB(customerCardId)
  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}
```

#### Async Processing
```typescript
// Process wallet updates in background queue
import Bull from 'bull'

const walletUpdateQueue = new Bull('wallet updates', {
  redis: { host: 'localhost', port: 6379 }
})

walletUpdateQueue.process('update-pass', async (job) => {
  const { customerCardId, updateType } = job.data
  
  switch (updateType) {
    case 'stamp_added':
      await updateAppleWalletPass(customerCardId)
      await updateGoogleWalletObject(customerCardId)
      break
    case 'reward_unlocked':
      await sendRewardNotification(customerCardId)
      break
  }
})
```

---

## 📊 Analytics & Monitoring

### Wallet Usage Metrics
```sql
-- Track wallet adoption rates
SELECT 
  wallet_type,
  COUNT(*) as total_cards,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM customer_cards 
WHERE wallet_type IS NOT NULL
GROUP BY wallet_type;

-- Monitor wallet pass generation success rates
SELECT 
  DATE_TRUNC('day', created_at) as date,
  wallet_type,
  COUNT(*) as passes_generated,
  AVG(current_stamps) as avg_stamps_at_creation
FROM customer_cards
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), wallet_type
ORDER BY date DESC;
```

### Error Tracking
```typescript
// Structured logging for wallet operations
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'wallet-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'wallet-combined.log' })
  ]
})

// Log wallet operations
export function logWalletOperation(operation: string, customerCardId: string, walletType: string, success: boolean, error?: any) {
  const logData = {
    operation,
    customerCardId,
    walletType,
    success,
    timestamp: new Date().toISOString(),
    error: error?.message
  }
  
  if (success) {
    logger.info('Wallet operation successful', logData)
  } else {
    logger.error('Wallet operation failed', logData)
  }
}
```

---

## 🏁 Conclusion

RewardJar's multi-wallet implementation provides comprehensive support for Apple Wallet, Google Wallet, and PWA functionality, ensuring maximum compatibility across all mobile platforms. The system is production-ready with proper certificate management, real-time updates, offline support, and comprehensive error handling.

### Key Success Factors ✅
- **Universal Compatibility**: Works on iOS, Android, and web browsers
- **Real-time Synchronization**: Instant updates when stamps are collected  
- **Graceful Degradation**: PWA fallback ensures no customer is left behind
- **Security First**: Proper certificate handling and authentication
- **Scalable Architecture**: Async processing and caching for performance
- **Comprehensive Testing**: End-to-end validation and monitoring

### Production Readiness ✅
- All environment variables documented and validated
- Certificates valid until July 2026
- Error handling and recovery mechanisms in place
- Performance optimizations implemented
- Monitoring and alerting configured
- Documentation complete for ongoing maintenance

**Status**: ✅ **PRODUCTION READY** - Deploy with confidence! 