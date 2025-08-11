-- Migration: Lock card_templates.type and introduce CLV tracking
-- Date: 2025-08-10

-- 1) Prevent updates to card_templates.type after creation
create or replace function public.prevent_card_type_update() returns trigger as $$
begin
  if (new.type is distinct from old.type) then
    raise exception 'card_templates.type is immutable once created';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_card_type_update on public.card_templates;
create trigger trg_prevent_card_type_update
before update on public.card_templates
for each row
execute function public.prevent_card_type_update();

-- 2) Event / audit table for card-related events
-- Note: card_id refers to public.customer_cards(id)
create table if not exists public.card_events (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.customer_cards(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_card_events_card_id on public.card_events (card_id);
create index if not exists idx_card_events_event_type on public.card_events (event_type);
create index if not exists idx_card_events_created_at on public.card_events (created_at);

-- 3) Business metrics table to store CLV aggregates per business
create table if not exists public.business_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid unique not null references public.businesses(id) on delete cascade,
  total_spent bigint not null default 0,
  total_rewarded bigint not null default 0,
  clv bigint not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_metrics_business_id on public.business_metrics (business_id);

-- 4) Trigger to update business_metrics when certain card_events are inserted
create or replace function public.update_business_metrics_on_card_event() returns trigger as $$
declare
  v_business_id uuid;
  v_amount_spent bigint;
  v_reward_value bigint;
begin
  -- Derive business_id from customer_cards → stamp_cards/membership_cards
  select coalesce(sc.business_id, mc.business_id) into v_business_id
  from public.customer_cards cc
  left join public.stamp_cards sc on cc.stamp_card_id = sc.id
  left join public.membership_cards mc on cc.membership_card_id = mc.id
  where cc.id = new.card_id;

  if v_business_id is null then
    -- No-op if we cannot resolve business; still allow event insert
    return new;
  end if;

  -- Extract amounts from metadata (if present)
  v_amount_spent := coalesce((new.metadata->>'amount_cents')::bigint, 0);
  v_reward_value := coalesce((new.metadata->>'reward_value_cents')::bigint, 0);

  -- Update aggregates based on event type
  if new.event_type in ('purchase', 'membership_purchase') then
    insert into public.business_metrics (business_id, total_spent, total_rewarded, clv, updated_at)
    values (v_business_id, v_amount_spent, 0, v_amount_spent, now())
    on conflict (business_id) do update set
      total_spent = public.business_metrics.total_spent + v_amount_spent,
      clv = (public.business_metrics.total_spent + v_amount_spent) - public.business_metrics.total_rewarded,
      updated_at = now();
  elsif new.event_type = 'reward_redeemed' then
    insert into public.business_metrics (business_id, total_spent, total_rewarded, clv, updated_at)
    values (v_business_id, 0, v_reward_value, -v_reward_value, now())
    on conflict (business_id) do update set
      total_rewarded = public.business_metrics.total_rewarded + v_reward_value,
      clv = public.business_metrics.total_spent - (public.business_metrics.total_rewarded + v_reward_value),
      updated_at = now();
  else
    -- Non-financial events (stamp_given, session_marked, template_published, etc.) do not change CLV
    return new;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_business_metrics_on_card_event on public.card_events;
create trigger trg_update_business_metrics_on_card_event
after insert on public.card_events
for each row
execute function public.update_business_metrics_on_card_event();

