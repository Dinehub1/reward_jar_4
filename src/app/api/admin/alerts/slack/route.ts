/**
 * RewardJar 4.0 - Slack Alerting API
 * Send system alerts and notifications to Slack channels
 * 
 * @version 4.0
 * @path /api/admin/alerts/slack
 * @created January 2025
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-only'
import { createAdminClient } from '@/lib/supabase/admin-client'
import type { Alert } from '@/lib/admin-audit'

interface SlackWebhookPayload {
  text: string
  blocks?: any[]
  username?: string
  icon_emoji?: string
  channel?: string
}

/**
 * POST /api/admin/alerts/slack
 * Send alert notification to Slack
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📢 Processing Slack alert notification...')

    // Verify admin authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Slack Alert: Authentication failed:', authError?.message)
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
      console.log('❌ Slack Alert: Admin access denied, user role:', userData?.role_id)
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

    // Check if Slack webhook is configured
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!slackWebhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured, skipping notification')
      return NextResponse.json(
        { success: true, message: 'Slack webhook not configured, alert logged only' },
        { status: 200 }
      )
    }

    // Format alert for Slack
    const slackPayload = formatAlertForSlack(alert)
    
    // Send to Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackPayload)
    })

    if (!slackResponse.ok) {
      throw new Error(`Slack API error: ${slackResponse.status} ${slackResponse.statusText}`)
    }

    // Log the alert in database for audit trail
    await logAlert(adminClient, alert, 'slack', true)

    console.log('✅ Slack alert sent successfully:', alert.message)
    
    return NextResponse.json({
      success: true,
      message: 'Alert sent to Slack successfully',
      alertId: alert.id
    })

  } catch (error) {
    console.error('❌ Slack alert failed:', error)
    
    // Try to log the failed attempt
    try {
      const adminClient = createAdminClient()
      await logAlert(adminClient, await request.json(), 'slack', false, error)
    } catch (logError) {
      console.error('❌ Failed to log Slack alert failure:', logError)
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send Slack alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Format alert for Slack with rich formatting
 */
function formatAlertForSlack(alert: Alert): SlackWebhookPayload {
  const emoji = getAlertEmoji(alert.level)
  const color = getAlertColor(alert.level)
  const timestamp = Math.floor(new Date(alert.timestamp).getTime() / 1000)

  // Create rich Slack blocks for better formatting
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} RewardJar 4.0 System Alert`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Level:* ${alert.level.toUpperCase()}`
        },
        {
          type: 'mrkdwn',
          text: `*Alert ID:* ${alert.id}`
        },
        {
          type: 'mrkdwn',
          text: `*Time:* <!date^${timestamp}^{date_short_pretty} at {time}|${alert.timestamp}>`
        },
        {
          type: 'mrkdwn',
          text: `*Action:* ${alert.action.replace(/_/g, ' ')}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Message:*\n${alert.message}`
      }
    }
  ]

  // Add metadata if present
  if (alert.metadata && Object.keys(alert.metadata).length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Details:*\n\`\`\`${JSON.stringify(alert.metadata, null, 2)}\`\`\``
      }
    })
  }

  // Add action buttons for critical alerts
  if (alert.level === 'critical' || alert.level === 'error') {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🔍 View Admin Dashboard'
          },
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rewardjar.app'}/admin/debug`,
          style: 'primary'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📊 System Health'
          },
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rewardjar.app'}/admin/debug?tab=health`
        }
      ]
    })
  }

  return {
    text: `${emoji} RewardJar Alert: ${alert.message}`,
    blocks,
    username: 'RewardJar Monitor',
    icon_emoji: emoji,
    channel: process.env.SLACK_ALERT_CHANNEL || '#alerts'
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
    case 'critical': return '#FF0000'
    case 'error': return '#FF6B35'
    case 'warning': return '#FFD23F'
    case 'info': return '#4A90E2'
    default: return '#808080'
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