import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-only'
import validateUUID from 'uuid-validate'

// Type definitions for membership card data
interface CustomerCard {
  id: string
  membership_type: string
  sessions_used: number
  total_sessions: number
  cost: number
  expiry_date: string | null
  wallet_type: string | null
  created_at: string
  customers?: {
    id: string
    name: string
    email: string
  }[]
}

interface BusinessData {
  name: string
  description: string
}

interface PassData {
  formatVersion: number
  passTypeIdentifier: string
  serialNumber: string
  teamIdentifier: string
  organizationName: string
  description: string
  backgroundColor: string
  foregroundColor: string
  labelColor: string
  logoText: string
  storeCard: {
    primaryFields: Array<{
      key: string
      label: string
      value: string
      textAlignment: string
    }>
    secondaryFields: Array<{
      key: string
      label: string
      value: string
      textAlignment: string
    }>
    headerFields: Array<{
      key: string
      label: string
      value: string
      textAlignment: string
    }>
    auxiliaryFields: Array<{
      key: string
      label: string
      value: string
      textAlignment: string
    }>
    backFields: Array<{
      key: string
      label: string
      value: string
    }>
  }
  barcode: {
    message: string
    format: string
    messageEncoding: string
    altText: string
  }
  webServiceURL: string
  authenticationToken: string
  userInfo: {
    customerCardId: string
    membershipType: string
    businessName: string
  }
  relevantDate: string
}

interface CalculatedData {
  sessionsRemaining: number
  progress: number
  isExpired: boolean
  isCompleted: boolean
  costPerSession: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const { customerCardId } = await params
    
    // Validate UUID format
    if (!validateUUID(customerCardId)) {
      return NextResponse.json(
        { error: 'Invalid customer card ID format' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Get membership card details
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        wallet_type,
        created_at,
        customers (
          id,
          name,
          email
        )
      `)
      .eq('id', customerCardId)
      .eq('membership_type', 'gym')
      .single()
      
    if (error || !customerCard) {
      return NextResponse.json(
        { error: 'Gym membership card not found' },
        { status: 404 }
      )
    }
    
    // Get business information (for membership cards, we need to find it differently)
    // Since membership cards don't directly link to businesses, we'll create a default business
    const businessData = {
      name: 'Premium Fitness Gym',
      description: 'Your fitness destination with premium facilities and expert trainers'
    }
    
    // Calculate membership progress and status
    const sessionsRemaining = (customerCard.total_sessions || 20) - (customerCard.sessions_used || 0)
    const progress = ((customerCard.sessions_used || 0) / (customerCard.total_sessions || 20)) * 100
    const isExpired = customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false
    const isCompleted = sessionsRemaining <= 0
    const costPerSession = (customerCard.cost || 15000) / (customerCard.total_sessions || 20)
    
    // Check Apple Wallet configuration
    if (!process.env.APPLE_TEAM_IDENTIFIER || !process.env.APPLE_PASS_TYPE_IDENTIFIER) {
      return NextResponse.json(
        { error: 'Apple Wallet not configured' },
        { status: 503 }
      )
    }
    
    // Generate PKPass data for gym membership
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER,
      serialNumber: customerCardId,
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER,
      organizationName: "RewardJar",
      description: `Premium Gym Membership - ${businessData.name}`,
      
      // Membership-specific styling (indigo theme)
      backgroundColor: "rgb(99, 102, 241)", // indigo-500
      foregroundColor: "rgb(255, 255, 255)", // white
      labelColor: "rgb(255, 255, 255)", // white
      logoText: "RewardJar",
      
      // Store card layout for gym membership
      storeCard: {
        // Primary display - sessions remaining
        primaryFields: [
          {
            key: "sessions",
            label: "Sessions Remaining",
            value: `${sessionsRemaining}/${customerCard.total_sessions || 20}`,
            textAlignment: "PKTextAlignmentCenter"
          }
        ],
        
        // Secondary fields - value and expiry
        secondaryFields: [
          {
            key: "value",
            label: "Membership Value",
            value: `₩${(customerCard.cost || 15000).toLocaleString()}`,
            textAlignment: "PKTextAlignmentLeft"
          },
          {
            key: "expiry",
            label: "Expires",
            value: customerCard.expiry_date ? 
              new Date(customerCard.expiry_date).toLocaleDateString() : 
              "No expiry",
            textAlignment: "PKTextAlignmentRight"
          }
        ],
        
        // Header field - membership type
        headerFields: [
          {
            key: "membership_type",
            label: "Membership",
            value: "Premium Gym Membership",
            textAlignment: "PKTextAlignmentCenter"
          }
        ],
        
        // Auxiliary fields - additional info
        auxiliaryFields: [
          {
            key: "facility",
            label: "Facility",
            value: businessData.name,
            textAlignment: "PKTextAlignmentLeft"
          },
          {
            key: "status",
            label: "Status",
            value: isExpired ? 'Expired' : 
                   isCompleted ? 'Complete' : 'Active',
            textAlignment: "PKTextAlignmentRight"
          }
        ],
        
        // Back of card information
        backFields: [
          {
            key: "membership_details",
            label: "Membership Details",
            value: `This premium gym membership includes ${customerCard.total_sessions || 20} sessions at ${businessData.name}.`
          },
          {
            key: "usage_info",
            label: "Usage Information",
            value: `Sessions Used: ${customerCard.sessions_used || 0}\nSessions Remaining: ${sessionsRemaining}\nPer-Session Value: ₩${Math.round(costPerSession).toLocaleString()}`
          },
          {
            key: "validity_info",
            label: "Membership Validity",
            value: customerCard.expiry_date ? 
              `Valid until: ${new Date(customerCard.expiry_date).toLocaleDateString()}\nPurchased: ${new Date(customerCard.created_at).toLocaleDateString()}` :
              `Purchased: ${new Date(customerCard.created_at).toLocaleDateString()}\nNo expiry date`
          },
          {
            key: "instructions",
            label: "How to Use",
            value: "Show this pass at the gym to mark session usage. Your pass will automatically update when sessions are used."
          },
          {
            key: "support",
            label: "Support",
            value: `Membership ID: ${customerCardId.substring(0, 8)}\nFor questions, contact the facility or visit rewardjar.com`
          }
        ]
      },
      
      // QR code for session marking
      barcode: {
        message: `gym:${customerCardId}`,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: `Gym Membership ID: ${customerCardId.substring(0, 8)}`
      },
      
      // Web service for real-time updates
      webServiceURL: `${process.env.BASE_URL || 'https://www.rewardjar.xyz'}/api/wallet/apple/membership/updates`,
      authenticationToken: customerCardId,
      
      // Expiry and relevance
      ...(customerCard.expiry_date && { expirationDate: customerCard.expiry_date }),
      relevantDate: new Date().toISOString(),
      
      // User metadata
      userInfo: {
        customerCardId: customerCardId,
        membershipType: 'gym',
        businessName: businessData.name,
        cardType: 'membership'
      },
      
      // Conditional styling based on status
      ...(isExpired && {
        backgroundColor: "rgb(239, 68, 68)", // red-500 for expired
        foregroundColor: "rgb(255, 255, 255)"
      }),
      ...(isCompleted && {
        backgroundColor: "rgb(34, 197, 94)", // green-500 for completed
        foregroundColor: "rgb(255, 255, 255)"
      })
    }

    // For debug mode, return JSON structure
    if (request.nextUrl.searchParams.get('debug') === 'true') {
      return NextResponse.json({
        passData,
        customerCard,
        business: businessData,
        calculated: {
          sessionsRemaining,
          progress: Math.round(progress),
          isExpired,
          isCompleted,
          costPerSession: Math.round(costPerSession)
        },
        environment: {
          appleTeamId: !!process.env.APPLE_TEAM_IDENTIFIER,
          applePassType: !!process.env.APPLE_PASS_TYPE_IDENTIFIER,
          appleCert: !!process.env.APPLE_CERT_BASE64
        }
      })
    }

    // TODO: Generate actual PKPass bundle
    // For now, return HTML preview
    const membershipHTML = generateMembershipHTML(
      customerCard,
      businessData,
      passData,
      {
        sessionsRemaining,
        progress: Math.round(progress),
        isExpired,
        isCompleted,
        costPerSession: Math.round(costPerSession)
      }
    )
    
    return new NextResponse(membershipHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
    
  } catch (error) {
    console.error('Error generating Apple Wallet membership pass:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate membership pass',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Generate HTML preview for membership card
function generateMembershipHTML(
  customerCard: CustomerCard,
  business: BusinessData,
  passData: PassData,
  calculated: CalculatedData
): string {
  const { sessionsRemaining, progress, isExpired, isCompleted, costPerSession } = calculated
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gym Membership - Apple Wallet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#6366f1">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .progress-bar {
            background: linear-gradient(90deg, #6366f1 0%, #6366f1 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
        .apple-wallet-card {
            background: ${isExpired ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                         isCompleted ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 
                         'linear-gradient(135deg, #6366f1, #4f46e5)'};
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Apple Wallet</h1>
            <p class="text-gray-600">Gym Membership Card</p>
        </div>

        <!-- Apple Wallet Card -->
        <div class="apple-wallet-card rounded-2xl text-white p-6 mb-6 transform hover:scale-105 transition-transform">
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h2 class="text-lg font-bold">Premium Gym Membership</h2>
                    <p class="text-indigo-100">${business.name}</p>
                </div>
                <div class="text-right">
                    <div class="text-xs text-indigo-200">RewardJar</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="space-y-4">
                <!-- Sessions Display -->
                <div class="text-center">
                    <div class="text-3xl font-bold">${sessionsRemaining}</div>
                    <div class="text-sm text-indigo-200">Sessions Remaining</div>
                    <div class="text-xs text-indigo-300">of ${customerCard.total_sessions || 20} total</div>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-indigo-400 rounded-full h-2">
                    <div class="progress-bar h-2 rounded-full transition-all duration-500"></div>
                </div>
                
                <!-- Status Information -->
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-indigo-200">Value</div>
                        <div class="font-semibold">₩${(customerCard.cost || 15000).toLocaleString()}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-indigo-200">Expires</div>
                        <div class="font-semibold">
                            ${customerCard.expiry_date ? 
                              new Date(customerCard.expiry_date).toLocaleDateString() : 
                              'No expiry'}
                        </div>
                    </div>
                </div>
                
                <!-- Status Badge -->
                <div class="text-center">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      isExpired ? 'bg-red-200 text-red-800' :
                      isCompleted ? 'bg-green-200 text-green-800' :
                      'bg-indigo-200 text-indigo-800'
                    }">
                        ${isExpired ? 'Expired' : isCompleted ? 'Complete' : 'Active'}
                    </span>
                </div>
            </div>
            
            <!-- QR Code Area -->
            <div class="mt-6 pt-4 border-t border-indigo-400">
                <div class="text-center">
                    <div class="w-16 h-16 bg-white bg-opacity-20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM19 15h2v2h-2zM19 19h2v2h-2z"/>
                        </svg>
                    </div>
                    <p class="text-xs text-indigo-200">Show at gym to mark sessions</p>
                    <p class="text-xs text-indigo-300">ID: ${customerCard.id.substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- Card Details -->
        <div class="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">Membership Details</h3>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">Sessions Used:</span>
                    <span class="font-medium ml-2">${customerCard.sessions_used || 0}</span>
                </div>
                <div>
                    <span class="text-gray-600">Remaining:</span>
                    <span class="font-medium ml-2">${sessionsRemaining}</span>
                </div>
                <div>
                    <span class="text-gray-600">Per Session:</span>
                    <span class="font-medium ml-2">₩${costPerSession.toLocaleString()}</span>
                </div>
                <div>
                    <span class="text-gray-600">Progress:</span>
                    <span class="font-medium ml-2">${progress}%</span>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <div class="text-xs text-gray-500 space-y-1">
                    <p><strong>Purchased:</strong> ${new Date(customerCard.created_at).toLocaleDateString()}</p>
                    ${customerCard.expiry_date ? 
                      `<p><strong>Valid Until:</strong> ${new Date(customerCard.expiry_date).toLocaleDateString()}</p>` : 
                      '<p><strong>Validity:</strong> No expiry date</p>'
                    }
                    <p><strong>Membership ID:</strong> ${customerCard.id.substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 space-y-3">
            <button onclick="downloadPass()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Add to Apple Wallet
            </button>
            <div class="flex space-x-3">
                <a href="/api/wallet/google/membership/${customerCard.id}" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Try Google Wallet
                </a>
                <a href="/api/wallet/pwa/membership/${customerCard.id}" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Use Web App
                </a>
            </div>
            <a href="/test/wallet-preview" class="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                ← Back to Tests
            </a>
        </div>
    </div>

    <script>
        function downloadPass() {
            // TODO: Implement actual PKPass download
            alert('PKPass generation not yet implemented. This is a preview.');
        }
        
        // Auto-refresh every 30 seconds to sync updates
        setInterval(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
  `
} 