'use client'

// Types for Google Maps JS API
 
// @ts-expect-error - type-only module for global google namespace
import type {} from '@types/google.maps'

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, AlertCircle } from 'lucide-react'
import { googleMapsLoader } from '@/lib/google-maps-loader'

interface PlaceResult {
  address: string
  latitude: number
  longitude: number
  placeId: string
  formatted_address: string
}

interface GooglePlacesInputProps {
  value?: string
  onChange: (result: PlaceResult | null) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function GooglePlacesInput({
  value,
  onChange,
  placeholder = 'Enter business address',
  error,
  disabled = false,
  className = ''
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState(value ?? '') // Initialize with prop value or empty string
  const [apiError, setApiError] = useState<string | null>(null)

  // Load Google Maps API using singleton loader
  useEffect(() => {
    
    const loadGoogleMaps = async () => {
      try {
        setApiError(null)
        
        // Check if already loaded
        if (googleMapsLoader.isLoaded()) {
          setIsLoaded(true)
          setIsLoading(false)
          return
        }

        // Load using singleton loader
        await googleMapsLoader.load()
        
        // Double check that the API is actually available
        if (window.google?.maps?.places?.Autocomplete) {
          setIsLoaded(true)
        } else {
          throw new Error('Google Maps Places API not available after loading')
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Google Maps loading error:', error)
        setApiError(error instanceof Error ? error.message : 'Failed to load Google Maps')
        setIsLoading(false)
      }
    }

    loadGoogleMaps()
  }, [])

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) return

    try {
      // Ensure Google Maps API is fully available
      if (!window.google?.maps?.places?.Autocomplete) {
        setApiError('Google Maps Places API not available')
        return
      }

      
      // Initialize autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'formatted_address', 'name', 'geometry.location']
      })

      // Handle place selection
      const handlePlaceSelect = () => {
        const place = autocompleteRef.current?.getPlace()
        
        if (!place || !place.geometry?.location) {
          return
        }


        const result: PlaceResult = {
          address: place.name || place.formatted_address || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          placeId: place.place_id || '',
          formatted_address: place.formatted_address || ''
        }

        setInputValue(result.address ?? '')
        onChange(result)
      }

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect)

      // Cleanup listener
      return () => {
        if (autocompleteRef.current && window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }
      }
    } catch (error) {
      console.error('Autocomplete initialization error:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to initialize autocomplete')
    }
  }, [isLoaded, disabled, onChange])

  // Sync external value changes - always ensure string
  useEffect(() => {
    setInputValue(value ?? '')
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value ?? ''
    setInputValue(newValue)
    
    // If user clears the input, clear the selection
    if (!newValue) {
      onChange(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent form submission on Enter key when in autocomplete dropdown
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Business Location
        </Label>
        <div className="relative">
          <Input
            placeholder="Loading Google Maps..."
            disabled
            className="bg-gray-50"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Business Location
        </Label>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Google Maps unavailable - enter address manually"
          disabled={disabled}
          className={error || apiError ? 'border-red-500' : ''}
        />
        {(error || apiError) && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error || apiError}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {apiError ? 'Google Maps failed to load. You can still enter the address manually.' : 'Google Maps API is not available. You can still enter the address manually.'}
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Business Location
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={error ? 'border-red-500' : ''}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      <p className="text-xs text-gray-500">
        Start typing to search for your business location using Google Places
      </p>
    </div>
  )
}

// Extend the Window interface to include google
declare global {
  interface Window {
    google: typeof google
  }
}