import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import jwt from 'jsonwebtoken'
import validateUUID from 'uuid-validate'

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

    // Check Google Wallet configuration
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || !process.env.GOOGLE_CLASS_ID) {
      return NextResponse.json(
        { error: 'Google Wallet not configured' },
        { status: 503 }
      )
    }

    // Calculate membership progress and status
    const sessionsUsed = customerCard.sessions_used || 0
    const totalSessions = customerCard.total_sessions || 20
    const sessionsRemaining = totalSessions - sessionsUsed
    const progress = (sessionsUsed / totalSessions) * 100
    const isExpired = customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false
    const isCompleted = sessionsRemaining <= 0
    const costPerSession = (customerCard.cost || 15000) / totalSessions

    // Default business data for membership cards
    const businessData = {
      name: 'Premium Fitness Gym',
      description: 'Your fitness destination with premium facilities and expert trainers'
    }

    // Create Google Wallet membership object (using loyalty object structure)
    const membershipObject = {
      id: `${process.env.GOOGLE_CLASS_ID}.${customerCardId}`,
      classId: process.env.GOOGLE_CLASS_ID,
      state: isExpired ? 'EXPIRED' : isCompleted ? 'COMPLETED' : 'ACTIVE',
      
      // Membership identification
      accountId: customerCardId,
      accountName: `Gym Member ${customerCardId.substring(0, 8)}`,
      
      // Primary display - sessions used/total
      loyaltyPoints: {
        balance: {
          string: `${sessionsUsed}/${totalSessions}`
        },
        label: "Sessions Used"
      },
      
      // Secondary display - sessions remaining
      secondaryLoyaltyPoints: {
        balance: {
          string: `${sessionsRemaining}`
        },
        label: "Sessions Remaining"
      },
      
      // QR code for session marking
      barcode: {
        type: "QR_CODE",
        value: customerCardId,
        alternateText: `Membership ID: ${customerCardId.substring(0, 8)}`
      },
      
      // Membership information modules
      textModulesData: [
        {
          id: "gym_info",
          header: businessData.name,
          body: businessData.description
        },
        {
          id: "membership_details",
          header: "Membership Details",
          body: `Total Value: ₩${(customerCard.cost || 15000).toLocaleString()} • Per Session: ₩${Math.round(costPerSession).toLocaleString()}`
        },
        {
          id: "progress_status",
          header: "Status",
          body: isExpired ? 
            "Membership Expired" : 
            isCompleted ? 
            "All sessions used - Please renew" : 
            `${Math.round(progress)}% used • ${sessionsRemaining} sessions remaining`
        },
        {
          id: "expiry_info",
          header: "Valid Until",
          body: customerCard.expiry_date ? 
            new Date(customerCard.expiry_date).toLocaleDateString() : 
            "No expiry date"
        }
      ],
      
      // Visual styling for gym membership (blue/indigo theme)
      hexBackgroundColor: "#6366f1", // indigo-500
      
      // Validity period
      validTimeInterval: {
        start: {
          date: new Date().toISOString()
        },
        end: customerCard.expiry_date ? {
          date: new Date(customerCard.expiry_date).toISOString()
        } : undefined
      }
    }

    // Create JWT payload for Google Wallet
    const jwtPayload = {
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      
      payload: {
        loyaltyObjects: [membershipObject]
      }
    }

    // Process the private key to handle various formats properly
    let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    
    // Handle different newline formats
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    
    // Remove any surrounding quotes that might be present
    privateKey = privateKey.replace(/^["']|["']$/g, '')
    
    // Ensure proper line endings for PEM format
    if (!privateKey.includes('\n')) {
      // If no newlines, try to detect and add them after header/footer
      privateKey = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
    }

    // Validate PEM format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key format - must be PEM format')
    }
    
    // Additional validation for JWT library compatibility
    if (!privateKey.trim().startsWith('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Private key must start with PEM header')
    }

    console.log('🔐 Signing JWT with RS256 algorithm for Google Wallet membership')
    console.log('🔍 Private key format validated:', {
      hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
      hasNewlines: privateKey.includes('\n'),
      length: privateKey.length
    })

    // Sign JWT with processed service account private key
    const token = jwt.sign(jwtPayload, privateKey, {
      algorithm: 'RS256'
    })

    // Generate "Add to Google Wallet" URL
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`

    // Return HTML page with Google Wallet integration
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gym Membership - Google Wallet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#6366f1">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .progress-bar {
            background: linear-gradient(90deg, #6366f1 0%, #6366f1 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
        .google-wallet-card {
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
            <h1 class="text-2xl font-bold text-gray-900">Google Wallet</h1>
            <p class="text-gray-600">Gym Membership Card</p>
        </div>

        <!-- Google Wallet Card -->
        <div class="google-wallet-card rounded-2xl text-white p-6 mb-6 transform hover:scale-105 transition-transform">
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h2 class="text-lg font-bold">Premium Gym Membership</h2>
                    <p class="text-indigo-100">${businessData.name}</p>
                </div>
                <div class="text-right">
                    <div class="text-xs text-indigo-200">Google Pay</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="space-y-4">
                <!-- Sessions Display -->
                <div class="text-center">
                    <div class="text-3xl font-bold">${sessionsRemaining}</div>
                    <div class="text-sm text-indigo-200">Sessions Remaining</div>
                    <div class="text-xs text-indigo-300">of ${totalSessions} total (${sessionsUsed} used)</div>
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
                    <p class="text-xs text-indigo-300">ID: ${customerCardId.substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- Add to Google Wallet Button -->
        <div class="mb-6">
            <a href="${saveUrl}" 
               target="_blank" 
               rel="noopener noreferrer"
               class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Add to Google Wallet</span>
            </a>
        </div>

        <!-- Membership Details -->
        <div class="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h3 class="text-lg font-semibold text-gray-900">Membership Details</h3>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">Sessions Used:</span>
                    <span class="font-medium ml-2">${sessionsUsed}</span>
                </div>
                <div>
                    <span class="text-gray-600">Remaining:</span>
                    <span class="font-medium ml-2">${sessionsRemaining}</span>
                </div>
                <div>
                    <span class="text-gray-600">Per Session:</span>
                    <span class="font-medium ml-2">₩${Math.round(costPerSession).toLocaleString()}</span>
                </div>
                <div>
                    <span class="text-gray-600">Progress:</span>
                    <span class="font-medium ml-2">${Math.round(progress)}%</span>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <div class="text-xs text-gray-500 space-y-1">
                    <p><strong>Purchased:</strong> ${new Date(customerCard.created_at).toLocaleDateString()}</p>
                    ${customerCard.expiry_date ? 
                      `<p><strong>Valid Until:</strong> ${new Date(customerCard.expiry_date).toLocaleDateString()}</p>` : 
                      '<p><strong>Validity:</strong> No expiry date</p>'
                    }
                    <p><strong>Membership ID:</strong> ${customerCardId.substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 space-y-3">
            <div class="flex space-x-3">
                <a href="/api/wallet/apple/membership/${customerCardId}" class="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Try Apple Wallet
                </a>
                <a href="/api/wallet/pwa/membership/${customerCardId}" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Use Web App
                </a>
            </div>
            <a href="/test/wallet-preview" class="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                ← Back to Tests
            </a>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds to sync updates
        setInterval(() => {
            window.location.reload();
        }, 30000);
        
        // Log wallet interaction
        console.log('Google Wallet Membership Card loaded:', {
            membershipId: '${customerCardId}',
            sessionsUsed: ${sessionsUsed},
            totalSessions: ${totalSessions},
            isExpired: ${isExpired},
            isCompleted: ${isCompleted}
        });
    </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error generating Google Wallet membership pass:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate membership pass',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 