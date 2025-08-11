## DRY RUN — Cleanup: Enforce Admin-only Template Creation, Lock Card Type, Add CLV Tracking

This is a planning report. No code changes applied yet (branch created only). Review and confirm before proceeding to Phase B.

### Scope Analyzed
- Template/card creation UI and API
- Template versioning and publish endpoints
- QR/scan handlers (stamp/session)
- Wallet builders (Apple/Google/PWA)
- Possible non-admin routes that create/modify templates/versions
- Documentation files

### Findings — Creation & Templates
- API
  - `src/app/api/admin/templates/route.ts`
    - GET: lists `card_templates` using admin client (OK)
    - POST: creates template and initial version with `createAdminClient()`; lacks explicit admin auth check (risk: should verify role_id=1).
  - `src/app/api/admin/templates/[id]/route.ts`
    - GET: fetches template + versions (OK)
    - PATCH: updates `{ name, type }` directly. Risk: `type` should be immutable. Needs API validation to block `type` updates.
  - `src/app/api/admin/templates/[id]/versions/route.ts`
    - POST: creates new version; `publish` toggles and unpublishes others. No admin auth check (should verify admin).
  - `src/app/api/admin/cards/route.ts`
    - Admin card creation flow; includes admin role check pattern to reuse for templates.

- UI
  - `src/app/admin/templates/page.tsx`
    - Client UI to list and create templates via `/api/admin/templates` POST.
  - `src/app/admin/templates/[id]/page.tsx`
    - Editor with Save Draft/Publish triggering `/api/admin/templates/[id]/versions`.
  - `src/app/templates/page.tsx` (public route)
    - A preview/templating playground; does not POST but could be confused as creation entry. Keep, but ensure navigation does not link to editor for non-admins.
  - Business area: `src/app/business/**`
    - Onboarding cards page explicitly routes to `business/no-access` on create; no DB writes found. Messaging already says Admin-managed (OK).

### Findings — Publish/Version Endpoints
- `src/app/api/admin/templates/[id]/versions/route.ts` manages version creation and publish; lacks explicit admin auth enforcement.

### Findings — QR/Scan Handlers
- `src/app/api/wallet/mark-session/[customerCardId]/route.ts`
  - Handles QR-scan mark session/stamp; writes to `session_usage` and updates `customer_cards`. Candidate to emit `card_events` for CLV-related events like stamp or session usage (amount optional) and trigger admin cache invalidation (already present).
- `src/app/api/stamp/add/route.ts`
  - Admin-style add stamp/session endpoint. Candidate to log `card_events` (event_type: 'stamp_given' or 'session_used') and update CLV only when revenue is recorded.

### Findings — Wallet Builders (reference only)
- Apple: `src/lib/wallet/builders/apple-pass-builder.ts`
- Google: `src/lib/wallet/builders/google-pass-builder.ts`
- PWA: `src/lib/wallet/builders/pwa-pass-builder.ts`
No changes required for cleanup; will use for publish snapshot only.

### Security & Supabase Client Usage
- Multiple API routes correctly use `createAdminClient()` server-side. Ensure no usage in client components. No client-side occurrences detected.
- Template endpoints currently do not check admin auth explicitly; add `createServerClient()` session check + admin role verification before writes.

### Documentation
- Keep: `doc/CardSystem_Documentation.md`, `doc/CLEANUP_REPORT.md`
- Other docs appear consolidated already. Additional root docs exist: `NEXTJS_PKPASS_MIME_CONFIG.md` (keep), `README.md` (keep). No stale duplicates found beyond those already archived per `doc/CLEANUP_REPORT.md`.

---

## Proposed Changes (to apply after approval)

### 1) Enforce Admin-only Template Creation and Versioning
- API
  - `src/app/api/admin/templates/route.ts`
    - Add server session check via `createServerClient()` and verify `users.role_id === 1` using `createAdminClient()` before POST.
  - `src/app/api/admin/templates/[id]/route.ts`
    - Add admin auth check for PATCH and GET (for defense-in-depth on GET if needed). For PATCH, disallow `type` updates.
  - `src/app/api/admin/templates/[id]/versions/route.ts`
    - Add admin auth check before inserting versions and publishing.

### 2) Make `card_templates.type` Immutable
- DB migration: `migrations/2025XXXX_lock_card_type_and_clv.sql`
  - Add `prevent_card_type_update()` trigger on `card_templates` to block updates to `type`.
  - Update API PATCH to ignore/deny `type` field changes gracefully with 400 error.

### 3) Add CLV and Event Tracking
- DB migration additions in same file:
  - Create `public.card_events` table to log business events.
  - Create `public.business_metrics` table to aggregate `clv_cents` and `total_revenue_cents`.
  - Trigger `trg_update_business_metrics` after insert on `card_events` to update aggregates for event_types: `membership_purchase`, `purchase`, `reward_redeemed`.

- Backend updates to emit events:
  - `src/app/api/stamp/add/route.ts`: insert into `card_events` with event_type `stamp_given` (amount optional; no CLV update) and optionally `purchase` when bill amount is present.
  - `src/app/api/wallet/mark-session/[customerCardId]/route.ts`: insert `session_marked` or `stamp_given` accordingly (amount optional) and optionally a revenue event if bill present in flow.
  - Add small shared util for emitting events `src/lib/admin-events.ts` usage or new helper to centralize insert.

### 4) UI Adjustments
- Ensure admin-only pages (`/admin/templates`, editor) are gated by existing admin layout hooks. No non-admin creation UIs found in business area; retain no-access routing.
- Consider adding explicit notice on `src/app/templates/page.tsx` that creation is admin-only if linked anywhere public.

### 5) Tests
- Add unit tests for:
  - Preventing template type updates (API returns 400; DB trigger blocks direct update)
  - Inserting `card_events` on stamp/session flows
  - Aggregation updates to `business_metrics`
- Expand E2E to ensure business users cannot create templates or publish versions.

### 6) Docs Updates
- `doc/CardSystem_Documentation.md`:
  - Add section on template immutability (type), admin-only endpoints for templates/versions, CLV overview tables and triggers.
- `doc/CLEANUP_REPORT.md`:
  - Append this cleanup scope; record migrations and API hardening.

---

## Candidate File List

### APIs to edit
- `src/app/api/admin/templates/route.ts` (add admin auth on POST)
- `src/app/api/admin/templates/[id]/route.ts` (add admin auth; disallow type change)
- `src/app/api/admin/templates/[id]/versions/route.ts` (add admin auth)
- `src/app/api/stamp/add/route.ts` (emit events; optional revenue)
- `src/app/api/wallet/mark-session/[customerCardId]/route.ts` (emit events; optional revenue)

### New files
- `migrations/2025XXXX_lock_card_type_and_clv.sql` (as specified)

### Docs to edit
- `doc/CardSystem_Documentation.md`
- `doc/CLEANUP_REPORT.md`

### Stale/duplicate docs
- None newly detected. Already consolidated per existing cleanup report.

---

## Open Questions for Confirmation
- Should `session_marked` and `stamp_given` affect CLV? Current plan: no revenue impact unless `amount_cents` is provided and event_type is purchase-like.
- Do we want to log publish actions (`template_published`) into `card_events`? Proposed: yes, for audit.
- Any additional event types to include up-front?

---

Prepared on branch: cleanup/admin-lock-clv-YYYYMMDD-HHMMSS

