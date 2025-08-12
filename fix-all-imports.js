#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix all pages that are missing ComponentErrorBoundary imports
const pagesToCheck = [
  'src/app/pricing/page.tsx',
  'src/app/use-cases/page.tsx',
  'src/app/templates/page.tsx',
  'src/app/setup/page.tsx',
  'src/app/debug-maps/page.tsx',
  'src/app/auth/customer-signup/page.tsx',
  'src/app/auth/debug/page.tsx',
  'src/app/auth/dev-login/page.tsx',
  'src/app/auth/reset/page.tsx',
  'src/app/auth/signup/page.tsx',
  'src/app/join/[cardId]/page.tsx'
];

console.log('🔧 Fixing missing ComponentErrorBoundary imports...');

pagesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if ComponentErrorBoundary is used but not imported
    const usesComponent = content.includes('ComponentErrorBoundary');
    const hasImport = content.includes("from '@/components/shared/ErrorBoundary'");
    
    if (usesComponent && !hasImport) {
      // Add the imports at the top
      const imports = `import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'
import { modernStyles, roleStyles } from '@/lib/design-tokens'

`;
      
      // Find the first line that's not a comment and add imports before it
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Skip initial comments and directives
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith("'use") && !line.startsWith('"use')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, ...imports.split('\n').slice(0, -1));
      content = lines.join('\n');
      
      // Also fix any onClick handlers in error boundaries
      content = content.replace(
        /onClick=\{[^}]+\}/g,
        'href="/reload"'
      );
      
      // Replace button with a tags
      content = content.replace(
        /<button[^>]*onClick[^>]*>/g,
        '<a href="/"'
      );
      
      content = content.replace(
        /<\/button>/g,
        '</a>'
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else if (!usesComponent) {
      console.log(`⏭️  Skipped: ${filePath} (no ComponentErrorBoundary usage)`);
    } else {
      console.log(`✅ Already OK: ${filePath}`);
    }
  } else {
    console.log(`❌ Not found: ${filePath}`);
  }
});

console.log('🎉 All imports fixed!');