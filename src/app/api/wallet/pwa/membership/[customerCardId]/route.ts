import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-only'
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

    // Return PWA-optimized HTML page
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gym Membership - PWA Wallet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#10b981">
    <link rel="manifest" href="/api/wallet/pwa/membership/${customerCardId}/manifest">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .progress-bar {
            background: linear-gradient(90deg, #10b981 0%, #10b981 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
        .pwa-wallet-card {
            background: ${isExpired ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 
                         isCompleted ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 
                         'linear-gradient(135deg, #10b981, #059669)'};
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        @media (display-mode: standalone) {
            .install-prompt { display: none; }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">PWA Wallet</h1>
            <p class="text-gray-600">Gym Membership Card</p>
        </div>

        <!-- PWA Install Prompt -->
        <div class="install-prompt bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6" id="installPrompt">
            <div class="flex items-center">
                <svg class="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
                <div class="flex-1">
                    <p class="text-sm text-blue-800">Install this app for easy access</p>
                </div>
                <button onclick="installPWA()" class="text-blue-600 text-sm font-medium">Install</button>
            </div>
        </div>

        <!-- PWA Wallet Card -->
        <div class="pwa-wallet-card rounded-2xl text-white p-6 mb-6 transform hover:scale-105 transition-transform">
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h2 class="text-lg font-bold">Premium Gym Membership</h2>
                    <p class="text-green-100">${businessData.name}</p>
                </div>
                <div class="text-right">
                    <div class="text-xs text-green-200">Web App</div>
                    <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mt-1">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="space-y-4">
                <!-- Sessions Display -->
                <div class="text-center">
                    <div class="text-3xl font-bold">${sessionsRemaining}</div>
                    <div class="text-sm text-green-200">Sessions Remaining</div>
                    <div class="text-xs text-green-300">of ${totalSessions} total (${sessionsUsed} used)</div>
                </div>
                
                <!-- Progress Bar -->
                <div class="w-full bg-green-400 rounded-full h-2">
                    <div class="progress-bar h-2 rounded-full transition-all duration-500"></div>
                </div>
                
                <!-- Status Information -->
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div class="text-green-200">Value</div>
                        <div class="font-semibold">₩${(customerCard.cost || 15000).toLocaleString()}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-green-200">Expires</div>
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
                      'bg-green-200 text-green-800'
                    }">
                        ${isExpired ? 'Expired' : isCompleted ? 'Complete' : 'Active'}
                    </span>
                </div>
            </div>
            
            <!-- QR Code Area -->
            <div class="mt-6 pt-4 border-t border-green-400">
                <div class="text-center">
                    <div class="w-16 h-16 bg-white bg-opacity-20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM19 15h2v2h-2zM19 19h2v2h-2z"/>
                        </svg>
                    </div>
                    <p class="text-xs text-green-200">Show at gym to mark sessions</p>
                    <p class="text-xs text-green-300">ID: ${customerCardId.substring(0, 8)}</p>
                </div>
            </div>
        </div>

        <!-- PWA Features -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Offline Features</h3>
            <div class="space-y-3">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span class="text-gray-700">Works offline</span>
                </div>
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span class="text-gray-700">Auto-sync when online</span>
                </div>
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span class="text-gray-700">Installable on home screen</span>
                </div>
            </div>
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
            <button onclick="refreshCard()" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors">
                Refresh Card
            </button>
            <div class="flex space-x-3">
                <a href="/api/wallet/apple/membership/${customerCardId}" class="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Try Apple Wallet
                </a>
                <a href="/api/wallet/google/membership/${customerCardId}" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                    Try Google Wallet
                </a>
            </div>
            <a href="/test/wallet-preview" class="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">
                ← Back to Tests
            </a>
        </div>
    </div>

    <script>
        let deferredPrompt;
        
        // PWA Installation
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installPrompt').style.display = 'block';
        });
        
        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the PWA install prompt');
                        document.getElementById('installPrompt').style.display = 'none';
                    }
                    deferredPrompt = null;
                });
            }
        }
        
        // Refresh functionality
        function refreshCard() {
            window.location.reload();
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshCard, 30000);
        
        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered:', registration))
                .catch(error => console.log('SW registration failed:', error));
        }
        
        // Store card data offline
        const cardData = {
            id: '${customerCardId}',
            type: 'gym_membership',
            sessionsUsed: ${sessionsUsed},
            totalSessions: ${totalSessions},
            progress: ${Math.round(progress)},
            isExpired: ${isExpired},
            isCompleted: ${isCompleted},
            lastSync: new Date().toISOString()
        };
        
        localStorage.setItem('membershipCard_${customerCardId}', JSON.stringify(cardData));
        
        // Log PWA wallet interaction
        console.log('PWA Membership Wallet loaded:', cardData);
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
    console.error('Error generating PWA membership wallet:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate PWA membership wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 