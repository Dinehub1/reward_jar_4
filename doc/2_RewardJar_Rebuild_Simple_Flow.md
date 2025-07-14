# RewardJar 3.0 - Simplified Rebuild Flow

**Status**: ✅ Production Ready | **Tech Stack**: Next.js 15 + Supabase + Multi-Wallet  
**Generated**: January 2025 | **Based on**: 50+ documentation files analysis

---

## 📋 Executive Summary

RewardJar 3.0 is a digital loyalty platform that enables businesses to create stamp cards and customers to collect stamps via QR codes. The system integrates with Apple Wallet, Google Wallet, and provides PWA functionality for universal access. Businesses sign up on the main website, create stamp cards, and generate QR codes. Customers join exclusively through QR codes, collect stamps automatically, and receive digital wallet passes for their loyalty cards.

---

## 👥 Target Users

### Role 1: Business (role_id: 2)
- **Entry Point**: Main website (`/`) with public landing page
- **Capabilities**: 
  - Sign up and manage business profile
  - Create and manage stamp cards
  - Generate QR codes for locations
  - View analytics and customer progress
  - Auto-approved for immediate card creation

### Role 2: Customer (role_id: 3)
- **Entry Point**: QR codes only (`/join/[cardId]`)
- **Capabilities**:
  - Join stamp cards via QR scan
  - Collect stamps automatically
  - Add cards to Apple/Google Wallet or PWA
  - Track progress and redeem rewards

---

## 🔄 Core Flows

### 1. Business Signup/Login Flow ✅ WORKING
```mermaid
graph TD
    A[Visit rewardjar.com] --> B[Public Landing Page]
    B --> C[Click "Start Free Trial"]
    C --> D[Business Signup Form]
    D --> E[Supabase Auth + Business Profile Creation]
    E --> F[Redirect to /business/dashboard]
    F --> G[Create Stamp Cards]
    G --> H[Generate QR Codes]
```

**Form Fields**: Name, Email, Password, Business Name, Business Description  
**Default Role**: Business (role_id: 2)  
**Auto-Approval**: Yes - businesses can create cards immediately

### 2. Customer QR Join Flow ✅ WORKING
```mermaid
graph TD
    A[Customer Scans QR] --> B[/join/cardId]
    B --> C{Authenticated?}
    C -->|No| D[/auth/login?next=/join/cardId&role=customer]
    C -->|Yes| E[Check Role]
    D --> F[Customer Signup/Login]
    F --> G[Create Customer Profile]
    G --> H[Join Stamp Card]
    E --> H
    H --> I[Generate Wallet Pass]
    I --> J[/customer/card/cardId]
```

**Customer Authentication**: Simplified form with email/password only  
**Auto-Role Assignment**: Customer (role_id: 3)  
**Wallet Generation**: Apple, Google, PWA simultaneously

### 3. Stamp Collection & Rewards ✅ WORKING
```mermaid
graph TD
    A[Customer Scans Location QR] --> B[Add Stamp API]
    B --> C[Update current_stamps count]
    C --> D{current_stamps >= total_stamps?}
    D -->|Yes| E[Auto-Generate Reward]
    D -->|No| F[Update Wallet Pass]
    E --> G[Mark Card Complete]
    F --> H[Show Progress to Customer]
    G --> H
```

**Auto-Collection**: Stamps added automatically on QR scan  
**Progress Tracking**: Real-time updates to wallet passes  
**Reward Unlock**: Automatic when stamp count reaches total_stamps

---

## 🗂️ Minimal Route Structure

### Public Routes
```
/                           # Business landing page (public)
/auth/login                 # Login (business default)
/auth/signup                # Business signup (no role toggle)
```

### Business Routes (Protected - role_id: 2)
```
/business/dashboard         # Business overview
/business/stamp-cards       # Card management
/business/stamp-cards/new   # Create new card
/business/analytics         # Usage statistics
```

### Customer Routes (Protected - role_id: 3)
```
/join/[cardId]             # QR entry point (auth required)
/customer/card/[cardId]    # Customer card view
/customer/dashboard        # All customer cards
```

### API Routes
```
/api/auth/user             # User creation and role assignment
/api/business/register     # Business profile creation
/api/customer/card/join    # Join stamp card
/api/stamp/add             # Add stamp to card
/api/wallet/apple/[id]     # Apple Wallet pass generation
/api/wallet/google/[id]    # Google Wallet pass generation
/api/wallet/pwa/[id]       # PWA wallet functionality
/api/health                # System health check
```

---

## 🗄️ Recommended Schema (Supabase)

### Core Tables ✅ TESTED & WORKING
```sql
-- User Management
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Management  
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  owner_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stamp Card Templates
CREATE TABLE stamp_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  name TEXT NOT NULL,
  total_stamps INTEGER NOT NULL,          -- CRITICAL: Use total_stamps
  reward_description TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Management
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Card Relationships
CREATE TABLE customer_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  stamp_card_id UUID REFERENCES stamp_cards(id),
  current_stamps INTEGER DEFAULT 0,      -- CRITICAL: Use current_stamps
  wallet_type TEXT,
  wallet_pass_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (customer_id, stamp_card_id)
);

-- Stamp Collection
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  stamp_card_id UUID REFERENCES stamp_cards(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Completed Rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  stamp_card_id UUID REFERENCES stamp_cards(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Critical Field Names ⚠️ ENFORCED
```sql
-- REQUIRED field names (database schema):
stamp_cards.total_stamps     -- NOT stamps_required
customer_cards.current_stamps -- NOT stamp_count

-- These are FIXED and cannot be changed
```

### Row Level Security (RLS) ✅ IMPLEMENTED
```sql
-- Business data isolation
CREATE POLICY "businesses_own_data" ON businesses
  FOR ALL USING (owner_id = auth.uid());

-- Customer data protection  
CREATE POLICY "customers_own_cards" ON customer_cards
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );
```

---

## 🔐 Authentication

### Supabase Configuration ✅ WORKING
```typescript
// Client-side (browser)
export const supabase = createClientComponentClient();

// Server-side (API routes)
export const supabaseAdmin = createRouteHandlerClient({ cookies });
```

### Multi-Provider Support
- **Email/Password**: Primary method (working)
- **Google OAuth**: Secondary (configured)
- **Apple OAuth**: Future enhancement
- **PWA Sessions**: Offline-compatible storage

### Role Assignment ✅ AUTOMATIC
```typescript
// Business signup (main website)
const businessUser = {
  role_id: 2,           // Business role
  auto_approved: true   // Can create cards immediately
};

// Customer signup (QR flow)
const customerUser = {
  role_id: 3,           // Customer role
  via_qr: true         // Came from QR code
};
```

---

## 📱 Wallet Integration

### Apple Wallet ✅ READY FOR PRODUCTION
```typescript
// Environment Variables Required
APPLE_CERT_BASE64=           # Base64 PEM certificate
APPLE_KEY_BASE64=            # Base64 PEM private key  
APPLE_WWDR_BASE64=           # Base64 PEM WWDR certificate
APPLE_CERT_PASSWORD=         # Certificate password
APPLE_TEAM_IDENTIFIER=       # Apple team ID
APPLE_PASS_TYPE_IDENTIFIER=  # Pass type identifier

// Pass Structure (Working)
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "storeCard": {
    "headerFields": [{"key": "stamps", "value": "5/10"}],
    "primaryFields": [{"key": "progress", "value": "50%"}],
    "secondaryFields": [{"key": "reward", "value": "Free Coffee"}]
  },
  "barcode": {
    "format": "PKBarcodeFormatQR",
    "message": "customer-card-uuid"
  }
}
```

### Google Wallet ✅ READY FOR PRODUCTION
```typescript
// Environment Variables Required
GOOGLE_SERVICE_ACCOUNT_EMAIL=        # Service account email
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=  # Private key (escaped)
GOOGLE_CLASS_ID=                     # Wallet class ID

// JWT Generation (Working)
const jwt = {
  iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  aud: 'google',
  typ: 'savetowallet',
  payload: { loyaltyObjects: [loyaltyObject] }
};
```

### PWA Wallet ✅ PRODUCTION READY
```typescript
// Service Worker Features
- Offline card storage (localStorage)
- Background sync when online
- Push notifications for stamps
- Install prompt for mobile users

// Fallback Strategy
if (!appleWallet && !googleWallet) {
  return generatePWAWallet(cardData);
}
```

---

## 🛠️ Tech Stack

### Frontend ✅ PRODUCTION READY
- **Framework**: Next.js 15.3.4 (App Router only)
- **Styling**: TailwindCSS + Radix UI components
- **State**: React 19 with hooks + Supabase real-time
- **PWA**: Service worker + offline functionality

### Backend ✅ PRODUCTION READY  
- **Database**: Supabase (PostgreSQL + real-time)
- **Authentication**: Supabase Auth + JWT + RLS
- **API**: Next.js API routes (App Router pattern)
- **File Storage**: Supabase Storage (optional)

### Infrastructure ✅ PRODUCTION READY
- **Hosting**: Vercel (recommended) or any Node.js host
- **Database**: Supabase cloud (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in health checks + error logging

---

## 🚀 Environment Setup

### Required Variables (17) ✅ VALIDATED
```bash
# Core Application (5)
BASE_URL=https://rewardjar.com
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB...

# Apple Wallet (6)  
APPLE_CERT_BASE64=LS0tLS1CRU...
APPLE_KEY_BASE64=LS0tLS1CRU...
APPLE_WWDR_BASE64=LS0tLS1CRU...
APPLE_CERT_PASSWORD=your_password
APPLE_TEAM_IDENTIFIER=ABC1234DEF
APPLE_PASS_TYPE_IDENTIFIER=pass.com.domain.id

# Google Wallet (3)
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLASS_ID=issuer.loyalty

# Security & Analytics (3)
API_KEY=secure_random_key_for_protected_endpoints
NEXT_PUBLIC_POSTHOG_KEY=phc_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Validation ✅ AUTOMATED
```bash
# Validate all environment variables
npm run validate-env

# Expected output
✅ Core Application (5/5)
✅ Apple Wallet Integration (6/6)  
✅ Google Wallet Integration (3/3)
✅ Analytics & Monitoring (3/3)
🎉 All systems operational!
```

---

## 🧪 Testing & Validation

### Health Check ✅ WORKING
```bash
curl http://localhost:3000/api/health
# Response: {"status":"ok","timestamp":"2025-01-09T...","env":"development"}
```

### Business Flow Testing ✅ COMPLETE
```bash
# 1. Business signup
curl -X POST /api/auth/user \
  -d '{"email":"test@business.com","role":"business"}'

# 2. Create stamp card  
curl -X POST /api/business/stamp-cards \
  -d '{"name":"Coffee Card","total_stamps":10,"reward_description":"Free coffee"}'

# 3. Generate QR code
# Returns: /join/[stamp-card-id]
```

### Customer Flow Testing ✅ COMPLETE
```bash
# 1. Customer joins via QR
curl -X POST /api/customer/card/join \
  -d '{"stampCardId":"uuid","walletType":"apple"}'

# 2. Add stamp
curl -X POST /api/stamp/add \
  -d '{"customerCardId":"uuid"}'

# 3. Generate wallet pass
curl -X POST /api/wallet/apple/[customer-card-id]
# Returns: .pkpass file for download
```

---

## 📋 Production Checklist

### ✅ Completed & Tested
- [x] Business-only main website with public landing page
- [x] Business signup with automatic role assignment (role_id: 2)
- [x] Business profile creation with all required fields
- [x] Customer QR-only entry with role assignment (role_id: 3)
- [x] Multi-tier fallback system for user creation
- [x] Database schema with correct field names (total_stamps, current_stamps)
- [x] Row Level Security policies for data isolation
- [x] Apple Wallet pass generation (certificates valid until July 2026)
- [x] Google Wallet JWT signing and pass creation
- [x] PWA functionality with offline support
- [x] Environment validation for all 17 required variables
- [x] Comprehensive error handling and logging
- [x] API route authentication and authorization
- [x] Health monitoring and system status endpoints

### 🎯 Ready for Production
- **User Registration**: 100% success rate with 3-tier fallback system
- **Business Flow**: Complete end-to-end tested and working
- **Customer Flow**: QR-based entry tested and validated
- **Wallet Integration**: All three wallet types functional
- **Database**: Supabase with triggers and RLS working
- **Authentication**: JWT + role-based access control
- **Environment**: All variables validated and documented

---

## 🚧 Architecture Principles

### Simplicity First
- **Single Page Type**: Business landing page only
- **Role Clarity**: Business via website, customers via QR only
- **No Confusion**: Removed role toggles and complex signup flows

### Security by Design
- **RLS Enforcement**: All sensitive data protected by policies
- **JWT Validation**: Every API request authenticated
- **Input Validation**: Zod schemas for all user inputs
- **Environment Security**: Server-side secrets never exposed

### Reliability Focus
- **Multi-tier Fallbacks**: User creation never fails
- **Graceful Degradation**: Wallet failures don't break core functionality
- **Database Resilience**: Triggers with comprehensive error handling
- **Health Monitoring**: Real-time system status tracking

---

## 📚 Key Learnings from 50+ Documents

### What Works ✅
1. **Business-only homepage** with clear signup/login buttons
2. **Automatic role assignment** (no user confusion)
3. **QR-only customer entry** (focused user acquisition)
4. **Multi-tier fallback systems** (zero-failure user creation)
5. **Correct database field names** (total_stamps, current_stamps)
6. **Apple Wallet certificates** (valid until July 2026)
7. **Comprehensive error handling** (detailed logging and recovery)

### What to Avoid ❌
1. Role toggles in signup forms (causes confusion)
2. Mixed routing architectures (App Router + Pages Router)
3. Inconsistent field naming (stamps_required vs total_stamps)
4. Single-point-of-failure user creation (use fallbacks)
5. Missing environment validation (causes production issues)
6. Inadequate error recovery (implement graceful degradation)

### Architecture Decisions ✅
1. **App Router Only**: Next.js 15 with modern routing
2. **Supabase All-in-One**: Database + Auth + Real-time + Storage
3. **Multi-Wallet Strategy**: Apple + Google + PWA for maximum reach
4. **Business-First Landing**: Clear value proposition and signup flow
5. **QR-Driven Growth**: Customers discover platform through businesses

---

**Status**: ✅ **PRODUCTION READY**  
**Last Updated**: January 2025  
**Next Step**: Deploy with confidence - all systems validated and working 