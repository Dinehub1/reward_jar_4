'use client'

import { useState, useEffect } from 'react'
import { GooglePlacesInput } from '@/components/ui/google-places-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { googleMapsLoader } from '@/lib/google-maps-loader'

export default function DebugMapsPage() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [inputValue, setInputValue] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    scriptsCount: 0,
    loaderState: 'unknown',
    googleMapsAvailable: false,
    placesAvailable: false,
    autocompleteAvailable: false
  })

  // Ensure component only renders on client to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  const updateDebugInfo = () => {
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    setDebugInfo({
      scriptsCount: scripts.length,
      loaderState: googleMapsLoader.isLoaded() ? 'loaded' : googleMapsLoader.isLoading() ? 'loading' : 'idle',
      googleMapsAvailable: !!(window as any).google?.maps,
      placesAvailable: !!(window as any).google?.maps?.places,
      autocompleteAvailable: !!(window as any).google?.maps?.places?.Autocomplete
    })
  }

  useEffect(() => {
    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLocationSelect = (locationData: any) => {
    console.log('🎯 Location selected:', locationData)
    setSelectedLocation(locationData)
    if (locationData) {
      setInputValue(locationData.address || locationData.formatted_address || '')
    }
  }

  const resetLoader = () => {
    googleMapsLoader.reset()
    setSelectedLocation(null)
    setInputValue('')
    setTimeout(updateDebugInfo, 100)
  }

  const forceReload = () => {
    window.location.reload()
  }

  // Show loading state during SSR/hydration
  if (!isClient) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">🗺️ Google Maps Debug Console</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🗺️ Google Maps Debug Console</h1>
          <p className="text-gray-600">Test and debug Google Maps API integration</p>
        </div>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{debugInfo.scriptsCount}</div>
                <p className="text-xs text-gray-500">Scripts Loaded</p>
                <Badge variant={debugInfo.scriptsCount === 1 ? 'default' : debugInfo.scriptsCount === 0 ? 'secondary' : 'destructive'}>
                  {debugInfo.scriptsCount === 1 ? 'Perfect' : debugInfo.scriptsCount === 0 ? 'None' : 'Multiple!'}
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">{debugInfo.loaderState}</div>
                <p className="text-xs text-gray-500">Loader State</p>
                <Badge variant={debugInfo.loaderState === 'loaded' ? 'default' : debugInfo.loaderState === 'loading' ? 'outline' : 'secondary'}>
                  {debugInfo.loaderState}
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">{debugInfo.googleMapsAvailable ? '✅' : '❌'}</div>
                <p className="text-xs text-gray-500">Google Maps</p>
                <Badge variant={debugInfo.googleMapsAvailable ? 'default' : 'destructive'}>
                  {debugInfo.googleMapsAvailable ? 'Available' : 'Missing'}
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">{debugInfo.placesAvailable ? '✅' : '❌'}</div>
                <p className="text-xs text-gray-500">Places API</p>
                <Badge variant={debugInfo.placesAvailable ? 'default' : 'destructive'}>
                  {debugInfo.placesAvailable ? 'Available' : 'Missing'}
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">{debugInfo.autocompleteAvailable ? '✅' : '❌'}</div>
                <p className="text-xs text-gray-500">Autocomplete</p>
                <Badge variant={debugInfo.autocompleteAvailable ? 'default' : 'destructive'}>
                  {debugInfo.autocompleteAvailable ? 'Ready' : 'Not Ready'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          <Button onClick={updateDebugInfo} variant="outline">
            🔄 Refresh Debug Info
          </Button>
          <Button onClick={resetLoader} variant="outline">
            🔥 Reset Loader
          </Button>
          <Button onClick={forceReload} variant="destructive">
            ⚡ Force Page Reload
          </Button>
        </div>

        {/* Google Places Input Test */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Google Places Input Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GooglePlacesInput
              value={inputValue}
              onChange={handleLocationSelect}
              placeholder="Search for a location..."
            />

            {selectedLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Location Selected:</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Address:</strong> {selectedLocation.address}</div>
                  <div><strong>Formatted:</strong> {selectedLocation.formatted_address}</div>
                  <div><strong>Latitude:</strong> {selectedLocation.latitude}</div>
                  <div><strong>Longitude:</strong> {selectedLocation.longitude}</div>
                  <div><strong>Place ID:</strong> {selectedLocation.placeId}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Console Logs */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600">✅ Success:</span>
                <span>Scripts Loaded = 1, All APIs Available, No console errors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-red-600">❌ Multiple Scripts:</span>
                <span>
                  If Scripts Loaded &gt; 1, this indicates the &quot;multiple times&quot; error
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">🔍 Debug:</span>
                <span>Open browser console to see detailed loading logs with emojis</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-orange-600">🔄 Reset:</span>
                <span>Use &quot;Reset Loader&quot; to clean up and try again without page reload</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>⚙️ Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div><strong>API Key Present:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Yes' : '❌ No'}</div>
              <div><strong>API Key Prefix:</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'N/A'}...</div>
              <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'N/A'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}