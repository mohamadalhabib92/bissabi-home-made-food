-- Après 20261127190000. Ajoute le compteur du code de retrait, sans effacer de données.
-- Cinq essais faux verrouillent la course, comme le code de preuve.

alter table public.courier_jobs add column if not exists pickup_attempts integer not null default 0;
alter table public.courier_jobs add column if not exists pickup_locked boolean not null default false;

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create or replace function public.mark_picked_up(job_id uuid, submitted_code text)
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
  if not found or job.pickup_locked or job.state is distinct from 'accepted' then
    return false;
  end if;
  if submitted_code = job.pickup_code then
    update public.courier_jobs set state = 'picked_up' where id = job.id;
    return true;
  end if;
  update public.courier_jobs
  set pickup_attempts = pickup_attempts + 1,
      pickup_locked = pickup_attempts + 1 >= 5
  where id = job.id;
  return false;
end;
$$;

revoke all on function public.mark_picked_up(uuid, text) from public, anon;
grant execute on function public.mark_picked_up(uuid, text) to authenticated;
