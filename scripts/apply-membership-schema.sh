#!/bin/bash

# Apply Membership Schema to Supabase Database
# RewardJar 4.0 - Gym Membership Cards Support

echo "🚀 Applying RewardJar 4.0 Membership Schema..."
echo "📅 $(date)"
echo ""

# Check if sql file exists
if [ ! -f "sql/membership_schema.sql" ]; then
  echo "❌ Error: sql/membership_schema.sql not found"
  echo "Please ensure the SQL file exists before running this script"
  exit 1
fi

# Apply schema changes to Supabase
echo "📊 Applying database schema changes..."
echo "   - Adding membership_type column to customer_cards"
echo "   - Creating membership_cards table"
echo "   - Creating session_usage table"
echo "   - Creating wallet_update_queue table"
echo "   - Setting up RLS policies"
echo "   - Creating triggers and functions"
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
  echo "✅ Supabase CLI found - applying via CLI"
  supabase db push --file sql/membership_schema.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Schema applied successfully via Supabase CLI"
  else
    echo "❌ Failed to apply schema via CLI"
    echo "📝 Please apply the SQL manually in Supabase dashboard"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Navigate to SQL Editor"
    echo "   3. Copy and paste the contents of sql/membership_schema.sql"
    echo "   4. Run the query"
  fi
else
  echo "⚠️  Supabase CLI not found"
  echo "📝 Please apply the SQL manually:"
  echo ""
  echo "1. Go to https://supabase.com/dashboard"
  echo "2. Navigate to your project → SQL Editor"
  echo "3. Copy and paste the contents of sql/membership_schema.sql"
  echo "4. Run the query"
  echo ""
  echo "Schema file location: sql/membership_schema.sql"
fi

echo ""
echo "🎯 After applying the schema, test the functionality:"
echo "   1. Start the development server: npm run dev"
echo "   2. Navigate to /test/wallet-preview"
echo "   3. Switch to 'Gym Memberships' tab"
echo "   4. Generate test data and test wallet generation"
echo "   5. Test session marking functionality"
echo ""
echo "✅ Schema application script completed" 