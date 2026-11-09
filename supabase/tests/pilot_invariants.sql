-- Preuves locales. Échoue (exception) si une règle ne tient pas.
-- À lancer après la migration, sur une base vide de données métier.

insert into pilot.markets (id, country_code, currency, timezone, status)
values ('sn-dk', 'SN', 'XOF', 'Africa/Dakar', 'planned')
on conflict (id) do nothing;

insert into pilot.kitchens (id, market_id, responsible_name, documents_ok, hygiene_ok, training_ok, sales_allowed)
values ('k_incomplete', 'ch-vd', null, false, false, false, false);

insert into pilot.dishes (id, kitchen_id, title, price_minor, currency, published, current_recipe_id)
values ('d_incomplete', 'k_incomplete', 'Mafé', 1800, 'CHF', true, null);

insert into pilot.recipe_versions (id, dish_id, version, allergens)
values ('r_incomplete', 'd_incomplete', 1, '{"peanuts":"present"}'::jsonb);

update pilot.dishes set current_recipe_id = 'r_incomplete' where id = 'd_incomplete';

insert into pilot.slots (id, dish_id, starts_at, ends_at, zone, capacity)
values ('s_incomplete', 'd_incomplete', '2026-11-12 17:00:00+00', '2026-11-12 18:00:00+00', 'Europe/Zurich', 4);

do $$
declare result text;
begin
  result := pilot.reserve_portion('buyer_a', 's_incomplete', 1);
  if result <> 'kitchen_file_incomplete' then
    raise exception 'dossier incomplet : %', result;
  end if;
  if (select count(*) from pilot.orders) <> 0 then
    raise exception 'une commande a été créée';
  end if;
end $$;

insert into pilot.kitchens (id, market_id, responsible_name, documents_ok, hygiene_ok, training_ok, sales_allowed)
values ('k_ready', 'ch-vd', 'Amina', true, true, true, true);

insert into pilot.dishes (id, kitchen_id, title, price_minor, currency, published)
values ('d_ready', 'k_ready', 'Mafé', 1800, 'CHF', true);

insert into pilot.recipe_versions (id, dish_id, version, allergens)
values ('r1', 'd_ready', 1, '{"milk":"absent","peanuts":"present"}'::jsonb);

update pilot.dishes set current_recipe_id = 'r1' where id = 'd_ready';

insert into pilot.slots (id, dish_id, starts_at, ends_at, zone, capacity)
values ('s_last', 'd_ready', '2026-11-12 17:00:00+00', '2026-11-12 18:00:00+00', 'Europe/Zurich', 1);

do $$
declare a text; b text;
begin
  a := pilot.reserve_portion('sara', 's_last', 1);
  b := pilot.reserve_portion('noah', 's_last', 1);
  if a not like 'ok:%' then raise exception 'première réservation : %', a; end if;
  if b <> 'portion_taken' then raise exception 'deuxième réservation : %', b; end if;
  if (select count(*) from pilot.orders where slot_id = 's_last') <> 1 then
    raise exception 'plus d’une commande';
  end if;
  if (select held + sold from pilot.slots where id = 's_last') <> 1 then
    raise exception 'stock incohérent';
  end if;
end $$;

do $$
declare oid text; rid text; pinned text; flagged boolean; frozen jsonb; current jsonb;
begin
  select id into oid from pilot.orders where buyer_id = 'sara';
  select recipe_version_id into pinned from pilot.orders where id = oid;
  rid := pilot.revise_recipe('d_ready', '{"milk":"present","peanuts":"present"}'::jsonb);
  select recipe_version_id into pinned from pilot.orders where id = oid;
  if pinned <> 'r1' then raise exception 'recette figée perdue : %', pinned; end if;
  select 'recipe_changed' = any (flags) into flagged from pilot.orders where id = oid;
  if not flagged then raise exception 'commande non signalée'; end if;
  select allergens into frozen from pilot.recipe_versions where id = 'r1';
  select allergens into current from pilot.recipe_versions where id = rid;
  if frozen->>'milk' <> 'absent' then raise exception 'version figée modifiée'; end if;
  if current->>'milk' <> 'present' then raise exception 'nouvel allergène absent'; end if;
end $$;

do $$
declare oid text; first text; second text; n int;
begin
  select id into oid from pilot.orders where buyer_id = 'sara';
  first := pilot.apply_payment_event('evt_1', oid);
  second := pilot.apply_payment_event('evt_1', oid);
  if first <> 'applied' then raise exception 'paiement : %', first; end if;
  if second <> 'duplicate' then raise exception 'doublon : %', second; end if;
  select count(*) into n from pilot.ledger;
  if n <> 1 then raise exception 'grand livre : %', n; end if;
  select count(*) into n from pilot.orders where payment_status = 'paid';
  if n <> 1 then raise exception 'commandes payées : %', n; end if;
end $$;

insert into pilot.missions (id, market_id, order_id, courier_id, precise_address)
select 'm1', 'ch-vd', id, 'luc', 'Rue de la Suettaz 3' from pilot.orders where buyer_id = 'sara';

do $$
begin
  perform * from pilot.open_mission('other', 'm1');
  raise exception 'le coursier intrus a été accepté';
exception
  when insufficient_privilege then
    if sqlerrm not like '%courier_refused%' then raise; end if;
end $$;

do $$
declare addr text;
begin
  select precise_address into addr from pilot.open_mission('luc', 'm1');
  if addr not like '%Suettaz%' then raise exception 'adresse manquante pour le coursier assigné'; end if;
end $$;

insert into pilot.lots (id, code) values ('lot1', 'LOT-24');
insert into pilot.batches (id, dish_id, blocked) values ('b1', 'd_ready', false);
insert into pilot.batch_lots (batch_id, lot_id) values ('b1', 'lot1');
insert into pilot.batch_orders (batch_id, order_id)
select 'b1', id from pilot.orders where buyer_id = 'sara';

do $$
declare n int; blocked boolean;
begin
  select count(*) into n from pilot.recall_lot('lot1');
  if n <> 1 then
    raise exception 'rappel : mauvais nombre de commandes (%)', n;
  end if;
  select sales_blocked into blocked from pilot.dishes where id = 'd_ready';
  if not blocked then raise exception 'vente non bloquée'; end if;
end $$;

insert into pilot.slots (id, dish_id, starts_at, ends_at, zone, capacity)
values ('s_after', 'd_ready', '2026-11-13 17:00:00+00', '2026-11-13 18:00:00+00', 'Europe/Zurich', 2);

do $$
declare result text;
begin
  result := pilot.reserve_portion('noah', 's_after', 1);
  if result <> 'sales_blocked' then raise exception 'après rappel : %', result; end if;
end $$;

insert into pilot.admin_scopes (actor_id, market_id) values ('admin_ch', 'ch-vd');

do $$
declare oid text;
begin
  select id into oid from pilot.orders where buyer_id = 'sara';
  perform * from pilot.read_order('admin_sn', 'admin', oid);
  raise exception 'admin hors marché accepté';
exception
  when insufficient_privilege then
    if sqlerrm not like '%market_scope_refused%' then raise; end if;
end $$;

do $$
declare oid text; mid text;
begin
  select id into oid from pilot.orders where buyer_id = 'sara';
  select market_id into mid from pilot.read_order('admin_ch', 'admin', oid);
  if mid <> 'ch-vd' then raise exception 'marché illisible'; end if;
end $$;

grant usage on schema pilot to pilot_client;
grant execute on function pilot.open_mission(text, text) to pilot_client;
revoke all on all tables in schema pilot from pilot_client;

set role pilot_client;

do $$
begin
  begin
    perform 1 from pilot.missions limit 1;
    raise exception 'table visible to pilot_client';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    perform * from pilot.open_mission('other', 'm1');
    raise exception 'courier accepted';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%courier_refused%' then
        raise;
      end if;
  end;
end $$;

reset role;
