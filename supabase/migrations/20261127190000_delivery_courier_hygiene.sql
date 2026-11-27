-- Après 20261127180000. Le service role (auth.uid() nul) et l’admin peuvent changer l’hygiène.
-- Parcours coursier côté serveur. Le code de preuve fait au moins 6 chiffres.
-- Cinq essais faux verrouillent la course (proof_locked, visible par l’admin).

alter table public.orders add column if not exists fulfilment text not null default 'pickup'
  check (fulfilment in ('pickup', 'delivery'));

alter table public.order_payments add column if not exists delivery_cents integer not null default 0;

alter table public.courier_jobs add column if not exists proof_attempts integer not null default 0;
alter table public.courier_jobs add column if not exists proof_locked boolean not null default false;

create or replace function public.freeze_kitchen_hygiene()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.hygiene_passed is distinct from new.hygiene_passed
     and (select auth.uid()) is not null
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

create or replace function public.is_courier()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.user_roles r
      where r.user_id = (select auth.uid()) and r.role = 'courier'
    )
    or exists (
      select 1 from public.account_profiles p
      where p.user_id = (select auth.uid()) and p.role = 'courier'
    )
  );
$$;

revoke all on function public.is_courier() from public, anon;
grant execute on function public.is_courier() to authenticated;

create or replace function public.accept_courier_job(job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched boolean;
begin
  if not public.is_courier() then
    return false;
  end if;
  update public.courier_jobs
  set courier_user_id = (select auth.uid()), state = 'accepted'
  where (id = job_id or order_id = job_id)
    and state = 'offered'
    and courier_user_id is null
  returning true into matched;
  return coalesce(matched, false);
end;
$$;

create or replace function public.mark_picked_up(job_id uuid, submitted_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched boolean;
begin
  if not public.is_courier() then
    return false;
  end if;
  update public.courier_jobs
  set state = 'picked_up'
  where (id = job_id or order_id = job_id)
    and courier_user_id = (select auth.uid())
    and state = 'accepted'
    and pickup_code = submitted_code
  returning true into matched;
  return coalesce(matched, false);
end;
$$;

create or replace function public.mark_en_route(job_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched boolean;
begin
  if not public.is_courier() then
    return false;
  end if;
  update public.courier_jobs
  set state = 'en_route'
  where (id = job_id or order_id = job_id)
    and courier_user_id = (select auth.uid())
    and state = 'picked_up'
  returning true into matched;
  return coalesce(matched, false);
end;
$$;

create or replace function public.confirm_delivery_proof(job_id uuid, submitted_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.courier_jobs%rowtype;
begin
  if not public.is_courier() then
    return false;
  end if;
  select * into job
  from public.courier_jobs
  where (id = job_id or order_id = job_id)
    and courier_user_id = (select auth.uid());
  if not found or job.proof_locked or job.state is distinct from 'en_route' then
    return false;
  end if;
  if submitted_code ~ '^[0-9]{6,12}$' and submitted_code = job.proof_code then
    update public.courier_jobs set state = 'delivered' where id = job.id;
    return true;
  end if;
  update public.courier_jobs
  set proof_attempts = proof_attempts + 1,
      proof_locked = proof_attempts + 1 >= 5
  where id = job.id;
  return false;
end;
$$;

revoke all on function public.accept_courier_job(uuid) from public, anon;
revoke all on function public.mark_picked_up(uuid, text) from public, anon;
revoke all on function public.mark_en_route(uuid) from public, anon;
revoke all on function public.confirm_delivery_proof(uuid, text) from public, anon;
grant execute on function public.accept_courier_job(uuid) to authenticated;
grant execute on function public.mark_picked_up(uuid, text) to authenticated;
grant execute on function public.mark_en_route(uuid) to authenticated;
grant execute on function public.confirm_delivery_proof(uuid, text) to authenticated;
