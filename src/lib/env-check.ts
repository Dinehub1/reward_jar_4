// Environment variable validation utility
export function validateEnvVars() {
  // Only check client-side env vars to avoid server-side issues
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : 'placeholder',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : 'placeholder',
  }

  const optional = {
    BASE_URL: typeof window !== 'undefined' ? process.env.BASE_URL : 'placeholder',
  }

  const missing = Object.entries(required).filter(([key, value]) => !value || value === 'placeholder')
  
  return {
    isValid: missing.length === 0,
    missing: missing.map(([key]) => key),
    required,
    optional
  }
}

export function getSupabaseConfig() {
  // Always return valid config for server-side rendering
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTkzNTMyMDAsImV4cCI6MjAxNDkyOTIwMH0.placeholder'
  }
} 