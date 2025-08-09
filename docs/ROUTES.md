### Canonical Routes — RewardJar 4.0

This document lists canonical endpoints after consolidation. All responses follow the standard envelope: `{ success, data, error, meta }`.

#### Admin Dashboard
- GET `/api/admin/dashboard` — Summary data
  - Params: `section=businesses|customers|cards` (optional), `details=true` (optional)
  - Returns: envelope with section data or full dashboard data

#### Wallet
- GET `/api/wallet/google/[customerCardId]` — Returns envelope with `{ jwt, saveUrl }`
- GET `/api/wallet/apple/[customerCardId]` — Returns envelope with `{ pkpassUrl }`
- GET `/api/wallet/status/[customerCardId]` — Returns envelope with `{ active, lastSignedAt }`

#### Health
- GET `/api/health` — Consolidated health with environment and DB check
- GET `/api/health/env` — Detailed environment validation

Notes:
- Dev/test routes under `/api/admin/*` are gated in production by environment flags.
- Card creation UI is available at `/admin/cards/new` with `?mode=quick|advanced`.

