

🔧 FINAL SPEC: Full Admin + Backend Parameters for Stamp Card Creation

Here’s a full structured config:

⸻

🗂️ Card Metadata (Basics)

Field	Type	Description
cardName	string	Internal + public card name (e.g. Pizza Lovers Card)
businessId	string	Business it belongs to
reward	string	e.g. “Free Garlic Bread or Soft Drink”
stampsRequired	number	Total stamps needed to unlock reward
cardColor	string	Hex code for background color (e.g. #FF5733)
iconEmoji	string	Display icon (e.g. 🍕 or 🧋)
cardExpiryDays	number	Card expires after X days (e.g. 60)
rewardExpiryDays	number	Reward valid after unlock for X days
card size 2:3 ratio


⸻

🧾 Stamp Logic Rules

Field	Type	Description
manualStampOnly	boolean	Always true (stamps only added by staff)
minSpendAmount	number	Minimum bill to allow stamp (₹500, etc.)
billProofRequired	boolean	True = bill number required at time of stamp
maxStampsPerDay	number	Anti-abuse throttle
duplicateVisitBuffer	string	e.g. 12h, 1d — min time between stamps


⸻

🪪 Wallet Card Fields (Dynamic / Display Only)

## Front of Card (Main View)
Wallet Field	Maps From Admin Panel Field(s)
logoText	Business Name
headerField	Card Name (e.g. Pizza Lovers Club)
primaryField	x / stampsRequired + emoji (e.g. 4 / 6 🍕)
secondaryFields	Reward (e.g. Free Garlic Bread or Soft Drink)
auxiliaryFields	"Show this card at counter to get your stamp"
backFields	"Valid for dine-in only, reward expires in 15 days"
expirationDate	Calculated per customer (issue date + cardExpiryDays)
barcode	Unique QR: /stamp/:customerCardId
backgroundColor	From cardColor

## Back of Card (Detail View) - Reference Implementation
Based on Apple Wallet card detail screens, the back of the card should include:

### Card Management
- **How to earn a stamp**: "Buy anything to get a stamp" (from stampConfig.minSpendAmount)
- **Total earned**: Dynamic count (e.g. "2 stamps", "0 rewards")
- **Till the next reward**: Calculated (stampsRequired - currentStamps)
- **Available rewards**: Current unlocked rewards count
- **Automatic Updates**: Toggle for push notifications
- **Allow Notifications**: Toggle for wallet notifications
- **Remove Pass**: Standard wallet removal option

### Reward Details
- **Reward details**: Expanded description from admin panel reward field
- **Terms of Use**: Standard terms + business-specific rules
- **Card expiration date**: "Unlimited" or calculated date
- **Referral program**: "Share card" functionality

### Business Information
- **Company name**: Business name from businessId
- **Website**: Business website link
- **Setup service**: Link to business support
- **Issuer information**: Business contact details
- **Support email**: Business support email

### Technical Details
- **Card serial number**: Unique identifier (auto-generated)
- **Updated**: Last modification timestamp
- **Cashback level**: For membership cards (Bronze/Silver/Gold)
- **Spend to reach next level**: For tiered programs


⸻

🎨 Live Preview in Admin Panel (Recommended Fields)


	•	✅ Logo & Business Name (auto-filled from businessId)
	•	✅ Card Name input (auto-updates wallet preview header apple wallet/ google wallet/PWA)
	•	✅ Color Picker for Card Background
	•	✅ Emoji Picker (🍕, 🧋, ☕, 🛍️…)
	•	✅ Stamps Slider (1–20)
	•	✅ Reward Description
	•	✅ Min Spend Input (₹)
	•	✅ Toggle: Require Bill? Yes/No
	•	✅ Toggle: Stamp Buffer Time (dropdown: 12h, 1d, none)

Live preview shows updated card in a 2:3 wallet-sized frame as admin configures inputs.

⸻

📱 Wallet Implementation Details (Based on Reference Screenshots)

### Apple Wallet Card Structure
The reference images show a comprehensive wallet card implementation with:

#### Main Card Display
- **Card header**: Business name and card title
- **Visual progress**: Stamp grid showing filled/empty states
- **Progress text**: "8 stamps" / "0 rewards" status
- **Reward availability**: Clear indication of unlocked rewards

#### Card Settings & Management
```
Automatic Updates: ON/OFF toggle
Allow Notifications: ON/OFF toggle
Remove Pass: Red text option
```

#### Progress Tracking
```
Total earned: "2 stamps"
Till the next reward: "8 stamps"
Available: "0 rewards"
```

#### Business Integration Fields
```
How to earn a stamp: "Buy anything to get a stamp"
Referral program: "🎁 Share card" with link
Company name: Business identifier
Website: Direct business link
Setup service: Support integration
```

#### Technical Metadata
```
Card serial number: Auto-generated unique ID
Updated: ISO timestamp (e.g., "03/08/2025 11:16:54")
Issuer information: Business contact details
Support email: Direct support contact
```

#### Advanced Features (For Premium Cards)
```
Cashback level: "Bronze" (Silver/Gold for tiers)
Spend to reach next level: "5 000,00" currency amount
Cashback percentage: "5%" or variable rate
Card expiration date: "Unlimited" or calculated
```

### Implementation Notes
- All dynamic values update in real-time via wallet API
- Card serial numbers must be unique per customer
- Timestamps follow ISO 8601 format
- Support progressive enhancement for premium features
- Maintain consistency across Apple/Google Wallet platforms

⸻

🔗 QR Code System (Auto-generated)

QR Type	URL Format	Used By	Notes
Customer Join	/join/[cardId]	Shown on poster	First-time customers only
Wallet QR	/stamp/[customerCardId]	Shown in wallet	For business staff to scan
Business Scan	Same as Wallet QR	Business Staff	Brings up stamp submission form


⸻

🛠️ Backend Data Schema (Enhanced for Wallet Integration)

stamp_cards (
  id,
  business_id,
  name,
  reward_description,
  total_stamps,
  card_color,
  icon_emoji,
  barcode_type ( 'QR_CODE'),
  expiry_days,
  reward_expiry_days,
  stamp_config (jsonb),
  status ('active' | 'inactive'),
  created_at,
  updated_at
)

stamp_config = {
  manualStampOnly: true,
  minSpendAmount: 500,
  billProofRequired: true,
  maxStampsPerDay: 1,
  duplicateVisitBuffer: "12h"
}

customers (
  id,
  name,
  phone,
  email,
  created_at,
  updated_at
)

customer_cards (
  id,
  stamp_card_id,
  customer_id,
  current_stamps: integer,
  reward_unlocked: boolean,
  reward_redeemed: boolean,
  wallet_serial_number: string (unique),
  last_wallet_update: timestamp,
  created_at,
  updated_at
)

stamps (
  id,
  customer_card_id,
  staff_id,
  bill_number,
  bill_amount,
  notes,
  created_at
)

wallet_provisioning_status (
  id,
  card_id,
  wallet_type ('apple' | 'google' | 'pwa'),
  status ('pending' | 'in_progress' | 'completed' | 'failed'),
  details (jsonb),
  created_at,
  updated_at
)

businesses (
  id,
  name,
  email,
  website,
  support_email,
  phone,
  address,
  created_at,
  updated_at
)


⸻


