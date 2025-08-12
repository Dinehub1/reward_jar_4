#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix broken import statements caused by the systematic design script
const brokenFiles = [
  'src/app/business/stamp-cards/[cardId]/customers/[customerId]/page.tsx',
  'src/app/business/stamp-cards/[cardId]/customers/page.tsx',
  'src/app/business/stamp-cards/[cardId]/rewards/page.tsx',
  'src/app/business/dashboard/page.tsx',
  'src/app/business/profile/page.tsx',
  'src/app/business/memberships/[id]/page.tsx',
  'src/app/business/memberships/page.tsx',
  'src/app/business/analytics/page.tsx',
  'src/app/admin/customers/page.tsx',
  'src/app/admin/demo/card-creation/page.tsx',
  'src/app/admin/businesses/[id]/page.tsx',
  'src/app/admin/test-cards/page.tsx',
  'src/app/admin/test-dashboard/page.tsx',
  'src/app/admin/cards/new/page.tsx',
  'src/app/admin/cards/stamp/[cardId]/page.tsx',
  'src/app/admin/cards/page.tsx',
  'src/app/admin/cards/membership/[cardId]/page.tsx',
  'src/app/admin/test-customer-monitoring/page.tsx',
  'src/app/admin/alerts/page.tsx',
  'src/app/admin/test-login/page.tsx',
  'src/app/admin/test-auth-debug/page.tsx',
  'src/app/admin/test-business-management/page.tsx',
  'src/app/admin/dev-tools/api-health/page.tsx',
  'src/app/admin/dev-tools/page.tsx',
  'src/app/admin/dev-tools/test-automation/page.tsx',
  'src/app/admin/dev-tools/system-monitor/page.tsx',
  'src/app/admin/debug-client/page.tsx',
  'src/app/debug-maps/page.tsx',
  'src/app/onboarding/business/page.tsx',
  'src/app/customer/card/[cardId]/page.tsx'
];

console.log('🔧 Fixing broken import statements...');

brokenFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the broken import pattern
    content = content.replace(
      /import\s+{\s*\nimport\s+{\s+ComponentErrorBoundary\s+}\s+from\s+'@\/components\/shared\/ErrorBoundary'\nimport\s+{\s+modernStyles,\s+roleStyles\s+}\s+from\s+'@\/lib\/design-tokens'/g,
      "import { ComponentErrorBoundary } from '@/components/shared/ErrorBoundary'\nimport { modernStyles, roleStyles } from '@/lib/design-tokens'\nimport {"
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
});

console.log('🎉 All import statements fixed!');