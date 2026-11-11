-- Stripe Connect, mode test. Schéma payments seulement.
-- Ne pas appliquer sur un projet hébergé. Le projet HMF n'existe pas encore.
-- Rollback : drop schema payments cascade. Les tables public existantes ne sont pas ici.

create schema if not exists payments;
revoke all on schema payments from public;

create table payments.settings (
  id boolean primary key default true check (id),
  payments_live boolean not null default false,
  commission_rate_bps integer not null default 1000 check (commission_rate_bps >= 0 and commission_rate_bps <= 10000)
);

insert into payments.settings (id, payments_live, commission_rate_bps) values (true, false, 1000);

create table payments.orders (
  id text primary key,
  cook_id text not null,
  dish_subtotal_minor integer not null check (dish_subtotal_minor >= 0),
  delivery_fee_minor integer not null default 0 check (delivery_fee_minor >= 0),
  currency text not null default 'chf' check (currency = 'chf')
);

create table payments.cook_accounts (
  cook_id text primary key,
  stripe_account_id text,
  charges_enabled boolean not null default false,
  bissabi_validated boolean not null default false
);

create table payments.webhook_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  order_id text,
  applied boolean not null,
  received_at timestamptz not null default now()
);

create table payments.order_payments (
  order_id text primary key,
  status text not null,
  updated_at timestamptz not null default now()
);

alter table payments.settings enable row level security;
alter table payments.orders enable row level security;
alter table payments.cook_accounts enable row level security;
alter table payments.webhook_events enable row level security;
alter table payments.order_payments enable row level security;
revoke all on all tables in schema payments from public, anon, authenticated;

create or replace function payments.cook_can_receive(p_cook text)
returns boolean
language sql
stable
security definer
set search_path = payments, pg_temp
as $$
  select exists (
    select 1 from payments.cook_accounts
    where cook_id = p_cook
      and stripe_account_id is not null
      and charges_enabled
      and bissabi_validated
  );
$$;

create or replace function payments.block_live(p_livemode boolean)
returns boolean
language sql
stable
security definer
set search_path = payments, pg_temp
as $$
  select p_livemode and not coalesce((select payments_live from payments.settings where id), false);
$$;

create or replace function payments.record_webhook(
  p_event text,
  p_type text,
  p_livemode boolean,
  p_order text,
  p_status text
)
returns text
language plpgsql
security definer
set search_path = payments, pg_temp
as $$
declare
  inserted text;
begin
  if payments.block_live(p_livemode) then
    return 'live_blocked';
  end if;
  insert into payments.webhook_events (event_id, event_type, livemode, order_id, applied)
  values (p_event, p_type, p_livemode, p_order, true)
  on conflict (event_id) do nothing
  returning event_id into inserted;
  if inserted is null then
    return 'duplicate';
  end if;
  if p_order is not null and p_status is not null then
    insert into payments.order_payments (order_id, status)
    values (p_order, p_status)
    on conflict (order_id) do update set status = excluded.status, updated_at = now();
  end if;
  return 'applied';
end;
$$;

revoke all on function payments.cook_can_receive(text) from public;
revoke all on function payments.block_live(boolean) from public;
revoke all on function payments.record_webhook(text, text, boolean, text, text) from public;
