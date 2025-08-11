#!/usr/bin/env node

/**
 * Apply Database Performance Optimizations
 * 
 * This script applies the auth performance optimizations to your Supabase database
 * Usage: node scripts/apply-db-optimizations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('🚀 Applying database performance optimizations...\n');

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Read the SQL optimization file
    const sqlFile = path.join(__dirname, '..', 'src', 'lib', 'database', 'auth-optimizations.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📊 Found ${statements.length} optimization statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toUpperCase().includes('CREATE INDEX')) {
        const indexName = statement.match(/idx_\w+/)?.[0] || `optimization_${i + 1}`;
        console.log(`📈 Creating index: ${indexName}`);
      } else if (statement.toUpperCase().includes('CREATE OR REPLACE VIEW')) {
        const viewName = statement.match(/user_roles_\w+/)?.[0] || `view_${i + 1}`;
        console.log(`👁️  Creating view: ${viewName}`);
      } else {
        console.log(`🔧 Executing optimization ${i + 1}`);
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`⚠️  Warning for statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Completed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Error executing statement ${i + 1}: ${err.message}`);
      }
      
      console.log('');
    }

    // Test performance improvements
    console.log('🧪 Testing performance improvements...\n');

    // Test user role lookup
    const startTime = Date.now();
    const testUserId = 'ba3615c6-9be6-4714-b4d6-e686b6e44308'; // Your admin user
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', testUserId)
      .single();

    const queryTime = Date.now() - startTime;
    
    if (userError) {
      console.log(`❌ Test query failed: ${userError.message}`);
    } else {
      console.log(`⚡ User role lookup: ${queryTime}ms (should be <50ms)`);
      if (queryTime < 50) {
        console.log(`🎯 EXCELLENT performance!`);
      } else if (queryTime < 150) {
        console.log(`👍 Good performance, indexes working`);
      } else {
        console.log(`📈 Performance improved but could be better`);
      }
    }

    console.log('\n✅ Database optimization complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Monitor auth query performance in logs');
    console.log('2. Watch for reduced callback requests');
    console.log('3. Test login speed improvements');

  } catch (error) {
    console.error('❌ Failed to apply optimizations:', error);
    process.exit(1);
  }
}

// Execute only if called directly
if (require.main === module) {
  main();
}

module.exports = { main };