import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import jwt from 'jsonwebtoken'

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

    const stampCardArray = customerCard.stamp_cards as {
      id: string
      total_stamps: number
      name: string
      reward_description: string
      businesses: {
        name: string
        description: string
      }[]
    }[]
    const stampCard = stampCardArray[0]
    const business = stampCard.businesses[0]
    
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

    // Check if we have the private key for JWT signing
    const hasPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

    // For debugging, return JSON structure
    if (request.nextUrl.searchParams.get('debug') === 'true') {
      return NextResponse.json({
        loyaltyObject: googlePassData.loyaltyObject,
        serviceAccountConfigured: !!hasPrivateKey,
        environment: {
          serviceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          classId: !!process.env.GOOGLE_CLASS_ID,
          privateKey: !!hasPrivateKey
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // If fully configured, generate JWT and "Add to Google Wallet" functionality
    if (hasPrivateKey) {
      try {
        const jwtToken = generateGoogleWalletJWT(googlePassData.loyaltyObject)
        const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`
        
        // Return interactive Google Wallet page
        const googleWalletHTML = generateGoogleWalletHTML(
          customerCard, 
          stampCard, 
          business, 
          saveUrl, 
          isCompleted, 
          progress, 
          stampsRemaining
        )
        
        return new NextResponse(googleWalletHTML, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
      } catch (error) {
        console.error('Error generating Google Wallet JWT:', error)
        return NextResponse.json(
          { 
            error: 'Failed to generate Google Wallet pass',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    }

    // Return setup instructions if not fully configured
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

// Google Wallet JWT generation
function generateGoogleWalletJWT(loyaltyObject: Record<string, unknown>): string {
  const jwtPayload = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [loyaltyObject]
    }
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Google service account private key not configured')
  }

  return jwt.sign(jwtPayload, process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, {
    algorithm: 'RS256'
  })
}

// Generate interactive Google Wallet HTML
function generateGoogleWalletHTML(
  customerCard: Record<string, unknown>, 
  stampCard: Record<string, unknown>, 
  business: Record<string, unknown>, 
  saveUrl: string, 
  isCompleted: boolean, 
  progress: number, 
  _stampsRemaining: number
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${stampCard.name} - Google Wallet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#4285f4">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .progress-bar {
            background: linear-gradient(90deg, #10b981 0%, #10b981 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
        .google-wallet-button {
            background: #4285f4;
            transition: all 0.3s ease;
        }
        .google-wallet-button:hover {
            background: #3367d6;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(66, 133, 244, 0.3);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Google Wallet</h1>
            <p class="text-gray-600">Digital Loyalty Card</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden mb-6">
            <!-- Card Header -->
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-xl font-bold">${stampCard.name}</h2>
                        <p class="text-blue-100">${business.name}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold">${customerCard.current_stamps}</div>
                        <div class="text-sm text-blue-100">of ${stampCard.total_stamps}</div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-blue-400 rounded-full h-3 mb-2">
                    <div class="progress-bar h-3 rounded-full transition-all duration-500"></div>
                </div>
                <div class="text-center text-blue-100 text-sm">${Math.round(progress)}% Complete</div>
            </div>

            <!-- Card Content -->
            <div class="p-6">
                <!-- Reward Section -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Your Reward</h3>
                    <p class="text-gray-700 mb-4">${stampCard.reward_description}</p>
                    
                    ${isCompleted ? 
                      '<div class="bg-green-50 border border-green-200 rounded-lg p-3"><div class="flex items-center text-green-800"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg><span class="font-semibold">Ready to claim!</span></div><p class="text-green-700 text-sm mt-1">Show this card to redeem your reward.</p></div>' :
                      '<div class="bg-gray-50 border border-gray-200 rounded-lg p-3"><p class="text-gray-600 text-sm">Collect ${stampsRemaining} more stamps to unlock this reward.</p></div>'
                    }
                </div>

                <!-- QR Code Section -->
                <div class="text-center border-t pt-4">
                    <div class="bg-gray-50 rounded-lg p-4 mb-3">
                        <div class="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center mb-2">
                            <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <p class="text-sm text-gray-600">Scan this QR code at ${business.name} to collect stamps</p>
                    </div>
                    <p class="text-xs text-gray-500">Card ID: ${(customerCard.id as string).substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- Google Wallet Button -->
        <div class="mb-6">
            <a href="${saveUrl}" 
               target="_blank" 
               class="google-wallet-button w-full text-white font-semibold py-4 px-6 rounded-lg block text-center">
                <div class="flex items-center justify-center">
                    <svg class="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 8V7l-3 2-3-2v1l3 2 3-2zM1 12v6c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-6H1zm20-7H3c-1.1 0-2 .9-2 2v1h22V7c0-1.1-.9-2-2-2z"/>
                    </svg>
                    Add to Google Wallet
                </div>
            </a>
        </div>

        <!-- Alternative Actions -->
        <div class="space-y-3">
            <button onclick="refreshCard()" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Refresh Card
            </button>
            <div class="flex space-x-3">
                <a href="/api/wallet/apple/${customerCard.id}" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Try Apple Wallet
                </a>
                <a href="/api/wallet/pwa/${customerCard.id}" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Use Web App
                </a>
            </div>
        </div>
    </div>

    <script>
        function refreshCard() {
            window.location.reload();
        }

        // Auto-refresh every 30 seconds to sync stamps
        setInterval(refreshCard, 30000);
        
        // Track Google Wallet button clicks
        document.querySelector('.google-wallet-button').addEventListener('click', function() {
            console.log('Google Wallet button clicked');
            // You can add analytics tracking here
        });
    </script>
</body>
</html>
  `
} 