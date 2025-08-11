'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QrCode, Camera, X, Check, AlertCircle } from 'lucide-react'
import { BillAmountModal, BillAmountData } from './BillAmountModal'

interface QRScannerProps {
  businessId: string
  onScanSuccess?: (result: any) => void
  className?: string
}

interface ScanResult {
  customerCardId: string
  cardType: 'stamp' | 'membership'
  cardName: string
  customerName?: string
  membershipCard?: {
    name: string
    membership_mode: string
    discount_type?: string
    discount_value?: number
    min_spend_cents?: number
  }
}

export function QRScanner({ businessId, onScanSuccess, className }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Bill amount modal state for discount redemptions
  const [showBillModal, setShowBillModal] = useState(false)
  const [billModalData, setBillModalData] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Start camera for QR scanning
  const startCamera = async () => {
    try {
      setIsScanning(true)
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Camera access denied or not available')
      setIsScanning(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Process scanned QR code data
  const processScan = async (data: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Extract customer card ID from QR code URL
      const urlMatch = data.match(/\/join\/([a-f0-9\-]+)/i)
      if (!urlMatch) {
        throw new Error('Invalid QR code format')
      }

      const customerCardId = urlMatch[1]

      // Get card details to determine action type
      const response = await fetch(`/api/business/cards/scan/${customerCardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process scan')
      }

      const scanResult: ScanResult = await response.json()
      setLastScanResult(scanResult)

      // If it's a discount membership, show bill amount modal
      if (scanResult.cardType === 'membership' && 
          scanResult.membershipCard?.membership_mode === 'discount') {
        setBillModalData({
          customerCard: {
            id: customerCardId,
            customer_name: scanResult.customerName
          },
          membershipCard: scanResult.membershipCard
        })
        setShowBillModal(true)
        setIsOpen(false) // Close scanner
        stopCamera()
      } else {
        // For stamp cards or session memberships, process directly
        await processStampOrSession(customerCardId, scanResult.cardType)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Process stamp increment or session mark
  const processStampOrSession = async (customerCardId: string, cardType: 'stamp' | 'membership') => {
    try {
      const response = await fetch(`/api/wallet/mark-session/${customerCardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          usageType: 'auto', // Let API auto-detect
          notes: `${cardType === 'stamp' ? 'Stamp' : 'Session'} added via QR scan`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process action')
      }

      const result = await response.json()
      onScanSuccess?.(result)
      setIsOpen(false)
      stopCamera()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action processing failed')
    }
  }

  // Handle bill amount confirmation for discounts
  const handleBillAmountConfirm = async (billData: BillAmountData) => {
    if (!billModalData) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/wallet/discount/redeem/${billModalData.customerCard.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          billAmountCents: billData.billAmountCents,
          notes: billData.notes,
          deviceId: billData.deviceId,
          terminalId: billData.terminalId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to apply discount')
      }

      const result = await response.json()
      onScanSuccess?.(result)
      setShowBillModal(false)
      setBillModalData(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discount processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Manual QR input processing
  const handleManualInput = () => {
    if (scanInput.trim()) {
      processScan(scanInput.trim())
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className={`flex items-center gap-2 ${className}`}
      >
        <QrCode className="h-4 w-4" />
        Scan QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          stopCamera()
          setScanInput('')
          setError(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Scanner</DialogTitle>
            <DialogDescription>
              Scan a customer's loyalty card QR code to add stamps or process actions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {!isScanning ? (
              <div className="space-y-4">
                <Button onClick={startCamera} className="w-full flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Start Camera
                </Button>

                <div className="flex items-center gap-2">
                  <hr className="flex-1" />
                  <span className="text-sm text-gray-500">or</span>
                  <hr className="flex-1" />
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Paste QR code URL here"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <Button 
                    onClick={handleManualInput} 
                    disabled={!scanInput.trim() || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Process URL'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-black rounded-lg"
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={stopCamera}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 text-center">
                  Position the QR code within the frame
                </p>
                
                {/* Note: Real QR scanning would require a library like @zxing/library */}
                <div className="text-center">
                  <Button 
                    onClick={() => {
                      // Simulate scan for demo - in real implementation, this would be automatic
                      const testUrl = scanInput || 'https://example.com/join/test-card-id'
                      processScan(testUrl)
                    }}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? 'Processing...' : 'Simulate Scan'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Amount Modal for Discount Redemptions */}
      {billModalData && (
        <BillAmountModal
          isOpen={showBillModal}
          onClose={() => {
            setShowBillModal(false)
            setBillModalData(null)
          }}
          onConfirm={handleBillAmountConfirm}
          customerCard={billModalData.customerCard}
          membershipCard={billModalData.membershipCard}
          isLoading={isProcessing}
        />
      )}
    </>
  )
}