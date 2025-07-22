import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId

    console.log('Generating PWA Wallet for card ID:', customerCardId)

    // Get customer card with stamp card details and membership info
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        created_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('Customer card not found:', error)
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    console.log('Fetched customer card:', customerCard)

    // Handle the data structure properly - stamp_cards is an object, not an array
    const stampCardData = (customerCard.stamp_cards as unknown) as {
      id: string
      total_stamps: number
      name: string
      reward_description: string
      businesses: {
        name: string
        description: string
      }
    }

    const businessData = stampCardData?.businesses as {
      name: string
      description: string
    }

    // Validate required data exists
    if (!stampCardData) {
      console.error('Stamp card data missing')
      return NextResponse.json(
        { error: 'Stamp card data not found' },
        { status: 404 }
      )
    }

    if (!businessData) {
      console.error('Business data missing')
      return NextResponse.json(
        { error: 'Business data not found' },
        { status: 404 }
      )
    }

    // Determine card type and calculate appropriate progress
    const isMembership = customerCard.membership_type === 'gym' || customerCard.membership_type === 'membership'
    let progress: number
    let isCompleted: boolean
    let primaryText: string
    let secondaryText: string
    let cardTitle: string
    let themeColor: string

    if (isMembership) {
      // Handle membership logic
      const sessionsUsed = customerCard.sessions_used || 0
      const totalSessions = customerCard.total_sessions || 20
      progress = Math.min((sessionsUsed / totalSessions) * 100, 100)
      isCompleted = sessionsUsed >= totalSessions
      primaryText = `${sessionsUsed} / ${totalSessions} Sessions Used`
      secondaryText = isCompleted ? 
        'All sessions complete!' : 
        `${totalSessions - sessionsUsed} sessions remaining`
      cardTitle = 'Membership Card'
      themeColor = '#6366f1' // Indigo for membership
      
      // Check if membership is expired
      const isExpired = customerCard.expiry_date ? new Date(customerCard.expiry_date) < new Date() : false
      if (isExpired && !isCompleted) {
        isCompleted = true
        secondaryText = 'Membership expired'
      }
    } else {
      // Handle loyalty card logic
      progress = Math.min((customerCard.current_stamps / stampCardData.total_stamps) * 100, 100)
      isCompleted = customerCard.current_stamps >= stampCardData.total_stamps
      primaryText = `${customerCard.current_stamps} / ${stampCardData.total_stamps} Stamps`
      secondaryText = isCompleted ? 
        'Reward ready to claim!' : 
        `${stampCardData.total_stamps - customerCard.current_stamps} stamps needed`
      cardTitle = 'Digital Loyalty Card'
      themeColor = '#10b981' // Green for loyalty
    }

    const stampCard = {
      id: stampCardData.id,
      name: stampCardData.name || (isMembership ? 'Membership Card' : 'Loyalty Card'),
      total_stamps: stampCardData.total_stamps || 10,
      reward_description: stampCardData.reward_description || 'Reward'
    }

    const business = {
      name: businessData.name || 'Business',
      description: businessData.description || (isMembership ? 'Visit us for your fitness sessions!' : 'Visit us to collect stamps and earn rewards!')
    }

    console.log('Card Type:', isMembership ? 'Membership' : 'Loyalty')
    console.log('Stamp Card:', stampCard)
    console.log('Business:', business)
    
    // Generate QR code for the customer card access URL
    // Use environment variable for base URL, fallback to localhost for development
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const cardAccessUrl = `${baseUrl}/customer/card/${customerCardId}`
    
    const qrCodeDataURL = await QRCode.toDataURL(cardAccessUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Generate PWA wallet HTML
    const walletHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${stampCard.name} - RewardJar</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="${themeColor}">
    <link rel="manifest" href="/api/wallet/pwa/${customerCardId}/manifest">
    <link rel="icon" href="/favicon.ico">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${stampCard.name}">
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .progress-bar {
            background: linear-gradient(90deg, ${themeColor} 0%, ${themeColor} ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
        .card-gradient {
            background: linear-gradient(135deg, ${themeColor}, ${themeColor}dd);
        }
    </style>
</head>
<body class="bg-gradient-to-br ${isMembership ? 'from-indigo-50 to-purple-100' : 'from-green-50 to-emerald-100'} min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">RewardJar</h1>
            <p class="text-gray-600">${cardTitle}</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden mb-6">
            <!-- Card Header -->
            <div class="card-gradient text-white p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-xl font-bold">${stampCard.name}</h2>
                        <p class="${isMembership ? 'text-indigo-100' : 'text-green-100'}">${business.name}</p>
                    </div>
                    <div class="text-right">
                        ${isCompleted ? 
                          '<svg class="w-10 h-10 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' :
                          (isMembership ? 
                            '<svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path></svg>' :
                            '<svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 4l-3 3-3-3 3-3 3 3z"></path></svg>'
                          )
                        }
                    </div>
                </div>
                
                <!-- Progress -->
                <div class="space-y-2">
                    <div class="flex justify-between text-sm ${isMembership ? 'text-indigo-100' : 'text-green-100'}">
                        <span>Progress</span>
                        <span>${primaryText}</span>
                    </div>
                    <div class="w-full ${isMembership ? 'bg-indigo-600/30' : 'bg-green-600/30'} rounded-full h-3">
                        <div class="bg-white rounded-full h-3 transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between items-center pt-2">
                        ${isCompleted ? 
                          '<div class="flex items-center text-yellow-300"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg><span class="font-semibold">' + (isMembership ? 'Membership Complete!' : 'Reward Unlocked!') + '</span></div>' :
                          `<div class="flex items-center ${isMembership ? 'text-indigo-100' : 'text-green-100'}"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">${isMembership ? '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>' : '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>'}</svg><span>${secondaryText}</span></div>`
                        }
                        <span class="text-2xl font-bold text-white">${Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <!-- Card Body -->
            <div class="p-6 space-y-4">
                <!-- Card Type Identifier -->
                <div class="flex items-center justify-center mb-4">
                    <div class="flex items-center gap-2 px-3 py-1 rounded-full ${isMembership ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}">
                        ${isMembership ? 
                          '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path></svg>' :
                          '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 4l-3 3-3-3 3-3 3 3z"></path></svg>'
                        }
                        <span class="text-sm font-medium">${cardTitle}</span>
                    </div>
                </div>

                <!-- Value/Reward Info -->
                <div>
                    <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg class="w-5 h-5 mr-2 ${isMembership ? 'text-indigo-600' : 'text-green-600'}" fill="currentColor" viewBox="0 0 20 20">
                            ${isMembership ? 
                              '<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>' :
                              '<path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>'
                            }
                        </svg>
                        ${isMembership ? 'Membership Value' : 'Your Reward'}
                    </h3>
                    <p class="text-gray-700 mb-3">
                        ${isMembership ? 
                          `₩${(customerCard.cost || 15000).toLocaleString()} membership with ${customerCard.total_sessions || 20} sessions` :
                          stampCard.reward_description
                        }
                    </p>
                    ${isCompleted ? 
                      `<div class="bg-${isMembership ? 'indigo' : 'green'}-50 border border-${isMembership ? 'indigo' : 'green'}-200 rounded-lg p-3">
                         <div class="flex items-center text-${isMembership ? 'indigo' : 'green'}-800">
                           <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                             <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                           </svg>
                           <span class="font-semibold">${isMembership ? 'All sessions used!' : 'Ready to claim!'}</span>
                         </div>
                         <p class="text-${isMembership ? 'indigo' : 'green'}-700 text-sm mt-1">
                           ${isMembership ? 'Your membership is complete.' : 'Show this card to redeem your reward.'}
                         </p>
                       </div>` :
                      `<div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
                         <p class="text-gray-600 text-sm">${secondaryText}</p>
                       </div>`
                    }
                </div>

                <!-- Usage Instructions -->
                <div class="bg-${isMembership ? 'indigo' : 'green'}-50 border border-${isMembership ? 'indigo' : 'green'}-200 rounded-lg p-4">
                    <h4 class="font-semibold text-${isMembership ? 'indigo' : 'green'}-900 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                        </svg>
                        How to Use
                    </h4>
                    <p class="text-${isMembership ? 'indigo' : 'green'}-800 text-sm">
                        ${isMembership ? 
                          `Show this card at ${business.name} to mark your session usage. Each visit will be tracked automatically.` :
                          `Show this card at ${business.name} to collect stamps. Collect all stamps to unlock your reward!`
                        }
                    </p>
                </div>

                <!-- QR Code Section -->
                <div class="text-center border-t pt-4">
                    <div class="bg-gray-50 rounded-lg p-4 mb-3">
                        <div class="w-40 h-40 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center mb-2 p-2">
                            <img src="${qrCodeDataURL}" alt="QR Code for ${business.name}" class="w-full h-full rounded" />
                        </div>
                        <p class="text-sm text-gray-600">
                          Scan this QR code at ${business.name} to ${isMembership ? 'mark sessions' : 'collect stamps'}
                        </p>
                    </div>
                    <p class="text-xs text-gray-500">Card ID: ${customerCardId.substring(0, 8)}...</p>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
            <button onclick="refreshCard()" class="${isMembership ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'} w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Refresh Card
            </button>
            <button onclick="shareCard()" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Share Card
            </button>
        </div>

        <!-- Card Statistics (if membership) -->
        ${isMembership ? `
        <div class="mt-6 bg-white rounded-lg shadow p-4">
            <h3 class="font-semibold text-gray-900 mb-3">Membership Details</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="text-center">
                    <div class="text-2xl font-bold text-indigo-600">${customerCard.sessions_used || 0}</div>
                    <div class="text-gray-600">Sessions Used</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-indigo-600">${(customerCard.total_sessions || 20) - (customerCard.sessions_used || 0)}</div>
                    <div class="text-gray-600">Remaining</div>
                </div>
            </div>
            ${customerCard.expiry_date ? `
            <div class="mt-3 pt-3 border-t text-center">
                <p class="text-xs text-gray-500">
                    Expires: ${new Date(customerCard.expiry_date).toLocaleDateString()}
                </p>
            </div>
            ` : ''}
        </div>
        ` : ''}
    </div>

    <script>
        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            console.log('New service worker available');
                            showUpdatePrompt();
                        });
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }

        // Offline/Online status handling
        window.addEventListener('online', () => {
            document.body.classList.remove('offline');
            showNotification('Back online! Syncing data...', 'success');
            refreshCard();
        });

        window.addEventListener('offline', () => {
            document.body.classList.add('offline');
            showNotification('You are offline. Data will sync when back online.', 'warning');
        });

        function refreshCard() {
            if (navigator.onLine) {
            window.location.reload();
            } else {
                showNotification('Cannot refresh while offline', 'warning');
            }
        }

        function shareCard() {
            if (navigator.share) {
                navigator.share({
                    title: '${stampCard.name} - ${business.name}',
                    text: '${isMembership ? 'Check out my membership progress!' : 'Check out my loyalty card progress!'}',
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showNotification('Card link copied to clipboard!', 'success');
                }).catch(() => {
                    showNotification('Failed to copy link', 'error');
                });
            }
        }

        // Auto-refresh every 30 seconds when online
        setInterval(() => {
            if (navigator.onLine) {
                refreshCard();
            }
        }, 30000);

        // Notification system
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            const colors = {
                success: 'bg-green-500',
                warning: 'bg-yellow-500', 
                error: 'bg-red-500',
                info: 'bg-blue-500'
            };
            
            notification.className = \`fixed top-4 left-4 right-4 \${colors[type]} text-white p-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-y-[-100px]\`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateY(0)';
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.transform = 'translateY(-100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        function showUpdatePrompt() {
            const updatePrompt = document.createElement('div');
            updatePrompt.className = 'fixed bottom-4 left-4 right-4 bg-purple-600 text-white p-3 rounded-lg shadow-lg z-50';
            updatePrompt.innerHTML = \`
                <div class="flex items-center justify-between">
                    <span class="text-sm">App update available</span>
                    <button onclick="updateApp()" class="bg-purple-500 hover:bg-purple-400 px-3 py-1 rounded text-sm font-semibold">Update</button>
                </div>
            \`;
            document.body.appendChild(updatePrompt);
        }

        function updateApp() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration) {
                        registration.update().then(() => {
                            window.location.reload();
                        });
                    }
                });
            }
        }
        
        // Add to home screen prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallPrompt();
        });

        function showInstallPrompt() {
            const installBanner = document.createElement('div');
            installBanner.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50';
            installBanner.innerHTML = \`
                <div class="flex items-center justify-between">
                    <span class="text-sm">Add to Home Screen for quick access</span>
                    <button onclick="installPWA()" class="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm font-semibold">Install</button>
                </div>
            \`;
            document.body.appendChild(installBanner);
            
            setTimeout(() => {
                if (installBanner.parentNode) {
                    installBanner.parentNode.removeChild(installBanner);
                }
            }, 8000);
        }

        function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    deferredPrompt = null;
                });
            }
        }
    </script>
</body>
</html>
    `

    return new NextResponse(walletHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Error generating PWA wallet:', error)
    return NextResponse.json(
      { error: 'Failed to generate wallet' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerCardId: string }> }
) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization')
    const testToken = process.env.NEXT_PUBLIC_TEST_TOKEN || 'test-token'
    
    if (!authHeader?.includes(testToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const supabase = await createClient()
    const customerCardId = resolvedParams.customerCardId
    const url = new URL(request.url)
    const requestedType = url.searchParams.get('type') // 'stamp' or 'membership'

    console.log('📱 POST: Generating PWA Wallet for card ID:', customerCardId, 'type:', requestedType)

    // Get customer card with stamp card details and membership info
    const { data: customerCard, error } = await supabase
      .from('customer_cards')
      .select(`
        id,
        current_stamps,
        membership_type,
        sessions_used,
        total_sessions,
        cost,
        expiry_date,
        created_at,
        stamp_cards (
          id,
          name,
          total_stamps,
          reward_description,
          businesses (
            name,
            description
          )
        )
      `)
      .eq('id', customerCardId)
      .single()

    if (error || !customerCard) {
      console.error('Customer card not found:', error)
      return NextResponse.json(
        { error: 'Customer card not found' },
        { status: 404 }
      )
    }

    // Determine card type - either from query param or database
    let cardType = requestedType
    if (!cardType) {
      // Auto-detect from database if not specified
      cardType = customerCard.membership_type === 'loyalty' ? 'stamp' : 'membership'
    }

    // Validate card type compatibility
    if (cardType === 'stamp' && customerCard.membership_type !== 'loyalty') {
      return NextResponse.json(
        { error: 'Card type mismatch: requested stamp card but database shows membership type' },
        { status: 400 }
      )
    }
    if (cardType === 'membership' && customerCard.membership_type !== 'membership') {
      return NextResponse.json(
        { error: 'Card type mismatch: requested membership card but database shows loyalty type' },
        { status: 400 }
      )
    }

    // Generate QR code for the journey
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/journey/${customerCardId}`
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    let htmlTemplate = ''

    if (cardType === 'stamp') {
      // STAMP CARD - 5x2 grid with green theme
      const totalStamps = customerCard.stamp_cards?.[0]?.total_stamps || 10
      const currentStamps = customerCard.current_stamps || 0
      const stampsGrid = []
      
      for (let i = 0; i < totalStamps; i++) {
        stampsGrid.push({
          filled: i < currentStamps,
          index: i
        })
      }

      htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Stamp Card - ${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #10b981, #059669);
            min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;
        }
        .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
        .header { text-align: center; margin-bottom: 24px; }
        .business-name { font-size: 24px; font-weight: bold; color: #10b981; margin-bottom: 8px; }
        .card-type { font-size: 16px; color: #6b7280; margin-bottom: 16px; }
        .stamps-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; }
        .stamp { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s ease; }
        .stamp.filled { background: #10b981; color: white; }
        .stamp.empty { background: #e5e7eb; color: #9ca3af; border: 2px dashed #d1d5db; }
        .progress { text-align: center; margin: 20px 0; }
        .progress-text { font-size: 18px; font-weight: 600; color: #10b981; margin-bottom: 8px; }
        .reward-text { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
        .qr-section { text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px; margin-top: 24px; }
        .qr-code { margin-bottom: 12px; }
        .qr-text { font-size: 12px; color: #6b7280; }
        .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="business-name">${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</div>
            <div class="card-type">Digital Stamp Card</div>
        </div>
        <div class="stamps-grid">
            ${stampsGrid.map(stamp => `<div class="stamp ${stamp.filled ? 'filled' : 'empty'}">${stamp.filled ? '★' : '☆'}</div>`).join('')}
        </div>
        <div class="progress">
            <div class="progress-text">${currentStamps}/${totalStamps} Stamps Collected</div>
            <div class="reward-text">${customerCard.stamp_cards?.[0]?.reward_description || 'Collect all stamps to earn your reward!'}</div>
        </div>
        <div class="qr-section">
            <div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;"></div>
            <div class="qr-text">Scan to add stamps or redeem rewards</div>
        </div>
        <div class="footer">
            <div class="footer-text">Powered by RewardJar - Happy Loyalty Management</div>
        </div>
    </div>
</body>
</html>`
    } else {
      // MEMBERSHIP CARD - Progress bar with indigo theme
      const totalSessions = customerCard.total_sessions || 20
      const usedSessions = customerCard.sessions_used || 0
      const progressPercent = Math.round((usedSessions / totalSessions) * 100)

      htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Membership Card - ${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;
        }
        .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
        .header { text-align: center; margin-bottom: 24px; }
        .business-name { font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 8px; }
        .card-type { font-size: 16px; color: #6b7280; margin-bottom: 16px; }
        .progress-section { margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; }
        .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 16px 0; }
        .progress-fill { height: 100%; background: #6366f1; transition: width 0.3s ease; }
        .sessions-text { text-align: center; font-size: 18px; font-weight: 600; color: #6366f1; margin-bottom: 8px; }
        .cost-text { text-align: center; font-size: 16px; color: #6b7280; margin-bottom: 8px; }
        .expiry-text { text-align: center; font-size: 14px; color: #ef4444; margin-bottom: 16px; }
        .qr-section { text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px; margin-top: 24px; }
        .qr-code { margin-bottom: 12px; }
        .qr-text { font-size: 12px; color: #6b7280; }
        .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="business-name">${customerCard.stamp_cards?.[0]?.businesses?.[0]?.name || 'RewardJar'}</div>
            <div class="card-type">Digital Membership Card</div>
        </div>
        <div class="progress-section">
            <div class="sessions-text">${usedSessions}/${totalSessions} Sessions Used</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            ${customerCard.cost ? `<div class="cost-text">₩${customerCard.cost.toLocaleString()}</div>` : ''}
            ${customerCard.expiry_date ? `<div class="expiry-text">Expires: ${new Date(customerCard.expiry_date).toLocaleDateString()}</div>` : ''}
        </div>
        <div class="qr-section">
            <div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;"></div>
            <div class="qr-text">Scan to mark sessions or check membership</div>
        </div>
        <div class="footer">
            <div class="footer-text">Powered by RewardJar - Happy Loyalty Management</div>
        </div>
    </div>
</body>
</html>`
    }

    return new NextResponse(htmlTemplate, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, max-age=1'
      }
    })

  } catch (error) {
    console.error('❌ Error generating PWA wallet:', error)
    return NextResponse.json(
      { error: 'Failed to generate PWA wallet' },
      { status: 500 }
    )
  }
} 