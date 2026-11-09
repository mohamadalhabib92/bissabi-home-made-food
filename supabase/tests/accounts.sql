-- Preuves : client / cuisinier, promotion refusée, publication bloquée tant que le dossier ou le courriel manque.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-0000000000c1', 'sara@example.com', '{"requested_role":"client","display_name":"Sara"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'amina@example.com', '{"requested_role":"cook","display_name":"Amina"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'intrus@example.com', '{"requested_role":"admin","display_name":"Intrus"}');

do $$
begin
  if (select signup_role from public.profiles where id = '00000000-0000-0000-0000-0000000000c1') <> 'client' then
    raise exception 'client mal classé';
  end if;
  if (select kitchen_status from public.profiles where id = '00000000-0000-0000-0000-0000000000c1') <> 'none' then
    raise exception 'client avec dossier cuisine';
  end if;
  if (select signup_role from public.profiles where id = '00000000-0000-0000-0000-0000000000c2') <> 'cook' then
    raise exception 'cuisinier mal classé';
  end if;
  if (select kitchen_status from public.profiles where id = '00000000-0000-0000-0000-0000000000c2') <> 'dossier_en_cours' then
    raise exception 'cuisinier pas en dossier en cours';
  end if;
  if (select signup_role from public.profiles where id = '00000000-0000-0000-0000-0000000000c3') <> 'client' then
    raise exception 'admin demandé à l’inscription accepté';
  end if;
  if exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000c3' and role = 'admin') then
    raise exception 'rôle admin posé depuis les métadonnées';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
set role authenticated;

do $$
begin
  begin
    insert into public.kitchen_files (user_id, responsible_name)
    values ('00000000-0000-0000-0000-0000000000c1', 'Sara');
    raise exception 'client a écrit un dossier cuisine';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    perform private.publish_dish('dish_x');
    raise exception 'client a publié';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%not_cook%' then raise; end if;
  end;
end $$;

reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
set role authenticated;

do $$
begin
  begin
    insert into public.user_roles (user_id, role)
    values ('00000000-0000-0000-0000-0000000000c2', 'admin');
    raise exception 'cuisinier promu admin';
  exception
    when insufficient_privilege then
      null;
  end;
  begin
    perform private.set_role('00000000-0000-0000-0000-0000000000c2', 'admin');
    raise exception 'set_role a accepté le cuisinier';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%role_reserved%' then raise; end if;
  end;
  begin
    update public.profiles set signup_role = 'client' where id = '00000000-0000-0000-0000-0000000000c2';
    raise exception 'colonne de rôle modifiée';
  exception
    when insufficient_privilege then
      null;
  end;
end $$;

reset role;

do $$
begin
  if exists (
    select 1 from public.user_roles
    where user_id = '00000000-0000-0000-0000-0000000000c2' and role = 'admin'
  ) then
    raise exception 'rôle admin enregistré';
  end if;
  if (select signup_role from public.profiles where id = '00000000-0000-0000-0000-0000000000c2') <> 'cook' then
    raise exception 'rôle d’inscription modifié';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
set role authenticated;

insert into public.account_dishes (id, owner_id, published)
values ('dish_amina', '00000000-0000-0000-0000-0000000000c2', false);

do $$
begin
  begin
    perform private.publish_dish('dish_amina');
    raise exception 'cuisinier non vérifié a publié';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%email_unverified%' then raise; end if;
  end;
end $$;

reset role;
update auth.users set email_confirmed_at = now() where id = '00000000-0000-0000-0000-0000000000c2';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
set role authenticated;

do $$
begin
  begin
    perform private.publish_dish('dish_amina');
    raise exception 'dossier en cours a publié';
  exception
    when insufficient_privilege then
      if sqlerrm not like '%dossier_en_cours%' then raise; end if;
  end;
  if (select published from public.account_dishes where id = 'dish_amina') then
    raise exception 'plat publié malgré le dossier';
  end if;
end $$;

reset role;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000a1', 'admin@bissabi.example', now(), '{"requested_role":"admin","display_name":"Admin"}');

delete from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a1';
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000a1', 'admin');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
set role authenticated;
select private.approve_kitchen('00000000-0000-0000-0000-0000000000c2');
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
set role authenticated;
select private.publish_dish('dish_amina');
reset role;

do $$
begin
  if not (select published from public.account_dishes where id = 'dish_amina') then
    raise exception 'plat approuvé non publié';
  end if;
end $$;
