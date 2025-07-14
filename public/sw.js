// RewardJar PWA Service Worker
// Version: 1.0.0
// Generated: January 2025

const CACHE_NAME = 'rewardjar-wallet-v1'
const OFFLINE_CACHE = 'rewardjar-offline-v1'

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdn.tailwindcss.com', // External CSS
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
]

// API routes that should work offline
const OFFLINE_FALLBACK_ROUTES = [
  '/api/wallet/pwa/',
  '/api/health'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  )
})

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/wallet/pwa/')) {
    // PWA wallet routes - cache first, then network
    event.respondWith(handleWalletRoute(request))
  } else if (url.pathname.startsWith('/api/')) {
    // Other API routes - network first, cache fallback
    event.respondWith(handleApiRoute(request))
  } else if (isStaticAsset(url)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request))
  } else {
    // Everything else - network first
    event.respondWith(handleNetworkFirst(request))
  }
})

// Background sync for offline stamp collection
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'stamp-sync') {
    event.waitUntil(syncStampData())
  } else if (event.tag === 'wallet-update') {
    event.waitUntil(syncWalletUpdates())
  }
})

// Push notifications for wallet updates
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  const options = {
    body: 'Your loyalty card has been updated!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Card',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('RewardJar', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'view') {
    // Open the wallet
    event.waitUntil(
      clients.openWindow('/customer/dashboard')
    )
  }
})

// Helper functions

async function handleWalletRoute(request) {
  const cacheKey = getCacheKey(request)
  
  try {
    // Try cache first for fast loading
    const cachedResponse = await caches.match(cacheKey)
    if (cachedResponse) {
      // Update in background
      fetch(request).then(response => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(cacheKey, responseClone)
          })
        }
      }).catch(() => {
        // Network error, cache is still valid
      })
      
      return cachedResponse
    }
    
    // Cache miss, try network
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(CACHE_NAME)
      cache.put(cacheKey, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    console.error('Wallet route failed:', error)
    
    // Return offline fallback
    return new Response(generateOfflineWalletHTML(), {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function handleApiRoute(request) {
  try {
    // Network first for API routes
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone()
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, responseClone)
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This feature requires an internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleStaticAsset(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, responseClone)
    }
    return networkResponse
  } catch (error) {
    console.error('Static asset failed:', error)
    return new Response('Asset not available offline', { status: 404 })
  }
}

async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    return new Response('Not available offline', { status: 404 })
  }
}

function isStaticAsset(url) {
  return url.pathname.startsWith('/icons/') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.hostname === 'cdn.tailwindcss.com' ||
         url.hostname === 'fonts.googleapis.com'
}

function getCacheKey(request) {
  // Create consistent cache keys for dynamic routes
  const url = new URL(request.url)
  return `${url.pathname}${url.search}`
}

async function syncStampData() {
  try {
    console.log('Syncing stamp data...')
    
    // Get stored stamps from IndexedDB or localStorage
    const pendingStamps = await getPendingStamps()
    
    for (const stamp of pendingStamps) {
      try {
        const response = await fetch('/api/stamp/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stamp)
        })
        
        if (response.ok) {
          // Remove from pending stamps
          await removePendingStamp(stamp.id)
          console.log('Stamp synced:', stamp.id)
        }
      } catch (error) {
        console.error('Failed to sync stamp:', stamp.id, error)
      }
    }
  } catch (error) {
    console.error('Stamp sync failed:', error)
  }
}

async function syncWalletUpdates() {
  try {
    console.log('Syncing wallet updates...')
    
    // Refresh all cached wallet data
    const cache = await caches.open(CACHE_NAME)
    const requests = await cache.keys()
    
    for (const request of requests) {
      if (request.url.includes('/api/wallet/pwa/')) {
        try {
          const response = await fetch(request)
          if (response.ok) {
            await cache.put(request, response.clone())
          }
        } catch (error) {
          console.error('Failed to update cached wallet:', error)
        }
      }
    }
  } catch (error) {
    console.error('Wallet update sync failed:', error)
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingStamps() {
  // TODO: Implement IndexedDB storage
  return []
}

async function removePendingStamp(stampId) {
  // TODO: Implement IndexedDB removal
  console.log('Remove pending stamp:', stampId)
}

function generateOfflineWalletHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - RewardJar</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta name="theme-color" content="#10b981">
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">You're Offline</h1>
        <p class="text-gray-600 mb-6">Your loyalty card data will sync when you're back online.</p>
        <button onclick="window.location.reload()" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg">
            Try Again
        </button>
    </div>
</body>
</html>
  `
}

console.log('RewardJar PWA Service Worker loaded') 