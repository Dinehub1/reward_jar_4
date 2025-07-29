import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-only'

export async function GET(request: NextRequest) {
  console.log('=== AUTH STATUS CHECK ===')
  
  let retryCount = 0
  const maxRetries = 3
  const retryDelay = 1000 // 1 second

  while (retryCount < maxRetries) {
    try {
      const supabase = await createClient()
      
      // Get the current session with timeout protection
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      })
      
      const { data: { session }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

      if (sessionError) {
        console.error(`Auth Status: Session error (attempt ${retryCount + 1}):`, sessionError)
        throw sessionError
      }

      if (!session?.user) {
        console.log('Auth Status: No authenticated user')
        return NextResponse.json({
          authenticated: false,
          user: null,
          role: null
        })
      }

      console.log('Auth Status: User authenticated:', session.user.id)

      // Get user role with retry protection
      let userRole = null
      let roleRetryCount = 0
      
      while (roleRetryCount < 2) { // Fewer retries for role check
        try {
          const rolePromise = supabase
            .from('users')
            .select('role_id')
            .eq('id', session.user.id)
            .single()
          
          const roleTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Role check timeout')), 3000)
          })
          
          const { data: userData, error: roleError } = await Promise.race([
            rolePromise,
            roleTimeoutPromise
          ]) as any

          if (roleError) {
            console.error(`Auth Status: Role error (attempt ${roleRetryCount + 1}):`, roleError)
            if (roleRetryCount < 1) {
              roleRetryCount++
              await new Promise(resolve => setTimeout(resolve, 500))
              continue
            }
            // If role check fails, still return authenticated status without role
            console.warn('Auth Status: Proceeding without role information')
            break
          }

          userRole = userData?.role_id || null
          console.log('Auth Status: User role verified:', userRole)
          break

        } catch (roleErr) {
          console.error(`Auth Status: Role fetch error (attempt ${roleRetryCount + 1}):`, roleErr)
          roleRetryCount++
          if (roleRetryCount < 2) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }

      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email
        },
        role: userRole
      })

    } catch (error) {
      console.error(`Auth Status Error (attempt ${retryCount + 1}):`, error)
      
      // Check if it's a connection error that we should retry
      if (error instanceof Error && (
        error.message.includes('ECONNRESET') ||
        error.message.includes('fetch failed') ||
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('network')
      )) {
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`Auth Status: Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
      }

      // If all retries failed or non-retryable error
      console.error('Auth Status: All retry attempts failed, returning unauthenticated status')
      return NextResponse.json({
        authenticated: false,
        user: null,
        role: null,
        error: 'Authentication check failed',
        retries: retryCount
      })
    }
  }

  // This should never be reached, but just in case
  return NextResponse.json({
    authenticated: false,
    user: null,
    role: null,
    error: 'Maximum retries exceeded'
  })
} 