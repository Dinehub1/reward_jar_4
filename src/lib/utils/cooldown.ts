import { createServerClient } from '@/lib/supabase/server'

export interface CooldownConfig {
  minutes: number
  usageType: 'session' | 'stamp' | 'discount'
}

export interface CooldownResult {
  allowed: boolean
  error?: string
  cooldownMinutes?: number
  lastUsageAt?: string
}

/**
 * Check if an action is allowed based on cooldown period
 * Prevents rapid repeat actions to reduce fraud/abuse
 */
export async function checkCooldown(
  customerCardId: string, 
  config: CooldownConfig
): Promise<CooldownResult> {
  try {
    const supabase = await createServerClient()
    
    const cooldownThreshold = new Date(Date.now() - config.minutes * 60 * 1000).toISOString()
    
    const { data: recentUsage, error } = await supabase
      .from('session_usage')
      .select('created_at')
      .eq('customer_card_id', customerCardId)
      .eq('usage_type', config.usageType)
      .gte('created_at', cooldownThreshold)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      // Allow action on DB error to avoid blocking legitimate usage
      return { allowed: true }
    }

    if (recentUsage && recentUsage.length > 0) {
      return {
        allowed: false,
        error: `Please wait ${config.minutes} minutes between ${config.usageType} actions`,
        cooldownMinutes: config.minutes,
        lastUsageAt: recentUsage[0].created_at
      }
    }

    return { allowed: true }
  } catch (error) {
    // Allow action on unexpected error
    return { allowed: true }
  }
}

/**
 * Default cooldown configurations by action type
 */
export const DEFAULT_COOLDOWNS: Record<string, CooldownConfig> = {
  stamp: { minutes: 5, usageType: 'stamp' },
  session: { minutes: 15, usageType: 'session' }, // Sessions might be longer activities
  discount: { minutes: 5, usageType: 'discount' }
} as const

/**
 * Get cooldown config from environment or use defaults
 */
export function getCooldownConfig(usageType: 'session' | 'stamp' | 'discount'): CooldownConfig {
  const envKey = `COOLDOWN_${usageType.toUpperCase()}_MINUTES`
  const envValue = process.env[envKey]
  
  if (envValue && !isNaN(parseInt(envValue))) {
    return {
      minutes: parseInt(envValue),
      usageType
    }
  }
  
  return DEFAULT_COOLDOWNS[usageType] || DEFAULT_COOLDOWNS.stamp
}