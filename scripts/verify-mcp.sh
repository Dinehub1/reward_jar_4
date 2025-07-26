#!/bin/bash
echo "🔍 MCP Integration Verification"
echo "=============================="
echo "Date: $(date)"
echo ""

# Check environment
echo "📋 Environment Check:"
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ SUPABASE_ACCESS_TOKEN not set"
    exit 1
else
    echo "✅ SUPABASE_ACCESS_TOKEN: ${SUPABASE_ACCESS_TOKEN:0:15}..."
fi

# Check MCP process
echo ""
echo "🔍 Process Check:"
MCP_PROC=$(ps aux | grep "mcp-server-supabase" | grep -v grep)
if [ -n "$MCP_PROC" ]; then
    echo "✅ MCP server is running:"
    echo "   $MCP_PROC"
else
    echo "❌ MCP server is not running"
fi

# Check database connectivity
echo ""
echo "🗄️  Database Check:"
USER_COUNT=$(curl -s -H "apikey: $(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d'=' -f2)" \
    -H "Authorization: Bearer $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)" \
    "$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)/rest/v1/users?select=count&limit=1" | \
    jq -r '.[0].count' 2>/dev/null)

if [ -n "$USER_COUNT" ] && [ "$USER_COUNT" != "null" ]; then
    echo "✅ Database accessible: $USER_COUNT users"
else
    echo "❌ Database connection failed"
fi

echo ""
echo "🎯 Verification complete!"
