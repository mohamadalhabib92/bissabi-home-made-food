-- Après 20261127170000, déjà appliqué. Ne pas modifier ce fichier-là.
-- Le coursier assigné ne lit pas proof_code. Il le soumet, la fonction vérifie.
-- Les fonctions d’aide ne sont plus appelables par le client.
-- Les déclencheurs pg_net / Vault sont retirés : l’app appelle sync-me avec son jeton.

revoke insert on public.order_items from anon, authenticated;
revoke insert, update, delete on public.orders from anon, authenticated;

drop trigger if exists notify_crm_profile on public.profiles;
drop trigger if exists notify_crm_account on public.account_profiles;
drop trigger if exists notify_crm_cook on public.cooks;

drop policy if exists courier_jobs_select_assigned on public.courier_jobs;
drop policy if exists courier_jobs_update_assigned on public.courier_jobs;
drop policy if exists kitchens_update_own on public.kitchens;

create policy kitchens_update_own on public.kitchens
  for update to authenticated
  using (cook_id in (select id from public.cooks where user_id = (select auth.uid())))
  with check (cook_id in (select id from public.cooks where user_id = (select auth.uid())));

create or replace function public.freeze_kitchen_hygiene()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.hygiene_passed is distinct from new.hygiene_passed
     and not exists (
       select 1 from public.user_roles
       where user_id = (select auth.uid()) and role = 'admin'
     ) then
    new.hygiene_passed := old.hygiene_passed;
  end if;
  return new;
end;
$$;

revoke all on function public.freeze_kitchen_hygiene() from public, anon, authenticated;

drop trigger if exists kitchens_freeze_hygiene on public.kitchens;
create trigger kitchens_freeze_hygiene
  before update on public.kitchens
  for each row execute function public.freeze_kitchen_hygiene();

create or replace view public.courier_jobs_assigned
with (security_invoker = false) as
select j.id, j.order_id, j.courier_user_id, j.state, j.pickup_code
from public.courier_jobs j
where j.courier_user_id = (select auth.uid());

revoke all on public.courier_jobs_assigned from public, anon;
grant select on public.courier_jobs_assigned to authenticated;

create or replace function public.confirm_delivery_proof(job_id uuid, submitted_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched boolean;
begin
  if submitted_code is null or length(submitted_code) < 4 or length(submitted_code) > 12 then
    return false;
  end if;
  update public.courier_jobs
  set state = 'delivered'
  where id = job_id
    and courier_user_id = (select auth.uid())
    and state is distinct from 'delivered'
    and proof_code = submitted_code
  returning true into matched;
  return coalesce(matched, false);
end;
$$;

revoke all on function public.confirm_delivery_proof(uuid, text) from public, anon;
grant execute on function public.confirm_delivery_proof(uuid, text) to authenticated;

revoke execute on function public.notify_crm_person() from public, anon, authenticated;
revoke execute on function public.courier_job_codes_unchanged(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.kitchen_hygiene_frozen(uuid, boolean) from public, anon, authenticated;
