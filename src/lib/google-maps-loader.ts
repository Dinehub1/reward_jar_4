/**
 * Google Maps API Loader - Singleton Pattern
 * Prevents multiple loading of Google Maps JavaScript API
 */

interface LoaderState {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  callbacks: Array<(loaded: boolean, error?: string) => void>
}

// Global flag to prevent multiple script loads
let mapsLoaderPromise: Promise<boolean> | null = null

class GoogleMapsLoader {
  private state: LoaderState = {
    isLoaded: false,
    isLoading: false,
    error: null,
    callbacks: []
  }

  private scriptId = 'google-maps-api-script'
  private loadingTimeout: NodeJS.Timeout | null = null

  /**
   * Load Google Maps API if not already loaded
   */
  async load(): Promise<boolean> {
    // Use global promise to prevent multiple loads
    if (!mapsLoaderPromise) {
      mapsLoaderPromise = new Promise((resolve, reject) => {
        // If already loaded, resolve immediately
        if (this.state.isLoaded && window.google?.maps?.places) {
          resolve(true)
          return
        }

        // If there's an error, reject immediately
        if (this.state.error) {
          reject(new Error(this.state.error))
          return
        }

        // Add callback to queue
        this.state.callbacks.push((loaded, error) => {
          if (loaded) {
            resolve(true)
          } else {
            reject(new Error(error || 'Failed to load Google Maps API'))
          }
        })

        // If already loading, just wait for callbacks
        if (this.state.isLoading) {
          return
        }

        // Start loading
        this.startLoading()
      })
    }
    
    return mapsLoaderPromise
  }

  private startLoading() {
    // Prevent multiple loading attempts
    if (this.state.isLoading) {
      console.log('🔄 Google Maps already loading, skipping duplicate request')
      return
    }

    this.state.isLoading = true

    try {
      // Check for existing Google Maps API
      if (window.google?.maps?.places?.Autocomplete) {
        console.log('✅ Google Maps API already loaded globally')
        this.handleSuccess()
        return
      }

      // Force cleanup of any existing scripts first
      this.forceCleanup()

      // Clean up existing global callbacks
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps
      }
      if (window.gm_authFailure) {
        delete window.gm_authFailure
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        this.handleError('Google Maps API key not found in environment variables')
        return
      }

      // Validate API key format
      if (!apiKey.startsWith('AIzaSy')) {
        this.handleError('Invalid Google Maps API key format. Key should start with "AIzaSy"')
        return
      }

      console.log('🔄 Loading Google Maps API with key:', apiKey.substring(0, 10) + '...')

      // Create unique callback name to avoid conflicts
      const callbackName = `initGoogleMaps_${Date.now()}`
      
      // Global callback for Google Maps initialization
      window[callbackName] = () => {
        console.log('📞 Google Maps callback triggered')
        
        // Clean up the callback
        delete window[callbackName]
        
        // Add a small delay to ensure all APIs are fully loaded
        setTimeout(() => {
          if (window.google?.maps?.places?.Autocomplete) {
            console.log('✅ Google Maps Places API fully loaded')
            this.handleSuccess()
          } else {
            console.error('❌ Google Maps Places API not available after loading')
            this.handleError('Google Maps Places API not fully loaded')
          }
        }, 200)
      }

      // Create script element with unique callback
      const script = document.createElement('script')
      script.id = this.scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`
      script.async = true
      script.defer = true

      script.onload = () => {
        console.log('📜 Google Maps script loaded successfully')
      }

      script.onerror = (event) => {
        console.error('❌ Google Maps script error:', event)
        this.handleError('Failed to load Google Maps JavaScript API. Check your internet connection.')
        // Clean up callback on error
        if (window[callbackName]) {
          delete window[callbackName]
        }
      }

      // Handle API key errors
      window.gm_authFailure = () => {
        console.error('❌ Google Maps authentication failure')
        this.handleError('Google Maps API authentication failed. Please check your API key, enable billing, and ensure the Places API is enabled in Google Cloud Console.')
      }

      // Add timeout for loading
      const timeout = setTimeout(() => {
        if (this.state.isLoading) {
          console.error('⏰ Google Maps loading timeout')
          this.handleError('Google Maps API loading timeout. Please check your API key and internet connection.')
          // Clean up callback on timeout
          if (window[callbackName]) {
            delete window[callbackName]
          }
        }
      }, 15000) // 15 second timeout

      // Store timeout reference for cleanup
      this.loadingTimeout = timeout

      console.log('📝 Appending Google Maps script to document head')
      document.head.appendChild(script)

    } catch (error) {
      console.error('❌ Error in startLoading:', error)
      this.handleError(`Error loading Google Maps: ${error}`)
    }
  }

  private handleSuccess() {
    console.log('🎉 Google Maps successfully loaded')
    
    // Clear timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
      this.loadingTimeout = null
    }

    this.state.isLoaded = true
    this.state.isLoading = false
    this.state.error = null

    // Execute all callbacks
    this.state.callbacks.forEach(callback => {
      try {
        callback(true)
      } catch (error) {
        console.error('Error in Google Maps load callback:', error)
      }
    })

    // Clear callbacks
    this.state.callbacks = []
  }

  private handleError(error: string) {
    console.error('💥 Google Maps loading failed:', error)
    
    // Clear timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
      this.loadingTimeout = null
    }

    this.state.isLoaded = false
    this.state.isLoading = false
    this.state.error = error

    // Execute all callbacks with error
    this.state.callbacks.forEach(callback => {
      try {
        callback(false, error)
      } catch (callbackError) {
        console.error('Error in Google Maps error callback:', callbackError)
      }
    })

    // Clear callbacks
    this.state.callbacks = []
  }

  /**
   * Check if Google Maps is currently loaded
   */
  isLoaded(): boolean {
    return this.state.isLoaded && !!window.google?.maps?.places
  }

  /**
   * Check if Google Maps is currently loading
   */
  isLoading(): boolean {
    return this.state.isLoading
  }

  /**
   * Get current error if any
   */
  getError(): string | null {
    return this.state.error
  }

  /**
   * Force cleanup of all Google Maps related scripts and globals
   */
  private forceCleanup() {
    console.log('🧹 Force cleaning up Google Maps resources')

    // Remove all existing Google Maps scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    if (existingScripts.length > 0) {
      console.log(`🗑️ Removing ${existingScripts.length} existing Google Maps script(s)`)
      existingScripts.forEach(script => {
        console.log('🗑️ Removing script:', script.src)
        script.remove()
      })
    }

    // Remove script by ID if it exists
    const scriptById = document.getElementById(this.scriptId)
    if (scriptById) {
      console.log('🗑️ Removing script by ID:', this.scriptId)
      scriptById.remove()
    }

    // Clean up global callbacks
    if (window.gm_authFailure) {
      delete window.gm_authFailure
    }

    // Clean up any remaining callback functions
    Object.keys(window).forEach(key => {
      if (key.startsWith('initGoogleMaps')) {
        console.log('🗑️ Cleaning up callback:', key)
        delete window[key]
      }
    })

    // Clear global google object if it exists (force reload)
    if (window.google) {
      console.log('🗑️ Clearing global google object')
      delete window.google
    }
  }

  /**
   * Reset the loader state (for testing/debugging)
   */
  reset() {
    console.log('🔄 Resetting Google Maps loader')
    
    // Clear global promise
    mapsLoaderPromise = null
    
    // Clear timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
      this.loadingTimeout = null
    }

    this.state = {
      isLoaded: false,
      isLoading: false,
      error: null,
      callbacks: []
    }

    // Force cleanup
    this.forceCleanup()
  }
}

// Export singleton instance
export const googleMapsLoader = new GoogleMapsLoader()

// Extend window interface
declare global {
  interface Window {
    google: typeof google
    gm_authFailure?: () => void
    initGoogleMaps?: () => void
  }
}