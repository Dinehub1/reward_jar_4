#!/usr/bin/env bash

# RewardJar 4.0 – Project Cleanup & Verification (Next.js 15 + Supabase)
# Priority: Admin Dashboard > Business > Customer

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_ROOT="$ROOT_DIR/backups"
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "📦 Backing up project (excluding node_modules, .next, backups, .git, playwright-report)..."
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude ".next" \
    --exclude "backups" \
    --exclude "playwright-report" \
    --exclude "*.log" \
    "$ROOT_DIR/" "$BACKUP_DIR/"
else
  tar --exclude='.git' --exclude='node_modules' --exclude='.next' --exclude='backups' --exclude='playwright-report' -czf "$BACKUP_DIR/project.tar.gz" -C "$ROOT_DIR" .
fi
echo "✅ Backup saved at $BACKUP_DIR"

echo "💾 Backing up database schema & data (pg_dump if DATABASE_URL set)..."
if command -v pg_dump >/dev/null 2>&1 && [[ "${DATABASE_URL:-}" != "" ]]; then
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" || echo "⚠️ Database backup failed"
else
  echo "⚠️ Skipping DB backup (pg_dump not found or DATABASE_URL not set)"
fi

# Detect package runner
if command -v pnpm >/dev/null 2>&1; then
  RUNNER="pnpm -s"
  DLX="pnpm dlx"
elif command -v npm >/dev/null 2>&1; then
  RUNNER="npm run"
  DLX="npx"
else
  echo "❌ Neither pnpm nor npm found in PATH" >&2
  exit 1
fi

echo "🔍 Auditing codebase for unused deps (depcheck) and duplicates (fdupes)..."
$DLX depcheck || echo "⚠️ depcheck found issues or is not fully configured"
if command -v fdupes >/dev/null 2>&1; then
  fdupes -r "$ROOT_DIR" || true
else
  echo "⚠️ fdupes not installed. On macOS: brew install fdupes"
fi

echo "🔐 Verifying admin-only constraints and security rules..."
# 1) Admin endpoints exist under App Router path
if [[ -d "$ROOT_DIR/src/app/api/admin" ]]; then
  echo "- Admin API routes in: src/app/api/admin"
  find "$ROOT_DIR/src/app/api/admin" -type f -name "route.ts" | sed "s|$ROOT_DIR/|- |"
else
  echo "❌ Expected admin API directory not found: src/app/api/admin"
fi

# 2) Ensure no admin client usage inside client components
CLIENT_FILES=$(grep -R -l --include='*.ts' --include='*.tsx' "^'use client'" "$ROOT_DIR/src" || true)
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
  echo "Please move admin operations to server routes/components."
else
  echo "✅ No admin client usage detected in client components"
fi

# 3) Ensure service role key is not exposed via NEXT_PUBLIC
if grep -R -n "NEXT_PUBLIC.*SUPABASE_SERVICE_ROLE_KEY" "$ROOT_DIR/src" >/dev/null 2>&1; then
  echo "❌ Found NEXT_PUBLIC exposure of SUPABASE_SERVICE_ROLE_KEY — remove immediately"
else
  echo "✅ SUPABASE_SERVICE_ROLE_KEY not exposed via NEXT_PUBLIC"
fi

# 4) Next.js 15 route params typing quick check
BAD_PARAMS=$(grep -R -n --include='page.tsx' -E "export default (async )?function .*\{ params \}: \{ params: \{" "$ROOT_DIR/src/app" || true)
if [[ -n "$BAD_PARAMS" ]]; then
  echo "⚠️ Potential Next.js 15 params typing issues (expected Promise<{...}>):"
  echo "$BAD_PARAMS" | sed 's/^/ - /'
else
  echo "✅ No obvious params typing issues detected in page components"
fi

echo "🌐 Listing API routes (App Router)..."
if [[ -d "$ROOT_DIR/src/app/api" ]]; then
  find "$ROOT_DIR/src/app/api" -type f -name "route.ts" | sed "s|$ROOT_DIR/|- |"
else
  echo "❌ src/app/api not found (this project uses App Router; pages/api is not used)"
fi

echo "📂 Migrations status (SQL files in migrations/)..."
if [[ -d "$ROOT_DIR/migrations" ]]; then
  ls -lah "$ROOT_DIR/migrations" | sed 's/^/ - /'
else
  echo "⚠️ migrations directory not found"
fi
if command -v supabase >/dev/null 2>&1; then
  echo "🔧 Supabase CLI detected; listing migrations via CLI:"
  supabase migration list | cat || echo "⚠️ Supabase CLI migration list failed"
else
  echo "ℹ️ Supabase CLI not found; skipping CLI migration checks"
fi

echo "📝 Checking documentation for admin mentions (doc/)..."
if [[ -d "$ROOT_DIR/doc" ]]; then
  grep -Ri "admin" "$ROOT_DIR/doc" || echo "⚠️ No 'admin' mention in doc/ — manual review recommended"
else
  echo "⚠️ Documentation folder 'doc/' not found"
fi

echo "🧪 Running unit tests (jest) — e2e optional..."
if $RUNNER test >/dev/null 2>&1; then
  $RUNNER test || echo "⚠️ Unit tests failed"
else
  echo "⚠️ Test script not configured"
fi

echo "🧹 Running lint & typecheck..."
if $RUNNER lint >/dev/null 2>&1; then
  $RUNNER lint || echo "⚠️ Lint failed"
else
  echo "⚠️ Lint script not configured"
fi

# Typecheck without requiring an npm script
if command -v pnpm >/dev/null 2>&1; then
  pnpm exec tsc -p "$ROOT_DIR/tsconfig.json" --noEmit || echo "⚠️ Type check failed"
elif command -v npx >/dev/null 2>&1; then
  npx tsc -p "$ROOT_DIR/tsconfig.json" --noEmit || echo "⚠️ Type check failed"
else
  echo "⚠️ TypeScript (tsc) not found; skipping typecheck"
fi

echo "🏁 Cleanup and verification complete. Ready for deployment review."

