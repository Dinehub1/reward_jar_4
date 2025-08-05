

🔧 FINAL SPEC: Full Admin + Backend Parameters for Stamp Card Creation

## 🚀 Next.js 15+ Optimization Features

### Performance Enhancements
- **React.memo()** for component memoization
- **useCallback()** for expensive function optimization  
- **useMemo()** for computed values caching
- **Dynamic imports** for code splitting
- **Proper error boundaries** with TypeScript types
- **Optimized file uploads** with validation
- **Cached API requests** with proper headers

### Modern Patterns
- **Server/Client component separation** following Next.js 15 best practices
- **TypeScript strict typing** with proper interfaces
- **Error handling** with user-friendly messages
- **Loading states** with skeleton components
- **Form validation** with real-time feedback

Here's a full structured config:

⸻

🗂️ Card Metadata (Basics)

Field	Type	Description
cardName	string	Internal + public card name (e.g. Pizza Lovers Card)
businessId	string	Business it belongs to
reward	string	e.g. "Free Garlic Bread or Soft Drink"
stampsRequired	number	Total stamps needed to unlock reward
cardColor	string	Hex code for background color (e.g. #FF5733)
iconEmoji	string	Display icon (e.g. 🍕 or 🧋)
barcodeType	string	Either "PDF417" or "QR_CODE"
cardExpiryDays	number	Card expires after X days (e.g. 60)
rewardExpiryDays	number	Reward valid after unlock for X days
card size 2:3 ratio

⸻

📝 Information Fields (Customer Messaging)

Field	Type	Description
cardDescription	string	Brief description shown on card (e.g. "Collect stamps to get rewards")
howToEarnStamp	string	Instructions for earning stamps (e.g. "Buy anything to get a stamp")
companyName	string	Company name displayed on card (auto-filled from business)
rewardDetails	string	Detailed description of reward
earnedStampMessage	string	Message when stamp earned. Use [#] for remaining count
earnedRewardMessage	string	Message when reward unlocked


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

#### 🎴 **Front of the Card**
*What customer sees when they open the card*

| Wallet Field | Maps From Admin Panel Field(s) | Description |
|--------------|--------------------------------|-------------|
| `logoText` | Business Name | Company branding at top |
| `headerField` | Card Name | e.g. "Pizza Lovers Club" |
| `primaryField` | x / stampsRequired + emoji | e.g. "4 / 6 🍕" (progress indicator) |
| `secondaryFields` | Reward Description | e.g. "Free Garlic Bread or Soft Drink" |
| `auxiliaryFields` | Action Instructions | e.g. "Show this card at counter to get your stamp" |
| `barcode` | Auto-generated QR | Unique QR: `/stamp/[customerCardId]` |
| `backgroundColor` | cardColor | Hex color from admin panel |
| `branding` | Static | "Powered by RewardJar" (subtle placement below QR) |

#### 📋 **Back of the Card (Pass Details)**
*Appears on Apple Wallet when tapping "i" or in Google Wallet when swiped/held*

| Wallet Field | Maps From Admin Panel Field(s) | Description |
|--------------|--------------------------------|-------------|
| `backFields` | Reward Details + Rules | e.g. "Dine-in only, 15-day expiry" |
| `supportContact` | Static | `support@rewardjar.xyz` |
| `terms` | Optional Admin Input | e.g. "One stamp per ₹500 bill" |
| `expirationDate` | Calculated | Card issue date + cardExpiryDays |
| `cardDescription` | Card Description | Brief explanation of loyalty program |
| `howToEarnStamp` | Stamp Instructions | e.g. "Buy anything to get a stamp" |


⸻

🎨 Live Preview in Admin Panel (Recommended Fields)


Step 1: Card Details
	•	✅ Logo & Business Name (auto-filled from businessId)
	•	✅ Card Name input (auto-updates wallet preview header)
	•	✅ Stamps Slider (1–20)
	•	✅ Reward Description
	•	✅ Card & Reward Expiry Settings

Step 2: Design
	•	✅ Color Picker for Card Background
	•	✅ Emoji Picker (🍕, 🧋, ☕, 🛍️…)
	•	✅ Barcode Type Selection (PDF417 vs QR Code)

Step 3: Stamp Rules
	•	✅ Min Spend Input (₹)
	•	✅ Toggle: Require Bill? Yes/No
	•	✅ Toggle: Stamp Buffer Time (dropdown: 12h, 1d, none)
	•	✅ Max Stamps Per Day Limit

Step 4: Information
	•	✅ Card Description Text
	•	✅ How to Earn Stamp Instructions
	•	✅ Company Name (auto-filled from business)
	•	✅ Reward Details
	•	✅ Stamp Earned Message Template
	•	✅ Reward Earned Message Template

## 📱 Enhanced Live Preview Features

#### 🧪 Platform-Specific Live Previews

**3-Tab Segmented UI for comprehensive wallet simulation:**

### 1. **Apple Wallet View**
✅ **Rounded corners** with authentic 2:3 ratio layout  
✅ **Dark theme** matching iOS Wallet interface  
✅ **QR placement** at bottom with proper spacing  
✅ **"i" button** that flips to back view with animation  
✅ **Typography** and spacing mimicking Apple Wallet style  
✅ **Pass stack** visual with subtle depth shadows  

### 2. **Google Wallet View**  
✅ **Rounded rectangle** with Material Design principles  
✅ **Light-themed UI** with Google's color palette  
✅ **Swipe/expand options** for back view simulation  
✅ **Long-press animation** revealing pass details  
✅ **Store location integration** with branding colors  
✅ **Card grouping** support as per [Google Wallet guidelines](https://developers.google.com/wallet/generic/use-cases/grouped-passes)  

### 3. **PWA Card View**
✅ **Mobile-optimized** simple card interface  
✅ **Minimal layout** with logo, stamp progress, reward display  
✅ **Floating QR button** with reward status indicator  
✅ **Offline-ready design** standards compliance  
✅ **Progressive enhancement** for various device capabilities  
✅ **Web app manifest** compatible styling  

### Real-Time Preview Features
✅ **Live form sync** - All admin inputs reflect instantly across platforms  
✅ **No overlapping elements** - Clean field separation and validation  
✅ **Valid QR codes** - Platform-specific QR generation and testing  
✅ **Consistent branding** - "Powered by RewardJar" placement across all views  
✅ **Dynamic stamp grids** - Adapting to stamp count changes  
✅ **Color validation** - Ensuring accessibility across light/dark themes  

### Performance Optimizations
✅ **Platform-specific rendering** with lazy loading  
✅ **Memoized preview components** for smooth interactions  
✅ **Error boundaries** for each platform simulator  
✅ **Optimized QR generation** with caching per platform  
✅ **Smooth transitions** between platform tabs without layout shifts

⸻

🔗 QR Code System (Auto-generated)

QR Type	URL Format	Used By	Notes
Customer Join	/join/[cardId]	Shown on poster	First-time customers only
Wallet QR	/stamp/[customerCardId]	Shown in wallet	For business staff to scan
Business Scan	Same as Wallet QR	Business Staff	Brings up stamp submission form


⸻

## 🔧 Code Optimization Implementation

### Component Structure
```typescript
// Dynamic imports for heavy components
const WalletProvisioningStatus = dynamic(() => 
  import('@/components/admin/WalletProvisioningStatus'),
  { 
    loading: () => <SkeletonLoader />,
    ssr: false 
  }
)

// Memoized component with proper typing
const OptimizedCardCreationPage = React.memo(() => {
  // Optimized state management
  const [errors, setErrors] = useState<ValidationError[]>([])
  
  // Memoized validation
  const validateCardData = useMemo(() => {
    // Validation logic here
  }, [cardData])
  
  // Optimized callbacks
  const handleSave = useCallback(async () => {
    // API call with proper error handling
  }, [cardData])
  
  return (
    <Suspense fallback={<LoadingState />}>
      {/* Component content */}
    </Suspense>
  )
})
```

### Error Handling Patterns
```typescript
interface ValidationError {
  field: string
  message: string
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Proper error state management
const [errors, setErrors] = useState<ValidationError[]>([])

// API error handling
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const result: ApiResponse = await response.json()
  // Handle result
} catch (error) {
  setErrors(prev => [...prev, { 
    field: 'api', 
    message: error instanceof Error ? error.message : 'Unknown error' 
  }])
}
```

### Live Preview Enhancements
```typescript
// Real QR Code Generation
const QRCodeDisplay = React.memo(({ value, size }: { value: string, size?: number }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  
  useEffect(() => {
    const generateQR = async () => {
      const qrcode = await import('qrcode')
      const url = await qrcode.toDataURL(value, {
        width: size,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
      setQrCodeUrl(url)
    }
    if (value) generateQR()
  }, [value, size])

  return qrCodeUrl ? (
    <img src={qrCodeUrl} alt="QR Code" width={size} height={size} />
  ) : (
    <FallbackQRPattern />
  )
})

// Platform-Specific Live Preview with 3-Tab Interface
const renderLivePreview = () => {
  const [activeTab, setActiveTab] = useState<'apple' | 'google' | 'pwa'>('apple')
  const [showBack, setShowBack] = useState(false)
  const qrCodeData = `${process.env.NEXT_PUBLIC_APP_URL}/stamp/demo-${cardData.cardName}`
  
  return (
    <div className="space-y-4">
      {/* Platform Tab Selector */}
      <div className="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1">
        <button 
          onClick={() => { setActiveTab('apple'); setShowBack(false) }}
          className={`px-4 py-2 rounded-md transition-all ${
            activeTab === 'apple' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
          }`}
        >
          🍎 Apple Wallet
        </button>
        <button 
          onClick={() => { setActiveTab('google'); setShowBack(false) }}
          className={`px-4 py-2 rounded-md transition-all ${
            activeTab === 'google' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
          }`}
        >
          📱 Google Wallet
        </button>
        <button 
          onClick={() => { setActiveTab('pwa'); setShowBack(false) }}
          className={`px-4 py-2 rounded-md transition-all ${
            activeTab === 'pwa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
          }`}
        >
          🌐 PWA Card
        </button>
      </div>
      
      {/* Platform-Specific Preview Container */}
      <div className="flex justify-center">
        <Suspense fallback={<PreviewSkeleton />}>
          {activeTab === 'apple' && (
            <AppleWalletPreview 
              cardData={cardData} 
              qrCodeData={qrCodeData}
              showBack={showBack}
              onToggleBack={setShowBack}
            />
          )}
          {activeTab === 'google' && (
            <GoogleWalletPreview 
              cardData={cardData} 
              qrCodeData={qrCodeData}
              showBack={showBack}
              onToggleBack={setShowBack}
            />
          )}
          {activeTab === 'pwa' && (
            <PWACardPreview 
              cardData={cardData} 
              qrCodeData={qrCodeData}
            />
          )}
        </Suspense>
      </div>
      
      {/* Platform-Specific Configuration Summary */}
      <div className="space-y-3">
        <div className="card-config">
          <h4 className="font-semibold">Preview: {activeTab.toUpperCase()} Wallet</h4>
          <div className="text-sm text-gray-600">
            {activeTab === 'apple' && 'iOS-style pass with dark theme and flip animation'}
            {activeTab === 'google' && 'Material Design with light theme and expansion'}
            {activeTab === 'pwa' && 'Progressive web app with offline-ready design'}
          </div>
        </div>
        <div className="pass-details">Real-time sync enabled across all platforms</div>
      </div>
    </div>
  )
}

// Apple Wallet Preview Component
const AppleWalletPreview = React.memo(({ cardData, qrCodeData, showBack, onToggleBack }) => (
  <div className="w-64 h-[520px] bg-black rounded-[2rem] p-2 shadow-xl">
    <div className="relative w-full h-full overflow-hidden rounded-[1.5rem] bg-gray-900">
      {/* Apple Wallet Front */}
      <div className={`absolute inset-0 transition-transform duration-300 ${
        showBack ? 'transform rotateY-180' : 'transform rotateY-0'
      }`}>
        <div className="card-front h-full p-4 text-white" style={{ 
          background: `linear-gradient(135deg, ${cardData.cardColor}, ${cardData.cardColor}dd)` 
        }}>
          {/* Info Button */}
          <button 
            onClick={() => onToggleBack(!showBack)}
            className="absolute top-4 right-4 w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-xs"
          >
            i
          </button>
          
          {/* Card Content */}
          <div className="space-y-3">
            <div className="text-sm opacity-80">{cardData.businessName}</div>
            <div className="text-lg font-semibold">{cardData.cardName}</div>
            <div className="text-2xl font-bold">{cardData.stamps} / {cardData.stampsRequired} {cardData.iconEmoji}</div>
            <div className="text-sm">{cardData.reward}</div>
            <div className="text-xs opacity-70">{cardData.auxiliaryFields}</div>
          </div>
          
          {/* QR Code at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <QRCodeDisplay value={qrCodeData} size={60} />
            <div className="text-xs opacity-50 mt-1">Powered by RewardJar</div>
          </div>
        </div>
      </div>
      
      {/* Apple Wallet Back */}
      <div className={`absolute inset-0 transition-transform duration-300 ${
        showBack ? 'transform rotateY-0' : 'transform rotateY-180'
      }`}>
        <div className="card-back h-full p-4 bg-gray-800 text-white">
          <button 
            onClick={() => onToggleBack(false)}
            className="absolute top-4 right-4 text-blue-400 text-sm"
          >
            Done
          </button>
          <h3 className="font-bold mb-4 text-lg">Pass Details</h3>
          <div className="space-y-3 text-sm">
            <div><span className="opacity-70">Description:</span><br/>{cardData.cardDescription}</div>
            <div><span className="opacity-70">How to Earn:</span><br/>{cardData.howToEarnStamp}</div>
            <div><span className="opacity-70">Rules:</span><br/>{cardData.backFields}</div>
            <div><span className="opacity-70">Support:</span><br/>support@rewardjar.xyz</div>
          </div>
        </div>
      </div>
    </div>
  </div>
))

// Google Wallet Preview Component  
const GoogleWalletPreview = React.memo(({ cardData, qrCodeData, showBack, onToggleBack }) => (
  <div className="w-80 bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="relative">
      {/* Google Wallet Front */}
      <div className={`transition-all duration-300 ${showBack ? 'h-96' : 'h-48'}`}>
        <div className="h-48 p-4" style={{ backgroundColor: cardData.cardColor }}>
          <div className="flex justify-between items-start text-white">
            <div>
              <div className="text-sm opacity-90">{cardData.businessName}</div>
              <div className="text-xl font-semibold mt-1">{cardData.cardName}</div>
            </div>
            <QRCodeDisplay value={qrCodeData} size={40} />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{cardData.stamps} / {cardData.stampsRequired} {cardData.iconEmoji}</div>
            <div className="text-sm opacity-90 mt-1">{cardData.reward}</div>
          </div>
        </div>
        
        {/* Expandable Details */}
        {showBack && (
          <div className="p-4 bg-gray-50 space-y-3">
            <div className="text-sm"><strong>Description:</strong> {cardData.cardDescription}</div>
            <div className="text-sm"><strong>How to Earn:</strong> {cardData.howToEarnStamp}</div>
            <div className="text-sm"><strong>Rules:</strong> {cardData.backFields}</div>
            <div className="text-sm"><strong>Support:</strong> support@rewardjar.xyz</div>
          </div>
        )}
      </div>
      
      {/* Expand/Collapse Button */}
      <button 
        onClick={() => onToggleBack(!showBack)}
        className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md"
      >
        <svg className={`w-4 h-4 transition-transform ${showBack ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>
    </div>
    <div className="px-4 pb-2 text-xs text-gray-500 text-center">Powered by RewardJar</div>
  </div>
))

// PWA Card Preview Component
const PWACardPreview = React.memo(({ cardData, qrCodeData }) => (
  <div className="w-72 bg-white rounded-xl shadow-lg overflow-hidden border">
    <div className="p-6" style={{ backgroundColor: `${cardData.cardColor}20` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-900">{cardData.businessName}</div>
        <div className="text-2xl">{cardData.iconEmoji}</div>
      </div>
      
      <div className="mb-4">
        <div className="text-xl font-bold text-gray-900 mb-2">{cardData.cardName}</div>
        <div className="text-3xl font-bold mb-2" style={{ color: cardData.cardColor }}>
          {cardData.stamps} / {cardData.stampsRequired}
        </div>
        <div className="text-sm text-gray-600">{cardData.reward}</div>
      </div>
      
      <div className="flex items-center justify-between">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Show QR Code
        </button>
        <div className="text-xs text-gray-500">Powered by RewardJar</div>
      </div>
    </div>
    
    {/* Floating QR Section */}
    <div className="p-4 bg-gray-50 border-t flex justify-center">
      <QRCodeDisplay value={qrCodeData} size={80} />
    </div>
  </div>
))
```

### Performance Optimizations
- **Memoized validation**: Only recalculates when dependencies change
- **Optimized file uploads**: Client-side validation before upload
- **Cached API requests**: HTTP caching headers for business data
- **Code splitting**: Heavy components loaded on-demand
- **Error boundaries**: Graceful error handling without crashes
- **Dynamic QR generation**: Real QR codes with library import optimization
- **Suspense boundaries**: Fallback components for QR code loading

⸻

🛠️ Backend Data Schema (Simplified)

cards (
  id,
  business_id,
  card_name,
  reward,
  stamps_required,
  color,
  icon,
  expiry_days,
  reward_expiry_days,
  stamp_config (json)
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
  email
)

customer_cards (
  id,
  card_id,
  customer_id,
  stamps: integer,
  reward_unlocked: boolean,
  reward_redeemed: boolean,
  created_at,
  updated_at
)

stamps (
  id,
  customer_card_id,
  staff_id,
  bill_no,
  bill_amount,
  notes,
  created_at
)


⸻


