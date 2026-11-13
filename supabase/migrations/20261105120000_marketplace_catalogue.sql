-- Additive marketplace fields (do NOT apply without Mohamed's approval).
-- Keeps existing tables; adds optional columns for richer catalogue / filters.

alter table if exists public.cooks
  add column if not exists origin_country text,
  add column if not exists origin_flag text,
  add column if not exists story text,
  add column if not exists specialties text[] default '{}',
  add column if not exists hygiene_badge boolean default false;

alter table if exists public.dishes
  add column if not exists photo_key text,
  add column if not exists vegan boolean default false,
  add column if not exists gluten_free boolean default false,
  add column if not exists spice_level smallint default 0 check (spice_level between 0 and 3),
  add column if not exists family_size boolean default false,
  add column if not exists servings int default 1,
  add column if not exists gallery_keys text[] default '{}',
  add column if not exists available_today boolean default false,
  add column if not exists tags text[] default '{}';

-- Helpful indexes (idempotent)
create index if not exists dishes_cuisine_idx on public.dishes (cuisine);
create index if not exists dishes_vegan_idx on public.dishes (vegan) where vegan = true;
create index if not exists dishes_halal_idx on public.dishes (halal) where halal = true;
create index if not exists cooks_canton_idx on public.cooks (canton);

-- RLS reminder: existing policies must keep buyer read of active dishes;
-- cooks update only own rows. No policy changes in this file.
