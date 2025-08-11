-- Migration: Add membership_mode and discount configuration to membership_cards
-- Date: 2025-08-10

-- 1) Add membership_mode to distinguish 'sessions' vs 'discount'
alter table if exists public.membership_cards
  add column if not exists membership_mode text not null default 'sessions';

-- 2) Discount configuration fields (nullable; used when membership_mode = 'discount')
alter table if exists public.membership_cards
  add column if not exists discount_type text check (discount_type in ('percent','amount')),
  add column if not exists discount_value integer,
  add column if not exists min_spend_cents integer,
  add column if not exists stackable boolean default false,
  add column if not exists max_uses_per_day integer,
  add column if not exists max_uses_per_week integer,
  add column if not exists validity_windows jsonb,
  add column if not exists eligible_categories text[],
  add column if not exists eligible_skus text[];

-- 3) Comments for clarity
comment on column public.membership_cards.membership_mode is 'sessions | discount';
comment on column public.membership_cards.discount_type is 'percent (value = percent as integer, e.g. 15) or amount (value = cents)';
comment on column public.membership_cards.discount_value is 'If percent, integer percent (e.g. 15). If amount, integer cents (e.g. 500 for $5)';
comment on column public.membership_cards.min_spend_cents is 'Minimum spend (in cents) to qualify for discount';
comment on column public.membership_cards.stackable is 'Whether discount can be stacked with other promos';
comment on column public.membership_cards.max_uses_per_day is 'Max redemptions per day for this membership (null = unlimited)';
comment on column public.membership_cards.max_uses_per_week is 'Max redemptions per week for this membership (null = unlimited)';
comment on column public.membership_cards.validity_windows is 'Array of time windows, e.g. [{"days":[1,2,3],"start":"09:00","end":"17:00"}]';
comment on column public.membership_cards.eligible_categories is 'List of category identifiers that are eligible for discount';
comment on column public.membership_cards.eligible_skus is 'List of SKU identifiers that are eligible for discount';

