#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Fix all remaining orphaned console.log patterns and other syntax issues
function fixRemainingOrphans() {
  let totalFixed = 0
  
  // Get all TypeScript files recursively
  function getFiles(dir, files = []) {
    const dirFiles = fs.readdirSync(dir)
    for (const file of dirFiles) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        getFiles(filePath, files)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        files.push(filePath)
      }
    }
    return files
  }
  
  const files = getFiles('src')
  
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    let fixes = 0
    
    // Pattern 1: Fix malformed catch blocks with extra }))
    const malformedCatch1 = /(\}\s*catch\s*\([^)]*\)\s*\{\s*console\.error[^}]*\}\s*\}\)\s*)/g
    const matches1 = content.match(malformedCatch1)
    if (matches1) {
      content = content.replace(malformedCatch1, (match) => {
        return match.replace(/\}\)\s*$/, '}')
      })
      fixes += matches1.length
    }
    
    // Pattern 2: Fix malformed catch blocks with extra })
    const malformedCatch2 = /(\}\s*catch\s*\([^)]*\)\s*\{\s*console\.error[^}]*\}\s*\)\s*)/g
    const matches2 = content.match(malformedCatch2)
    if (matches2) {
      content = content.replace(malformedCatch2, (match) => {
        return match.replace(/\)\s*$/, '\n    }')
      })
      fixes += matches2.length
    }
    
    // Pattern 3: Fix malformed template literals in catch blocks
    const malformedTemplate = /(\}\s*catch\s*\([^)]*\)\s*\{\s*console\.error[^}]*\}\s*[^}]*\$\{[^}]*\}\s*`)/g
    const matches3 = content.match(malformedTemplate)
    if (matches3) {
      content = content.replace(malformedTemplate, (match) => {
        const parts = match.split('console.error')
        if (parts.length === 2) {
          return parts[0] + 'console.error("Error:", error)\n        }'
        }
        return match
      })
      fixes += matches3.length
    }
    
    // Pattern 4: Fix return statements outside function context
    const orphanedReturn = /(\s*return NextResponse\.json\([^)]*\)\s*\}\s*\}\s*catch)/g
    const matches4 = content.match(orphanedReturn)
    if (matches4) {
      content = content.replace(orphanedReturn, (match) => {
        return match.replace(/\s*\}\s*\}\s*catch/, '\n    }\n  } catch')
      })
      fixes += matches4.length
    }
    
    // Pattern 5: Fix malformed object literal with errors list
    const malformedErrors = /(\}\s*`\]\s*\}\s*)/g
    const matches5 = content.match(malformedErrors)
    if (matches5) {
      content = content.replace(malformedErrors, '        }\n      }')
      fixes += matches5.length
    }
    
    if (fixes > 0) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Fixed ${fixes} issue(s) in ${filePath}`)
      totalFixed += fixes
    }
  }
  
  console.log(`\n🎉 Total fixes applied: ${totalFixed}`)
  return totalFixed
}

// Run the fixes
try {
  fixRemainingOrphans()
  console.log('\n✅ Remaining orphan fixes completed!')
} catch (error) {
  console.error('❌ Error during orphan fixes:', error.message)
  process.exit(1)
}