# Cleanup Report

Date: 2025-08-10

## Scope
Repository cleanup to remove unused/duplicate files and artifacts while preserving wallet functionality and key docs.
Also enforces admin-only template management, immutable template type, and adds CLV/event tracking.

## Must-Keep Docs (retained)
- Consolidated docs into `doc/CardSystem_Documentation.md` replacing:
  - `doc/cardflow.md`
  - `doc/PERFORMANCE_OPTIMIZATION_SUMMARY.md`
  - `doc/SMART_CARD.md`
  - `doc/WALLET_JSON_AUDIT.md`

## Deleted Files
- Duplicate/old docs and audits:
  - doc/CLEANUP_NOTES.md
  - doc/CARD_WALLET_CLEANUP.md
  - doc/smartcardcreation.md
  - doc/MODERN_ADMIN_UI_PLAN.md
  - doc/CODEBASE_DUPLICATION_AUDIT.md
  - doc/CARD_WALLET_AUDIT.md
  - doc/ADMIN_SYSTEM_AUDIT_REPORT.md
  - doc/doc2/* (debug/planning/guides)
- Build artifacts:
  - dist/* (pkpass, icons, signatures, ios_production_build/*)
- Code duplication removal:
  - Dropped local `generatePKPass` in `src/app/api/wallet/apple/[customerCardId]/route.ts` (use `src/lib/wallet/apple-helpers.ts::generatePKPass`)
- Debug page:
  - src/app/debug-maps (deleted)

## Merges / Consolidation
- Apple .pkpass generation now uniformly uses `src/lib/wallet/apple-helpers.ts::generatePKPass`.

## Security & Access Hardening
- Admin-only enforcement added for template creation and version publishing endpoints:
  - `POST /api/admin/templates`
  - `PATCH /api/admin/templates/[id]` (blocks type changes)
  - `POST /api/admin/templates/[id]/versions`
- Business UIs continue to redirect to `business/no-access` for create actions.

## Database Migrations
- `migrations/20250810_lock_card_type_and_clv.sql`:
  - Prevent updates to `card_templates.type` after creation
  - Added `card_events` (audit/events with metadata)
  - Added `business_metrics` (aggregated CLV: total_spent, total_rewarded, clv)
  - Trigger to update CLV on purchase-like and reward events

## Event Logging
- Stamp/session flows now emit events to `card_events`:
  - `src/app/api/stamp/add/route.ts`
  - `src/app/api/wallet/mark-session/[customerCardId]/route.ts`
- Template publish logs `template_published` events (non-financial).

## Renames / De-duplications
- Deprecated references updated to point to `doc/CardSystem_Documentation.md`.

## Before / After File Count (approx.)
- Before: included multiple doc variants and dist artifacts
- After: ~20+ doc files removed; ~15+ artifacts in dist removed; one debug page removed

## Build & Validation
- Build: SUCCESS (`npm run build`)
- Wallet routes present and compiled:
  - /api/wallet/apple/[customerCardId]
  - /api/wallet/google/[customerCardId]
  - /api/wallet/pwa/[customerCardId]
- Apple generation: shared builder + helpers (barcode + PKPass signing when certs provided)
- Google JWT: unchanged; requires service account env to sign

## Notes / Follow-ups
- Consider gating verbose console logs behind `process.env.NODE_ENV !== 'production'` in admin hooks/services to reduce noise.
- `.gitignore` excludes `/dist/` and `*.pkpass`.
- If other debug-only pages exist, we can remove or protect them behind dev flags similarly.