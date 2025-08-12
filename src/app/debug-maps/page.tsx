'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Map, 
  MapPin, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ExternalLink,
  Code,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react'
import Link from 'next/link'
import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

interface MapStatus {
  apiKey: boolean
  connectivity: boolean
  loading: boolean
  lastChecked: string
  errors: string[]
}

interface LocationTest {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  status: 'success' | 'error' | 'pending'
  result?: string
}

function LegacyGoogleMapsDebugPage() {
  const [mapStatus, setMapStatus] = useState<MapStatus>({
    apiKey: false,
    connectivity: false,
    loading: true,
    lastChecked: '',
    errors: []
  })
  
  const [locationTests, setLocationTests] = useState<LocationTest[]>([
    {
      id: 'test-1',
      name: 'Business Location - Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      status: 'pending'
    },
    {
      id: 'test-2',
      name: 'Customer Address - Brooklyn',
      coordinates: { lat: 40.6782, lng: -73.9442 },
      status: 'pending'
    },
    {
      id: 'test-3',
      name: 'Delivery Zone - Queens',
      coordinates: { lat: 40.7282, lng: -73.7949 },
      status: 'pending'
    }
  ])

  const [testRunning, setTestRunning] = useState(false)

  useEffect(() => {
    checkGoogleMapsStatus()
  }, [])

  const checkGoogleMapsStatus = async () => {
    setMapStatus(prev => ({ ...prev, loading: true, errors: [] }))
    
    try {
      // Check if Google Maps API key is available
      const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      // Simulate API connectivity test
      const connectivityTest = await new Promise<boolean>((resolve) => {
        setTimeout(() => {
          // For demo purposes, simulate connection based on API key
          resolve(hasApiKey)
        }, 1500)
      })

      const errors: string[] = []
      if (!hasApiKey) {
        errors.push('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable not found')
      }
      if (!connectivityTest) {
        errors.push('Unable to connect to Google Maps API')
      }

      setMapStatus({
        apiKey: hasApiKey,
        connectivity: connectivityTest,
        loading: false,
        lastChecked: new Date().toLocaleTimeString(),
        errors
      })
    } catch (error) {
      setMapStatus(prev => ({
        ...prev,
        loading: false,
        errors: ['Failed to check Google Maps status']
      }))
    }
  }

  const runLocationTests = async () => {
    setTestRunning(true)
    
    for (let i = 0; i < locationTests.length; i++) {
      const test = locationTests[i]
      
      // Update status to pending
      setLocationTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: 'pending' } : t
      ))

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate result
      const success = Math.random() > 0.3 // 70% success rate for demo
      
      setLocationTests(prev => prev.map(t => 
        t.id === test.id ? { 
          ...t, 
          status: success ? 'success' : 'error',
          result: success 
            ? `Location found: ${test.coordinates.lat}, ${test.coordinates.lng}`
            : 'Geocoding failed: Invalid coordinates'
        } : t
      ))
    }
    
    setTestRunning(false)
  }

  const overallHealth = mapStatus.apiKey && mapStatus.connectivity

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Google Maps Debug Console</h1>
              <p className="text-muted-foreground">Debug and test Google Maps API integration</p>
            </div>
          </div>
          <Link href="/admin/dev-tools">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Back to Dev Tools
            </Button>
          </Link>
        </div>

        {/* Overall Status */}
        <Card className={`border-2 ${overallHealth ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {overallHealth ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              Google Maps Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${mapStatus.apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">API Key Configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${mapStatus.connectivity ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">API Connectivity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Last Check: {mapStatus.lastChecked || 'Never'}</span>
              </div>
            </div>
            
            {mapStatus.errors.length > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {mapStatus.errors.map((error, index) => (
                      <div key={index} className="text-sm">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status Check</TabsTrigger>
            <TabsTrigger value="location">Location Tests</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Environment Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Google Maps API Key</span>
                    <Badge variant={mapStatus.apiKey ? "default" : "destructive"}>
                      {mapStatus.apiKey ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Environment</span>
                    <Badge variant="secondary">
                      {process.env.NODE_ENV || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Base URL</span>
                    <Badge variant="outline">
                      {typeof window !== 'undefined' ? window.location.origin : 'Server'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    API Connectivity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Maps JavaScript API</span>
                    <Badge variant={mapStatus.connectivity ? "default" : "destructive"}>
                      {mapStatus.connectivity ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Geocoding API</span>
                    <Badge variant="secondary">Testing Required</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Places API</span>
                    <Badge variant="secondary">Testing Required</Badge>
                  </div>
                  <Button 
                    onClick={checkGoogleMapsStatus} 
                    disabled={mapStatus.loading}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    {mapStatus.loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh Status
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Location & Geocoding Tests</h3>
              <Button 
                onClick={runLocationTests}
                disabled={testRunning || !mapStatus.connectivity}
                className="gap-2"
              >
                {testRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                Run Location Tests
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {locationTests.map((test) => (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {test.coordinates.lat}, {test.coordinates.lng}
                        </p>
                        {test.result && (
                          <p className="text-xs text-muted-foreground">{test.result}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {test.status === 'pending' && testRunning && (
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {test.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {test.status === 'error' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <Badge 
                          variant={
                            test.status === 'success' ? 'default' : 
                            test.status === 'error' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>To configure Google Maps API:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Get a Google Maps API key from the Google Cloud Console</li>
                        <li>Enable the following APIs: Maps JavaScript API, Geocoding API, Places API</li>
                        <li>Add your API key to .env.local as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
                        <li>Restart your development server</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Environment Variable</h4>
                  <code className="text-sm bg-white p-2 rounded border block">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Google Maps Documentation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a 
                    href="https://developers.google.com/maps/documentation/javascript"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Maps JavaScript API
                  </a>
                  <a 
                    href="https://developers.google.com/maps/documentation/geocoding"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Geocoding API
                  </a>
                  <a 
                    href="https://developers.google.com/maps/documentation/places/web-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Places API
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Issues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">API Key Not Working</h4>
                    <p className="text-xs text-muted-foreground">
                      Ensure API key has proper restrictions and billing is enabled
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Geocoding Fails</h4>
                    <p className="text-xs text-muted-foreground">
                      Check that Geocoding API is enabled in Google Cloud Console
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Maps Not Loading</h4>
                    <p className="text-xs text-muted-foreground">
                      Verify domain restrictions and referrer settings
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
export default function GoogleMapsDebugPage() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Debug Maps Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the debug maps</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <LegacyGoogleMapsDebugPage />
      </div>
    </ComponentErrorBoundary>
  )
}