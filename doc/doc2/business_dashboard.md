# RewardJar 4.0 - Business Dashboard & Onboarding Journey

**Status**: ✅ Phase 1 Production Ready | **Tech Stack**: Next.js 15 + Supabase + Multi-Wallet Integration  
**Generated**: July 21, 2025 | **Version**: 4.0 Business Dashboard Documentation

---

## 📋 Overview

RewardJar 4.0 is a comprehensive digital loyalty platform that enables businesses to create and manage **loyalty cards** with two distinct types:

- **Stamp Cards**: Retention-focused, stamp-based loyalty system for repeat customer engagement
- **Membership Cards**: Upselling-focused, session-based system for premium services (gyms, spas, etc.)

The platform provides complete multi-wallet integration (Apple Wallet, Google Wallet, PWA), real-time analytics, and intelligent customer journey tracking to boost business revenue and customer lifetime value (CLV).

### Key Features ✅
- **Dual Card System**: Both stamp cards and membership cards with intelligent auto-detection
- **Multi-Wallet Support**: Apple Wallet, Google Wallet, and Progressive Web App (PWA)
- **Real-time Analytics**: Customer journey tracking, CLV analysis, and predictive insights
- **QR Code Integration**: Seamless stamp collection and session marking
- **Business Intelligence**: Revenue forecasting, churn prediction, and growth metrics

---

## 🚀 Business Onboarding Journey

### 3-Step Onboarding Wizard

#### Step 1: Account Creation
**Route**: `/auth/signup` → `/business/dashboard`

**Form Fields**:
- Email (required)
- Password (required) 
- Business Name (optional - can be completed later)
- contact number
- store numbers (2-3 number)

**Backend Processing**:
```typescript
// User creation with business role
{
  role_id: 2, // Business role
  auto_approved: true, // Immediate access
  profile_progress: 40 // If name/email provided
}
```

**Progress Calculation**: 40% if Name and Email are provided, 20% if only Email

#### Step 2: Business Profile Details
**Route**: `/business/onboarding/profile`

**Optional Fields** (No mandatory requirements):
- **Business Name** (20% progress) - Defaults to signup name
- **Contact Email** (20% progress) - Defaults to signup email
- **Location** (20% progress) - For location-based features
- **Short Description** (20% progress) - Max 200 characters
- **Logo Upload** (10% progress) - Displayed on loyalty cards
- **Website URL** (10% progress) - For business verification

**Progress Bar**: 
- Visual: Shaded gradient from red (0%) to green (100%)
- Tooltips on uncompleted fields
- Displayed in dashboard header and onboarding flow

**Backend Processing**:
```sql
-- Updates businesses table
UPDATE businesses SET 
  name = $1,
  contact_email = $2,
  description = $3,
  location = $4,
  website_url = $5,
  logo_url = $6, -- Uploaded to Supabase Storage
  profile_progress = calculated_percentage
WHERE owner_id = $user_id;
```

Currency Selector:Per your request, a symbol-only selector (e.g., ₩, $, €) should be added without conversion functionality.

#### Step 3: Loyalty Card Introduction
**Route**: `/business/onboarding/cards`

**Content**:
- **Educational Section**: Explains difference between stamp cards vs. membership  cards
- **Sample Previews**: Live preview of both card types with business name/logo
- **CTA Button**: "Create Your First Loyalty Card" with dropdown selection

**Card Type Selection**:
```typescript
const cardTypes = [
  {
    type: 'stamp',
    title: 'Stamp Card',
    description: 'Perfect for cafes, restaurants, retail - collect stamps, earn rewards',
    route: '/business/stamp-cards/new'
  },
  {
    type: 'membership', 
    title: 'Membership Card',
    description: 'Ideal for gyms, spas, studios - track sessions, manage memberships',
    route: '/business/memberships/new'
  }
];
```

### Validation & Feedback System

**Real-time Validation**:
- Email format validation
- Business name length (3-100 characters)
- Description character limit (200 max)
- URL format validation
- Image file type/size validation

**Profile Completion Modal**:
```typescript
const profileModal = {
  trigger: "Login with <60% profile completion",
  title: "Complete your profile to start your customer loyalty journey and boost revenue today!",
  content: "Sample card preview with current business details",
  actions: ["Complete Profile", "Skip for Now"],
  restrictions: "None - card creation allowed regardless of completion"
};
```

**Subscription Check**:
```typescript
const subscriptionModal = {
  trigger: "Payment due or expired subscription",
  title: "Renew your subscription to continue",
  content: "Your subscription expires on [date]. Renew now to keep your loyalty program active.",
  cta: "Renew Subscription"
};
```

---

## 🏢 Business Dashboard (`/business/dashboard`)

### Layout & Navigation

**Sidebar Navigation**:
```typescript
const sidebarMenu = [
  { title: "Dashboard", route: "/business/dashboard", icon: "📊" },
  { title: "Stamp Cards", route: "/business/stamp-cards", icon: "🎫" },
  { title: "Membership Cards", route: "/business/memberships", icon: "💳" },
  { title: "Analytics", route: "/business/analytics", icon: "📈" },
  { title: "Profile", route: "/business/profile", icon: "⚙️" }
];
```

### Dashboard Features

#### 1. Profile Progress Bar
**Location**: Top of dashboard
**Visual**: Shaded gradient bar (red to green) with percentage
**Tooltips**: Hover reveals uncompleted fields
```typescript
const progressTooltips = {
  business_name: "Add your business name (20%)",
  contact_email: "Add contact email (20%)", 
  location: "Add business location (20%)",
  description: "Add business description (20%)",
  logo: "Upload your logo (10%)",
  website: "Add website URL (10%)"
};
```

#### 2. Subscription Timeline
**Display**: "Active until August 20, 2025" with status indicator
**Payment Due Modal**: Triggers automatically when payment is due
```typescript
const subscriptionStatus = {
  active: { color: "green", message: "Active until [date]" },
  due: { color: "orange", message: "Payment due - Renew now" },
  expired: { color: "red", message: "Subscription expired" }
};
```

#### 3. Bill Amount Modal
**Trigger**: When adding stamps via `/business/stamp-cards/add` or manager mode
**Purpose**: Customer lifetime value (CLV) tracking and revenue analytics

```typescript
const billAmountModal = {
  title: "Record Transaction Amount",
  fields: {
    amount: { type: "number", required: true, placeholder: "₩10,000" },
    notes: { type: "text", optional: true, placeholder: "Additional notes" }
  },
  storage: "stamp_transactions table for CLV analysis"
};
```

#### 4. Customer Journey Highlights

**New Customers Section**:
```typescript
const newCustomers = {
  metric: "30 new customers this month",
  description: "Authenticated first-time sign-ups for loyalty cards",
  trend: "+15% from last month"
};
```

**Repeat Visits Section**:
```typescript
const repeatVisits = {
  metrics: [
    "Stamp card repeat customers increased 3x in past 2 months",
    "Average stamps per customer: 4.2",
    "Reward redemption rate: 68%"
  ],
  actions: ["Stamps added", "Rewards redeemed", "Sessions marked", "Upselling actions"]
};
```

**Revenue Impact Section**:
```typescript
const revenueImpact = {
  stampCards: "₩280,000 from bill amounts (stamp cards)",
  membershipCards: "₩450,000 from 30 memberships", 
  totalRevenue: "₩730,000 total tracked revenue",
  growth: "CLV up 25% this quarter"
};
```

**Visual Component**: Funnel chart showing New → Repeat → Rewards/Upsells progression

#### 5. Quick Stats Dashboard
```typescript
const quickStats = {
  totalLoyaltyCards: {
    total: 439,
    breakdown: { stampCards: 410, membershipCards: 29 }
  },
  totalCustomers: 373,
  recentActivity: [
    { type: "stamp", amount: "₩8,500", time: "2 hours ago" },
    { type: "session", membership: "Premium Gym", time: "4 hours ago" },
    { type: "reward", description: "Free coffee redeemed", time: "6 hours ago" },
    { type: "stamp", amount: "₩12,000", time: "1 day ago" },
    { type: "membership", amount: "₩15,000", time: "2 days ago" }
  ]
};
```

#### 6. Create Loyalty Card CTA
**Primary Button**: "Create Loyalty Card" with dropdown
```typescript
const createCardDropdown = [
  {
    type: "stamp",
    title: "Stamp Card", 
    subtitle: "For repeat customers and rewards",
    route: "/business/stamp-cards/new"
  },
  {
    type: "membership",
    title: "Membership Card",
    subtitle: "For sessions and premium services", 
    route: "/business/memberships/new"
  }
];
```

#### 7. Recent Cards Management
**Display**: List of 5 most recent loyalty cards
```typescript
const recentCards = [
  {
    name: "Coffee Loyalty Card",
    type: "stamp", 
    customers: 45,
    created: "3 days ago",
    actions: ["Manage", "View QR", "Analytics"]
  },
  {
    name: "Gym Membership - Premium", 
    type: "membership",
    customers: 12,
    created: "1 week ago", 
    actions: ["Manage", "View QR", "Analytics"]
  }
];
```

### Manager Permissions System

**Sub-role Structure**: Manager under role_id: 2 (Business)
```sql
-- Manager permissions table
CREATE TABLE manager_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES users(id),
  permissions TEXT[] DEFAULT ARRAY['add_stamps', 'redeem_rewards', 'view_analytics'],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Manager Mode UI Section**:
```typescript
const managerMode = {
  permissions: [
    "Add stamps with bill amount modal",
    "Redeem customer rewards",
    "View card analytics and customer data", 
    "Generate QR codes for locations"
  ],
  restrictions: [
    "Cannot create new loyalty cards",
    "Cannot modify business profile",
    "Cannot access financial analytics"
  ]
};
```

---

## 📊 Analytics Dashboard (`/business/analytics`)

### Tab Structure

#### Stamp Cards Analytics Tab
```typescript
const stampCardAnalytics = {
  metrics: {
    totalStamps: "2,847 stamps collected",
    averageStampsPerCard: "4.2 stamps",
    redemptionRate: "68% reward redemption",
    repeatCustomerGrowth: "3x increase in repeat customers"
  },
  revenue: {
    totalFromBillAmounts: "₩280,000",
    averageTransactionSize: "₩9,500",
    cLVGrowth: "CLV up 25% this quarter"
  }
};
```

#### Membership Cards Analytics Tab  
```typescript
const membershipAnalytics = {
  metrics: {
    totalSessions: "347 sessions tracked",
    averageSessionsPerMembership: "11.2 sessions",
    membershipRevenue: "₩450,000 from 30 memberships",
    expiredMemberships: "3 expired this month"
  },
  utilization: {
    averageUtilization: "56% of total sessions used",
    popularMemberships: ["Premium Gym (12 active)", "Spa Package (8 active)"]
  }
};
```

### Chart Visualizations

**Bar Charts**: 
- Stamps collected per week/month
- Sessions used per membership type
- Revenue trends by card type

**Line Charts**:
- Customer growth over time
- Revenue growth trends  
- CLV progression

**Pie Charts**:
- Redemption rates by card type
- Customer distribution by loyalty card
- Revenue breakdown (stamps vs memberships)

### Filter System
```typescript
const analyticsFilters = {
  timeRange: ["7 days", "30 days", "90 days", "Custom range"],
  location: ["All locations", "Main store", "Branch locations"],
  cardType: ["All cards", "Stamp cards only", "Membership cards only"],
  customerSegment: ["New customers", "Repeat customers", "VIP customers"]
};
```

### CLV Insights Section
```typescript
const cLVInsights = {
  averageSpend: "₩18,500 per customer",
  growthMetrics: [
    "CLV increased 25% this quarter",
    "Repeat customer value: ₩24,000 average",
    "New customer acquisition cost: ₩3,200"
  ],
  recommendations: [
    "Focus on customers with 2-3 stamps (highest conversion potential)",
    "Increase membership card promotion (higher CLV)",
    "Target customers who haven't visited in 15+ days"
  ]
};
```

### Growth Stats Banners
**Prominent Display**: Highlighted metrics for business motivation
```typescript
const growthBanners = [
  {
    metric: "3x Repeat Customer Growth",
    subtitle: "Customers returning within 30 days",
    trend: "↗️ +200% from last quarter"
  },
  {
    metric: "25% CLV Increase", 
    subtitle: "Average customer lifetime value",
    trend: "↗️ From ₩14,800 to ₩18,500"
  },
  {
    metric: "₩730,000 Total Revenue",
    subtitle: "Tracked through loyalty programs",
    trend: "↗️ +45% from last quarter"
  }
];
```

---

## 🔮 Predictive Analytics (Phase 1)

### Retention Prediction System
```sql
-- SQL for retention analysis
SELECT 
  business_id,
  COUNT(DISTINCT customer_id) as total_customers,
  COUNT(DISTINCT CASE WHEN last_activity >= NOW() - INTERVAL '30 days' 
        THEN customer_id END) as active_customers,
  ROUND(
    COUNT(DISTINCT CASE WHEN last_activity >= NOW() - INTERVAL '30 days' 
          THEN customer_id END) * 100.0 / COUNT(DISTINCT customer_id), 
    2
  ) as retention_rate
FROM customer_activity_view 
GROUP BY business_id
HAVING retention_rate < 10; -- Flag low retention businesses
```

**Intervention Alerts**:
```typescript
const retentionAlerts = {
  lowRetention: {
    threshold: "<10% repeat customers in 2 months",
    alert: "⚠️ Low customer retention detected",
    suggestions: [
      "Launch bonus stamp campaign",
      "Send re-engagement notifications", 
      "Offer limited-time membership discounts"
    ]
  }
};
```

### Revenue Forecasting
```typescript
const revenueForecast = {
  algorithm: "Linear regression based on bill amounts and membership sales",
  prediction: "₩1.5M monthly revenue if 3x repeat growth continues",
  confidence: "85% confidence level",
  factors: [
    "Current repeat customer growth rate (3x)",
    "Average transaction size (₩9,500)",
    "Membership conversion rate (12%)",
    "Seasonal trends and patterns"
  ]
};
```

### Churn Risk Analysis
```sql
-- Identify at-risk customers
SELECT 
  cc.id,
  c.name,
  cc.last_activity,
  EXTRACT(days FROM NOW() - cc.last_activity) as days_inactive,
  cc.current_stamps,
  cc.total_stamps
FROM customer_cards cc
JOIN customers c ON cc.customer_id = c.id  
WHERE cc.last_activity < NOW() - INTERVAL '30 days'
  AND cc.current_stamps > 0
  AND cc.current_stamps < cc.total_stamps
ORDER BY days_inactive DESC;
```

**Churn Prevention**:
```typescript
const churnPrevention = {
  riskIndicators: [
    "No activity in 30+ days",
    "Partial stamp progress (1-3 stamps)",
    "Membership with <30% session usage"
  ],
  interventions: [
    "Automated re-engagement email",
    "Bonus stamp offer",
    "Membership extension offer"
  ]
};
```

---

## ⚙️ Admin Section (`/admin`)

### Business Management Tab
```typescript
const businessManagement = {
  categories: [
    "Salons & Spa",
    "Cafe & Restaurant", 
    "Gym & Fitness Studio",
    "Hotel",
    "Retail Store",
    "Supermarket"
  ],
  actions: [
    "View/edit business profiles",
    "Approve/deactivate businesses",
    "Category assignment",
    "Performance monitoring"
  ]
};
```

### System Analytics Tab
```typescript
const systemAnalytics = {
  overview: {
    totalCards: 439,
    breakdown: { stampCards: 410, membershipCards: 29 },
    totalBusinesses: 347,
    totalCustomers: 1247
  },
  filters: [
    "Filter by city/region",
    "Filter by business category", 
    "Filter by card type",
    "Filter by performance metrics"
  ],
  revenueTracking: "₩2.3M total tracked revenue via bill amounts"
};
```

### Support Tab
```typescript
const supportFeatures = {
  manualOperations: [
    "Add stamps manually (for failed QR scans)",
    "Process reward redemptions",
    "Update bill amounts for transactions",
    "Reset customer card progress",
    "Extend membership expiration dates"
  ],
  ticketSystem: "Integration with customer support tickets",
  auditLog: "Track all manual changes and support actions"
};
```

### Role & Permissions
```sql
-- Admin role definition
INSERT INTO roles (id, name) VALUES (1, 'admin');

-- Admin permissions
CREATE TABLE admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  permission_level TEXT DEFAULT 'full_access',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 UI/UX Elements

### Modal Components

#### Profile Completion Modal
```typescript
const profileCompletionModal = {
  trigger: "Login with incomplete profile",
  design: {
    title: "Complete your profile to start your customer loyalty journey and boost revenue today!",
    preview: "Live sample card with current business details",
    actions: ["Complete Profile", "Skip for Now"],
    emphasis: "No restrictions - card creation always allowed"
  }
};
```

#### Bill Amount Modal
```typescript
const billAmountModal = {
  trigger: "Adding stamps or manager mode operations",
  fields: {
    billAmount: {
      type: "currency",
      required: true,
      placeholder: "₩10,000",
      validation: "Min ₩1,000, Max ₩1,000,000"
    },
    notes: {
      type: "textarea", 
      optional: true,
      maxLength: 200,
      placeholder: "Additional transaction notes"
    }
  },
  purpose: "CLV analysis and revenue tracking"
};
```

#### Card Creation Modal
```typescript
const cardCreationModal = {
  features: ["Live preview as user types", "Logo placement preview", "Sample customer view"],
  validation: "Real-time validation with helpful error messages",
  templates: "Pre-built templates for different business types"
};
```

### Progress Bar Component
```typescript
const progressBar = {
  visual: "Shaded gradient from red (0%) to green (100%)",
  interactivity: "Tooltips on hover showing missing fields",
  placement: ["Dashboard header", "Profile page", "Onboarding flow"],
  calculation: "Real-time updates based on completed fields"
};
```

### Tooltip System
```typescript
const tooltipSystem = {
  progressBar: "Shows which fields are missing and their point values",
  subscriptionStatus: "Explains billing cycle and renewal process", 
  analyticsMetrics: "Definitions and calculation methods",
  cardTypes: "Explains difference between stamp and membership cards"
};
```

---

## 🔄 Future Enhancements (Phase 2)

### Machine Learning Analytics
- **Predictive CLV Modeling**: Advanced ML algorithms for customer value prediction
- **Churn Prevention AI**: Automated intervention recommendations
- **Revenue Optimization**: AI-driven pricing and promotion suggestions
- **Customer Segmentation**: Automated customer persona identification

### Automated Support System
- **Chatbot Integration**: AI-powered customer support for businesses
- **Auto-Resolution**: Automatic handling of common QR code and wallet issues
- **Smart Notifications**: Predictive alerts for business optimization
- **Integration APIs**: Third-party POS and CRM system integrations

### Advanced Business Intelligence
- **Competitive Analysis**: Market benchmarking and competitor insights
- **Location Intelligence**: Geographic performance analysis and expansion recommendations
- **Seasonal Forecasting**: Advanced seasonal trend prediction and planning
- **ROI Calculator**: Detailed return on investment tracking for loyalty programs

---

## 📝 Implementation Notes

### Database Schema Requirements
```sql
-- Key tables for business dashboard
- users (role_id: 2 for business)
- businesses (profile data and progress tracking)
- stamp_cards (loyalty card templates)
- customer_cards (individual customer loyalty cards with membership_type)
- stamp_transactions (bill amounts for CLV analysis)
- session_usage (membership card session tracking)
- wallet_update_queue (real-time wallet synchronization)
```

### API Endpoints
```typescript
const businessAPIEndpoints = [
  "GET /api/business/dashboard - Dashboard data",
  "GET /api/business/analytics - Analytics data", 
  "POST /api/business/profile - Update profile",
  "POST /api/business/cards/create - Create loyalty card",
  "GET /api/business/customers - Customer list",
  "POST /api/stamp/add - Add stamps with bill amount",
  "GET /api/business/revenue - Revenue analytics"
];
```

### Performance Considerations
- **Caching**: Dashboard data cached for 5 minutes
- **Pagination**: Customer lists paginated (50 per page)
- **Real-time Updates**: WebSocket connections for live analytics
- **Image Optimization**: Logo images optimized for wallet display

---

**Status**: ✅ **Phase 1 Complete** - Ready for production deployment  
**Next Phase**: Advanced ML analytics and automation features  
**Documentation**: Complete for stakeholders and development team 