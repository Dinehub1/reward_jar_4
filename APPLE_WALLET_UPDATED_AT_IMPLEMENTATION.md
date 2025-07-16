# Apple Wallet Real-time Updates with `updated_at` Implementation

## 🎯 **Problem Solved**
Implemented comprehensive `updated_at` column tracking and Apple Wallet synchronization system to enable real-time wallet updates when customer data changes (stamps added, rewards earned, etc.).

## 🏗️ **Architecture Overview**

### **Database Schema Enhancement**
Added `updated_at` columns to all relevant tables:
- `businesses` - Track business profile changes
- `stamp_cards` - Track loyalty card updates  
- `customers` - Track customer profile changes
- `customer_cards` - **CRITICAL** - Track stamp progress changes
- `stamps` - Track individual stamp additions
- `rewards` - Track reward completions

### **Wallet Update Flow**
```mermaid
graph TD
    A[Customer Scans QR] --> B[Add Stamp API]
    B --> C[Update customer_cards.current_stamps]
    C --> D[Trigger: updated_at = NOW()]
    D --> E[Trigger: Insert wallet_update_queue]
    E --> F[Process Update Queue]
    F --> G{Wallet Type?}
    G -->|Apple| H[Send Apple Push Notification]
    G -->|Google| I[Update Google Wallet Object]
    G -->|PWA| J[Send Web Push Notification]
    H --> K[Apple Wallet Updates Automatically]
    I --> L[Google Wallet Updates Automatically]
    J --> M[PWA Updates via Service Worker]
```

## 🛠️ **Implementation Details**

### **1. Database Migration (`scripts/add-updated-at-columns.sql`)**
```sql
-- Add updated_at columns to all tables
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE stamp_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customer_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE stamps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create wallet update queue for async processing
CREATE TABLE wallet_update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_card_id UUID NOT NULL REFERENCES customer_cards(id),
  update_type TEXT NOT NULL CHECK (update_type IN ('stamp_update', 'reward_complete', 'card_update')),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **2. Automatic Timestamp Updates**
```sql
-- Function to update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers on all tables
CREATE TRIGGER update_customer_cards_updated_at 
  BEFORE UPDATE ON customer_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **3. Wallet Update Triggers**
```sql
-- Trigger wallet updates when customer_cards change
CREATE OR REPLACE FUNCTION trigger_wallet_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stamps IS DISTINCT FROM NEW.current_stamps THEN
    INSERT INTO wallet_update_queue (customer_card_id, update_type)
    VALUES (NEW.id, 
            CASE 
              WHEN NEW.current_stamps >= (SELECT total_stamps FROM stamp_cards WHERE id = NEW.stamp_card_id) 
              THEN 'reward_complete'
              ELSE 'stamp_update'
            END);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 **API Endpoints**

### **1. Apple Wallet Update Endpoint**
`/api/wallet/apple/updates` - Handles Apple Wallet pass updates

**Features:**
- Uses `updated_at` timestamps for `Last-Modified` headers
- Supports `If-Modified-Since` for efficient sync
- Returns 304 Not Modified when no changes
- Generates updated PKPass files with latest data

**Usage:**
```typescript
// Apple Wallet automatically calls this endpoint
// when webServiceURL is configured in the pass

// Check for updates
GET /api/wallet/apple/updates?passTypeIdentifier=pass.com.rewardjar.rewards&serialNumber=uuid

// Get updated pass
POST /api/wallet/apple/updates
{
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "customer-card-uuid"
}
```

### **2. Wallet Update Queue Processor**
`/api/wallet/process-updates` - Processes pending wallet updates

**Features:**
- Batch processing of queued updates
- Support for Apple, Google, and PWA wallets
- Error handling and retry logic
- Queue statistics and monitoring

**Usage:**
```bash
# Process pending updates (can be called via cron job)
curl -X POST https://yourapp.com/api/wallet/process-updates

# Check queue status
curl https://yourapp.com/api/wallet/process-updates
```

### **3. Enhanced Stamp Add API**
`/api/stamp/add` - Now triggers automatic wallet updates

**Flow:**
1. Add stamp to customer card
2. Update `current_stamps` count
3. Trigger `updated_at = NOW()`
4. Database trigger inserts into `wallet_update_queue`
5. Background processor handles wallet updates

## 📱 **Apple Wallet Integration**

### **Pass Configuration**
```json
{
  "webServiceURL": "https://yourapp.com/api/wallet/apple/updates",
  "authenticationToken": "customer-card-uuid",
  "passTypeIdentifier": "pass.com.rewardjar.rewards",
  "serialNumber": "customer-card-uuid"
}
```

### **Update Mechanism**
1. **Initial Pass Creation**: Customer adds pass to Apple Wallet
2. **Data Changes**: Stamps added, rewards earned, etc.
3. **Database Trigger**: `updated_at` timestamp updated
4. **Queue Processing**: Update queued for processing
5. **Push Notification**: Apple notified of pass update
6. **Automatic Update**: Apple Wallet fetches updated pass

### **HTTP Headers**
```http
# Apple Wallet checks for updates
GET /api/wallet/apple/updates?serialNumber=uuid
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT

# Response if no updates
HTTP/1.1 304 Not Modified

# Response if updates available
HTTP/1.1 200 OK
Last-Modified: Thu, 22 Oct 2015 08:30:00 GMT
```

## 🧪 **Testing**

### **1. Run Database Migration**
```sql
-- Run in Supabase SQL editor
\i scripts/add-updated-at-columns.sql
```

### **2. Create Test Data**
```sql
-- Run in Supabase SQL editor
\i scripts/create-test-customer-card.sql
```

### **3. Test Wallet Updates**
```bash
# Add a stamp (should trigger wallet update)
curl -X POST https://yourapp.com/api/stamp/add \
  -H "Content-Type: application/json" \
  -d '{"customerCardId": "test-customer-card-123"}'

# Check wallet update queue
curl https://yourapp.com/api/wallet/process-updates

# Process pending updates
curl -X POST https://yourapp.com/api/wallet/process-updates
```

### **4. Test Apple Wallet Updates**
```bash
# Check for pass updates
curl "https://yourapp.com/api/wallet/apple/updates?passTypeIdentifier=pass.com.rewardjar.rewards&serialNumber=test-customer-card-123"

# Get updated pass (debug mode)
curl "https://yourapp.com/api/wallet/apple/updates?debug=true" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"passTypeIdentifier": "pass.com.rewardjar.rewards", "serialNumber": "test-customer-card-123"}'
```

## 🚀 **Production Deployment**

### **1. Environment Variables**
```env
# Apple Wallet (required for updates)
APPLE_CERT_BASE64=LS0tLS1CRUdJTi...
APPLE_KEY_BASE64=LS0tLS1CRUdJTi...
APPLE_WWDR_BASE64=LS0tLS1CRUdJTi...
APPLE_CERT_PASSWORD=your_password
APPLE_TEAM_IDENTIFIER=ABC1234DEF
APPLE_PASS_TYPE_IDENTIFIER=pass.com.rewardjar.rewards

# Base URL for webhook callbacks
BASE_URL=https://yourapp.com
```

### **2. Cron Job Setup**
```bash
# Process wallet updates every 5 minutes
*/5 * * * * curl -X POST https://yourapp.com/api/wallet/process-updates

# Or use Vercel Cron Jobs
# vercel.json
{
  "crons": [
    {
      "path": "/api/wallet/process-updates",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### **3. Monitoring**
```bash
# Check queue health
curl https://yourapp.com/api/wallet/process-updates

# Expected response
{
  "message": "Wallet update queue status",
  "stats": {
    "total": 45,
    "pending": 3,
    "processed": 40,
    "failed": 2
  }
}
```

## 🔧 **Key Benefits**

### **1. Real-time Synchronization**
- Wallet passes update automatically when data changes
- No manual refresh required by customers
- Instant feedback on stamp collection

### **2. Efficient Updates**
- Uses HTTP `Last-Modified` headers for efficient sync
- Only updates when data actually changes
- Reduces server load and bandwidth

### **3. Reliable Processing**
- Async queue processing prevents blocking
- Error handling and retry logic
- Batch processing for performance

### **4. Multi-wallet Support**
- Apple Wallet push notifications
- Google Wallet object updates
- PWA web push notifications

## 📊 **Database Schema Changes**

### **Before (Missing updated_at)**
```sql
CREATE TABLE customer_cards (
  id UUID PRIMARY KEY,
  current_stamps INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **After (With updated_at)**
```sql
CREATE TABLE customer_cards (
  id UUID PRIMARY KEY,
  current_stamps INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- NEW
);

-- Automatic trigger
CREATE TRIGGER update_customer_cards_updated_at 
  BEFORE UPDATE ON customer_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🎉 **Result**

✅ **Complete Apple Wallet synchronization system**
✅ **Real-time updates when stamps are added**
✅ **Efficient HTTP caching with Last-Modified headers**
✅ **Async queue processing for reliability**
✅ **Multi-wallet support (Apple, Google, PWA)**
✅ **Production-ready with monitoring and error handling**

The `updated_at` implementation provides the foundation for a professional wallet synchronization system that keeps customer wallet passes in sync with the latest data automatically! 