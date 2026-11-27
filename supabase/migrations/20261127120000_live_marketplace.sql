-- Place de marché. Projet bissabi-home-made-food (qizhprlzeiqrngwpxjnd, eu-central-2).
-- NON APPLIQUÉ. Ne pas lancer sans l’accord de Mohamed.
-- Les tables passe 1 (profiles, cooks, dishes, orders, reviews) restent. On ajoute ce qui manque.

alter table public.account_profiles drop constraint if exists account_profiles_role_check;
alter table public.account_profiles add constraint account_profiles_role_check
  check (role in ('client', 'cook', 'traiteur', 'courier'));

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('buyer', 'cook', 'traiteur', 'courier', 'admin'));

create table if not exists public.kitchens (
  id uuid primary key default gen_random_uuid(),
  cook_id uuid not null unique references public.cooks (id) on delete cascade,
  kind text not null check (kind in ('home', 'caterer')),
  canton text not null default 'VD' check (canton = 'VD'),
  hygiene_passed boolean not null default false
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  dish_id uuid references public.dishes (id),
  title text not null,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create table if not exists public.payouts (
  stripe_payout_id text primary key,
  cook_id uuid references public.cooks (id),
  amount_cents integer,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.courier_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  courier_user_id uuid references auth.users (id),
  state text not null default 'offered' check (state in ('offered', 'accepted', 'picked_up', 'en_route', 'delivered')),
  pickup_code text not null,
  proof_code text not null
);

alter table public.kitchens enable row level security;
alter table public.order_items enable row level security;
alter table public.payouts enable row level security;
alter table public.courier_jobs enable row level security;

revoke all on public.kitchens from anon;
revoke all on public.order_items from anon;
revoke all on public.payouts from anon;
revoke all on public.courier_jobs from anon;

grant select, insert, update on public.kitchens to authenticated;
grant select, insert on public.order_items to authenticated;
grant select on public.payouts to authenticated;
grant select, update on public.courier_jobs to authenticated;

create policy kitchens_own on public.kitchens
  for select to authenticated
  using (cook_id in (select id from public.cooks where user_id = (select auth.uid())));

create policy kitchens_insert_own on public.kitchens
  for insert to authenticated
  with check (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    and hygiene_passed = false
  );

create policy order_items_parties on public.order_items
  for select to authenticated
  using (order_id in (
    select id from public.orders
    where buyer_id = (select auth.uid())
       or cook_id in (select id from public.cooks where user_id = (select auth.uid()))
  ));

create policy payouts_own on public.payouts
  for select to authenticated
  using (cook_id in (select id from public.cooks where user_id = (select auth.uid())));

create policy courier_jobs_assigned on public.courier_jobs
  for select to authenticated
  using (
    courier_user_id = (select auth.uid())
    or courier_user_id is null
  );
