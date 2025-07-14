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

    // Generate PWA wallet HTML
    const walletHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${stampCard.name} - RewardJar</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#10b981">
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
            background: linear-gradient(90deg, #10b981 0%, #10b981 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-md">
        <!-- Header -->
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">RewardJar</h1>
            <p class="text-gray-600">Digital Loyalty Card</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-xl shadow-2xl overflow-hidden mb-6">
            <!-- Card Header -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h2 class="text-xl font-bold">${stampCard.name}</h2>
                        <p class="text-green-100">${business.name}</p>
                    </div>
                    <div class="text-right">
                        ${isCompleted ? 
                          '<svg class="w-10 h-10 text-yellow-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' :
                          '<svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 4l-3 3-3-3 3-3 3 3z"></path></svg>'
                        }
                    </div>
                </div>
                
                <!-- Progress -->
                <div class="space-y-2">
                    <div class="flex justify-between text-sm text-green-100">
                        <span>Progress</span>
                        <span>${customerCard.current_stamps} / ${stampCard.total_stamps} stamps</span>
                    </div>
                    <div class="w-full bg-green-600/30 rounded-full h-3">
                        <div class="bg-white rounded-full h-3 transition-all duration-500 progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between items-center pt-2">
                        ${isCompleted ? 
                          '<div class="flex items-center text-yellow-300"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg><span class="font-semibold">Reward Unlocked!</span></div>' :
                          `<div class="flex items-center text-green-100"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg><span>${stampsRemaining} more stamps needed</span></div>`
                        }
                        <span class="text-2xl font-bold text-white">${Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <!-- Card Body -->
            <div class="p-6 space-y-4">
                <!-- Reward Info -->
                <div>
                    <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                        </svg>
                        Your Reward
                    </h3>
                    <p class="text-gray-700 mb-3">${stampCard.reward_description}</p>
                    ${isCompleted ? 
                      '<div class="bg-green-50 border border-green-200 rounded-lg p-3"><div class="flex items-center text-green-800"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg><span class="font-semibold">Ready to claim!</span></div><p class="text-green-700 text-sm mt-1">Show this card to redeem your reward.</p></div>' :
                      `<div class="bg-gray-50 border border-gray-200 rounded-lg p-3"><p class="text-gray-600 text-sm">Collect ${stampsRemaining} more stamps to unlock this reward.</p></div>`
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
                    <p class="text-xs text-gray-500">Card ID: ${customerCardId.substring(0, 8)}...</p>
                </div>
            </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
            <button onclick="refreshCard()" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Refresh Card
            </button>
            <button onclick="shareCard()" class="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Share Card
            </button>
        </div>
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
                    text: 'Check out my loyalty card progress!',
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