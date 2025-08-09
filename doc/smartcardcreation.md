# Smart Card Creation System — Analysis, Redesign, and Implementation Guide

Generated: Aug 2025

## Implementation snapshot (current status)

This repo now contains the first working slice of the Smart Card Creation System described below. Highlights:

- Admin wizard at `/admin/cards/new` includes:
  - Step 0: Card Type (Stamp or Membership)
  - Step 1: Mode (Standard vs Advanced — advanced scaffold in place)
  - Sticky, always-on preview using `CardLivePreview` across all steps and platforms (Apple/Google/PWA)
- Admin dashboard at `/admin/cards` adds a Templates tab (lightweight), and a dedicated Templates index/editor is available at `/admin/templates` and `/admin/templates/[id]`.
- Template + Version APIs implemented (server-only, admin client):
  - GET/POST `/api/admin/templates`
  - GET/PATCH `/api/admin/templates/[id]`
  - POST `/api/admin/templates/[id]/versions` (supports `publish: true` to publish and unpublish older versions)
- Version publishing generates pass snapshots only on publish using centralized builders (Apple JSON and Google Loyalty object preview). Draft saves do not generate pass JSON.
- Zod-based authoring validation for canonical camelCase shape.
- Debounced autosave drafts (localStorage + server draft save).
- Supabase migration added for `card_templates` and `card_template_versions` (see Section 5).

What’s next: expand the Advanced Designer (sections/ordering), enforce per-platform limits inline, and complete E2E tests for publish/rollback and preview parity.

## 1) Current System Overview and Gaps

This section summarizes the existing card creation and management experience based on the current codebase and UI flows.

### 1.1 Admin Cards Listing and Management

- Page: `src/app/admin/cards/page.tsx`
- Capabilities
  - Tabs for Stamp and Membership cards with stats (counts, active, customers)
  - Search and status filtering
  - Live preview panel using unified `CardLivePreview` with canonical field mapping
  - Data loaded via `/api/admin/dashboard-unified`
- Gaps
  - No “template” concept surfaced (cannot create/edit reusable templates)
  - Preview exists but not deeply actionable (no quick links to issuance, test wallets, or template edit)
  - Limited smart insights (e.g., engagement, conversion, expiry health)

### 1.2 Card Creation (New)

- Page: `src/app/admin/cards/new/page.tsx`
- Capabilities
  - Template selector (Coffee, Restaurant, Salon/Spa, Retail Store, Fitness, Custom)
  - Multi-step wizard: Details → Design → Stamp Rules → Information → Preview & Save
  - Real-time platform preview in Step 4 via `CardLivePreview`
  - Validations (required fields, ranges)
  - Save creates a server payload via `mapQuickToAdvancedPayload`
- Gaps
  - Card type selection not explicit up-front (flow is stamp-first; membership not fully supported here)
  - No explicit “Standard vs Advanced” mode
  - Advanced customization (layout sections, field ordering, images set, multi-branding, back-of-card structure) is limited
  - Preview appears primarily on final step; earlier deep platform-specific preview would be beneficial
  - No first-class template/version management (draft/publish, rollback)
  - Context exists (`CardCreationContext`) but page is self-contained; opportunities to consolidate

### 1.3 Preview and Mapping

- Unified preview: `src/components/unified/CardLivePreview.tsx` and `src/components/shared/CardPresentational.tsx`
- Mapping utilities: `src/lib/utils/field-mapping.ts`, `src/lib/card-mappers.ts`
- Gaps
  - Some pages use inline mappings; consolidation on a single mapper increases consistency
  - Live preview props are camelCase; ensure all admin pages normalize database shapes consistently

### 1.4 Wallet Builders and Compliance (Existing)

- Centralized builders: Apple, Google, PWA (see `doc/CARD_WALLET_AUDIT.md`, `doc/WALLET_JSON_AUDIT.md`)
- Apple helpers consolidated and URL construction standardized
- Gaps
  - Ensure Apple uses a single `barcodes` array consistently and centralized barcode/webServiceURL helpers everywhere
  - Membership issuance and PWA experiences should reuse the same builders/patterns

## 2) Proposed Smart Card Creation Architecture and Workflow

### 2.1 Goals

- Provide a scalable, secure, and user-friendly system to author, preview, version, and publish loyalty cards
- Unify templates and live preview across all screens
- Ensure Apple Wallet and Google Wallet compliance

### 2.2 Architecture Overview

- Pages & flows
  - Card Overview Dashboard (cards + templates)
  - Template Editor (Standard and Advanced modes)
  - Card Creation Wizard (per business, using templates)
  - Customer Join/Issuance flows
- Services
  - Admin APIs for templates, versions, and cards (server-only, RLS-aware; admin client only in server routes)
  - Wallet APIs (Apple PKPass generation/signing; Google JWT Save URL; PWA HTML/manifest)
- Core principles
  - Canonical data shape; strict field mapping between UI (camelCase) and DB (snake_case)
  - DRY builders for Apple/Google/PWA
  - Template versioning with publish/draft lifecycle

### 2.3 Smart Card Lifecycle (Modeled on SCMS)

Adopt a simplified lifecycle for loyalty “smart cards,” aligning with industry SCMS nomenclature: Register → Issue → Activate/Deactivate → Lock/Unlock → Revoke → Retire → Delete. See: [Smart card management system — Wikipedia](https://en.wikipedia.org/wiki/Smart_card_management_system).

- Register: Create a template/version; card class exists in the system
- Issue: Instantiate customer-linked card (Apple/Google/PWA issuance)
- Activate/Deactivate: Temporarily toggle card’s usability (e.g., business suspension)
- Lock/Unlock: Prevent or re-enable user access (fraud handling)
- Revoke: Invalidate credentials (e.g., invalid Apple auth token)
- Retire/Delete: Remove or disconnect card/template from active use

Security side-notes (key lengths, RNG, secure communications) from smart card contexts are instructive for wallet integrations and PKI signing. See: [Smart card security considerations (ABC4Trust)](https://github.com/p2abcengine/p2abcengine/wiki/Smart-card-security-considerations) and Secure Technology Alliance publications directory: <https://www.securetechalliance.org/publications-smart-card-security/>.

## 3) UI/UX — New System

### 3.1 Card Overview Dashboard

- Cards and Templates tabs
- Filters: business, status, type, updated date, published/draft
- Smart insights: active installs, recent adds, completion to reward, upcoming expiries
- Quick Actions per item: Preview (Apple/Google/PWA), Edit Template, Duplicate, Archive, Publish/Unpublish
- Batch actions: Publish, Archive, Export

### 3.2 Create New Card — Multi-step

Step 0: Select Card Type
- Options: Stamp, Membership (extensible: Coupon, Gift Card, Tiered Loyalty)
- Live preview: visible from the start with sensible defaults or selected template baseline

Step 1: Choose Mode
- Standard (template-based): pick from curated templates; configure essentials (name, color, emoji, counts)
- Advanced (full customization): unlock full designer (sections, layout, assets, back-of-card fields, color/tokens)
- Live preview: persists on the right; updates in real time when switching modes

Step 2: Business & Basics
- Business selector (logo, name prefill)
- Card basics: name, reward summary, required counts (or sessions), expiries
 - Live preview: instantly reflects each keystroke/change (brand/logo/name/colors)

Step 3: Design
- Theme: solid/gradient/image; brand color; contrast checker
- Asset management: logo/icon upload, background image with cropping
- Typography scale and compact mode toggle
 - Live preview: same component and controls across steps (platform switch, front/back); no visual drift

Step 4: Rules & Data
- Stamp rules (min spend, duplicate buffer, caps)
- Membership rules (sessions, pricing, duration)
- Validation hints for Apple/Google limits
 - Live preview: demo progress and counters update immediately; rule hints surface in-line

Step 5: Information (Back of card)
- Reward details, description, how-to-earn, support links
 - Live preview: back-of-card content updates as you type (consistent layout)

Step 6: Preview & Publish
- Real-time preview with platform toggle (Apple/Google/PWA), visible from start to end (sticky side panel)
- Draft/Publish with version notes; Save as Template

### 3.3 Always-on Live Preview (Start-to-End)

- A single, shared preview component (`CardLivePreview` → `CardPresentational`) is rendered as a sticky right panel across Steps 0–6. Implemented in the wizard and in the Template Editor.
- Real-time updates: all form inputs (both Standard and Advanced) update the preview immediately with no step-change flicker.
- Consistent controls from start to end:
  - Platform switch: Apple / Google / PWA
  - Front/Back toggle (back-of-card content reflects Information step fields)
  - Optional demo progress scrubber (for admin testing only)
- Data mapping: uses one canonical mapper to avoid casing drift; identical visuals across all screens.
- Graceful defaults: when required fields are missing (e.g., before a template is chosen), the preview shows placeholder content with validation hints.
- Performance: memoization and debounced heavy ops for image processing; no blocking UI on keystrokes.

### Advanced Mode Designer

- Section builder mapped to platform-specific fields:
  - Apple: headerFields, primaryFields, secondaryFields, auxiliaryFields, backFields
  - Google: loyalty object fields, labels, colors, barcode
- Layout presets and drag-and-drop ordering
- Per-platform nudges if a configuration exceeds known limits

### UX Guardrails

- Zod-based validation with inline hints and platform-specific constraints
- Minimum loading states, auth hydration guards (Next 15 best practices)
- Autosave drafts; undo/redo in the designer

## 4) Apple Wallet and Google Wallet Compliance

 Apple Wallet (PKPass)
- Prefer `barcodes` array; consistent QR configuration
- Use flat `backgroundColor`; avoid gradients in pass JSON
- Asset requirements: `icon.png` (29/58/87px), `logo.png` with @2x/@3x
- Web service URL + authentication token for updates
- Keep text lengths within safe ranges; section counts conservative

Google Wallet (Loyalty/Membership)
- Provide `programName`, proper logo, and `hexBackgroundColor`
- QR barcode recommended; mirror value to object ID/customer card ID
- JWT Save URL signed with service account
- Prelaunch testing and launch readiness: follow Google Wallet guidance for button/UI tests and publishing flow (see References)

Industry context for security and lifecycle is informed by SCMS and smart-card practices: [Wikipedia — SCMS](https://en.wikipedia.org/wiki/Smart_card_management_system), [Smart card security considerations](https://github.com/p2abcengine/p2abcengine/wiki/Smart-card-security-considerations), and Secure Technology Alliance resources: <https://www.securetechalliance.org/publications-smart-card-security/>.

## 5) Data Model Updates (Supabase)

Adopt versioned templates and customer-linked cards (aligned with `doc/SMART_CARD.md`).

Tables
- `card_templates(id, business_id, name, type, schema_version, created_by, created_at)`
- `card_template_versions(id, template_id, version, ui_payload, pass_payload, is_published, created_at)`
- `customer_cards(id, user_id, template_id, template_version, card_type, state, created_at)`

Notes
- UI payload: canonical camelCase authoring shape
- Pass payload: resolved platform-ready fields (from builders)
- RLS: admin SELECT policies across tables; business and customer scoping per role

Applied migration (abbreviated):

```sql
create table if not exists card_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name text not null,
  type text not null check (type in ('stamp','membership')),
  schema_version int not null default 1,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists card_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references card_templates(id) on delete cascade,
  version int not null,
  ui_payload jsonb not null,
  pass_payload jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create index if not exists idx_card_templates_business_type on card_templates (business_id, type);
create index if not exists idx_card_template_versions_template_pub on card_template_versions (template_id, is_published);
```

## 6) API & Builders

Admin APIs (server routes)
- Templates
  - GET/POST `/api/admin/templates`
    - POST body: `{ businessId, name, type: 'stamp'|'membership', uiPayload }`
  - GET/PATCH `/api/admin/templates/[id]`
  - POST `/api/admin/templates/[id]/versions` (publish/draft)
    - Body: `{ uiPayload, publish?: boolean }`
    - On publish: mark new version published and unpublish older ones atomically; generate pass snapshots for Apple/Google
- Cards
  - POST `/api/admin/cards` (instantiate from template version OR raw canonical form)
  - GET `/api/admin/cards` (dashboard data)

Wallet APIs
- Apple: PKPass generation/signing using centralized builder; updates route sharing helpers
- Google: Loyalty/Membership object + JWT Save URL using centralized builder
- PWA: HTML generator + manifest via unified builder

Builders (single sources of truth)
- `apple-pass-builder.ts`, `google-pass-builder.ts`, `pwa-pass-builder.ts`
- Central helpers: `buildAppleBarcode`, `getAppleWebServiceUrl`, color utilities

Response shapes (examples)

```json
// GET /api/admin/templates
{ "success": true, "data": [ { "id": "...", "business_id": "...", "name": "Coffee", "type": "stamp", "schema_version": 1 } ] }

// POST /api/admin/templates/[id]/versions (publish)
{ "success": true, "data": { "id": "...", "template_id": "...", "version": 2, "is_published": true, "ui_payload": { ... }, "pass_payload": { "apple": { ... }, "google": { "loyaltyObject": { ... } } } } }
```

## 7) Implementation Plan

Phase 1: Foundations — Implemented
- Templates & Versions data model and admin APIs (see Sections 5–6)
- Consolidated preview mapping via `mapAdminCardFormToPreview`

Phase 2: UI — In progress
- Dashboard Templates tab added; dedicated Templates index/editor available
- Wizard includes Step 0 (type) and Step 1 (mode)
- Sticky real-time preview across all steps (implemented)

Phase 3: Advanced Designer
- Section builder with per-platform validation hints
- Asset management (upload, crop) and contrast checks

Phase 4: Compliance & QA — Planned
- Enforce Apple/Google limits inline (Zod hints + UI)
- Device tests (iOS Wallet, Android Google Wallet); Playwright screenshots

## 8) Tech Stack & Libraries

- Next.js 15 (route params unwrapped via `await params` on server; `use(params)` on client)
- Type-safe builders and SWR-based data fetching
- React Hook Form + Zod, Framer Motion for UI polish
- `jsonwebtoken`, `google-auth-library` for Google Wallet
- Custom PKPass signing with OpenSSL-based implementation or `@walletpass/pass-js`

Security
- NEVER use `createAdminClient()` in client components; server-only for admin operations
- Validate required env vars at startup

## 9) Testing Strategy

- Unit: builders, mappers, template publishing (initial smoke tests added)
- Integration: API routes (templates/versions/cards), Apple PKPass generation, Google Save URL
- E2E: wizard flows (Standard/Advanced), preview parity, join → add to wallet; Templates tab/editor navigation (baseline added)
- Visual: Playwright snapshots across light/dark and presets
- Google Wallet: complete Pre-launch Testing and Launch Checklist (button behavior, UI guidelines, image/headings conformance) before go-live

## 10) Extensibility

- New Card Types: extend template union, preview mappers, and builders
- Pluggable sections: constrained schema mapping to platform-specific fields
- Versioning: safe publish/rollback with audit trail

## 11) References

- Smart card management system (lifecycle nomenclature): [Wikipedia](https://en.wikipedia.org/wiki/Smart_card_management_system)
- Smart card security considerations (key lengths, RNG, secure channels): [GitHub Wiki](https://github.com/p2abcengine/p2abcengine/wiki/Smart-card-security-considerations)
- Secure Technology Alliance — Publications (security context): <https://www.securetechalliance.org/publications-smart-card-security/>
- Google Wallet — Pre-launch Testing (Loyalty): `https://developers.google.com/wallet/retail/loyalty-cards/test-and-go-live/prelaunch-testing`
- Google Wallet — Launch checklist: `https://developers.google.com/wallet/retail/loyalty-cards/test-and-go-live/launch-checklist`

