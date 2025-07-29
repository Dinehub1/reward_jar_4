import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createAdminClient } from '@/lib/supabase/admin-client'

// Winston logger for error tracking
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'wallet-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'wallet-combined.log' })
  ]
})

interface PrivateKeyValidation {
  present: boolean
  format: {
    hasBeginMarker: boolean
    hasEndMarker: boolean
    hasNewlines: boolean
    length: number
    isValidPEM: boolean
  }
  runtime: {
    canLoad: boolean
    canSign: boolean
    signatureValid: boolean
  }
  errors: string[]
  warnings: string[]
}

interface EnvironmentDebugResult {
  status: string
  timestamp: string
  googleWallet: {
    privateKey: PrivateKeyValidation
    serviceAccountEmail: {
      present: boolean
      format: string
      isValidEmail: boolean
    }
    classId: {
      present: boolean
      format: string
      isValidFormat: boolean
    }
  }
  testJWT: {
    generated: true
    payload: Record<string, unknown>
  } | {
    generated: false
    error: string
  }
  recommendations: string[]
}

function validateEmailFormat(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateGoogleClassId(classId: string): boolean {
  if (!classId || typeof classId !== 'string') return false
  // Format: issuer.category.identifier (e.g., issuer.loyalty.rewardjar)
  const classIdRegex = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
  return classIdRegex.test(classId)
}

function validatePrivateKeyFormat(privateKey: string): PrivateKeyValidation {
  const validation: PrivateKeyValidation = {
    present: Boolean(privateKey),
    format: {
      hasBeginMarker: false,
      hasEndMarker: false,
      hasNewlines: false,
      length: 0,
      isValidPEM: false
    },
    runtime: {
      canLoad: false,
      canSign: false,
      signatureValid: false
    },
    errors: [],
    warnings: []
  }

  if (!privateKey) {
    validation.errors.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable is missing')
    return validation
  }

  validation.format.length = privateKey.length
  validation.format.hasBeginMarker = privateKey.includes('-----BEGIN PRIVATE KEY-----')
  validation.format.hasEndMarker = privateKey.includes('-----END PRIVATE KEY-----')
  validation.format.hasNewlines = privateKey.includes('\n')

  // Basic PEM format validation
  validation.format.isValidPEM = validation.format.hasBeginMarker && 
                                 validation.format.hasEndMarker && 
                                 validation.format.hasNewlines

  if (!validation.format.hasBeginMarker) {
    validation.errors.push('Private key missing BEGIN PRIVATE KEY marker')
  }
  if (!validation.format.hasEndMarker) {
    validation.errors.push('Private key missing END PRIVATE KEY marker')
  }
  if (!validation.format.hasNewlines) {
    validation.errors.push('Private key missing newline characters (may need unescaping)')
  }
  if (validation.format.length < 100) {
    validation.errors.push('Private key appears too short to be valid')
  }

  // Runtime validation - attempt to use the key
  if (validation.format.isValidPEM) {
    try {
      // Process the private key to handle escaped newlines
      let processedKey = privateKey
      
      // Handle different newline formats
      if (processedKey.includes('\\\\n')) {
        processedKey = processedKey.replace(/\\\\n/g, '\n')
      } else if (processedKey.includes('\\n')) {
        processedKey = processedKey.replace(/\\n/g, '\n')
      }
      
      // Remove any surrounding quotes
      processedKey = processedKey.replace(/^["']|["']$/g, '')
      
      // Test JWT signing capability
      const testPayload = {
        iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'test@example.com',
        aud: 'google',
        typ: 'savetowallet',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        payload: {
          loyaltyObjects: [{
            id: 'test.object.1',
            classId: process.env.GOOGLE_CLASS_ID || 'test.class.1'
          }]
        }
      }

      const token = jwt.sign(testPayload, processedKey, { algorithm: 'RS256' })
      validation.runtime.canLoad = true
      validation.runtime.canSign = true
      
      // Verify the token (basic validation)
      try {
        jwt.verify(token, processedKey, { algorithms: ['RS256'] })
        validation.runtime.signatureValid = true
      } catch (verifyError) {
        validation.warnings.push(`JWT verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`)
      }
      
    } catch (error) {
      validation.runtime.canLoad = false
      validation.runtime.canSign = false
      validation.errors.push(`Runtime validation failed: ${error instanceof Error ? error.message : String(error)}`)
      
      // Log the error for debugging
      logger.error('Google Wallet private key runtime validation failed', {
        error: error instanceof Error ? error.message : String(error),
        keyLength: privateKey.length,
        hasBeginMarker: validation.format.hasBeginMarker,
        hasEndMarker: validation.format.hasEndMarker,
        hasNewlines: validation.format.hasNewlines
      })
    }
  }

  return validation
}

export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const supabase = createAdminClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    // For development, we'll allow a simple token check
    // In production, you'd want proper JWT validation
    const token = authHeader.replace('Bearer ', '')
    if (token !== process.env.ADMIN_DEBUG_TOKEN && token !== 'admin-debug-token') {
      return NextResponse.json(
        { error: 'Invalid admin token' },
        { status: 403 }
      )
    }

    console.log('🔍 Starting Google Wallet environment debug...')
    
    const timestamp = new Date().toISOString()
    
    // Validate Google Wallet Private Key
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    const privateKeyValidation = validatePrivateKeyFormat(privateKey || '')
    
    // Validate Service Account Email
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
    const emailValid = validateEmailFormat(serviceAccountEmail)
    
    // Validate Class ID
    const classId = process.env.GOOGLE_CLASS_ID || ''
    const classIdValid = validateGoogleClassId(classId)
    
    // Generate test JWT if possible
    let testJWT: { generated: true; payload: Record<string, unknown> } | { generated: false; error: string } = { 
    generated: false as const, 
    error: 'Private key validation failed' 
  }
    if (privateKeyValidation.runtime.canSign) {
      try {
        const testPayload = {
          iss: serviceAccountEmail,
          aud: 'google',
          typ: 'savetowallet',
          iat: Math.floor(Date.now() / 1000),
          payload: {
            loyaltyObjects: [{
              id: `${classId}.test.${Date.now()}`,
              classId: classId
            }]
          }
        }
        
        let processedKey = privateKey!
        if (processedKey.includes('\\\\n')) {
          processedKey = processedKey.replace(/\\\\n/g, '\n')
        } else if (processedKey.includes('\\n')) {
          processedKey = processedKey.replace(/\\n/g, '\n')
        }
        processedKey = processedKey.replace(/^["']|["']$/g, '')
        
        jwt.sign(testPayload, processedKey, { algorithm: 'RS256' }) // Test JWT generation
        testJWT = { 
          generated: true as const, 
          payload: testPayload as Record<string, unknown>
        }
        
        console.log('✅ Test JWT generated successfully')
        
      } catch (error) {
        testJWT = { 
          generated: false as const, 
          error: error instanceof Error ? error.message : String(error) 
        }
        logger.error('Test JWT generation failed', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      }
    } else {
      testJWT = { 
        generated: false as const, 
        error: 'Google Wallet private key not configured' 
      }
    }
    
    // Generate recommendations
    const recommendations: string[] = []
    
    if (privateKeyValidation.errors.length > 0) {
      recommendations.push('Fix private key format issues before deploying to production')
    }
    if (!emailValid) {
      recommendations.push('Verify GOOGLE_SERVICE_ACCOUNT_EMAIL is a valid email format')
    }
    if (!classIdValid) {
      recommendations.push('Ensure GOOGLE_CLASS_ID follows the format: issuer.category.identifier')
    }
    if (privateKeyValidation.runtime.canSign && !privateKeyValidation.runtime.signatureValid) {
      recommendations.push('Private key can sign but verification fails - check key integrity')
    }
    if (privateKeyValidation.warnings.length > 0) {
      recommendations.push('Review warnings for potential configuration issues')
    }
    
    const result: EnvironmentDebugResult = {
      status: privateKeyValidation.errors.length === 0 ? 'healthy' : 'error',
      timestamp,
      googleWallet: {
        privateKey: privateKeyValidation,
        serviceAccountEmail: {
          present: Boolean(serviceAccountEmail),
          format: serviceAccountEmail ? serviceAccountEmail.substring(0, 20) + '...' : 'missing',
          isValidEmail: emailValid
        },
        classId: {
          present: Boolean(classId),
          format: classId || 'missing',
          isValidFormat: classIdValid
        }
      },
      testJWT,
      recommendations
    }
    
    console.log(`✅ Debug validation completed: ${result.status}`)
    
    return NextResponse.json(result, { 
      status: privateKeyValidation.errors.length === 0 ? 200 : 500 
    })
    
  } catch (error) {
    console.error('❌ Critical error in debug validation:', error)
    logger.error('Critical error in debug validation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json({
      status: 'error',
      error: 'Internal server error during debug validation',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 