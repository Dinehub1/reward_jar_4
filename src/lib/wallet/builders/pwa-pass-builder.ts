export interface PwaStampParams {
  type: 'stamp'
  businessName: string
  cardName: string
  cardColor: string
  iconEmoji: string
  currentStamps: number
  totalStamps: number
  rewardDescription?: string
  qrCodeDataUrl: string
}

export interface PwaMembershipParams {
  type: 'membership'
  businessName: string
  cardName: string
  cardColor: string
  sessionsUsed: number
  totalSessions: number
  cost?: number
  expiryDate?: string | null
  qrCodeDataUrl: string
}

export type PwaParams = PwaStampParams | PwaMembershipParams

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    '#' +
    (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  )
}

import { formatCurrency, formatDate } from '@/lib/format'
import { PwaCopy } from '@/lib/wallet/walletCopy'

export function buildPwaHtml(params: PwaParams): string {
  const primaryColor = params.cardColor || '#8B4513'
  const secondaryColor = adjustColorBrightness(primaryColor, -20)
  const isMembership = params.type === 'membership'

  if (params.type === 'stamp') {
    const { businessName, cardName, iconEmoji, currentStamps, totalStamps, rewardDescription, qrCodeDataUrl } = params
    const stampsGrid = Array.from({ length: totalStamps }, (_, i) => ({ filled: i < currentStamps }))
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PwaCopy.stamp.pageTitle} - ${businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;
    }
    .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
    .header { text-align: center; margin-bottom: 24px; }
    .business-name { font-size: 24px; font-weight: bold; color: ${primaryColor}; margin-bottom: 8px; }
    .card-type { font-size: 16px; color: #6b7280; margin-bottom: 16px; }
    .stamps-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; }
    .stamp { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s ease; }
    .stamp.filled { background: ${primaryColor}; color: white; }
    .stamp.empty { background: #e5e7eb; color: #9ca3af; border: 2px dashed #d1d5db; }
    .progress { text-align: center; margin: 20px 0; }
    .progress-text { font-size: 18px; font-weight: 600; color: ${primaryColor}; margin-bottom: 8px; }
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
      <div class="business-name">${businessName}</div>
      <div class="card-type">${PwaCopy.stamp.pageTitle}</div>
    </div>
    <div class="stamps-grid">
      ${stampsGrid
        .map((s) => `<div class="stamp ${s.filled ? 'filled' : 'empty'}">${s.filled ? '★' : '☆'}</div>`)
        .join('')}
    </div>
    <div class="progress">
      <div class="progress-text">${currentStamps}/${totalStamps} ${PwaCopy.stamp.progressSuffix}</div>
      <div class="reward-text">${rewardDescription || PwaCopy.stamp.rewardFallback}</div>
    </div>
    <div class="qr-section">
      <div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;"></div>
      <div class="qr-text">${PwaCopy.stamp.qrText}</div>
    </div>
    <div class="footer">
      <div class="footer-text">${PwaCopy.stamp.footer}</div>
    </div>
  </div>
</body>
</html>`
  }

  const { businessName, cardName, sessionsUsed, totalSessions, cost, expiryDate, qrCodeDataUrl } = params
  const progressPercent = Math.round((sessionsUsed / totalSessions) * 100)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PwaCopy.membership.pageTitle} - ${businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      min-height: 100vh; padding: 20px; display: flex; align-items: center; justify-content: center;
    }
    .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
    .header { text-align: center; margin-bottom: 24px; }
    .business-name { font-size: 24px; font-weight: bold; color: ${primaryColor}; margin-bottom: 8px; }
    .card-type { font-size: 16px; color: #6b7280; margin-bottom: 16px; }
    .progress-section { margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; }
    .progress-bar { width: 100%; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 16px 0; }
    .progress-fill { height: 100%; background: ${primaryColor}; transition: width 0.3s ease; }
    .sessions-text { text-align: center; font-size: 18px; font-weight: 600; color: ${primaryColor}; margin-bottom: 8px; }
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
      <div class="business-name">${businessName}</div>
      <div class="card-type">${PwaCopy.membership.pageTitle}</div>
    </div>
    <div class="progress-section">
      <div class="sessions-text">${sessionsUsed}/${totalSessions} ${PwaCopy.membership.sessionsUsed}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      ${typeof cost === 'number' ? `<div class="cost-text">${formatCurrency(cost, 'KRW')}</div>` : ''}
      ${expiryDate ? `<div class="expiry-text">${PwaCopy.membership.expiresOn}: ${formatDate(expiryDate)}</div>` : ''}
    </div>
    <div class="qr-section">
      <div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;"></div>
      <div class="qr-text">${PwaCopy.membership.qrText}</div>
    </div>
    <div class="footer">
      <div class="footer-text">${PwaCopy.membership.footer}</div>
    </div>
  </div>
</body>
</html>`
}

