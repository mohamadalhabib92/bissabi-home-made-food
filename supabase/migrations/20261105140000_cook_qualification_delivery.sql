-- Additive migration — NOT applied automatically.
-- Cook qualification attempts + delivery partner jobs (marketplace follow-up 2026-11-05).
-- Review RLS with Mohamed before apply.

-- Qualification attempts (hygiène / allergènes / sécurité)
create table if not exists public.cook_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references auth.users (id) on delete cascade,
  module text not null check (module in ('hygiene', 'allergens', 'safety')),
  score integer not null check (score >= 0 and score <= 100),
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cook_quiz_attempts_cook_created_idx
  on public.cook_quiz_attempts (cook_id, created_at desc);

create table if not exists public.cook_qualifications (
  cook_id uuid primary key references auth.users (id) on delete cascade,
  badge_earned_at timestamptz,
  badge_expires_at timestamptz,
  passed_hygiene_at timestamptz,
  passed_allergens_at timestamptz,
  passed_safety_at timestamptz,
  liability_accepted_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Delivery modes on dishes / cooks (text arrays; app remains source of truth until sync)
alter table if exists public.cooks
  add column if not exists delivery_modes text[] default array['pickup']::text[],
  add column if not exists preferred_partner_id text,
  add column if not exists halal_certification_note text,
  add column if not exists liability_accepted_at timestamptz;

alter table if exists public.dishes
  add column if not exists delivery_modes text[];

-- Partner registry (placeholders until real agreements)
create table if not exists public.delivery_partners (
  id text primary key,
  label_fr text not null,
  label_en text not null,
  kind text not null check (kind in ('bike_coop', 'platform', 'postal', 'taxi', 'other')),
  active boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  partner_id text references public.delivery_partners (id),
  state text not null check (state in (
    'quoted', 'requested', 'accepted', 'at_kitchen', 'picked_up', 'en_route', 'delivered', 'failed', 'cancelled'
  )),
  fee_chf numeric(10, 2),
  eta_min integer,
  eta_max integer,
  mock boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists delivery_jobs_order_idx on public.delivery_jobs (order_id);

alter table if exists public.orders
  add column if not exists delivery_job_id uuid,
  add column if not exists delivery_partner_id text,
  add column if not exists fulfilment_mode text;

-- RLS stubs (tighten before prod)
alter table public.cook_quiz_attempts enable row level security;
alter table public.cook_qualifications enable row level security;
alter table public.delivery_partners enable row level security;
alter table public.delivery_jobs enable row level security;


drop policy if exists cook_quiz_attempts_own on public.cook_quiz_attempts;
drop policy if exists cook_qualifications_own on public.cook_qualifications;
drop policy if exists delivery_partners_read on public.delivery_partners;
drop policy if exists delivery_jobs_read_auth on public.delivery_jobs;
-- Cooks manage their own attempts / badge
create policy cook_quiz_attempts_own
  on public.cook_quiz_attempts for all
  using (auth.uid() = cook_id)
  with check (auth.uid() = cook_id);

create policy cook_qualifications_own
  on public.cook_qualifications for all
  using (auth.uid() = cook_id)
  with check (auth.uid() = cook_id);

-- Partners list readable by authenticated users; writes service role only (no policy = deny for anon writes)
create policy delivery_partners_read
  on public.delivery_partners for select
  to authenticated
  using (true);

create policy delivery_jobs_read_auth
  on public.delivery_jobs for select
  to authenticated
  using (true);

comment on table public.cook_quiz_attempts is 'Bissabi internal training attempts — not an official FSVO certificate';
comment on table public.delivery_partners is 'Placeholder partner ids until real agreements exist';
