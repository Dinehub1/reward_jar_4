// Jest setup file for RewardJar 4.0 tests
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: process.env.NODE_ENV === 'test' ? () => {} : console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
}

// Set test timeout
jest.setTimeout(30000) // 30 seconds for database operations

// Mock Next.js environment
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

// Ensure required environment variables are set for tests
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} not set in test environment`)
  }
}) 