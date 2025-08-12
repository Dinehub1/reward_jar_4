#!/usr/bin/env node

/**
 * 🎨 SYSTEMATIC DESIGN CONSISTENCY APPLICATION
 * 
 * Automatically applies design tokens and error boundaries to all 44 remaining pages
 * Phase 4 Tier 3 systematic implementation for RewardJar 4.0
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Complete page configurations for all 54 pages
const ALL_PAGE_CONFIGS = {
  // ✅ TIER 1 - ALREADY COMPLETED (6/6)
  'src/app/page.tsx': { role: 'public', type: 'marketing', name: 'Landing Page', status: 'completed' },
  'src/app/admin/page.tsx': { role: 'admin', type: 'dashboard', name: 'Admin Dashboard', status: 'completed' },
  'src/app/business/dashboard/page.tsx': { role: 'business', type: 'dashboard', name: 'Business Dashboard', status: 'completed' },
  'src/app/admin/cards/page.tsx': { role: 'admin', type: 'management', name: 'Admin Card Management', status: 'completed' },
  'src/app/business/stamp-cards/page.tsx': { role: 'business', type: 'management', name: 'Business Card Management', status: 'completed' },
  'src/app/admin/cards/new/page.tsx': { role: 'admin', type: 'form', name: 'Card Creation Wizard', status: 'completed' },
  
  // ✅ TIER 2 - ALREADY COMPLETED (4/4)
  'src/app/admin/businesses/page.tsx': { role: 'admin', type: 'management', name: 'Admin Business Management', status: 'completed' },
  'src/app/business/profile/page.tsx': { role: 'business', type: 'form', name: 'Business Profile', status: 'completed' },
  'src/app/auth/login/page.tsx': { role: 'public', type: 'auth', name: 'Login Experience', status: 'completed' },
  'src/app/onboarding/business/page.tsx': { role: 'public', type: 'onboarding', name: 'Business Onboarding', status: 'completed' },
  
  // ✅ TIER 3 - PARTIALLY COMPLETED (2/44)
  'src/app/admin/customers/page.tsx': { role: 'admin', type: 'management', name: 'Customer Management', status: 'completed' },
  'src/app/admin/templates/page.tsx': { role: 'admin', type: 'management', name: 'Template Management', status: 'completed' },
  
  // 🔄 TIER 3 - REMAINING PAGES TO ENHANCE (42/44)
  
  // Admin Pages (Role 1) - 23 remaining
  'src/app/admin/alerts/page.tsx': { role: 'admin', type: 'monitoring', name: 'Alert Management' },
  'src/app/admin/support/page.tsx': { role: 'admin', type: 'monitoring', name: 'Support Dashboard' },
  'src/app/admin/dev-tools/page.tsx': { role: 'admin', type: 'monitoring', name: 'Developer Tools' },
  'src/app/admin/dev-tools/api-health/page.tsx': { role: 'admin', type: 'monitoring', name: 'API Health' },
  'src/app/admin/dev-tools/system-monitor/page.tsx': { role: 'admin', type: 'monitoring', name: 'System Monitor' },
  'src/app/admin/dev-tools/test-automation/page.tsx': { role: 'admin', type: 'monitoring', name: 'Test Automation' },
  'src/app/admin/demo/card-creation/page.tsx': { role: 'admin', type: 'demo', name: 'Card Creation Demo' },
  'src/app/admin/sandbox/page.tsx': { role: 'admin', type: 'testing', name: 'Admin Sandbox' },
  'src/app/admin/debug-client/page.tsx': { role: 'admin', type: 'testing', name: 'Debug Client' },
  'src/app/admin/test-auth-debug/page.tsx': { role: 'admin', type: 'testing', name: 'Auth Debug' },
  'src/app/admin/test-business-management/page.tsx': { role: 'admin', type: 'testing', name: 'Business Test' },
  'src/app/admin/test-cards/page.tsx': { role: 'admin', type: 'testing', name: 'Cards Test' },
  'src/app/admin/test-customer-monitoring/page.tsx': { role: 'admin', type: 'testing', name: 'Customer Test' },
  'src/app/admin/test-dashboard/page.tsx': { role: 'admin', type: 'testing', name: 'Dashboard Test' },
  'src/app/admin/test-login/page.tsx': { role: 'admin', type: 'testing', name: 'Login Test' },
  
  // Dynamic Admin Pages
  'src/app/admin/businesses/[id]/page.tsx': { role: 'admin', type: 'detail', name: 'Business Detail' },
  'src/app/admin/cards/membership/[cardId]/page.tsx': { role: 'admin', type: 'detail', name: 'Membership Card Detail' },
  'src/app/admin/cards/stamp/[cardId]/page.tsx': { role: 'admin', type: 'detail', name: 'Stamp Card Detail' },
  'src/app/admin/templates/[id]/page.tsx': { role: 'admin', type: 'detail', name: 'Template Detail' },
  
  // Business Pages (Role 2) - 9 remaining
  'src/app/business/analytics/page.tsx': { role: 'business', type: 'analytics', name: 'Business Analytics' },
  'src/app/business/memberships/page.tsx': { role: 'business', type: 'management', name: 'Membership Management' },
  'src/app/business/no-access/page.tsx': { role: 'business', type: 'info', name: 'No Access' },
  'src/app/business/onboarding/cards/page.tsx': { role: 'business', type: 'onboarding', name: 'Card Setup' },
  'src/app/business/onboarding/profile/page.tsx': { role: 'business', type: 'onboarding', name: 'Profile Setup' },
  
  // Dynamic Business Pages
  'src/app/business/memberships/[id]/page.tsx': { role: 'business', type: 'detail', name: 'Membership Detail' },
  'src/app/business/stamp-cards/[cardId]/customers/page.tsx': { role: 'business', type: 'management', name: 'Card Customers' },
  'src/app/business/stamp-cards/[cardId]/customers/[customerId]/page.tsx': { role: 'business', type: 'detail', name: 'Customer Detail' },
  'src/app/business/stamp-cards/[cardId]/rewards/page.tsx': { role: 'business', type: 'management', name: 'Card Rewards' },
  
  // Customer Pages (Role 3) - 2 remaining
  'src/app/customer/dashboard/page.tsx': { role: 'customer', type: 'dashboard', name: 'Customer Dashboard' },
  'src/app/customer/card/[cardId]/page.tsx': { role: 'customer', type: 'detail', name: 'Customer Card' },
  
  // Public Pages - 8 remaining
  'src/app/auth/customer-signup/page.tsx': { role: 'public', type: 'auth', name: 'Customer Signup' },
  'src/app/auth/debug/page.tsx': { role: 'public', type: 'auth', name: 'Auth Debug' },
  'src/app/auth/dev-login/page.tsx': { role: 'public', type: 'auth', name: 'Dev Login' },
  'src/app/auth/reset/page.tsx': { role: 'public', type: 'auth', name: 'Password Reset' },
  'src/app/auth/signup/page.tsx': { role: 'public', type: 'auth', name: 'Signup' },
  'src/app/faq/page.tsx': { role: 'public', type: 'info', name: 'FAQ' },
  'src/app/pricing/page.tsx': { role: 'public', type: 'info', name: 'Pricing' },
  'src/app/use-cases/page.tsx': { role: 'public', type: 'info', name: 'Use Cases' },
  'src/app/templates/page.tsx': { role: 'public', type: 'info', name: 'Templates' },
  'src/app/setup/page.tsx': { role: 'public', type: 'onboarding', name: 'Setup' },
  'src/app/debug-maps/page.tsx': { role: 'public', type: 'testing', name: 'Debug Maps' },
  
  // Dynamic Public Pages
  'src/app/join/[cardId]/page.tsx': { role: 'public', type: 'onboarding', name: 'Join Card' }
}

/**
 * Check if a file needs enhancement
 */
function needsEnhancement(filePath, config) {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️ Skipping ${filePath} (file not found)`)
    return false
  }
  
  if (config.status === 'completed') {
    console.log(`✅ Skipping ${filePath} (already completed)`)
    return false
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const hasErrorBoundary = content.includes('ComponentErrorBoundary')
  const hasDesignTokens = content.includes('getPageEnhancement') || content.includes('modernStyles')
  
  if (hasErrorBoundary && hasDesignTokens) {
    console.log(`✅ Skipping ${filePath} (already enhanced)`)
    return false
  }
  
  return true
}

/**
 * Apply design consistency enhancement to a file
 */
function enhanceFile(filePath, config) {
  console.log(`🎨 Enhancing ${filePath}...`)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Skip if it's already a client component and has the right imports
    const isClientComponent = content.includes("'use client'")
    
    // Add imports if not present
    const needsErrorBoundary = !content.includes('ComponentErrorBoundary')
    const needsDesignTokens = !content.includes('modernStyles') && !content.includes('getPageEnhancement')
    
    if (needsErrorBoundary || needsDesignTokens) {
      // Find the last import statement
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import'))
      if (importLines.length > 0) {
        const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1])
        const insertPosition = content.indexOf('\n', lastImportIndex) + 1
        
        let newImports = ''
        if (needsErrorBoundary) {
          newImports += "import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'\n"
        }
        if (needsDesignTokens) {
          newImports += "import { modernStyles, roleStyles } from '@/lib/design-tokens'\n"
        }
        
        content = content.slice(0, insertPosition) + newImports + content.slice(insertPosition)
      }
    }
    
    // Find and modify export default function
    const exportMatch = content.match(/export default function (\w+)\s*\([^)]*\)\s*{/)
    if (exportMatch) {
      const originalName = exportMatch[1]
      const legacyName = `Legacy${originalName}`
      
      // Rename original function
      content = content.replace(`export default function ${originalName}`, `function ${legacyName}`)
      
      // Add enhanced export at the end
      const enhancedExport = `
export default function ${originalName}() {
  return (
    <ComponentErrorBoundary fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">${config.name} Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load the ${config.name.toLowerCase()}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    }>
      <div className={modernStyles.layout.container}>
        <${legacyName} />
      </div>
    </ComponentErrorBoundary>
  )
}`
      
      content += enhancedExport
    }
    
    // Write enhanced content
    fs.writeFileSync(filePath, content)
    console.log(`✅ Enhanced ${filePath}`)
    return true
    
  } catch (error) {
    console.error(`❌ Error enhancing ${filePath}:`, error.message)
    return false
  }
}

/**
 * Main systematic enhancement process
 */
function main() {
  console.log('🚀 Starting Systematic Design Consistency Application...\n')
  
  let enhanced = 0
  let skipped = 0
  let errors = 0
  
  // Process all pages by priority
  const priorityOrder = [
    'admin', // Admin pages first (highest business impact)
    'business', // Business pages second (primary users)
    'customer', // Customer pages third (end users)
    'public' // Public pages last (marketing/auth)
  ]
  
  priorityOrder.forEach(role => {
    console.log(`\n📋 Processing ${role.toUpperCase()} pages...`)
    console.log('='.repeat(50))
    
    Object.entries(ALL_PAGE_CONFIGS).forEach(([filePath, config]) => {
      if (config.role === role && config.status !== 'completed') {
        if (needsEnhancement(filePath, config)) {
          if (enhanceFile(filePath, config)) {
            enhanced++
          } else {
            errors++
          }
        } else {
          skipped++
        }
      }
    })
  })
  
  // Summary
  console.log('\n🎉 Systematic Design Enhancement Complete!')
  console.log('='.repeat(50))
  console.log(`✅ Enhanced: ${enhanced} pages`)
  console.log(`⏭️ Skipped: ${skipped} pages`)
  console.log(`❌ Errors: ${errors} pages`)
  
  const totalPages = Object.keys(ALL_PAGE_CONFIGS).length
  const completedPages = Object.values(ALL_PAGE_CONFIGS).filter(c => c.status === 'completed').length + enhanced
  
  console.log(`\n📊 Overall Progress: ${completedPages}/${totalPages} pages (${Math.round(completedPages/totalPages*100)}%)`)
  
  console.log('\n📋 Next Steps:')
  console.log('1. Run: npm run build')
  console.log('2. Test enhanced pages in development')
  console.log('3. Commit changes to version control')
  console.log('4. Deploy to staging environment')
  
  // Save enhancement report
  const report = {
    timestamp: new Date().toISOString(),
    enhanced,
    skipped,
    errors,
    totalPages,
    completedPages,
    completionRate: Math.round(completedPages/totalPages*100)
  }
  
  fs.writeFileSync('design-enhancement-report.json', JSON.stringify(report, null, 2))
  console.log('📄 Report saved to: design-enhancement-report.json')
}

if (require.main === module) {
  main()
}

module.exports = { enhanceFile, needsEnhancement, ALL_PAGE_CONFIGS }