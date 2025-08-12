#!/usr/bin/env node

/**
 * 🎨 BATCH DESIGN CONSISTENCY ENHANCER
 * 
 * Automatically applies design tokens and error boundaries to all pages
 * Phase 4 Tier 3 implementation for RewardJar 4.0
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// Page configurations
const PAGE_CONFIGS = {
  // Admin pages (Role 1)
  'src/app/admin/alerts/page.tsx': { role: 'admin', type: 'monitoring', name: 'Alert Management' },
  'src/app/admin/support/page.tsx': { role: 'admin', type: 'monitoring', name: 'Support Dashboard' },
  'src/app/admin/dev-tools/page.tsx': { role: 'admin', type: 'monitoring', name: 'Developer Tools' },
  
  // Business pages (Role 2)
  'src/app/business/memberships/page.tsx': { role: 'business', type: 'management', name: 'Membership Management' },
  'src/app/business/onboarding/cards/page.tsx': { role: 'business', type: 'onboarding', name: 'Card Setup' },
  'src/app/business/onboarding/profile/page.tsx': { role: 'business', type: 'onboarding', name: 'Profile Setup' },
  
  // Public pages
  'src/app/faq/page.tsx': { role: 'public', type: 'form', name: 'FAQ' },
  'src/app/pricing/page.tsx': { role: 'public', type: 'form', name: 'Pricing' },
  'src/app/use-cases/page.tsx': { role: 'public', type: 'form', name: 'Use Cases' },
  'src/app/templates/page.tsx': { role: 'public', type: 'list', name: 'Templates' }
}

/**
 * Check if a file needs enhancement
 */
function needsEnhancement(filePath) {
  if (!fs.existsSync(filePath)) return false
  
  const content = fs.readFileSync(filePath, 'utf8')
  return !content.includes('ComponentErrorBoundary') && 
         !content.includes('getPageEnhancement') &&
         content.includes('export default')
}

/**
 * Apply design consistency enhancement to a file
 */
function enhanceFile(filePath, config) {
  console.log(`🎨 Enhancing ${filePath}...`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Add imports if not present
  if (!content.includes('ComponentErrorBoundary')) {
    const importMatch = content.match(/^(.*import.*from.*lucide-react.*\n)/m)
    if (importMatch) {
      const importSection = importMatch[1]
      const newImports = `${importSection}import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { getPageEnhancement, createErrorFallback } from '@/lib/design-consistency/page-enhancer'
`
      content = content.replace(importSection, newImports)
    }
  }
  
  // Find and modify export default
  const exportMatch = content.match(/export default function (\w+)\s*\([^)]*\)\s*{/)
  if (exportMatch) {
    const originalName = exportMatch[1]
    const legacyName = `Legacy${originalName}`
    
    // Rename original function
    content = content.replace(`export default function ${originalName}`, `function ${legacyName}`)
    
    // Add enhanced export at the end
    const enhancedExport = `
export default function ${originalName}() {
  const enhancement = getPageEnhancement('${config.role}', '${config.type}')
  
  return (
    <ComponentErrorBoundary fallback={createErrorFallback('${config.role}', '${config.name}')}>
      <div className={enhancement.containerClass}>
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
}

/**
 * Main enhancement process
 */
function main() {
  console.log('🚀 Starting Tier 3 Design Consistency Enhancement...\n')
  
  let enhanced = 0
  let skipped = 0
  
  Object.entries(PAGE_CONFIGS).forEach(([filePath, config]) => {
    if (needsEnhancement(filePath)) {
      try {
        enhanceFile(filePath, config)
        enhanced++
      } catch (error) {
        console.error(`❌ Error enhancing ${filePath}:`, error.message)
      }
    } else {
      console.log(`⏭️ Skipping ${filePath} (already enhanced or missing)`)
      skipped++
    }
  })
  
  console.log(`\n🎉 Design Consistency Enhancement Complete!`)
  console.log(`✅ Enhanced: ${enhanced} pages`)
  console.log(`⏭️ Skipped: ${skipped} pages`)
  console.log(`\n📋 Next Steps:`)
  console.log(`1. Run: npm run build`)
  console.log(`2. Test enhanced pages`)
  console.log(`3. Deploy to staging`)
}

if (require.main === module) {
  main()
}

module.exports = { enhanceFile, needsEnhancement, PAGE_CONFIGS }