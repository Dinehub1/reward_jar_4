#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function updateReactFcPatterns(content, filename) {
  let updatedContent = content;
  let changesMade = 0;

  // Pattern 1: export const Component: React.FC<Props> = ({ props }) =>
  const pattern1 = /export\s+const\s+(\w+):\s*React\.FC<([^>]*)>\s*=\s*\(\s*\{([^}]*)\}\s*\)\s*=>/g;
  updatedContent = updatedContent.replace(pattern1, (match, componentName, propsType, destructuredProps) => {
    changesMade++;
    return `export function ${componentName}({ ${destructuredProps} }: ${propsType}) {`;
  });

  // Pattern 2: const Component: React.FC<Props> = ({ props }) =>
  const pattern2 = /const\s+(\w+):\s*React\.FC<([^>]*)>\s*=\s*\(\s*\{([^}]*)\}\s*\)\s*=>/g;
  updatedContent = updatedContent.replace(pattern2, (match, componentName, propsType, destructuredProps) => {
    changesMade++;
    return `function ${componentName}({ ${destructuredProps} }: ${propsType}) {`;
  });

  // Pattern 3: export const Component: React.FC<Props> = (props) =>
  const pattern3 = /export\s+const\s+(\w+):\s*React\.FC<([^>]*)>\s*=\s*\(\s*([^)]*)\s*\)\s*=>/g;
  updatedContent = updatedContent.replace(pattern3, (match, componentName, propsType, props) => {
    changesMade++;
    return `export function ${componentName}(${props}: ${propsType}) {`;
  });

  // Pattern 4: const Component: React.FC<Props> = (props) =>
  const pattern4 = /const\s+(\w+):\s*React\.FC<([^>]*)>\s*=\s*\(\s*([^)]*)\s*\)\s*=>/g;
  updatedContent = updatedContent.replace(pattern4, (match, componentName, propsType, props) => {
    changesMade++;
    return `function ${componentName}(${props}: ${propsType}) {`;
  });

  // Pattern 5: React.FC without props type
  const pattern5 = /export\s+const\s+(\w+):\s*React\.FC\s*=\s*\(\s*\{([^}]*)\}\s*\)\s*=>/g;
  updatedContent = updatedContent.replace(pattern5, (match, componentName, destructuredProps) => {
    changesMade++;
    return `export function ${componentName}({ ${destructuredProps} }) {`;
  });

  // Pattern 6: React.FC without props type (non-export)
  const pattern6 = /const\s+(\w+):\s*React\.FC\s*=\s*\(\s*\{([^}]*)\}\s*\)\s*=>/g;
  updatedContent = updatedContent.replace(pattern6, (match, componentName, destructuredProps) => {
    changesMade++;
    return `function ${componentName}({ ${destructuredProps} }) {`;
  });

  // Update arrow function bodies to regular function bodies if needed
  if (changesMade > 0) {
    // Find any remaining arrow function bodies and convert them
    // This is a simplified approach - in practice, you might need more sophisticated parsing
    
    // Look for patterns like "}) => (" and convert to "}) {"
    updatedContent = updatedContent.replace(/\)\s*=>\s*\(/g, ') {');
    
    // Look for return statements that need to be added
    // This is a heuristic and might need manual review
  }

  return { content: updatedContent, changes: changesMade };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Only process files that contain React.FC
    if (!content.includes('React.FC')) {
      return 0;
    }
    
    const result = updateReactFcPatterns(content, filePath);
    
    if (result.changes > 0) {
      fs.writeFileSync(filePath, result.content);
      console.log(`✅ ${filePath}: Updated ${result.changes} React.FC patterns`);
      return result.changes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let totalChanges = 0;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, .git, etc.
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
          totalChanges += processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Process TypeScript and TSX files
        if (fullPath.match(/\.(ts|tsx)$/)) {
          totalChanges += processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dir}:`, error.message);
  }
  
  return totalChanges;
}

// Main execution
console.log('🔄 Starting React.FC pattern updates...\n');

const srcDir = path.join(process.cwd(), 'src');
const totalChanges = processDirectory(srcDir);

console.log(`\n🎉 React.FC pattern update complete! Updated ${totalChanges} patterns.`);
console.log('⚠️  Please review the changes and ensure arrow function returns are properly converted to function returns.');