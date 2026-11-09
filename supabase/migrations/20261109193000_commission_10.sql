-- Commission 10 % (1000 points de base), figée sur la commande au paiement.
-- Additif. Le schéma pilot doit déjà exister. Ne pas appliquer sur un projet hébergé.

alter table pilot.markets add column if not exists commission_rate_bps integer not null default 1000;
alter table pilot.orders add column if not exists commission_rate_bps integer;

update pilot.markets set commission_rate_bps = 1000 where commission_rate_bps is null;

create or replace function pilot.apply_payment_event(p_event text, p_order text)
returns text
language plpgsql
security definer
set search_path = pilot, pg_temp
as $$
declare
  o pilot.orders%rowtype;
  inserted text;
  rate integer;
  commission integer;
begin
  insert into pilot.payment_events (event_id, order_id, kind, applied)
  values (p_event, p_order, 'payment_succeeded', false)
  on conflict (event_id) do nothing
  returning event_id into inserted;
  if inserted is null then
    return 'duplicate';
  end if;
  select * into o from pilot.orders where id = p_order for update;
  if o.payment_status = 'paid' then
    return 'already_paid';
  end if;
  select m.commission_rate_bps into rate
  from pilot.markets m
  where m.id = o.market_id;
  rate := coalesce(rate, 1000);
  commission := (o.total_minor * rate + 5000) / 10000;
  update pilot.orders
    set payment_status = 'paid', commission_rate_bps = rate
    where id = p_order;
  update pilot.slots set held = held - o.qty, sold = sold + o.qty where id = o.slot_id;
  insert into pilot.ledger (id, event_id, order_id, currency, collected_minor, commission_minor, fees_minor, owed_kitchen_minor)
  values ('led_' || p_event, p_event, p_order, o.currency, o.total_minor, commission, 0, o.total_minor - commission);
  update pilot.payment_events set applied = true where event_id = p_event;
  return 'applied';
end;
$$;

revoke all on function pilot.apply_payment_event(text, text) from public;
