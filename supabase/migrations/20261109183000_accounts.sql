-- Comptes client et cuisinier. Additif.
-- Ne pas appliquer sur le projet Supabase hébergé depuis l'agent.
-- Le rôle n'est pas lu dans user_metadata pour les décisions : la ligne public.user_roles fait foi.
-- requested_role dans les métadonnées n'est lu qu'une fois, à la création du compte, et seulement pour client ou cook.
-- Rollback : supabase/rollback/20261109183000_accounts.sql

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists locale text;
alter table public.profiles add column if not exists signup_role text;
alter table public.profiles add column if not exists kitchen_status text;

update public.profiles set signup_role = 'client' where signup_role is null;
update public.profiles set kitchen_status = 'none' where kitchen_status is null;

alter table public.profiles alter column signup_role set default 'client';
alter table public.profiles alter column kitchen_status set default 'none';
alter table public.profiles alter column signup_role set not null;
alter table public.profiles alter column kitchen_status set not null;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_signup_role_check') then
    alter table public.profiles drop constraint profiles_signup_role_check;
  end if;
  if exists (select 1 from pg_constraint where conname = 'profiles_kitchen_status_check') then
    alter table public.profiles drop constraint profiles_kitchen_status_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_signup_role_check check (signup_role in ('client', 'cook'));
alter table public.profiles
  add constraint profiles_kitchen_status_check check (kitchen_status in ('none', 'dossier_en_cours', 'approved', 'suspended'));

create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  primary key (user_id, role)
);

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'user_roles_role_check') then
    alter table public.user_roles drop constraint user_roles_role_check;
  end if;
end $$;

alter table public.user_roles
  add constraint user_roles_role_check check (role in ('buyer', 'client', 'cook', 'admin', 'courier'));

create table if not exists public.kitchen_files (
  user_id uuid primary key references auth.users (id) on delete cascade,
  responsible_name text,
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  line text not null,
  postal_code text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  status text not null default 'requested' check (status in ('requested', 'done', 'refused'))
);

create table if not exists public.account_dishes (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  published boolean not null default false
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.has_role(target text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and (
        role = target
        or (target = 'client' and role = 'buyer')
      )
  );
$$;

create or replace function private.email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = (select auth.uid())
      and email_confirmed_at is not null
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.has_role(text) from public;
revoke all on function private.email_confirmed() from public;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.has_role(text) to authenticated;
grant execute on function private.email_confirmed() to authenticated;

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.signup_role is distinct from old.signup_role and not private.is_admin() then
      raise exception 'role_reserved' using errcode = '42501';
    end if;
    if new.kitchen_status is distinct from old.kitchen_status and not private.is_admin() then
      raise exception 'kitchen_status_reserved' using errcode = '42501';
    end if;
  end if;
  if new.signup_role not in ('client', 'cook') then
    raise exception 'role_reserved' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function private.protect_profile_role();

create or replace function private.protect_user_roles()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'supabase_auth_admin') then
    return coalesce(new, old);
  end if;
  if not private.is_admin() then
    raise exception 'role_reserved' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_roles_protect on public.user_roles;
create trigger user_roles_protect
  before insert or update or delete on public.user_roles
  for each row execute function private.protect_user_roles();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := coalesce(new.raw_user_meta_data->>'requested_role', 'client');
begin
  if requested is distinct from 'cook' then
    requested := 'client';
  end if;
  insert into public.profiles (id, display_name, phone, locale, signup_role, kitchen_status)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
    null,
    nullif(new.raw_user_meta_data->>'locale', ''),
    requested,
    case when requested = 'cook' then 'dossier_en_cours' else 'none' end
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, requested)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.publish_dish(p_dish text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  status text;
begin
  if not private.has_role('cook') then
    raise exception 'not_cook' using errcode = '42501';
  end if;
  if not private.email_confirmed() then
    raise exception 'email_unverified' using errcode = '42501';
  end if;
  select kitchen_status into status from public.profiles where id = (select auth.uid());
  if status is distinct from 'approved' then
    raise exception 'dossier_en_cours' using errcode = '42501';
  end if;
  update public.account_dishes
    set published = true
    where id = p_dish and owner_id = (select auth.uid());
  if not found then
    raise exception 'not_owner' using errcode = '42501';
  end if;
end;
$$;

create or replace function private.set_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'role_reserved' using errcode = '42501';
  end if;
  if p_role not in ('client', 'cook', 'admin', 'courier', 'buyer') then
    raise exception 'bad_role' using errcode = '22023';
  end if;
  insert into public.user_roles (user_id, role) values (p_user, p_role)
  on conflict do nothing;
end;
$$;

create or replace function private.approve_kitchen(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'role_reserved' using errcode = '42501';
  end if;
  update public.profiles
    set kitchen_status = 'approved'
    where id = p_user and signup_role = 'cook';
end;
$$;

create or replace function private.request_account_deletion()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  insert into public.deletion_requests (user_id)
  values ((select auth.uid()))
  returning id into created;
  return created;
end;
$$;

revoke all on function private.publish_dish(text) from public;
revoke all on function private.set_role(uuid, text) from public;
revoke all on function private.approve_kitchen(uuid) from public;
revoke all on function private.request_account_deletion() from public;

create or replace function public.request_account_deletion()
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.request_account_deletion();
$$;

revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;

grant execute on function private.publish_dish(text) to authenticated;
grant execute on function private.set_role(uuid, text) to authenticated;
grant execute on function private.approve_kitchen(uuid) to authenticated;
grant execute on function private.request_account_deletion() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.kitchen_files enable row level security;
alter table public.delivery_addresses enable row level security;
alter table public.deletion_requests enable row level security;
alter table public.account_dishes enable row level security;

revoke all on public.profiles, public.user_roles, public.kitchen_files, public.delivery_addresses, public.deletion_requests, public.account_dishes from public, anon, authenticated;

grant select (
  id, display_name, phone, locale, signup_role, kitchen_status, created_at
) on public.profiles to authenticated;
grant update (display_name, phone, locale) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.kitchen_files to authenticated;
grant select, insert, update, delete on public.delivery_addresses to authenticated;
grant select on public.deletion_requests to authenticated;
grant select, insert on public.account_dishes to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists roles_select_own on public.user_roles;
create policy roles_select_own on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists kitchen_own on public.kitchen_files;
create policy kitchen_own on public.kitchen_files
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.has_role('cook'))
  )
  with check (
    user_id = (select auth.uid())
    and (select private.has_role('cook'))
  );

drop policy if exists address_own on public.delivery_addresses;
create policy address_own on public.delivery_addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (select private.has_role('client')));

drop policy if exists deletion_select_own on public.deletion_requests;
create policy deletion_select_own on public.deletion_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists dishes_own on public.account_dishes;
create policy dishes_own on public.account_dishes
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists dishes_insert_own on public.account_dishes;
create policy dishes_insert_own on public.account_dishes
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select private.has_role('cook')));
