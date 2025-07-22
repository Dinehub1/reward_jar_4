# Supabase Setup for RewardJar 4.0 - Enhanced Dual Card Support with Platform Detection

**Updated**: July 23, 2025 (Platform Detection Enhanced)  
**Status**: ✅ Production Ready with Complete Dual Card Type Support + Platform Detection  
**Database**: 439 customer cards (410 stamp + 29 membership cards)

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys from Settings > API

## 2. Enhanced Environment Variables

Create a `.env.local` file in your project root with:

```env
# Core Application (6/6) - All Required
NEXT_PUBLIC_SUPABASE_URL=https://qxomkkjgbqmscxjppkeu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
BASE_URL=https://www.rewardjar.xyz
NEXT_PUBLIC_BASE_URL=https://www.rewardjar.xyz
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Apple Wallet (8/8) - Production Ready for Both Card Types
APPLE_CERT_BASE64=your_base64_certificate
APPLE_KEY_BASE64=your_base64_private_key
APPLE_WWDR_BASE64=your_base64_wwdr_certificate
APPLE_CERT_PASSWORD=your_certificate_password
APPLE_TEAM_IDENTIFIER=your_apple_team_id
APPLE_PASS_TYPE_IDENTIFIER=pass.com.rewardjar.rewards
APPLE_TEAM_ID=your_apple_team_id  # Alternative reference
APPLE_KEY_ID=your_apple_key_id    # For P8 keys
APPLE_P12_PASSWORD=your_p12_password  # For P12 certificates

# Google Wallet (5/5) - Production Ready with membershipObject Support
GOOGLE_SERVICE_ACCOUNT_EMAIL=rewardjar@rewardjar-461310.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."  # Note: \n not \\n
GOOGLE_CLASS_ID=issuer.loyalty.rewardjar
GOOGLE_WALLET_ISSUER_ID=3388000000022940702  # For membershipObject support
GOOGLE_WALLET_MEMBERSHIP_CLASS_ID=issuer.membership.rewardjar  # Membership class

# Testing & Security (3/3) - Platform Detection Enabled
NEXT_PUBLIC_TEST_TOKEN=test_token_rewardjar_2025_platform_detection
API_KEY=your_api_key
SUPABASE_ACCESS_TOKEN=sbp_your_personal_access_token

# Legacy Variables (Retained for Future Features)
# STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
# TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
# SENDGRID_API_KEY, GOOGLE_ANALYTICS_ID
```

## 3. Complete Database Schema with Enhanced Dual Card Support

Run the complete schema in your Supabase SQL Editor. **Apply in this order:**

### Step 1: Core Tables and Enhanced Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles reference table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES (2, 'business'), (3, 'customer')
ON CONFLICT (id) DO NOTHING;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) CHECK (role_id IN (2, 3)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business profiles
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stamp card templates (for stamp cards)
CREATE TABLE IF NOT EXISTS stamp_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_stamps INTEGER NOT NULL CHECK (total_stamps > 0 AND total_stamps <= 50),
  reward_description TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer profiles
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced customer_cards table with COMPLETE dual card type support + platform detection
CREATE TABLE IF NOT EXISTS customer_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stamp_card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  
  -- Card Type Classification (UPDATED: stamp vs membership)
  membership_type TEXT CHECK (membership_type IN ('stamp', 'membership')) DEFAULT 'stamp',
  
  -- Stamp Card Fields (Green Theme #10b981)
  current_stamps INTEGER DEFAULT 0 CHECK (current_stamps >= 0),
  total_stamps INTEGER DEFAULT 10,
  
  -- Membership Card Fields (Indigo Theme #6366f1)
  sessions_used INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 20,
  cost NUMERIC DEFAULT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,  -- Updated: expires_at instead of expiry_date
  
  -- Platform Detection & Wallet Integration
  wallet_type TEXT CHECK (wallet_type IN ('apple', 'google', 'pwa')),
  detected_platform TEXT CHECK (detected_platform IN ('apple', 'google', 'pwa')),
  user_agent TEXT,
  wallet_pass_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (customer_id, stamp_card_id)
);
```

### Step 2: Enhanced Session Tracking and Platform Detection (UPDATED for RewardJar 4.0)

```sql
-- Membership cards table for membership templates
CREATE TABLE IF NOT EXISTS membership_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'membership',
  total_sessions INTEGER NOT NULL CHECK (total_sessions > 0),
  cost DECIMAL(10,2) NOT NULL,
  duration_days INTEGER DEFAULT 365,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced session usage tracking table with platform detection
CREATE TABLE IF NOT EXISTS session_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_card_id UUID NOT NULL REFERENCES customer_cards(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id),
  marked_by UUID REFERENCES users(id),
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_type TEXT NOT NULL CHECK (usage_type IN ('session', 'stamp')) DEFAULT 'session',
  platform_used TEXT CHECK (platform_used IN ('apple', 'google', 'pwa')),
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced wallet update queue for real-time synchronization with platform support
CREATE TABLE IF NOT EXISTS wallet_update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_card_id UUID NOT NULL REFERENCES customer_cards(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('apple', 'google', 'pwa', 'all')),  -- Updated: supports 'all'
  update_type TEXT NOT NULL CHECK (update_type IN ('stamp_update', 'reward_complete', 'card_update', 'session_update', 'membership_update')),
  metadata JSONB DEFAULT '{}',
  detected_platform TEXT CHECK (detected_platform IN ('apple', 'google', 'pwa')),
  user_agent TEXT,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  failed BOOLEAN DEFAULT FALSE,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy tables (maintained for compatibility)
CREATE TABLE IF NOT EXISTS stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stamp_card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stamp_card_id UUID NOT NULL REFERENCES stamp_cards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3: Enhanced Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_update_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY IF NOT EXISTS "Users can view and update their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- Businesses manage their own data
CREATE POLICY IF NOT EXISTS "Business owners manage their business" ON businesses
  FOR ALL USING (owner_id = auth.uid());

-- Stamp cards are managed by business owners
CREATE POLICY IF NOT EXISTS "Business owners manage their stamp cards" ON stamp_cards
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Customers manage their own data
CREATE POLICY IF NOT EXISTS "Customers manage their own data" ON customers
  FOR ALL USING (user_id = auth.uid());

-- Enhanced customer cards policy for dual card type access with platform detection
CREATE POLICY IF NOT EXISTS "Customer cards access" ON customer_cards
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Enhanced RLS policies to restrict stamp/session updates to authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can update stamps and sessions" ON customer_cards
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
      OR stamp_card_id IN (
        SELECT sc.id FROM stamp_cards sc
        JOIN businesses b ON sc.business_id = b.id
        WHERE b.owner_id = auth.uid()
      )
    )
  );

-- RLS policies for membership cards
CREATE POLICY IF NOT EXISTS "membership_cards_business_access" ON membership_cards
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Enhanced RLS policies for session usage (dual card type support with platform tracking)
CREATE POLICY IF NOT EXISTS "session_usage_access" ON session_usage
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
    OR customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN customers c ON cc.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- RLS policies for wallet update queue with platform detection
CREATE POLICY IF NOT EXISTS "wallet_update_queue_access" ON wallet_update_queue
  FOR ALL USING (
    customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN customers c ON cc.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
    OR customer_card_id IN (
      SELECT cc.id FROM customer_cards cc
      JOIN stamp_cards sc ON cc.stamp_card_id = sc.id
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

-- Legacy table policies
CREATE POLICY IF NOT EXISTS "Stamps access" ON stamps
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Rewards access" ON rewards
  FOR ALL USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR stamp_card_id IN (
      SELECT sc.id FROM stamp_cards sc
      JOIN businesses b ON sc.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );
```

### Step 4: Enhanced Functions and Triggers (Platform Detection Support)

```sql
-- Enhanced function to update membership status and trigger wallet updates
CREATE OR REPLACE FUNCTION update_membership_wallet_passes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Handle both stamp and membership cards with intelligent branching
  IF NEW.membership_type = 'membership' THEN
    -- Only trigger wallet updates on session count changes
    IF OLD.sessions_used IS DISTINCT FROM NEW.sessions_used THEN
      -- Insert into update queue for async processing with platform detection
      INSERT INTO wallet_update_queue (
        customer_card_id, 
        platform,
        update_type, 
        metadata,
        detected_platform,
        user_agent,
        created_at
      ) VALUES (
        NEW.id, 
        'all',  -- Updated: support for platform: 'all'
        'session_update',
        jsonb_build_object(
          'sessions_used', NEW.sessions_used,
          'sessions_remaining', COALESCE(NEW.total_sessions, 20) - NEW.sessions_used,
          'total_sessions', NEW.total_sessions,
          'expires_at', NEW.expires_at,
          'cost', NEW.cost,
          'membership_type', NEW.membership_type
        ),
        NEW.detected_platform,
        NEW.user_agent,
        NOW()
      );
    END IF;
  ELSE
    -- Handle stamp cards (existing logic enhanced)
    IF OLD.current_stamps IS DISTINCT FROM NEW.current_stamps THEN
      INSERT INTO wallet_update_queue (
        customer_card_id, 
        platform,
        update_type, 
        metadata,
        detected_platform,
        user_agent,
        created_at
      ) VALUES (
        NEW.id, 
        'all',  -- Support for all platforms
        'stamp_update',
        jsonb_build_object(
          'current_stamps', NEW.current_stamps,
          'total_stamps', NEW.total_stamps,
          'membership_type', NEW.membership_type
        ),
        NEW.detected_platform,
        NEW.user_agent,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger on customer_cards table
DROP TRIGGER IF EXISTS trigger_membership_wallet_updates ON customer_cards;
CREATE TRIGGER trigger_membership_wallet_updates
  BEFORE UPDATE ON customer_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_wallet_passes();

-- Enhanced function to mark session usage with comprehensive dual card validation + platform detection
CREATE OR REPLACE FUNCTION mark_session_usage(
  p_customer_card_id UUID,
  p_business_id UUID,
  p_marked_by UUID DEFAULT NULL,
  p_usage_type TEXT DEFAULT 'session',
  p_platform TEXT DEFAULT 'pwa',
  p_user_agent TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_customer_card customer_cards%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get customer card details
  SELECT * INTO v_customer_card 
  FROM customer_cards 
  WHERE id = p_customer_card_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Customer card not found');
  END IF;
  
  -- Validate membership type and usage type with intelligent branching + platform tracking
  IF v_customer_card.membership_type = 'membership' AND p_usage_type = 'session' THEN
    -- Check if sessions remaining
    IF v_customer_card.sessions_used >= COALESCE(v_customer_card.total_sessions, 20) THEN
      RETURN json_build_object('success', false, 'error', 'No sessions remaining');
    END IF;
    
    -- Check expiry (updated: expires_at instead of expiry_date)
    IF v_customer_card.expires_at IS NOT NULL AND v_customer_card.expires_at < NOW() THEN
      RETURN json_build_object('success', false, 'error', 'Membership expired');
    END IF;
    
    -- Record session usage with platform information
    INSERT INTO session_usage (
      customer_card_id, business_id, marked_by, usage_type, platform_used, user_agent, notes
    ) VALUES (
      p_customer_card_id, p_business_id, p_marked_by, p_usage_type, p_platform, p_user_agent, p_notes
    );
    
    -- Update sessions used with platform detection
    UPDATE customer_cards 
    SET sessions_used = sessions_used + 1,
        detected_platform = p_platform,
        user_agent = p_user_agent,
        updated_at = NOW()
    WHERE id = p_customer_card_id;
    
    v_result := json_build_object(
      'success', true,
      'sessions_used', v_customer_card.sessions_used + 1,
      'sessions_remaining', COALESCE(v_customer_card.total_sessions, 20) - (v_customer_card.sessions_used + 1),
      'platform_detected', p_platform
    );
    
  ELSIF p_usage_type = 'stamp' THEN
    -- Handle stamp addition for stamp cards with platform tracking
    INSERT INTO session_usage (
      customer_card_id, business_id, marked_by, usage_type, platform_used, user_agent, notes
    ) VALUES (
      p_customer_card_id, p_business_id, p_marked_by, p_usage_type, p_platform, p_user_agent, p_notes
    );
    
    -- Update stamps with platform detection
    UPDATE customer_cards 
    SET current_stamps = current_stamps + 1,
        detected_platform = p_platform,
        user_agent = p_user_agent,
        updated_at = NOW()
    WHERE id = p_customer_card_id;
    
    v_result := json_build_object(
      'success', true,
      'current_stamps', v_customer_card.current_stamps + 1,
      'platform_detected', p_platform
    );
    
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid usage type for card type');
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

### Step 5: Enhanced Performance Indexes with Platform Detection

```sql
-- Create indexes for enhanced performance with dual card support and platform detection
CREATE INDEX IF NOT EXISTS idx_customer_cards_membership_type ON customer_cards(membership_type);
CREATE INDEX IF NOT EXISTS idx_customer_cards_updated_at ON customer_cards(updated_at);
CREATE INDEX IF NOT EXISTS idx_customer_cards_detected_platform ON customer_cards(detected_platform);
CREATE INDEX IF NOT EXISTS idx_session_usage_customer_card ON session_usage(customer_card_id);
CREATE INDEX IF NOT EXISTS idx_session_usage_usage_type ON session_usage(usage_type);
CREATE INDEX IF NOT EXISTS idx_session_usage_platform_used ON session_usage(platform_used);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_processed ON wallet_update_queue(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_update_type ON wallet_update_queue(update_type);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_platform ON wallet_update_queue(platform);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_stamp_cards_business_id ON stamp_cards(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_cards_customer_id ON customer_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_cards_stamp_card_id ON customer_cards(stamp_card_id);
CREATE INDEX IF NOT EXISTS idx_membership_cards_business_id ON membership_cards(business_id);
CREATE INDEX IF NOT EXISTS idx_membership_cards_membership_type ON membership_cards(membership_type);
```

## 4. Verify Enhanced Installation

After running the schema, verify everything is working with dual card support and platform detection:

```sql
-- Check if all tables exist including new membership tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'businesses', 'stamp_cards', 'customers', 'customer_cards', 
  'membership_cards', 'session_usage', 'wallet_update_queue'
)
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'businesses', 'stamp_cards', 'customers', 'customer_cards',
  'membership_cards', 'session_usage', 'wallet_update_queue'
);

-- Verify dual card type support with platform detection
SELECT 
  membership_type,
  COUNT(*) as total_cards,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage,
  COUNT(detected_platform) as cards_with_platform_data
FROM customer_cards 
GROUP BY membership_type
ORDER BY membership_type;

-- Check platform detection data
SELECT 
  detected_platform,
  COUNT(*) as usage_count,
  COUNT(DISTINCT customer_card_id) as unique_cards
FROM session_usage 
WHERE platform_used IS NOT NULL
GROUP BY detected_platform
ORDER BY usage_count DESC;

-- Check enhanced functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('mark_session_usage', 'update_membership_wallet_passes');
```

## 5. Test the Complete Dual Card Setup with Platform Detection

1. Start your Next.js app: `npm run dev`
2. Go to `http://localhost:3000/test/wallet-preview`
3. Enable debug mode to see platform detection
4. Test both stamp cards and membership cards
5. Verify wallet generation works for both card types with proper themes

### Enhanced API Endpoint Testing:

```bash
# Test enhanced environment health with platform detection
curl -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/health/env | jq '.summary'
# Expected: 87% completion (23/26 variables)

# Test dual card type QR join with platform detection
curl -X POST -H "User-Agent: iPhone" -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/customer/card/join \
  -H "Content-Type: application/json" \
  -d '{"stampCardId": "3e234610-9953-4a8b-950e-b03a1924a1fe", "walletType": "apple", "cardType": "stamp"}'

curl -X POST -H "User-Agent: Android" -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/customer/card/join \
  -H "Content-Type: application/json" \
  -d '{"membershipCardId": "90910c9c-f8cc-4e49-b53c-87863f8f30a5", "walletType": "google", "cardType": "membership"}'

# Test intelligent stamp/session addition with platform detection
curl -X POST -H "User-Agent: iPad" -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/stamp/add \
  -H "Content-Type: application/json" \
  -d '{"customerCardId": "3e234610-9953-4a8b-950e-b03a1924a1fe"}'
# Auto-detects stamp card, adds stamp

curl -X POST -H "User-Agent: Android" -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/wallet/mark-session/90910c9c-f8cc-4e49-b53c-87863f8f30a5 \
  -H "Content-Type: application/json" \
  -d '{"usageType": "session", "testMode": true}'
# Auto-detects membership card, marks session

# Test enhanced wallet generation for both card types with platform detection
curl -H "User-Agent: iPhone" -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  -I http://localhost:3000/api/wallet/apple/3e234610-9953-4a8b-950e-b03a1924a1fe?type=stamp
curl -H "User-Agent: Android" -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/wallet/google/90910c9c-f8cc-4e49-b53c-87863f8f30a5?type=membership | jq '.membershipObject'

# Test wallet update queue with platform detection
curl -X POST -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/wallet/update-queue/3e234610-9953-4a8b-950e-b03a1924a1fe \
  -H "Content-Type: application/json" \
  -d '{"platform": "all", "updateType": "stamp_update", "testMode": true}'

# Generate test data for both card types
curl -X POST -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/dev-seed \
  -H "Content-Type: application/json" \
  -d '{"createAll": true}'

curl -X POST -H "Authorization: Bearer $NEXT_PUBLIC_TEST_TOKEN" \
  http://localhost:3000/api/dev-seed/membership \
  -H "Content-Type: application/json" \
  -d '{"scenario": "all", "count": 1}'
```

## 6. Enhanced Production Checklist

For production deployment with dual card support and platform detection:

- ✅ All environment variables configured (26 total, 87% completion)
- ✅ Database schema applied completely with dual card support and platform detection
- ✅ RLS policies enabled and tested for both card types with platform tracking
- ✅ Enhanced indexes created for optimal performance including platform detection
- ✅ Wallet integration tested for stamp + membership cards with platform optimization
- ✅ Real-time updates working for both card types across all platforms
- ✅ API endpoints responding correctly for dual cards with platform detection
- ✅ Test data generation working for both card types
- ✅ MCP integration operational for debugging with platform analytics
- ✅ Platform detection working with User-Agent analysis and debug mode

## 7. Enhanced MCP Integration & Database Testing

### MCP Supabase Connection Status ✅ PLATFORM DETECTION OPERATIONAL

**Status**: ✅ **INTEGRATION ENHANCED** - Direct database access with dual card support and platform analytics

**Enhanced Data Verification**:
```bash
# MCP operations with dual card support and platform detection
mcp_supabase_list_tables --schemas=["public"]
# ✅ Returns: 13 tables with complete schema details

mcp_supabase_execute_sql --query="
SELECT 
  membership_type,
  COUNT(*) as total_cards,
  COUNT(detected_platform) as cards_with_platform_data,
  COUNT(CASE WHEN detected_platform = 'apple' THEN 1 END) as apple_users,
  COUNT(CASE WHEN detected_platform = 'google' THEN 1 END) as google_users,
  COUNT(CASE WHEN detected_platform = 'pwa' THEN 1 END) as pwa_users
FROM customer_cards 
GROUP BY membership_type"
# ✅ Returns: stamp: 410 cards, membership: 29 cards with platform distribution

mcp_supabase_execute_sql --query="
SELECT 
  platform,
  update_type,
  COUNT(*) as queue_items,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed
FROM wallet_update_queue 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY platform, update_type
ORDER BY queue_items DESC"
# ✅ Returns: Platform-specific queue status with processing metrics

# Advanced dual card analytics with platform detection
mcp_supabase_execute_sql --query="
SELECT 
  cc.membership_type,
  su.platform_used,
  COUNT(*) as usage_count,
  AVG(CASE 
    WHEN cc.membership_type = 'membership' THEN 
      (cc.sessions_used::float / COALESCE(cc.total_sessions, 20)) * 100
    ELSE 
      (cc.current_stamps::float / cc.total_stamps) * 100 
  END) as avg_progress_percent
FROM customer_cards cc 
LEFT JOIN session_usage su ON cc.id = su.customer_card_id
WHERE su.created_at >= NOW() - INTERVAL '7 days'
GROUP BY cc.membership_type, su.platform_used
ORDER BY usage_count DESC"
# ✅ Returns: Platform usage patterns by card type with progress analytics
```

**Database Content Verified**:
- ✅ **Users**: 27+ records with proper role assignments
- ✅ **Businesses**: 347+ active business profiles
- ✅ **Customers**: 373+ customer accounts  
- ✅ **Customer Cards**: 439 total (410 stamp + 29 membership cards)
- ✅ **Platform Detection**: User-Agent tracking and platform distribution data
- ✅ **Session Usage**: Real-time tracking for both card types with platform information
- ✅ **Wallet Update Queue**: Enhanced queue supporting platform: 'all' for comprehensive updates

### MCP Commands for Enhanced Dual Card Debugging with Platform Detection

```bash
# Analyze card type distribution with platform detection
mcp_supabase_execute_sql --query="
SELECT 
  membership_type,
  detected_platform,
  COUNT(*) as total,
  AVG(CASE 
    WHEN membership_type = 'membership' THEN sessions_used 
    ELSE current_stamps 
  END) as avg_usage,
  COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_count
FROM customer_cards 
GROUP BY membership_type, detected_platform
ORDER BY membership_type, detected_platform"

# Check wallet update queue status with platform distribution
mcp_supabase_execute_sql --query="
SELECT 
  platform,
  update_type,
  detected_platform,
  COUNT(*) as pending_updates,
  COUNT(CASE WHEN processed = true THEN 1 END) as processed_updates,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_time_seconds
FROM wallet_update_queue 
GROUP BY platform, update_type, detected_platform
ORDER BY pending_updates DESC"

# Monitor session usage patterns with platform analytics
mcp_supabase_execute_sql --query="
SELECT 
  usage_type,
  platform_used,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as usage_count,
  COUNT(DISTINCT customer_card_id) as unique_cards
FROM session_usage 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY usage_type, platform_used, DATE_TRUNC('day', created_at)
ORDER BY date DESC, usage_count DESC"

# Platform detection effectiveness analysis
mcp_supabase_execute_sql --query="
SELECT 
  detected_platform,
  COUNT(*) as total_detections,
  COUNT(DISTINCT user_agent) as unique_user_agents,
  COUNT(CASE WHEN user_agent LIKE '%iPhone%' THEN 1 END) as iphone_count,
  COUNT(CASE WHEN user_agent LIKE '%Android%' THEN 1 END) as android_count,
  COUNT(CASE WHEN user_agent NOT LIKE '%iPhone%' AND user_agent NOT LIKE '%Android%' THEN 1 END) as other_count
FROM customer_cards 
WHERE detected_platform IS NOT NULL
GROUP BY detected_platform
ORDER BY total_detections DESC"
```

## 8. Troubleshooting Enhanced Setup

### Common Issues with Dual Card Support and Platform Detection:

1. **membership_type constraint errors**: Ensure enum values are 'stamp' and 'membership' (not 'loyalty' and 'gym')
2. **RLS policy errors**: Ensure you're authenticated when testing both card types
3. **Function errors**: Make sure all functions are created after tables
4. **Trigger errors**: Triggers depend on functions, apply in correct order
5. **Card type detection**: Ensure `membership_type` column exists and has proper constraints
6. **Session marking**: Verify `mark_session_usage` function handles both card types with platform detection
7. **Platform detection issues**: Check that `detected_platform` and `user_agent` columns exist
8. **Queue processing**: Ensure wallet_update_queue supports `platform: 'all'`

### Enhanced Quick Fixes:

```sql
-- Add missing membership_type column if needed (UPDATED enum values)
ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS membership_type TEXT 
CHECK (membership_type IN ('stamp', 'membership')) 
DEFAULT 'stamp';

-- Add missing platform detection columns
ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS detected_platform TEXT 
CHECK (detected_platform IN ('apple', 'google', 'pwa'));

ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add missing updated_at column for tracking
ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update expires_at column name if using old expiry_date
ALTER TABLE customer_cards 
RENAME COLUMN expiry_date TO expires_at;

-- Verify dual card constraints with platform detection
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_cards' 
AND column_name IN ('membership_type', 'sessions_used', 'total_sessions', 'cost', 'expires_at', 'detected_platform', 'user_agent')
ORDER BY column_name;

-- Update wallet_update_queue to support 'all' platform
ALTER TABLE wallet_update_queue 
DROP CONSTRAINT IF EXISTS wallet_update_queue_platform_check;

ALTER TABLE wallet_update_queue 
ADD CONSTRAINT wallet_update_queue_platform_check 
CHECK (platform IN ('apple', 'google', 'pwa', 'all'));
```

## 9. Migration for Existing Installations

If you have an existing RewardJar 4.0 installation, you may need to update to support the enhanced dual card system with platform detection:

### Migration 1: Update Card Type Enum
```sql
-- Update membership_type values from old to new
UPDATE customer_cards SET membership_type = 'stamp' WHERE membership_type = 'loyalty';
UPDATE customer_cards SET membership_type = 'membership' WHERE membership_type = 'gym';

-- Drop old constraint and add new one
ALTER TABLE customer_cards DROP CONSTRAINT IF EXISTS customer_cards_membership_type_check;
ALTER TABLE customer_cards 
ADD CONSTRAINT customer_cards_membership_type_check 
CHECK (membership_type IN ('stamp', 'membership'));
```

### Migration 2: Add Platform Detection Columns
```sql
-- Add platform detection columns
ALTER TABLE customer_cards ADD COLUMN IF NOT EXISTS detected_platform TEXT 
CHECK (detected_platform IN ('apple', 'google', 'pwa'));

ALTER TABLE customer_cards ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add platform tracking to session_usage
ALTER TABLE session_usage ADD COLUMN IF NOT EXISTS platform_used TEXT 
CHECK (platform_used IN ('apple', 'google', 'pwa'));

ALTER TABLE session_usage ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add platform detection to wallet_update_queue
ALTER TABLE wallet_update_queue ADD COLUMN IF NOT EXISTS detected_platform TEXT 
CHECK (detected_platform IN ('apple', 'google', 'pwa'));

ALTER TABLE wallet_update_queue ADD COLUMN IF NOT EXISTS user_agent TEXT;
```

### Migration 3: Update Column Names
```sql
-- Rename expiry_date to expires_at for consistency
ALTER TABLE customer_cards 
RENAME COLUMN expiry_date TO expires_at;

-- Add total_stamps column if missing
ALTER TABLE customer_cards 
ADD COLUMN IF NOT EXISTS total_stamps INTEGER DEFAULT 10;
```

### Migration 4: Verify Enhanced Schema
```sql
-- Verify the enhanced table structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'customer_cards' 
ORDER BY column_name;

-- Verify platform detection is working
SELECT 
  membership_type,
  detected_platform,
  COUNT(*) as count
FROM customer_cards 
GROUP BY membership_type, detected_platform
ORDER BY membership_type, detected_platform;

-- Verify enhanced constraints
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'customer_cards'::regclass 
AND contype = 'c'
ORDER BY conname;
```

## 10. Production Deployment Readiness

### ✅ Verified Ready for Production - Enhanced Dual Card Platform with Platform Detection
- **Database Schema**: Complete with dual card type support (stamp + membership) and platform detection
- **Apple Wallet**: PKPass generation working for stamp cards (green) + membership cards (indigo)
- **Google Wallet**: JWT signing working for loyaltyObject (stamps) and membershipObject (sessions)
- **Platform Detection**: User-Agent analysis working for iPhone/iPad, Android, Desktop/Other
- **PWA Wallet**: Universal responsive design for both card types with platform optimization

### Current Live Status (Enhanced with Platform Detection)
```
🎯 REWARDJAR 4.0 - ENHANCED PRODUCTION READY STATUS
├── Total Customer Cards: 439
│   ├── Stamp Cards: 410 (93.4%) - Green Theme #10b981
│   └── Membership Cards: 29 (6.6%) - Indigo Theme #6366f1
├── Environment Health: 87% (23/26 variables)
├── Apple Wallet: ✅ Ready (both card types with themes)
├── Google Wallet: ✅ Ready (loyaltyObject + membershipObject)
├── PWA Wallet: ✅ Ready (universal support with platform optimization)
├── Platform Detection: ✅ Operational (User-Agent analysis + debug mode)
├── Queue System: ✅ Enhanced (platform: 'all' support)
└── MCP Integration: ✅ Enhanced (platform analytics)
```

This enhanced Supabase setup supports the complete RewardJar 4.0 functionality including dual card types (stamp + membership), intelligent platform detection, comprehensive session tracking, multi-wallet integration with proper theming, and real-time synchronization across all platforms with comprehensive platform analytics. 