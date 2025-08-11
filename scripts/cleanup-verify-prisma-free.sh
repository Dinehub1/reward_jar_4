#!/usr/bin/env bash

# ===============================================
# 🧹 CLEANUP + VERIFY SCRIPT (Prisma-free)
# ===============================================
# Purpose:
# 1. Ensure no duplicate/similar components/files.
# 2. Verify API endpoints work and are organized correctly.
# 3. Enforce admin-only card creation flow.
# 4. Check Supabase integration (admin role, service role key usage).
# 5. Prepare project for deployment.
# ===============================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==============================================="
echo "🚀 Starting Cleanup + Verification"
echo "==============================================="

# 1️⃣ Remove unused / duplicate files
echo "[Step 1] Scanning for duplicate or similar files..."
if command -v fdupes >/dev/null 2>&1; then
  fdupes -r src | tee duplicates.log || true
else
  echo "⚠️ fdupes not installed. On macOS: brew install fdupes"
  : > duplicates.log
fi
if [ -s duplicates.log ]; then
  echo "⚠️ Duplicates found! Please review duplicates.log"
else
  echo "✅ No duplicates found."
fi

# 2️⃣ ADMIN DASHBOARD CHECKS FIRST
echo "[Step 2] Verifying Admin Dashboard..."
if [ -d "src/app/admin" ]; then
  echo "📂 Admin dashboard folder exists."
else
  echo "❌ Missing admin dashboard folder! Deployment blocked."
  exit 1
fi

# 3️⃣ Enforce admin-only card creation
echo "[Step 3] Checking card creation API for admin enforcement..."
ADMIN_CARDS_ROUTE="src/app/api/admin/cards/route.ts"
if [ ! -f "$ADMIN_CARDS_ROUTE" ]; then
  echo "❌ $ADMIN_CARDS_ROUTE missing."
  exit 1
fi
if ! grep -Eq "export (async function|const) POST" "$ADMIN_CARDS_ROUTE"; then
  echo "❌ $ADMIN_CARDS_ROUTE has no POST handler."
  exit 1
fi

# Ensure there are no non-admin POST handlers for card creation
NON_ADMIN_POST=$(find src/app/api -type f -path "*/route.ts" \
  ! -path "*/admin/*" \
  -exec grep -El "export (async function|const) POST" {} + | \
  grep "/cards/" || true)
if [ -n "$NON_ADMIN_POST" ]; then
  echo "❌ Found POST handlers for card routes outside admin:"
  echo "$NON_ADMIN_POST" | sed 's/^/ - /'
  exit 1
fi
echo "✅ Admin-only card creation check passed."

# 4️⃣ API ENDPOINT VERIFICATION
echo "[Step 4] Checking API endpoints..."
MISSING_HANDLER=0
while IFS= read -r file; do
  echo "🔍 Checking $file"
  if ! grep -Eq "export (async function|const) (GET|POST|PATCH|PUT|DELETE|OPTIONS|HEAD)" "$file"; then
    echo "❌ $file missing HTTP handler export (GET/POST/etc)."
    MISSING_HANDLER=1
  fi
done < <(find src/app/api -type f -name "route.ts" | sort)
if [ "$MISSING_HANDLER" -ne 0 ]; then
  echo "⚠️ Some routes are missing handler exports. Review above."
fi

# 5️⃣ SUPABASE SECURITY CHECK
echo "[Step 5] Checking Supabase service role key usage..."
# 5a) Ensure service role key never exposed client-side
if grep -R -n "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" src >/dev/null 2>&1; then
  echo "❌ Found NEXT_PUBLIC exposure of SUPABASE_SERVICE_ROLE_KEY — remove immediately"
  exit 1
fi

# 5b) Ensure no admin client usage inside client components
CLIENT_FILES=$(grep -R -l --include='*.ts' --include='*.tsx' "^'use client'" src || true)
VIOLATIONS=()
if [[ -n "${CLIENT_FILES:-}" ]]; then
  while IFS= read -r file; do
    if grep -qE "createAdminClient|@/lib/supabase/admin-client" "$file"; then
      VIOLATIONS+=("$file")
    fi
  done <<< "$CLIENT_FILES"
fi
if (( ${#VIOLATIONS[@]} > 0 )); then
  echo "❌ Found admin client usage in client components (violates security rules):"
  printf '%s\n' "${VIOLATIONS[@]}" | sed 's/^/ - /'
  exit 1
fi

# 5c) Guard against accidental service_role references in client code
if grep -R -n --include='*.tsx' --include='*.ts' "service_role" src/components src/app/*/*/page.tsx >/dev/null 2>&1; then
  echo "❌ Found 'service_role' tokens in client-facing code. Remove them."
  exit 1
fi
echo "✅ Supabase security checks passed."

# 6️⃣ BUSINESS & CUSTOMER SIDE VERIFICATION
echo "[Step 6] Checking Business & Customer side routes..."
for dir in business customer; do
  if [ -d "src/app/$dir" ]; then
    echo "📂 $dir section exists."
  else
    echo "⚠️ $dir section missing."
  fi
done

# 7️⃣ ENVIRONMENT CHECK
echo "[Step 7] Checking required environment variables..."
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")
ENV_FILES=(.env .env.local .env.development .env.production env.local.template env.example)
for var in "${REQUIRED_VARS[@]}"; do
  FOUND=0
  for f in "${ENV_FILES[@]}"; do
    if [ -f "$f" ] && grep -q "^$var=" "$f"; then
      FOUND=1
      break
    fi
  done
  if [ "$FOUND" -eq 1 ]; then
    echo "✅ $var found in env files."
  else
    echo "❌ $var missing!"
    exit 1
  fi
done

# 8️⃣ FINAL CLEANUP REPORT
echo "[Step 8] Generating cleanup report..."
{
  echo "Cleanup & Verification completed on $(date)"
  echo "Duplicates lines: $(wc -l < duplicates.log)"
  echo "Admin card creation enforced: YES"
  echo "Deployment ready: YES (if no ❌ above)"
} > cleanup-report.txt

echo "==============================================="
echo "🎯 Cleanup + Verification Done"
echo "📄 See cleanup-report.txt for summary."
echo "==============================================="

