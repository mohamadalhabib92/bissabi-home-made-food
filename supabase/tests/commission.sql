do $$
declare
  commission integer;
  owed integer;
  rate integer;
  rows integer;
begin
  select l.commission_minor, l.owed_kitchen_minor, o.commission_rate_bps
    into commission, owed, rate
  from pilot.ledger l
  join pilot.orders o on o.id = l.order_id
  where l.event_id = 'evt_1';
  if commission <> 180 then
    raise exception 'commission 10 %% attendue 180, obtenu %', commission;
  end if;
  if owed <> 1620 then
    raise exception 'net cuisinier attendu 1620, obtenu %', owed;
  end if;
  if rate <> 1000 then
    raise exception 'taux figé attendu 1000, obtenu %', rate;
  end if;
  if pilot.apply_payment_event('evt_1', (select order_id from pilot.ledger where event_id = 'evt_1')) <> 'duplicate' then
    raise exception 'le doublon n’a pas été ignoré';
  end if;
  select count(*) into rows from pilot.ledger where event_id = 'evt_1';
  if rows <> 1 then
    raise exception 'le doublon a créé une deuxième commission';
  end if;
end $$;
