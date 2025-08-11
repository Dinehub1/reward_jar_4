'use client'

import React from 'react'
import Image from 'next/image'

export interface QRCodeDisplayProps {
  value: string
  size?: number
  walletType?: 'apple' | 'google' | 'pwa' | 'default'
  className?: string
}

export const QRCodeDisplay = React.memo<QRCodeDisplayProps>(({ 
  value, 
  size = 120, 
  walletType = 'default',
  className = ''
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')
  
  const getOptimalSize = React.useCallback(() => {
    switch (walletType) {
      case 'apple': return Math.min(size, 60)
      case 'google': return Math.min(size, 50)
      case 'pwa': return Math.max(size, 80)
      default: return size
    }
  }, [size, walletType])

  const optimalSize = getOptimalSize()
  
  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const qrcode = await import('qrcode')
        const url = await qrcode.toDataURL(value, {
          width: optimalSize * 2,
          margin: walletType === 'google' ? 0 : 1,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M'
        })
        setQrCodeUrl(url)
      } catch (error) {
      }
    }
    if (value) generateQR()
  }, [value, optimalSize, walletType])

  if (qrCodeUrl) {
    return (
      <Image
        src={qrCodeUrl}
        alt="QR Code"
        width={optimalSize}
        height={optimalSize}
        className={`transition-all duration-200 ${
          walletType === 'google' ? 'rounded-sm' : 'rounded'
        } ${className}`}
        style={{ imageRendering: 'crisp-edges' }}
      />
    )
  }

  return (
    <div 
      className={`bg-white flex items-center justify-center border-2 border-dashed border-gray-300 animate-pulse ${
        walletType === 'google' ? 'rounded-sm' : 'rounded'
      } ${className}`}
      style={{ width: optimalSize, height: optimalSize }}
    >
      <div className="w-6 h-6 text-gray-400 text-xs font-mono flex items-center justify-center">
        QR
      </div>
    </div>
  )
})

QRCodeDisplay.displayName = 'QRCodeDisplay'

export default QRCodeDisplay

