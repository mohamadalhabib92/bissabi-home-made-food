-- Comptes et livreurs. NON APPLIQUÉ. Ne pas lancer sur un projet hébergé sans accord.
-- anon n'a aucun droit. Un livreur ne peut pas se valider lui-même.

create table public.account_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('client', 'cook', 'courier')),
  created_at timestamptz not null default now()
);

create table public.couriers_directory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  vehicle text not null check (vehicle in ('foot', 'bike', 'scooter', 'car')),
  zone text not null check (zone in ('lausanne', 'prilly', 'both')),
  available boolean not null default false,
  validated boolean not null default false
);

alter table public.account_profiles enable row level security;
alter table public.couriers_directory enable row level security;

revoke all on public.account_profiles from anon, authenticated;
revoke all on public.couriers_directory from anon, authenticated;

grant select, insert, update on public.account_profiles to authenticated;
grant select, insert, update on public.couriers_directory to authenticated;

create policy account_profiles_own on public.account_profiles
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy couriers_select_own on public.couriers_directory
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy couriers_insert_unvalidated on public.couriers_directory
  for insert to authenticated
  with check (user_id = (select auth.uid()) and validated = false);

create policy couriers_update_keep_validation on public.couriers_directory
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and validated = (select c.validated from public.couriers_directory c where c.user_id = (select auth.uid()))
  );

create policy couriers_admin_validate on public.couriers_directory
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
