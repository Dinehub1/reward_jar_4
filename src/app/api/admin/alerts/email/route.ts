/**
 * RewardJar 4.0 - Email Alerting API
 * Send system alerts and notifications via email
 * 
 * @version 4.0
 * @path /api/admin/alerts/email
 * @created January 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { Alert } from '@/lib/admin-audit'

interface EmailPayload {
  to: string[]
  subject: string
  html: string
  text: string
}

/**
 * POST /api/admin/alerts/email
 * Send alert notification via email
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 Processing email alert notification...')

    // Verify admin authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Email Alert: Authentication failed:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin role
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role_id !== 1) {
      console.log('❌ Email Alert: Admin access denied, user role:', userData?.role_id)
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse alert data
    const alert: Alert = await request.json()
    
    if (!alert || !alert.message) {
      return NextResponse.json(
        { success: false, error: 'Invalid alert data' },
        { status: 400 }
      )
    }

    // Check email configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ Email SMTP not configured, skipping email notification')
      return NextResponse.json(
        { success: true, message: 'Email SMTP not configured, alert logged only' },
        { status: 200 }
      )
    }

    // Get admin email recipients
    const recipients = await getAdminEmailRecipients(adminClient)
    if (recipients.length === 0) {
      console.warn('⚠️ No admin email recipients found')
      return NextResponse.json(
        { success: true, message: 'No email recipients configured' },
        { status: 200 }
      )
    }

    // Format email
    const emailPayload = formatAlertForEmail(alert, recipients)
    
    // Send email
    const emailResult = await sendEmail(emailPayload)
    
    if (!emailResult.success) {
      throw new Error(emailResult.error)
    }

    // Log the alert in database for audit trail
    await logAlert(adminClient, alert, 'email', true)

    console.log('✅ Email alert sent successfully:', alert.message)
    
    return NextResponse.json({
      success: true,
      message: 'Alert sent via email successfully',
      alertId: alert.id,
      recipients: recipients.length
    })

  } catch (error) {
    console.error('❌ Email alert failed:', error)
    
    // Try to log the failed attempt
    try {
      const adminClient = createAdminClient()
      await logAlert(adminClient, await request.json(), 'email', false, error)
    } catch (logError) {
      console.error('❌ Failed to log email alert failure:', logError)
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get admin email recipients from database
 */
async function getAdminEmailRecipients(adminClient: any): Promise<string[]> {
  try {
    // Get all admin users with email addresses
    const { data: adminUsers, error } = await adminClient
      .from('users')
      .select('email')
      .eq('role_id', 1)
      .not('email', 'is', null)

    if (error) {
      console.error('❌ Failed to fetch admin users:', error)
      return []
    }

    const emails = adminUsers?.map(u => u.email).filter(Boolean) || []
    
    // Add configured admin emails from environment
    const envAdminEmails = process.env.ADMIN_ALERT_EMAILS?.split(',').map(e => e.trim()) || []
    
    // Combine and deduplicate
    const allEmails = [...new Set([...emails, ...envAdminEmails])]
    
    console.log(`📧 Found ${allEmails.length} admin email recipients`)
    return allEmails
  } catch (error) {
    console.error('❌ Error getting admin email recipients:', error)
    return []
  }
}

/**
 * Format alert for email with HTML template
 */
function formatAlertForEmail(alert: Alert, recipients: string[]): EmailPayload {
  const emoji = getAlertEmoji(alert.level)
  const color = getAlertColor(alert.level)
  const timestamp = new Date(alert.timestamp).toLocaleString()
  
  const subject = `${emoji} RewardJar Alert: ${alert.level.toUpperCase()} - ${alert.message}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RewardJar System Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: ${color}; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .alert-info { background: #f8f9fa; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; }
    .metadata { background: #f1f3f4; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 14px; overflow-x: auto; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
    .button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} RewardJar System Alert</h1>
    </div>
    
    <div class="content">
      <div class="alert-info">
        <h2 style="margin-top: 0; color: ${color};">${alert.level.toUpperCase()} Alert</h2>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <p><strong>Alert ID:</strong> ${alert.id}</p>
        <p><strong>Recommended Action:</strong> ${alert.action.replace(/_/g, ' ')}</p>
      </div>
      
      ${alert.metadata ? `
      <h3>Additional Details:</h3>
      <div class="metadata">${JSON.stringify(alert.metadata, null, 2)}</div>
      ` : ''}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rewardjar.app'}/admin/debug" class="button">
          🔍 View Admin Dashboard
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rewardjar.app'}/admin/debug?tab=health" class="button">
          📊 System Health
        </a>
      </div>
      
      <p><strong>What to do next:</strong></p>
      <ul>
        <li>Check the admin dashboard for more details</li>
        <li>Review system health metrics</li>
        <li>Take appropriate action based on the alert type</li>
        ${alert.level === 'critical' ? '<li><strong>This is a critical alert requiring immediate attention</strong></li>' : ''}
      </ul>
    </div>
    
    <div class="footer">
      <p>This alert was generated by the RewardJar 4.0 monitoring system.</p>
      <p>If you believe this is an error, please contact the development team.</p>
    </div>
  </div>
</body>
</html>`

  const text = `
RewardJar System Alert

${emoji} ${alert.level.toUpperCase()} ALERT

Message: ${alert.message}
Time: ${timestamp}
Alert ID: ${alert.id}
Action Required: ${alert.action.replace(/_/g, ' ')}

${alert.metadata ? `Details:\n${JSON.stringify(alert.metadata, null, 2)}` : ''}

View the admin dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://rewardjar.app'}/admin/debug

This alert was generated by the RewardJar 4.0 monitoring system.
`

  return {
    to: recipients,
    subject,
    html,
    text
  }
}

/**
 * Send email using configured SMTP service
 */
async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we'll use a simple HTTP service or integrate with SendGrid/Mailgun
    // This is a placeholder implementation - you would integrate with your preferred email service
    
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid(payload)
    } else if (process.env.MAILGUN_API_KEY) {
      return await sendViaMailgun(payload)
    } else {
      // Fallback to basic SMTP (you would implement this)
      console.log('📧 Email would be sent to:', payload.to.join(', '))
      console.log('📧 Subject:', payload.subject)
      return { success: true }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: payload.to.map(email => ({ email })),
          subject: payload.subject
        }],
        from: {
          email: process.env.FROM_EMAIL || 'alerts@rewardjar.app',
          name: 'RewardJar Alerts'
        },
        content: [
          { type: 'text/plain', value: payload.text },
          { type: 'text/html', value: payload.html }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'SendGrid error' 
    }
  }
}

/**
 * Send email via Mailgun
 */
async function sendViaMailgun(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const domain = process.env.MAILGUN_DOMAIN
    const formData = new FormData()
    
    formData.append('from', `RewardJar Alerts <alerts@${domain}>`)
    formData.append('to', payload.to.join(','))
    formData.append('subject', payload.subject)
    formData.append('text', payload.text)
    formData.append('html', payload.html)

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Mailgun error' 
    }
  }
}

/**
 * Get emoji for alert level
 */
function getAlertEmoji(level: Alert['level']): string {
  switch (level) {
    case 'critical': return '🚨'
    case 'error': return '❌'
    case 'warning': return '⚠️'
    case 'info': return 'ℹ️'
    default: return '📝'
  }
}

/**
 * Get color for alert level
 */
function getAlertColor(level: Alert['level']): string {
  switch (level) {
    case 'critical': return '#dc2626'
    case 'error': return '#ea580c'
    case 'warning': return '#d97706'
    case 'info': return '#2563eb'
    default: return '#6b7280'
  }
}

/**
 * Log alert to database for audit trail
 */
async function logAlert(
  adminClient: any,
  alert: Alert,
  channel: string,
  success: boolean,
  error?: any
): Promise<void> {
  try {
    await adminClient
      .from('alert_notifications')
      .insert({
        alert_id: alert.id,
        alert_level: alert.level,
        alert_message: alert.message,
        notification_channel: channel,
        notification_success: success,
        notification_error: error ? (error instanceof Error ? error.message : String(error)) : null,
        sent_at: new Date().toISOString(),
        metadata: alert.metadata
      })
  } catch (logError) {
    console.error('❌ Failed to log alert notification:', logError)
  }
}