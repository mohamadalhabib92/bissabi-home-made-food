-- Pilote Bissabi — marché, hygiène, réservation, paiement simulé, livraison, rappel.
-- Additif : schéma `pilot` seulement. Ne touche pas aux tables de la passe 1 ni aux données déjà là.
-- Ne pas appliquer sur le projet Supabase hébergé depuis l'agent.
-- Schéma non exposé par l'API. Les fonctions sensibles sont security definer, hors de `public`.
-- Rollback manuel : supabase/rollback/20261109150000_pilot_marketplace.sql

create schema if not exists pilot;

revoke all on schema pilot from public;
grant usage on schema pilot to postgres;

create table if not exists pilot.markets (
  id text primary key,
  country_code text not null,
  currency text not null,
  timezone text not null,
  status text not null check (status in ('pilot', 'planned', 'closed')),
  claim text not null default 'internal_only' check (claim = 'internal_only')
);

create table if not exists pilot.zones (
  id text primary key,
  market_id text not null references pilot.markets (id),
  city text not null,
  postal_code text not null,
  delivery_fee_minor integer not null check (delivery_fee_minor >= 0),
  served boolean not null default false,
  unique (market_id, postal_code)
);

create table if not exists pilot.admin_scopes (
  actor_id text not null,
  market_id text not null references pilot.markets (id),
  primary key (actor_id, market_id)
);

create table if not exists pilot.kitchens (
  id text primary key,
  market_id text not null references pilot.markets (id),
  responsible_name text,
  documents_ok boolean not null default false,
  hygiene_ok boolean not null default false,
  training_ok boolean not null default false,
  sales_allowed boolean not null default false,
  suspended boolean not null default false
);

create table if not exists pilot.dishes (
  id text primary key,
  kitchen_id text not null references pilot.kitchens (id),
  title text not null,
  price_minor integer not null check (price_minor >= 0),
  currency text not null,
  published boolean not null default false,
  sales_blocked boolean not null default false,
  current_recipe_id text
);

create table if not exists pilot.recipe_versions (
  id text primary key,
  dish_id text not null references pilot.dishes (id),
  version integer not null,
  allergens jsonb not null,
  unique (dish_id, version)
);

create table if not exists pilot.slots (
  id text primary key,
  dish_id text not null references pilot.dishes (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  zone text not null,
  capacity integer not null check (capacity >= 0),
  held integer not null default 0 check (held >= 0),
  sold integer not null default 0 check (sold >= 0),
  check (held + sold <= capacity)
);

create table if not exists pilot.orders (
  id text primary key,
  market_id text not null references pilot.markets (id),
  buyer_id text not null,
  kitchen_id text not null references pilot.kitchens (id),
  dish_id text not null references pilot.dishes (id),
  recipe_version_id text not null references pilot.recipe_versions (id),
  slot_id text not null references pilot.slots (id),
  qty integer not null check (qty > 0),
  payment_status text not null,
  total_minor integer not null,
  currency text not null,
  flags text[] not null default '{}'
);

create table if not exists pilot.payment_events (
  event_id text primary key,
  order_id text not null references pilot.orders (id),
  kind text not null,
  applied boolean not null
);

create table if not exists pilot.ledger (
  id text primary key,
  event_id text not null unique references pilot.payment_events (event_id),
  order_id text not null references pilot.orders (id),
  currency text not null,
  collected_minor integer not null,
  commission_minor integer not null,
  fees_minor integer not null,
  owed_kitchen_minor integer not null
);

create table if not exists pilot.missions (
  id text primary key,
  market_id text not null references pilot.markets (id),
  order_id text not null references pilot.orders (id),
  courier_id text not null,
  precise_address text not null
);

create table if not exists pilot.lots (
  id text primary key,
  code text not null
);

create table if not exists pilot.batches (
  id text primary key,
  dish_id text not null references pilot.dishes (id),
  blocked boolean not null default false
);

create table if not exists pilot.batch_lots (
  batch_id text not null references pilot.batches (id),
  lot_id text not null references pilot.lots (id),
  primary key (batch_id, lot_id)
);

create table if not exists pilot.batch_orders (
  batch_id text not null references pilot.batches (id),
  order_id text not null references pilot.orders (id),
  primary key (batch_id, order_id)
);

alter table pilot.markets enable row level security;
alter table pilot.zones enable row level security;
alter table pilot.admin_scopes enable row level security;
alter table pilot.kitchens enable row level security;
alter table pilot.dishes enable row level security;
alter table pilot.recipe_versions enable row level security;
alter table pilot.slots enable row level security;
alter table pilot.orders enable row level security;
alter table pilot.payment_events enable row level security;
alter table pilot.ledger enable row level security;
alter table pilot.missions enable row level security;
alter table pilot.lots enable row level security;
alter table pilot.batches enable row level security;
alter table pilot.batch_lots enable row level security;
alter table pilot.batch_orders enable row level security;

revoke all on all tables in schema pilot from public;

insert into pilot.markets (id, country_code, currency, timezone, status)
values ('ch-vd', 'CH', 'CHF', 'Europe/Zurich', 'pilot')
on conflict (id) do nothing;

insert into pilot.zones (id, market_id, city, postal_code, delivery_fee_minor, served)
values
  ('lausanne-1003', 'ch-vd', 'Lausanne', '1003', 600, true),
  ('prilly-1008', 'ch-vd', 'Prilly', '1008', 600, true)
on conflict (id) do nothing;

create or replace function pilot.reserve_portion(p_buyer text, p_slot text, p_qty integer)
returns text
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  s pilot.slots%rowtype;
  d pilot.dishes%rowtype;
  k pilot.kitchens%rowtype;
  oid text;
begin
  select * into s from pilot.slots where id = p_slot for update;
  if not found then return 'no_slot'; end if;
  select * into d from pilot.dishes where id = s.dish_id for update;
  select * into k from pilot.kitchens where id = d.kitchen_id for update;
  if k.suspended or k.responsible_name is null or length(btrim(k.responsible_name)) = 0
     or not k.documents_ok or not k.hygiene_ok or not k.training_ok or not k.sales_allowed then
    return 'kitchen_file_incomplete';
  end if;
  if d.sales_blocked or not d.published then
    return 'sales_blocked';
  end if;
  if s.held + s.sold + p_qty > s.capacity then
    return 'portion_taken';
  end if;
  oid := 'ord_' || gen_random_uuid()::text;
  update pilot.slots set held = held + p_qty where id = s.id;
  insert into pilot.orders (id, market_id, buyer_id, kitchen_id, dish_id, recipe_version_id, slot_id, qty, payment_status, total_minor, currency)
  values (oid, k.market_id, p_buyer, k.id, d.id, d.current_recipe_id, s.id, p_qty, 'unpaid', d.price_minor * p_qty, d.currency);
  return 'ok:' || oid;
end;
$$;

create or replace function pilot.revise_recipe(p_dish text, p_allergens jsonb)
returns text
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  next_version integer;
  rid text;
begin
  select coalesce(max(version), 0) + 1 into next_version from pilot.recipe_versions where dish_id = p_dish;
  rid := 'recipe_' || gen_random_uuid()::text;
  insert into pilot.recipe_versions (id, dish_id, version, allergens) values (rid, p_dish, next_version, p_allergens);
  update pilot.dishes set current_recipe_id = rid where id = p_dish;
  update pilot.orders
    set flags = flags || array['recipe_changed']
    where dish_id = p_dish
      and recipe_version_id <> rid
      and not ('recipe_changed' = any (flags));
  return rid;
end;
$$;

create or replace function pilot.apply_payment_event(p_event text, p_order text)
returns text
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  o pilot.orders%rowtype;
  inserted text;
begin
  insert into pilot.payment_events (event_id, order_id, kind, applied)
  values (p_event, p_order, 'payment_succeeded', false)
  on conflict (event_id) do nothing
  returning event_id into inserted;
  if inserted is null then
    return 'duplicate';
  end if;
  select * into o from pilot.orders where id = p_order for update;
  if o.payment_status = 'paid' then
    return 'already_paid';
  end if;
  update pilot.orders set payment_status = 'paid' where id = p_order;
  update pilot.slots set held = held - o.qty, sold = sold + o.qty where id = o.slot_id;
  insert into pilot.ledger (id, event_id, order_id, currency, collected_minor, commission_minor, fees_minor, owed_kitchen_minor)
  values ('led_' || p_event, p_event, p_order, o.currency, o.total_minor, 0, 0, o.total_minor);
  update pilot.payment_events set applied = true where event_id = p_event;
  return 'applied';
end;
$$;

create or replace function pilot.open_mission(p_actor text, p_mission text)
returns table (mission_id text, precise_address text)
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  m pilot.missions%rowtype;
begin
  select * into m from pilot.missions where id = p_mission;
  if not found then
    raise exception 'unknown_mission' using errcode = 'P0002';
  end if;
  if m.courier_id <> p_actor then
    raise exception 'courier_refused' using errcode = '42501';
  end if;
  mission_id := m.id;
  precise_address := m.precise_address;
  return next;
end;
$$;

create or replace function pilot.read_order(p_actor text, p_role text, p_order text)
returns table (order_id text, market_id text)
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  o pilot.orders%rowtype;
begin
  select * into o from pilot.orders where id = p_order;
  if not found then
    raise exception 'unknown_order' using errcode = 'P0002';
  end if;
  if p_role = 'admin' and not exists (
    select 1 from pilot.admin_scopes s
    where s.actor_id = p_actor and s.market_id = o.market_id
  ) then
    raise exception 'market_scope_refused' using errcode = '42501';
  end if;
  order_id := o.id;
  market_id := o.market_id;
  return next;
end;
$$;

create or replace function pilot.recall_lot(p_lot text)
returns setof text
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  affected text;
begin
  update pilot.batches b
    set blocked = true
    where exists (select 1 from pilot.batch_lots bl where bl.batch_id = b.id and bl.lot_id = p_lot);
  update pilot.dishes d
    set sales_blocked = true, published = false
    where exists (
      select 1 from pilot.batches b
      join pilot.batch_lots bl on bl.batch_id = b.id
      where b.dish_id = d.id and bl.lot_id = p_lot
    );
  for affected in
    select distinct bo.order_id
    from pilot.batch_orders bo
    join pilot.batch_lots bl on bl.batch_id = bo.batch_id
    where bl.lot_id = p_lot
  loop
    update pilot.orders
      set flags = flags || array['recall']
      where id = affected and not ('recall' = any (flags));
    return next affected;
  end loop;
end;
$$;

revoke all on all functions in schema pilot from public;
