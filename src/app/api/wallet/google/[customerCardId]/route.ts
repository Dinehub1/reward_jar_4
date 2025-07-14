import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId

    // Get customer card with stamp card details
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        wallet_type,
        created_at,
        stamp_cards!inner (
          id,
          name,
          total_stamps,
          reward_description,
          businesses!inner (
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    const stampCard = customerCard.stamp_cards
    const business = stampCard.businesses
    
    // Calculate progress
    const progress = Math.min((customerCard.current_stamps / stampCard.total_stamps) * 100, 100)
    const isCompleted = customerCard.current_stamps >= stampCard.total_stamps
    const stampsRemaining = Math.max(stampCard.total_stamps - customerCard.current_stamps, 0)

    // Check if Google Wallet is configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_CLASS_ID) {
      return NextResponse.json(
        { 
          error: 'Google Wallet not configured', 
          message: 'Please contact support for Google Wallet integration'
        },
        { status: 503 }
      )
    }

    // Generate Google Wallet pass data
    const googlePassData = {
      "@context": "https://schema.org",
      "@type": "LoyaltyProgram",
      "name": stampCard.name,
      "description": stampCard.reward_description,
      "provider": {
        "@type": "Organization",
        "name": business.name,
        "description": business.description
      },
      "loyaltyObject": {
        "id": `${process.env.GOOGLE_CLASS_ID}.${customerCardId}`,
        "classId": process.env.GOOGLE_CLASS_ID,
        "state": "ACTIVE",
        "accountId": customerCardId,
        "accountName": `Customer ${customerCardId.substring(0, 8)}`,
        "loyaltyPoints": {
          "balance": {
            "string": `${customerCard.current_stamps}/${stampCard.total_stamps}`
          },
          "label": "Stamps Collected"
        },
        "secondaryLoyaltyPoints": {
          "balance": {
            "string": `${Math.round(progress)}%`
          },
          "label": "Progress"
        },
        "barcode": {
          "type": "QR_CODE",
          "value": customerCardId,
          "alternateText": `Card ID: ${customerCardId}`
        },
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
        "imageModulesData": [
          {
            "id": "logo",
            "mainImage": {
              "sourceUri": {
                "uri": `${process.env.BASE_URL || 'https://rewardjar.com'}/api/images/google-wallet-logo`
              },
              "contentDescription": {
                "defaultValue": {
                  "language": "en-US",
                  "value": "RewardJar Logo"
                }
              }
            }
          }
        ],
        "hexBackgroundColor": "#10b981", // green-500
        "validTimeInterval": {
          "start": {
            "date": new Date().toISOString().split('T')[0]
          }
        }
      }
    }

    // In a production environment, you would:
    // 1. Sign the JWT with Google service account credentials
    // 2. Create the actual Google Wallet pass
    // 3. Return the "Add to Google Wallet" URL
    
    // For now, return setup instructions
    const instructionsHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Google Wallet - Setup Required</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-gray-900 mb-2">Google Wallet Integration</h1>
            <p class="text-gray-600">Google Wallet passes require additional setup</p>
        </div>
        
        <div class="space-y-4 mb-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold text-blue-900 mb-2">Required Setup:</h3>
                <ul class="text-sm text-blue-800 space-y-1">
                    <li>• Google Cloud Project</li>
                    <li>• Google Wallet API enabled</li>
                    <li>• Service account credentials</li>
                    <li>• Issuer account approval</li>
                </ul>
            </div>
            
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 mb-2">Card Information:</h3>
                <div class="text-sm text-gray-700 space-y-1">
                    <p><strong>Card:</strong> ${stampCard.name}</p>
                    <p><strong>Business:</strong> ${business.name}</p>
                    <p><strong>Progress:</strong> ${customerCard.current_stamps}/${stampCard.total_stamps} stamps (${Math.round(progress)}%)</p>
                    <p><strong>Reward:</strong> ${stampCard.reward_description}</p>
                </div>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 class="font-semibold text-green-900 mb-2">Alternative Options:</h3>
                <div class="space-y-2">
                    <a href="/api/wallet/pwa/${customerCardId}" class="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded font-medium">
                        Use Web App Instead
                    </a>
                    <a href="/api/wallet/apple/${customerCardId}" class="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center py-2 px-4 rounded font-medium">
                        Try Apple Wallet
                    </a>
                </div>
            </div>
        </div>
        
        <div class="text-center">
            <a href="/customer/card/${customerCardId}" class="text-gray-600 hover:text-gray-900 text-sm">
                ← Back to Card
            </a>
        </div>
    </div>
    
    <script>
        // If Google Wallet is configured, this would generate the "Add to Google Wallet" button
        console.log('Google Wallet pass data:', ${JSON.stringify(googlePassData, null, 2)});
    </script>
</body>
</html>
    `

    return new NextResponse(instructionsHTML, {
      headers: {
        'Content-Type': 'text/html'
      }
    })

  } catch (error) {
    console.error('Error generating Google Wallet pass:', error)
    return NextResponse.json(
      { error: 'Failed to generate Google Wallet pass' },
      { status: 500 }
    )
  }
} 