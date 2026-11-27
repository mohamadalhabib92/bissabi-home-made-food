-- Schéma lu plus tard par Bissabi CRM Pro, dans le projet bissabi-crm (ppeovmfuhtidavdnrwxu).
-- NON APPLIQUÉ. La clé service ne figure pas ici.
-- anon et authenticated n’ont aucun droit : seul le service_role du serveur crm-sync écrit.

create schema if not exists bissabi_food;

create table if not exists bissabi_food.contacts (
  external_id text primary key,
  kind text not null check (kind in ('buyer', 'seller')),
  display_name text,
  email text,
  updated_at timestamptz not null default now()
);

create table if not exists bissabi_food.sellers (
  external_id text primary key,
  kind text not null default 'home',
  display_name text,
  updated_at timestamptz not null default now()
);

create table if not exists bissabi_food.orders (
  external_id text primary key,
  status text not null check (status in ('paid', 'refunded')),
  currency text not null default 'CHF',
  buyer_external_id text,
  seller_external_id text,
  subtotal_cents integer not null default 0,
  commission_cents integer not null default 0,
  total_cents integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table bissabi_food.contacts enable row level security;
alter table bissabi_food.sellers enable row level security;
alter table bissabi_food.orders enable row level security;

revoke all on bissabi_food.contacts from anon, authenticated;
revoke all on bissabi_food.sellers from anon, authenticated;
revoke all on bissabi_food.orders from anon, authenticated;

-- Aucune policy pour anon ou authenticated.
-- CRM Pro lira ce schéma plus tard, avec une clé qui lui sera donnée hors de ce dépôt.
