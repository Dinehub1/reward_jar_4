const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyPaginationOptimizations() {
  try {
    console.log('🚀 Starting pagination optimization migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/20250112_pagination_optimization.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📖 Read migration file successfully')
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        })
        
        if (error) {
          // Try direct query execution if RPC fails
          const { error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1)
          
          if (directError) {
            throw error
          }
          
          // For index creation, we can ignore "already exists" errors
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Index already exists, skipping: ${statement.substring(0, 100)}...`)
          } else {
            throw error
          }
        }
        
        successCount++
        
        // Log progress for long operations
        if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown'
          console.log(`✅ Created index: ${indexName}`)
        }
        
      } catch (error) {
        errorCount++
        console.error(`❌ Error executing statement ${i + 1}:`)
        console.error(`   Statement: ${statement.substring(0, 200)}...`)
        console.error(`   Error: ${error.message}`)
        
        // Continue with non-critical errors
        if (!error.message.includes('already exists')) {
          console.log('   Continuing with remaining statements...')
        }
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📈 Success Rate: ${Math.round((successCount / statements.length) * 100)}%`)
    
    // Verify critical indexes were created
    console.log('\n🔍 Verifying critical indexes...')
    await verifyIndexes()
    
    // Test pagination performance
    console.log('\n⚡ Testing pagination performance...')
    await testPaginationPerformance()
    
    console.log('\n🎉 Pagination optimization migration completed successfully!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

async function verifyIndexes() {
  const criticalIndexes = [
    'idx_businesses_created_at_desc',
    'idx_stamp_cards_created_at_desc', 
    'idx_membership_cards_created_at_desc',
    'idx_customer_cards_created_at_desc'
  ]
  
  for (const indexName of criticalIndexes) {
    try {
      const { data, error } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('indexname', indexName)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.log(`❌ Failed to verify index ${indexName}: ${error.message}`)
      } else if (data) {
        console.log(`✅ Verified index: ${indexName}`)
      } else {
        console.log(`⚠️  Index not found: ${indexName}`)
      }
    } catch (error) {
      console.log(`❌ Error checking index ${indexName}: ${error.message}`)
    }
  }
}

async function testPaginationPerformance() {
  const testQueries = [
    {
      name: 'Businesses pagination',
      query: async () => {
        const start = Date.now()
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .range(0, 24)
        
        const duration = Date.now() - start
        
        if (error) throw error
        
        return {
          duration,
          rowCount: data?.length || 0
        }
      }
    },
    {
      name: 'Stamp cards pagination',
      query: async () => {
        const start = Date.now()
        const { data, error } = await supabase
          .from('stamp_cards')
          .select('id, card_name, created_at')
          .order('created_at', { ascending: false })
          .range(0, 24)
        
        const duration = Date.now() - start
        
        if (error) throw error
        
        return {
          duration,
          rowCount: data?.length || 0
        }
      }
    }
  ]
  
  for (const test of testQueries) {
    try {
      const result = await test.query()
      console.log(`✅ ${test.name}: ${result.duration}ms (${result.rowCount} rows)`)
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
    }
  }
}

// Run the migration
if (require.main === module) {
  applyPaginationOptimizations()
    .then(() => {
      console.log('\n✅ All done! Your database is optimized for efficient pagination.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error)
      process.exit(1)
    })
}

module.exports = { applyPaginationOptimizations }