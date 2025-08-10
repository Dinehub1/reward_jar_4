## RewardJar Card System — Unified Documentation

### Overview
- Admins create and manage all cards. Businesses cannot create or edit cards.
- Platforms: Apple Wallet (.pkpass), Google Wallet (JWT Save URL), and PWA preview.

### Admin-only Card Creation
- UI: `src/app/admin/cards/new/page.tsx` (wizard + live previews); `src/app/admin/templates/*` (template + version management)
- API: `POST /api/admin/cards` → `src/app/api/admin/cards/route.ts`; `POST /api/admin/templates`, `POST /api/admin/templates/[id]/versions`
- Security: Uses `createServerClient()` for auth and `createAdminClient()` for DB writes (RLS bypass); checks `users.role_id === 1` for all admin template/card writes.

### Business Experience
- Pages: `src/app/business/*` allow viewing analytics, customers, and card lists only.
- All “create card” actions redirect to `src/app/business/no-access/page.tsx` with contact support guidance.

### Data Model and Rules
- Tables: `stamp_cards`, `membership_cards`, unified `customer_cards` for ownership.
- Locking: Businesses cannot write to card tables; RLS must enforce read-only for role_id = 2.
- Customer cards must reference only one: `stamp_card_id` or `membership_card_id`.
- Template immutability: `card_templates.type` is immutable after creation (DB trigger + API validation).

### CLV and Events
- `card_events`: logs `stamp_given`, `session_marked`, `purchase`, `reward_redeemed`, `template_published` with flexible `metadata`.
- `business_metrics`: aggregates `total_spent`, `total_rewarded`, and computed `clv`. Updated via trigger on `card_events` for purchase-like and reward events.

### Wallet Flows
- Apple: `GET /api/wallet/apple/[customerCardId]` builds base pass JSON via `src/lib/wallet/builders/apple-pass-builder.ts`, adds barcode with `src/lib/wallet/apple-helpers.ts`, and signs to `.pkpass` when certs present. `?debug=true` returns JSON.
- Google: `GET /api/wallet/google/[customerCardId]` builds a loyalty object and signs RS256 JWT, returning a Save URL page.
- PWA: `GET /api/wallet/pwa/[customerCardId]` renders HTML preview via `src/lib/wallet/builders/pwa-pass-builder.ts` with QR code.

### Builders (single sources of truth)
- Apple: `buildApplePassJson`, `convertHexToRgbColor` → `src/lib/wallet/builders/apple-pass-builder.ts`
- Apple helpers: `buildAppleBarcode`, `generatePKPass` → `src/lib/wallet/apple-helpers.ts`
- Google: `buildGoogleIds`, `createLoyaltyObject`, `createSaveToWalletJwt`, `buildSaveUrl` → `src/lib/wallet/builders/google-pass-builder.ts`
- PWA: `buildPwaHtml` → `src/lib/wallet/builders/pwa-pass-builder.ts`

### Field Mapping Consistency
- Utility: `src/lib/utils/field-mapping.ts` resolves legacy vs canonical names, ensuring DB constraints are met. Keep both legacy and canonical fields in writes where required (e.g., `name` + `card_name`, `total_stamps` + `stamps_required`).

### Event Tagging, Logging, Analytics
- Admin Events: `src/lib/admin-events.ts` for audit issues, deprecations, wallet failures, system errors, and cleanup notifications.
- Analytics: `lib/monitoring/analytics.ts` provides client-side tracking for card creation steps, API calls, errors, and web vitals. Server-side analytics endpoint: `src/app/api/analytics/route.ts`.

### Next.js 15 Params and Auth
- Routes/components must unwrap `params` appropriately: `await params` (server) / `use(params)` (client).
- Client components use `createClient()` only for auth state; no admin client on the client.

### Tests and Validation
- E2E and unit tests ensure admin card creation works and business UIs cannot create cards.
- Use `pnpm lint` and `pnpm test` before commits. Ensure wallet flows return valid responses (Apple `.pkpass`/JSON, Google Save URL HTML, PWA HTML).

### Maintenance
- Do not commit build artifacts (e.g., PKPass manifests). Builders generate artifacts at runtime.
- Keep this document in sync with code changes to builders, routes, and admin/business access rules.

