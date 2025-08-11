#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Fix all wallet route orphaned console.log patterns
function fixWalletRoutes() {
  let totalFixed = 0
  
  // Get all wallet API files
  function getWalletFiles(dir, files = []) {
    const dirFiles = fs.readdirSync(dir)
    for (const file of dirFiles) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        getWalletFiles(filePath, files)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        files.push(filePath)
      }
    }
    return files
  }
  
  const files = getWalletFiles('src/app/api/wallet')
  files.push('src/app/api/admin/wallet-provision/route.ts')
  
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    let fixes = 0
    
    // Pattern 1: Remove orphaned console.log parameters like:
    // businessId,
    // usageType,
    // notes
    // })
    const orphanedParams = /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*,?\s*$/gm
    const lines = content.split('\n')
    const newLines = []
    let skipMode = false
    let braceCount = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Check if this line is an orphaned parameter
      if (trimmed.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*,?\s*$/) && 
          i > 0 && lines[i-1].trim().includes(',')) {
        // Skip orphaned parameters
        fixes++
        continue
      }
      
      // Check for orphaned }) on its own line after parameters
      if (trimmed === '})' && i > 0 && 
          lines[i-1].trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*$/)) {
        // Skip orphaned })
        fixes++
        continue
      }
      
      // Fix malformed console.error blocks that end with }])
      if (line.includes('console.error') && line.includes('}])')) {
        newLines.push(line.replace(/\}\]\s*$/, '}'))
        fixes++
        continue
      }
      
      // Fix malformed catch blocks that end with `)
      if (trimmed.match(/^\s*\}\s*\)\s*$/)) {
        newLines.push(line.replace(/\)\s*$/, ''))
        fixes++
        continue
      }
      
      newLines.push(line)
    }
    
    content = newLines.join('\n')
    
    if (fixes > 0) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed ${fixes} issue(s) in ${filePath}`)
      totalFixed += fixes
    }
  }
  
  console.log(`\n🎉 Total wallet route fixes applied: ${totalFixed}`)
  return totalFixed
}

// Run the fixes
try {
  fixWalletRoutes()
  console.log('\n✅ Wallet route fixes completed!')
} catch (error) {
  console.error('❌ Error during wallet route fixes:', error.message)
  process.exit(1)
}