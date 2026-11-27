-- Stripe Connect Express — grand livre local. NON APPLIQUÉ.
-- Ne pas lancer cette migration sur un projet hébergé sans l’accord de Mohamed.
-- Aucune clé, aucun compte Stripe réel. RLS : anon et authenticated n’ont aucun accès.

create table public.stripe_connect_accounts (
  cook_id uuid primary key,
  stripe_account_id text unique,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  event_id text primary key,
  order_id text,
  event_type text not null,
  received_at timestamptz not null default now()
);

create table public.refunds (
  refund_id text primary key,
  order_id text not null,
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

alter table public.stripe_connect_accounts enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;

revoke all on public.stripe_connect_accounts from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;
revoke all on public.refunds from anon, authenticated;

-- Aucune policy pour anon ou authenticated : le service_role du serveur seulement.
-- Ne pas accorder service_role ici : il contourne déjà la RLS côté Supabase.
