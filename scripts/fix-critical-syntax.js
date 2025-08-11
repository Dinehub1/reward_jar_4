#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Fix critical syntax errors that are blocking the build
function fixCriticalSyntaxErrors() {
  let totalFixed = 0
  
  // Files that were showing errors in the build output
  const criticalFiles = [
    'src/components/admin/EnhancedBusinessEditForm.tsx',
    'src/lib/hooks/use-admin-auth.ts', 
    'src/app/admin/cards/new/page.tsx',
    'src/app/admin/cards/page.tsx',
    'src/app/admin/dev-tools/page.tsx'
  ]
  
  for (const filePath of criticalFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`)
      continue
    }
    
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    
    // Pattern 1: Fix extra closing brace before finally block
    // } catch (error) {
    //   console.error("Error:", error)
    // }
    // } finally {  <-- this extra } is the problem
    const extraBraceBeforeFinally = /(\}\s*\n\s*)\}\s*finally\s*\{/g
    const matches1 = content.match(extraBraceBeforeFinally)
    if (matches1) {
      content = content.replace(extraBraceBeforeFinally, '$1} finally {')
      console.log(`✅ Fixed ${matches1.length} extra brace(s) before finally in ${filePath}`)
      totalFixed += matches1.length
    }
    
    // Pattern 2: Fix malformed console.error statements
    // } catch (error) {
    //   console.error("Error:", error)
    // })  <-- extra ) is the problem
    const malformedCatchBlock = /\}\s*catch\s*\([^)]*\)\s*\{\s*console\.error\([^)]*\)\s*\}\s*\)\s*}/g
    const matches2 = content.match(malformedCatchBlock)
    if (matches2) {
      content = content.replace(malformedCatchBlock, (match) => {
        return match.replace(/\)\s*}$/, '}')
      })
      console.log(`✅ Fixed ${matches2.length} malformed catch block(s) in ${filePath}`)
      totalFixed += matches2.length
    }
    
    // Pattern 3: Fix double braces ") { {" to ") {"
    const doubleBraces = /\)\s*\{\s*\{/g
    const matches3 = content.match(doubleBraces)
    if (matches3) {
      content = content.replace(doubleBraces, ') {')
      console.log(`✅ Fixed ${matches3.length} double brace(s) in ${filePath}`)
      totalFixed += matches3.length
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated ${filePath}`)
    } else {
      console.log(`ℹ️  No changes needed for ${filePath}`)
    }
  }
  
  console.log(`\n🎉 Total fixes applied: ${totalFixed}`)
  return totalFixed
}

// Run the fixes
try {
  fixCriticalSyntaxErrors()
  console.log('\n✅ Critical syntax error fixes completed!')
} catch (error) {
  console.error('❌ Error during syntax fixes:', error.message)
  process.exit(1)
}