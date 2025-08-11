#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixSyntaxErrors(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      fixSyntaxErrors(filePath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Fix missing arrows in map functions
      const mapArrowFix = content.replace(/\.map\(\([^)]+\)\s*\{/g, (match) => {
        return match.replace(/\{$/, '=> (');
      });
      
      if (mapArrowFix !== content) {
        content = mapArrowFix;
        changed = true;
      }
      
      // Fix broken try-catch blocks
      content = content.replace(/}\s*catch\s*\(\s*error\s*\)\s*\{[^}]*\}/gs, (match) => {
        if (!match.includes('console.error') && !match.includes('throw') && !match.includes('return')) {
          return match.replace(/\{[^}]*\}$/, '{\n        console.error("Error:", error)\n      }');
        }
        return match;
      });
      
      // Fix missing console declarations
      content = content.replace(/console\.error\s*=\s*\([^)]*\)\s*=>\s*\{/g, 'console.error = (...args: any[]) => {');
      
      if (changed || content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed syntax errors in: ${filePath}`);
      }
    }
  });
}

// Start from src directory
fixSyntaxErrors('src');
console.log('Syntax error fix complete!');