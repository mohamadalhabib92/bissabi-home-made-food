-- Correctifs après application de live_marketplace. Ne pas modifier les fichiers déjà appliqués.
-- Courses non assignées : visibles seulement par un rôle coursier, sans les codes.
-- Mise à jour : cuisine par son propriétaire (hygiène figée), course par le coursier assigné ou un admin.

drop policy if exists courier_jobs_assigned on public.courier_jobs;

create or replace function public.courier_job_codes_unchanged(job_id uuid, pickup text, proof text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.courier_jobs
    where id = job_id and pickup_code = pickup and proof_code = proof
  );
$$;

revoke all on function public.courier_job_codes_unchanged(uuid, text, text) from public, anon;
grant execute on function public.courier_job_codes_unchanged(uuid, text, text) to authenticated;

create policy courier_jobs_select_assigned on public.courier_jobs
  for select to authenticated
  using (courier_user_id = (select auth.uid()));

create policy courier_jobs_select_admin on public.courier_jobs
  for select to authenticated
  using ((select private.is_admin()));

create policy courier_jobs_update_assigned on public.courier_jobs
  for update to authenticated
  using (courier_user_id = (select auth.uid()))
  with check (
    courier_user_id = (select auth.uid())
    and public.courier_job_codes_unchanged(id, pickup_code, proof_code)
  );

create policy courier_jobs_update_admin on public.courier_jobs
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create or replace view public.courier_jobs_open
with (security_invoker = false) as
select j.id, j.order_id, j.state
from public.courier_jobs j
where j.courier_user_id is null
  and (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'courier'
    )
    or exists (
      select 1 from public.account_profiles p
      where p.user_id = (select auth.uid()) and p.role = 'courier'
    )
  );

revoke all on public.courier_jobs_open from public, anon;
grant select on public.courier_jobs_open to authenticated;

create or replace function public.kitchen_hygiene_frozen(kitchen_id uuid, next_flag boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kitchens
    where id = kitchen_id and hygiene_passed = next_flag
  );
$$;

revoke all on function public.kitchen_hygiene_frozen(uuid, boolean) from public, anon;
grant execute on function public.kitchen_hygiene_frozen(uuid, boolean) to authenticated;

create policy kitchens_update_own on public.kitchens
  for update to authenticated
  using (cook_id in (select id from public.cooks where user_id = (select auth.uid())))
  with check (
    cook_id in (select id from public.cooks where user_id = (select auth.uid()))
    and public.kitchen_hygiene_frozen(id, hygiene_passed)
  );

create policy kitchens_update_admin on public.kitchens
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Grand livre lu par crm-sync. Le client n’y écrit pas : le webhook, avec la clé service.
create table if not exists public.order_payments (
  order_id text primary key,
  buyer_id text not null,
  seller_id text not null,
  seller_kind text not null default 'home' check (seller_kind in ('home', 'caterer')),
  status text not null check (status in ('paid', 'refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  stripe_payment_intent_id text,
  updated_at timestamptz not null default now()
);

alter table public.order_payments enable row level security;
revoke all on public.order_payments from anon, authenticated;

-- Nouvelle fiche : prévenir crm-sync. Sans secret Vault, l’inscription continue.
create or replace function public.notify_crm_person()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
  person uuid;
begin
  person := case when tg_table_name = 'profiles' then new.id else new.user_id end;
  begin
    select decrypted_secret into secret
    from vault.decrypted_secrets
    where name = 'food_service_role_key'
    limit 1;
    if secret is null or secret = '' then
      return new;
    end if;
    perform net.http_post(
      url := 'https://qizhprlzeiqrngwpxjnd.supabase.co/functions/v1/crm-sync',
      body := jsonb_build_object('userId', person),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || secret
      )
    );
  exception when others then
    return new;
  end;
  return new;
end;
$$;

drop trigger if exists notify_crm_profile on public.profiles;
create trigger notify_crm_profile
  after insert on public.profiles
  for each row execute function public.notify_crm_person();

drop trigger if exists notify_crm_account on public.account_profiles;
create trigger notify_crm_account
  after insert on public.account_profiles
  for each row execute function public.notify_crm_person();

drop trigger if exists notify_crm_cook on public.cooks;
create trigger notify_crm_cook
  after insert on public.cooks
  for each row execute function public.notify_crm_person();
