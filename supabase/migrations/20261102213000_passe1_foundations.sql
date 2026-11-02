-- Passe 1 — fondations Bissabi Home Made Food.
-- Fichier seulement. Ne pas appliquer sur un projet réel depuis l'agent.
-- Aucune URL, aucune clé, aucune donnée personnelle.
-- RLS activé sur chaque table public. Les rôles vivent dans public.user_roles
-- (pas dans user_metadata). Les fonctions security definer sont dans private.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Autorité du canton de Vaud. Les autres cantons s'ajouteront plus tard, sans libellé inventé.
create table public.authorities (
  code text primary key,
  canton text not null unique,
  label text not null,
  official_name text not null,
  city text,
  notes text
);

insert into public.authorities (code, canton, label, official_name, city, notes)
values (
  'ofco-vd',
  'VD',
  'Annonce OFCO (VD)',
  'Office de la consommation',
  'Epalinges',
  'à valider — badge uniquement après revue admin'
);

create table public.launch_zones (
  canton text primary key,
  orders_open boolean not null default false,
  note text
);

insert into public.launch_zones (canton, orders_open, note)
values ('VD', true, 'Commandes et livraisons. Hors de ce canton : pas de commande.');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('buyer', 'cook', 'admin')),
  primary key (user_id, role)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  canton text,
  created_at timestamptz not null default now()
);

create table public.cooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null,
  commune text,
  npa text,
  lat double precision,
  lng double precision,
  canton text not null default 'VD',
  ofco_status text not null default 'none' check (ofco_status in ('none', 'pending', 'identity_verified', 'ofco_verified')),
  delivers boolean not null default false,
  created_at timestamptz not null default now()
);

-- Adresse exacte du cuisinier : jamais dans la fiche publique.
create table public.cook_private (
  cook_id uuid primary key references public.cooks (id) on delete cascade,
  exact_address text
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references public.cooks (id) on delete cascade,
  title text not null,
  description text not null default '',
  price_chf numeric(8, 2) not null check (price_chf >= 0),
  active boolean not null default false,
  photo_path text,
  conservation text,
  reheating text,
  animal_origin text check (animal_origin in ('none', 'meat', 'fish', 'both')),
  provenance text,
  is_bakery boolean,
  production_country text,
  canton text not null default 'VD',
  created_at timestamptz not null default now()
);

create table public.dish_allergens (
  dish_id uuid not null references public.dishes (id) on delete cascade,
  allergen text not null check (allergen in (
    'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
    'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs'
  )),
  level text not null check (level in ('present', 'traces', 'absent')),
  primary key (dish_id, allergen)
);

create table public.dish_ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  name text not null,
  qty numeric not null check (qty > 0),
  unit text not null default 'g'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id),
  cook_id uuid not null references public.cooks (id),
  status text not null default 'sent',
  slot_date date not null,
  created_at timestamptz not null default now()
);

-- Adresse séparée : le cuisinier ne la lit qu'après acceptation et jusqu'à J+1.
create table public.order_addresses (
  order_id uuid primary key references public.orders (id) on delete cascade,
  address text not null
);

create table public.cook_documents (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null references public.cooks (id) on delete cascade,
  kind text not null check (kind in ('id_front', 'id_back', 'selfie', 'ofco_notice')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null
);

insert into public.app_settings (key, value)
values (
  'commission_model',
  '{"model":"buyer","rate":0.15,"note":"à valider"}'::jsonb
);

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false
);

insert into public.feature_flags (key, enabled)
values ('twint', false), ('group_order', false), ('events', false), ('weekly_plan', false);

create index cooks_canton_idx on public.cooks (canton);
create index cooks_user_idx on public.cooks (user_id);
create index dishes_cook_idx on public.dishes (cook_id);
create index dishes_active_idx on public.dishes (active);
create index orders_buyer_idx on public.orders (buyer_id);
create index orders_cook_idx on public.orders (cook_id);
create index orders_slot_date_idx on public.orders (slot_date);
create index user_roles_user_idx on public.user_roles (user_id);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Publication : le plat est d'abord inséré inactif, puis les 14 allergènes et
-- les ingrédients, puis active = true. Le déclencheur refuse une fiche incomplète.
create or replace function private.assert_dish_publishable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_allergens int;
  n_ingredients int;
begin
  if tg_op = 'INSERT' and new.active then
    raise exception 'Insérer le plat inactif, puis renseigner allergènes et ingrédients avant publication';
  end if;
  if new.active is not true then
    return new;
  end if;
  select count(*) into n_allergens
  from public.dish_allergens
  where dish_id = new.id
    and level in ('present', 'traces', 'absent');
  if n_allergens < 14 then
    raise exception 'Publication bloquée : les 14 allergènes doivent être renseignés';
  end if;
  select count(*) into n_ingredients from public.dish_ingredients where dish_id = new.id;
  if n_ingredients < 1 then
    raise exception 'Publication bloquée : ingrédients manquants';
  end if;
  if new.photo_path is null or length(btrim(new.photo_path)) = 0 then
    raise exception 'Publication bloquée : photo manquante';
  end if;
  if new.conservation is null or length(btrim(new.conservation)) = 0 then
    raise exception 'Publication bloquée : conservation manquante';
  end if;
  if new.reheating is null or length(btrim(new.reheating)) = 0 then
    raise exception 'Publication bloquée : réchauffage manquant';
  end if;
  if new.animal_origin is null then
    raise exception 'Publication bloquée : origine animale non renseignée';
  end if;
  if new.animal_origin <> 'none' and (new.provenance is null or length(btrim(new.provenance)) = 0) then
    raise exception 'Publication bloquée : provenance manquante';
  end if;
  if new.is_bakery is null then
    raise exception 'Publication bloquée : pain ou pâtisserie non renseigné';
  end if;
  if new.is_bakery and (new.production_country is null or length(btrim(new.production_country)) = 0) then
    raise exception 'Publication bloquée : pays de production manquant';
  end if;
  return new;
end;
$$;

revoke all on function private.assert_dish_publishable() from public, anon, authenticated;

create trigger dishes_publishable
  before insert or update on public.dishes
  for each row execute function private.assert_dish_publishable();

-- RLS
alter table public.authorities enable row level security;
alter table public.launch_zones enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;
alter table public.cooks enable row level security;
alter table public.cook_private enable row level security;
alter table public.dishes enable row level security;
alter table public.dish_allergens enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.orders enable row level security;
alter table public.order_addresses enable row level security;
alter table public.cook_documents enable row level security;
alter table public.app_settings enable row level security;
alter table public.feature_flags enable row level security;

revoke all on public.authorities, public.launch_zones, public.user_roles, public.profiles,
  public.cooks, public.cook_private, public.dishes, public.dish_allergens, public.dish_ingredients, public.orders,
  public.order_addresses, public.cook_documents, public.app_settings, public.feature_flags
  from anon, authenticated;

grant select on public.authorities, public.launch_zones, public.app_settings, public.feature_flags to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select (id, display_name, commune, npa, lat, lng, canton, ofco_status, delivers, created_at) on public.cooks to anon;
grant select, insert, update on public.cooks to authenticated;
grant select, insert, update on public.cook_private to authenticated;
grant select on public.dishes, public.dish_allergens, public.dish_ingredients to anon, authenticated;
grant insert, update, delete on public.dishes, public.dish_allergens, public.dish_ingredients to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_addresses to authenticated;
grant select, insert on public.cook_documents to authenticated;
grant select on public.user_roles to authenticated;

create policy authorities_read on public.authorities
  for select to anon, authenticated
  using (true);

create policy launch_zones_read on public.launch_zones
  for select to anon, authenticated
  using (true);

create policy settings_read on public.app_settings
  for select to anon, authenticated
  using (true);

create policy flags_read on public.feature_flags
  for select to anon, authenticated
  using (true);

create policy settings_admin_write on public.app_settings
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy flags_admin_write on public.feature_flags
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

create policy cooks_public_select on public.cooks
  for select to anon, authenticated
  using (true);

create policy cooks_insert_own on public.cooks
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy cooks_update_own on public.cooks
  for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

create view public.cooks_public
with (security_invoker = true) as
select id, display_name, commune, npa, lat, lng, canton, ofco_status, delivers, created_at
from public.cooks;

grant select on public.cooks_public to anon, authenticated;

create policy cook_private_own on public.cook_private
  for select to authenticated
  using (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  );

create policy cook_private_write on public.cook_private
  for insert to authenticated
  with check (cook_id in (select id from public.cooks where user_id = (select auth.uid())));

create policy cook_private_update on public.cook_private
  for update to authenticated
  using (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  )
  with check (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  );

create policy dishes_select on public.dishes
  for select to anon, authenticated
  using (
    active = true
    or cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  );

create policy dishes_write on public.dishes
  for insert to authenticated
  with check (cook_id in (select id from public.cooks where user_id = (select auth.uid())));

create policy dishes_update on public.dishes
  for update to authenticated
  using (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  )
  with check (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  );

create policy dishes_delete on public.dishes
  for delete to authenticated
  using (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  );

create policy allergens_select on public.dish_allergens
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.dishes d
      where d.id = dish_id
        and (
          d.active = true
          or d.cook_id in (select id from public.cooks where user_id = (select auth.uid()))
          or (select private.is_admin())
        )
    )
  );

create policy allergens_write on public.dish_allergens
  for all to authenticated
  using (
    exists (
      select 1 from public.dishes d
      join public.cooks c on c.id = d.cook_id
      where d.id = dish_id
        and (c.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  )
  with check (
    exists (
      select 1 from public.dishes d
      join public.cooks c on c.id = d.cook_id
      where d.id = dish_id
        and (c.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  );

create policy ingredients_select on public.dish_ingredients
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.dishes d
      where d.id = dish_id
        and (
          d.active = true
          or d.cook_id in (select id from public.cooks where user_id = (select auth.uid()))
          or (select private.is_admin())
        )
    )
  );

create policy ingredients_write on public.dish_ingredients
  for all to authenticated
  using (
    exists (
      select 1 from public.dishes d
      join public.cooks c on c.id = d.cook_id
      where d.id = dish_id
        and (c.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  )
  with check (
    exists (
      select 1 from public.dishes d
      join public.cooks c on c.id = d.cook_id
      where d.id = dish_id
        and (c.user_id = (select auth.uid()) or (select private.is_admin()))
    )
  );

create policy orders_buyer on public.orders
  for select to authenticated
  using (buyer_id = (select auth.uid()) or (select private.is_admin()));

create policy orders_cook on public.orders
  for select to authenticated
  using (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    or (select private.is_admin())
  );

create policy address_buyer on public.order_addresses
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = (select auth.uid())
    )
    or (select private.is_admin())
  );

create policy address_cook_after_accept on public.order_addresses
  for select to authenticated
  using (
    exists (
      select 1
      from public.orders o
      join public.cooks c on c.id = o.cook_id
      where o.id = order_addresses.order_id
        and c.user_id = (select auth.uid())
        and o.status in ('accepted', 'preparing', 'ready', 'delivering', 'delivered', 'completed')
        and o.slot_date >= (current_date - 1)
    )
  );

create policy documents_admin_select on public.cook_documents
  for select to authenticated
  using ((select private.is_admin()));

create policy documents_insert_own on public.cook_documents
  for insert to authenticated
  with check (cook_id in (select id from public.cooks where user_id = (select auth.uid())));

-- Buckets : photos de plats lisibles, documents cuisinier privés (admin).
insert into storage.buckets (id, name, public)
values ('dishes', 'dishes', true), ('cook-documents', 'cook-documents', false)
on conflict (id) do nothing;

create policy dishes_storage_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'dishes');

create policy dishes_storage_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dishes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy documents_storage_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'cook-documents' and (select private.is_admin()));

create policy documents_storage_own_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cook-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
