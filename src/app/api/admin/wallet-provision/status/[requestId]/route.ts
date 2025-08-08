/**
 * Wallet Generation Status API
 * 
 * Check the status of a specific wallet generation request
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'
import { walletGenerationService } from '@/lib/wallet/wallet-generation-service'
import type { ApiResponse } from '@/lib/supabase/types'
import { use } from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    // Unwrap params for Next.js 15+
    const { requestId } = await params
    
    // Authentication check
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      } as ApiResponse<never>, { status: 401 })
    }

    // Validate request ID
    if (!requestId || typeof requestId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request ID'
      } as ApiResponse<never>, { status: 400 })
    }

    // Get queue status
    const queueStatus = walletGenerationService.getQueueStatus()
    
    // Check if request is pending
    const pendingRequest = queueStatus.pending.find(r => r.id === requestId)
    if (pendingRequest) {
      return NextResponse.json({
        success: true,
        data: {
          requestId,
          status: 'pending',
          position: queueStatus.pending.findIndex(r => r.id === requestId) + 1,
          totalPending: queueStatus.pending.length,
          estimatedWaitTime: `${Math.max(1, queueStatus.pending.findIndex(r => r.id === requestId) * 20)} seconds`,
          createdAt: pendingRequest.createdAt
        }
      })
    }

    // Check if request is processing
    const processingRequest = queueStatus.processing.find(r => r.id === requestId)
    if (processingRequest) {
      return NextResponse.json({
        success: true,
        data: {
          requestId,
          status: 'processing',
          startedAt: processingRequest.createdAt,
          types: processingRequest.types,
          cardId: processingRequest.cardId
        }
      })
    }

    // Check if request is completed
    const completedResult = queueStatus.completed.find(r => r.requestId === requestId)
    if (completedResult) {
      return NextResponse.json({
        success: true,
        data: {
          requestId,
          status: 'completed',
          result: completedResult,
          downloadUrls: generateDownloadUrls(completedResult)
        }
      })
    }

    // Check if request failed
    const failedRequest = queueStatus.failed.find(r => r.request.id === requestId)
    if (failedRequest) {
      return NextResponse.json({
        success: true,
        data: {
          requestId,
          status: 'failed',
          error: failedRequest.error,
          failedAt: failedRequest.failedAt,
          originalRequest: failedRequest.request
        }
      })
    }

    // Request not found
    return NextResponse.json({
      success: false,
      error: 'Request not found',
      details: 'The specified request ID was not found in the queue'
    } as ApiResponse<never>, { status: 404 })

  } catch (error) {
    console.error('❌ WALLET STATUS: Error checking status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<never>, { status: 500 })
  }
}

/**
 * Generate download URLs for completed wallet generation
 */
function generateDownloadUrls(result: any): Record<string, string> {
  const urls: Record<string, string> = {}
  
  if (result.results.apple?.success && result.results.apple.pkpassUrl) {
    urls.apple = result.results.apple.pkpassUrl
  }
  
  if (result.results.google?.success && result.results.google.saveUrl) {
    urls.google = result.results.google.saveUrl
  }
  
  if (result.results.pwa?.success) {
    urls.pwa = `/api/pwa/card/${result.unifiedData.id}`
  }
  
  return urls
}