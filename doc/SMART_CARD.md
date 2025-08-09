## Smart Card Creation System

### Project scope

Build an extensible system to create and manage two initial card types — Stamp Cards and Membership Cards — with a powerful admin interface for template editing, real‑time previews, validations against Apple Wallet and Google Wallet, and server‑side pass generation. The backend stores reusable templates and user‑linked card instances. The system must follow Next.js 15 patterns and Supabase security rules.

Links: [Apple Wallet HIG](https://developer.apple.com/design/human-interface-guidelines/wallet), [Google Wallet design](https://developers.google.com/wallet)

---

### Architecture overview

```mermaid
graph TD
  AdminUI[Admin UI (Next.js client)] -->|SWR/API| TemplatesAPI[Templates API]
  AdminUI -->|Live Preview Data| Preview[CardLivePreview]
  TemplatesAPI --> DB[(Supabase: card_templates, template_versions, customer_cards)]
  CustomerApp[Customer/PWA/Join flows] --> WalletAPIs
  WalletAPIs[Wallet APIs] --> AppleAPI[Apple PKPass Builder + Sign]
  WalletAPIs --> GoogleAPI[Google Object/JWT Builder]
  AppleAPI --> AppleWallet[Apple Wallet (.pkpass)]
  GoogleAPI --> GoogleWallet[Google Wallet (JWT Save URL)]
  subgraph Server (RLS-aware + Admin)
    TemplatesAPI
    WalletAPIs
    AppleAPI
    GoogleAPI
  end
```

Key principles

- Data schema consistency: single canonical card template type; mappers convert DB snake_case ↔ UI camelCase.
- DRY builders: reuse `buildApplePass`, `createSaveToWalletJwt`, and unified preview components.
- Security: never expose service role keys in client; admin operations only in server routes/actions.
- Next.js 15 params: unwrap `params` via `use()` in client and `await` in server.

---

### Data model (Supabase)

Core tables (suggested):

```sql
-- Card templates (reusable, versioned)
create table if not exists public.card_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  name text not null,
  type text not null check (type in ('stamp','membership')),
  schema_version int not null default 1,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.card_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.card_templates(id) on delete cascade,
  version int not null,
  ui_payload jsonb not null,      -- canonical camelCase UI shape
  pass_payload jsonb not null,    -- resolved wallet-ready fields (derived)
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique(template_id, version)
);

-- User-linked cards instantiated from a template/version
create table if not exists public.customer_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  template_id uuid not null references public.card_templates(id),
  template_version int not null,
  card_type text not null check (card_type in ('stamp','membership')),
  state jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

Notes

- Keep UI payloads minimal (text, colors, layout) and derive wallet payloads with builders.
- Enforce RLS policies per role; admin endpoints should bypass via server-only admin client (never in client components).

---

### UI/UX design suggestions (Apple + Google aligned)

- Minimal, legible typography; avoid dense content. Prefer concise labels and values.
- Color usage: ensure contrast for text on backgrounds; avoid overly saturated gradients. For Apple store cards, keep background simple.
- Imagery
  - Apple Wallet: `icon.png` at 29×29 with `icon@2x.png` 58×58 and `icon@3x.png` 87×87; `logo.png` with wider variants (e.g., ~320×100 @2x, ~480×150 @3x) as used in current scripts.
  - Google Wallet: program logo square (~66×66 recommended); optional hero image wide banner (~1032×336). Keep clear space and avoid text crowding. Follow latest Google Wallet image specs.
- Layout presets: provide clean presets for stamp grid and membership summary; offer a compact variant for smaller cards.
- Real-time preview: show platform toggle (Apple / Google / PWA) to visualize differences.
- Input validation: block unsupported fields (e.g., too many fields for Apple primary/secondary sections, barcodes format, color hex).

---

### Template editing and live preview

Prefer a form-based editor with optional drag-and-drop sections. Persist drafts; publish versions explicitly.

TypeScript types (UI shape) and mappers

```ts
// src/types/card-template.ts
export type CardType = 'stamp' | 'membership'

export interface BaseTemplate {
  name: string
  cardType: CardType
  brandColor?: string // hex
  labelColor?: string // hex
  logoUrl?: string
  iconUrl?: string
}

export interface StampTemplate extends BaseTemplate {
  cardType: 'stamp'
  stampsRequired: number
  reward: string
  stampEmoji?: string
}

export interface MembershipTemplate extends BaseTemplate {
  cardType: 'membership'
  membershipName?: string
  totalSessions?: number
  priceCents?: number
}

export type CardTemplateUI = StampTemplate | MembershipTemplate
```

Editor with live preview (client component)

```tsx
'use client'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CardLivePreview } from '@/components/unified/CardLivePreview'
import { mapAdminCardFormToPreview } from '@/lib/card-mappers'

const templateSchema = z.object({
  cardType: z.enum(['stamp','membership']),
  name: z.string().min(2),
  brandColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  labelColor: z.string().optional(),
  stampsRequired: z.number().int().min(1).max(20).optional(),
  reward: z.string().optional(),
  totalSessions: z.number().int().min(1).max(200).optional(),
})

export default function TemplateEditor() {
  const { register, watch, handleSubmit, formState } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { cardType: 'stamp', name: 'Coffee Card', brandColor: '#10b981' }
  })

  const formValues = watch()
  const previewData = useMemo(() => mapAdminCardFormToPreview(formValues), [formValues])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit(() => {})} className="space-y-4">
        <input {...register('name')} placeholder="Card name" />
        <select {...register('cardType')}>
          <option value="stamp">Stamp</option>
          <option value="membership">Membership</option>
        </select>
        <input {...register('brandColor')} placeholder="#10b981" />
        {/* conditional fields for stamp or membership */}
        {formValues.cardType === 'stamp' && (
          <>
            <input type="number" {...register('stampsRequired')} placeholder="Stamps required" />
            <input {...register('reward')} placeholder="Reward description" />
          </>
        )}
        {formValues.cardType === 'membership' && (
          <input type="number" {...register('totalSessions')} placeholder="Total sessions" />
        )}
      </form>
      <div>
        <CardLivePreview data={previewData} platform="apple" />
        <div className="mt-4">
          <CardLivePreview data={previewData} platform="google" />
        </div>
      </div>
    </div>
  )
}
```

Validation helpers (server-safe)

```ts
// src/lib/wallet/template-validation.ts
export function validateAppleTemplate(input: any) {
  const errors: string[] = []
  if (input.name?.length > 64) errors.push('Name too long for Apple header')
  // Limit sections/fields to Apple StoreCard expectations
  // Validate hex colors and provide fallbacks
  return errors
}

export function validateGoogleTemplate(input: any) {
  const errors: string[] = []
  // Validate required programName/logo presence and text lengths per Google Wallet
  return errors
}
```

---

### Wallet pass generation

Apple Wallet (.pkpass)

```ts
// Server route example (Next.js 15)
import { NextRequest, NextResponse } from 'next/server'
import { buildApplePass } from '@/lib/wallet/builders/apple-pass-builder'
import { buildAppleBarcode } from '@/lib/wallet/apple-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ customerCardId: string }> }) {
  const { customerCardId } = await params
  // fetch card + business + derived state ...
  const passData = buildApplePass(card, business, customerCardId, derived)
  const withBarcode = { ...passData, ...buildAppleBarcode(customerCardId, { altTextPrefix: 'Card ID' }) }
  // package into .pkpass with manifest + signature (existing utility)
  // return new NextResponse(pkpassBuffer, { headers: { 'Content-Type': 'application/vnd.apple.pkpass' }})
}
```

Google Wallet (JWT Save URL)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { buildGoogleIds, createLoyaltyObject, createSaveToWalletJwt, buildSaveUrl } from '@/lib/wallet/builders/google-pass-builder'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ customerCardId: string }> }) {
  const { customerCardId } = await params
  const ids = buildGoogleIds(customerCardId)
  const loyaltyObject = createLoyaltyObject({ ids, current: 3, total: 10, ...more })
  const jwt = createSaveToWalletJwt(loyaltyObject)
  const url = buildSaveUrl(jwt)
  return NextResponse.json({ url })
}
```

Notes

- Reuse existing builders listed in `doc/CARD_WALLET_AUDIT.md` to avoid duplication.
- For Apple assets, ensure `icon.png`, `icon@2x.png`, `icon@3x.png`, `logo.png` (and @2x/@3x) are added into the archive and hashed in `manifest.json` before signing.

---

### Extensibility

- New card types: add a template subtype, extend preview mapper, and add a builder that resolves to Apple/Google compatible fields.
- Pluggable sections: define a constrained schema for sections (header/primary/secondary/auxiliary/back) and map them per platform.
- Versioning: publish new `card_template_versions`, keep older versions for existing user cards.

---

### Libraries and frameworks

- UI/editor: React Hook Form, Zod, `dnd-kit` (drag and drop), `react-colorful` (color picker), TailwindCSS for quick layout.
- State: SWR for data fetching; avoid service role in client. Use server actions/routes for admin mutations.
- Apple: existing custom builder + OpenSSL signing; alternatively `passkit-generator` or `@walletpass/pass-js` if needed.
- Google: `jsonwebtoken`, `google-auth-library` (for service account); follow Wallet Objects API.

---

### Testing strategy

- Unit
  - Builders: Apple `buildApplePass` shape (formatVersion, identifiers, fields), Google JWT creation and ID composition.
  - Mappers: ensure admin form → preview is stable across pages.
- Integration
  - API routes return valid MIME types and payloads; Apple `.pkpass` opens on device; Google Save URL renders and adds to wallet.
- Visual regression
  - Playwright screenshot tests for `CardLivePreview` across presets, light/dark, and compact mode.
- Device validation
  - Real iOS Wallet install test; Android Google Wallet Save flow; verify barcode/QR scans and field placements.
- Security
  - Audit no `createAdminClient()` in client components; ensure environment variables remain server-only.

---

### Implementation steps

1) Data and APIs
   - Add `card_templates`, `card_template_versions`, `customer_cards` tables with RLS.
   - Create admin CRUD API/routes using server-only clients.
2) Editor + Preview
   - Implement `TemplateEditor` with Zod validation and live preview using `CardLivePreview`.
   - Replace ad-hoc previews with unified frame per audit recommendations.
3) Builders
   - Reuse existing Apple/Google builders; centralize barcode and webServiceURL helpers.
4) Validation rules
   - Implement Apple/Google validators; integrate into editor as inline errors.
5) Testing
   - Add unit tests for builders/mappers; add Playwright snapshots; run e2e join → add to wallet.
6) Launch
   - Seed example templates (stamp, membership); run device tests; document asset prep workflow.


---

### API contracts and server/client usage

- Server-only admin routes (create/update templates and versions) must use `createAdminClient()` and run on the server; never import into client components.
- Client pages must use SWR hooks that call the admin API endpoints, not direct database access.

Admin API examples

```ts
// src/app/api/admin/templates/route.ts (POST) - server route
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export async function POST(request: Request) {
  const body = await request.json()
  const admin = createAdminClient()
  const { data, error } = await admin.from('card_templates').insert({
    business_id: body.businessId,
    name: body.name,
    type: body.type
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ id: data.id })
}
```

Client fetching pattern

```ts
'use client'
import useSWR from 'swr'
const fetcher = (url: string) => fetch(url).then(r => r.json())
export function useAdminTemplates() {
  const { data, error, isLoading } = useSWR('/api/admin/templates', fetcher)
  return { templates: data?.templates ?? [], error, isLoading }
}
```

Route params (Next.js 15)

```ts
// Server component/route
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // use id
}
```

---

### Security and environment validation

- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or create admin clients in client components.
- Validate environment variables at startup and fail fast.

Example

```ts
// src/lib/env/validate.ts
export function validateEnvOrThrow() {
  const required = [
    'APPLE_TEAM_IDENTIFIER',
    'APPLE_PASS_TYPE_IDENTIFIER',
    'GOOGLE_ISSUER_ID',
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'
  ]
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) throw new Error(`Missing env: ${missing.join(', ')}`)
}
```

Call once in server initialization paths or first API hit.

---

### Apple/Google validation constraints (authoring-time)

- Apple Wallet (StoreCard)
  - Sections: use `primaryFields`, `secondaryFields`, `auxiliaryFields`, `headerFields`, `backFields` sparingly.
  - Typical safe counts: primary 1–2, secondary 1–2, auxiliary 0–2, header 1.
  - Colors: prefer high-contrast; avoid gradients in pass JSON; use flat `backgroundColor`.
  - Assets: `icon.png` (29px) + `icon@2x` (58px) + `icon@3x` (87px); `logo.png` wide with @2x/@3x.
  - Barcode: prefer `barcodes` array; message encoding `iso-8859-1`.

- Google Wallet (Loyalty/Membership via Objects/Class)
  - Provide `programName`, logo, and brand color (`hexBackgroundColor`).
  - QR value mirrored to object ID or customer card ID.
  - Use approved class IDs via issuer; JWT Save URL must be signed with service account.

The editor should surface these as validations and hints.

---

### Compact sizing and visual guidance

- Use design tokens to keep pass width/height consistent across previews. For compact previews, reduce padding and typography scale by ~12–16% while maintaining readable contrast.
- Apple preview: rounded corners, subdued shadows, no heavy borders. Google preview: white card on light background with subtle shadow.
- QR size: keep minimum 120–160 px on desktop preview; auto-scale smaller on mobile preview frames.

---

### Versioning workflow

1) Draft: admin edits UI payload; live preview updates.
2) Publish: freeze UI payload into a new `card_template_versions.version` and compute `pass_payload` using builders.
3) Rollout: new user cards reference latest published version; existing user cards keep their version unless migrated.
4) Deprecate: mark old versions as not default; keep for historical cards.

---

### Pre-commit and CI checks

- Run lint and type-check: `pnpm lint && pnpm type-check`.
- Ensure no `createAdminClient()` usage in client components.
- Verify dynamic routes unwrap `params` correctly.
- Unit tests: builders and mappers.
- E2E: preview parity vs device passes.

References

- See `doc/CARD_WALLET_AUDIT.md` and `doc/WALLET_JSON_AUDIT.md` for existing builders, routes, and consolidation notes.

