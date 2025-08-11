#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns to preserve (development-only logging)
const PRESERVE_PATTERNS = [
  /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)\s*{[\s\S]*?console\./,
  /process\.env\.NODE_ENV\s*===\s*['"]development['"][\s\S]*?console\./,
  /NODE_ENV.*development.*console\./,
];

// Console methods to remove
const CONSOLE_METHODS = ['log', 'warn', 'error', 'info', 'debug'];

function shouldPreserveLine(line, nextLines = []) {
  const fullContext = [line, ...nextLines.slice(0, 3)].join('\n');
  return PRESERVE_PATTERNS.some(pattern => pattern.test(fullContext));
}

function removeConsoleLogs(content, filename) {
  const lines = content.split('\n');
  const newLines = [];
  let removed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLines = lines.slice(i + 1, i + 4);
    
    // Check if this line contains console logging
    const hasConsole = CONSOLE_METHODS.some(method => 
      line.includes(`console.${method}`)
    );
    
    if (hasConsole) {
      // Check if we should preserve this console statement
      if (shouldPreserveLine(line, nextLines)) {
        newLines.push(line);
        continue;
      }
      
      // Remove the console statement
      const trimmedLine = line.trim();
      
      // If it's a standalone console statement, remove the entire line
      if (trimmedLine.startsWith('console.') || 
          trimmedLine.match(/^\s*console\./)) {
        removed++;
        continue; // Skip this line
      }
      
      // If console is part of a larger statement, try to remove just the console part
      let cleanedLine = line;
      CONSOLE_METHODS.forEach(method => {
        const patterns = [
          new RegExp(`console\\.${method}\\([^)]*\\);?\\s*`, 'g'),
          new RegExp(`console\\.${method}\\([^)]*\\),?\\s*`, 'g'),
        ];
        patterns.forEach(pattern => {
          cleanedLine = cleanedLine.replace(pattern, '');
        });
      });
      
      // Only keep the line if it has content after removing console
      if (cleanedLine.trim() && cleanedLine.trim() !== line.trim()) {
        newLines.push(cleanedLine);
        removed++;
      } else if (cleanedLine.trim()) {
        newLines.push(line); // Keep original if cleaning failed
      } else {
        removed++; // Remove empty line
      }
    } else {
      newLines.push(line);
    }
  }
  
  return { content: newLines.join('\n'), removed };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = removeConsoleLogs(content, filePath);
    
    if (result.removed > 0) {
      fs.writeFileSync(filePath, result.content);
      console.log(`✅ ${filePath}: Removed ${result.removed} console statements`);
      return result.removed;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let totalRemoved = 0;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, .git, etc.
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          totalRemoved += processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Process TypeScript and TSX files
        if (fullPath.match(/\.(ts|tsx)$/)) {
          totalRemoved += processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error.message);
  }
  
  return totalRemoved;
}

// Main execution
console.log('🧹 Starting console.log cleanup...\n');

const srcDir = path.join(process.cwd(), 'src');
const totalRemoved = processDirectory(srcDir);

console.log(`\n🎉 Cleanup complete! Removed ${totalRemoved} console statements from production code.`);
console.log('✅ Development-only console statements preserved.');