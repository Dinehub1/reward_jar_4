import crypto from 'crypto'

export interface GoogleWalletIds {
  issuerId: string
  classId: string
  objectId: string
}

export function buildGoogleIds(
  customerCardId: string,
  issuerIdFromEnv?: string,
  isMembershipCard?: boolean
): GoogleWalletIds {
  // Handle both numeric and string issuer IDs
  let issuerId = issuerIdFromEnv || process.env.GOOGLE_WALLET_ISSUER_ID || process.env.GOOGLE_ISSUER_ID || '3388000000022940702'
  
  // If issuer ID contains dots (legacy format), extract the numeric part or use default
  if (issuerId && issuerId.includes('.')) {
    console.warn(`Google Wallet: Legacy issuer ID format detected: ${issuerId}. Please update to numeric format.`)
    issuerId = '3388000000022940702' // Use default numeric issuer ID
  }
  const fallbackSuffix = isMembershipCard ? 'rewardjar_membership_1' : 'rewardjar_stamp_1'
  const suffix = (
    isMembershipCard
      ? process.env.GOOGLE_WALLET_CLASS_SUFFIX_MEMBERSHIP
      : process.env.GOOGLE_WALLET_CLASS_SUFFIX_STAMP
  ) || process.env.GOOGLE_WALLET_CLASS_SUFFIX || fallbackSuffix

  const classId = `${issuerId}.${suffix}`
  const objectId = `${classId}.${customerCardId.replace(/-/g, '')}`
  return { issuerId, classId, objectId }
}

export interface LoyaltyObject {
  id: string
  classId: string
  state: 'ACTIVE' | 'INACTIVE'
  loyaltyPoints: {
    label: string
    balance: { string: string }
  }
  accountName: string
  accountId: string
  barcode: {
    type: 'QR_CODE'
    value: string
    alternateText?: string
  }
  textModulesData?: { header: string; body: string }[]
}

export function createLoyaltyObject(params: {
  ids: GoogleWalletIds
  current: number
  total: number
  displayName?: string
  objectDisplayId: string
  label?: string
  textModulesData?: { header: string; body: string }[]
}): LoyaltyObject {
  const { ids, current, total, displayName, objectDisplayId, label, textModulesData } = params
  
  // Validate required parameters
  if (!ids || !ids.objectId || !ids.classId) {
    throw new Error('Missing required Google Wallet IDs (objectId, classId)')
  }
  
  if (!objectDisplayId || typeof objectDisplayId !== 'string') {
    throw new Error(`Missing or invalid objectDisplayId: "${objectDisplayId}". Expected a non-empty string.`)
  }
  
  if (typeof current !== 'number' || typeof total !== 'number') {
    throw new Error(`Invalid progress values: current=${current}, total=${total}. Expected numbers.`)
  }
  
  // Ensure objectDisplayId is long enough for substring operations
  const safeObjectDisplayId = objectDisplayId.length >= 20 ? objectDisplayId : objectDisplayId.padEnd(20, '0')
  
  return {
    id: ids.objectId,
    classId: ids.classId,
    state: 'ACTIVE',
    loyaltyPoints: {
      label: label || 'Points',
      balance: { string: `${current}/${total}` },
    },
    accountName: displayName || 'Guest User',
    accountId: safeObjectDisplayId.substring(0, 20),
    barcode: {
      type: 'QR_CODE',
      value: objectDisplayId,
      alternateText: safeObjectDisplayId.substring(0, 20),
    },
    ...(textModulesData && textModulesData.length ? { textModulesData } : {}),
  }
}

export function createSaveToWalletJwt(loyaltyObject: LoyaltyObject): string {
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google Wallet credentials not configured')
  }

  privateKey = privateKey.replace(/\\n/g, '\n').replace(/^['"]|['"]$/g, '')
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format')
  }

  const payload = {
    iss: serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    payload: { loyaltyObjects: [loyaltyObject] },
  }

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signatureInput = `${headerB64}.${payloadB64}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), privateKey).toString('base64url')
  return `${signatureInput}.${signature}`
}

export function buildSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`
}

