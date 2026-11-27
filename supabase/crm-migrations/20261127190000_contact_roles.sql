-- Projet bissabi-crm. Une personne = un contact, avec un tableau de rôles.
-- Les anciennes lignes buyer:/seller: sont recopiées sur bissabi-food:user:<id>.

alter table bissabi_food.contacts add column if not exists roles text[] not null default '{}';

update bissabi_food.contacts
set roles = array[kind]
where roles = '{}' and kind in ('buyer', 'seller');

insert into bissabi_food.contacts (external_id, kind, display_name, email, roles)
select
  'bissabi-food:user:' || split_part(external_id, ':', 3),
  case when bool_or(kind = 'seller') then 'seller' else 'buyer' end,
  max(display_name),
  max(email),
  array_agg(distinct kind)
from bissabi_food.contacts
where split_part(external_id, ':', 2) in ('buyer', 'seller')
  and split_part(external_id, ':', 3) <> ''
group by split_part(external_id, ':', 3)
on conflict (external_id) do update set
  roles = (
    select coalesce(array_agg(distinct role_name), '{}')
    from unnest(bissabi_food.contacts.roles || excluded.roles) as role_name
  ),
  kind = excluded.kind,
  display_name = coalesce(bissabi_food.contacts.display_name, excluded.display_name),
  email = coalesce(bissabi_food.contacts.email, excluded.email),
  updated_at = now();

update bissabi_food.orders
set buyer_external_id = 'bissabi-food:user:' || split_part(buyer_external_id, ':', 3)
where split_part(buyer_external_id, ':', 2) = 'buyer';

update bissabi_food.orders
set seller_external_id = 'bissabi-food:user:' || split_part(seller_external_id, ':', 3)
where split_part(seller_external_id, ':', 2) = 'seller';

delete from bissabi_food.contacts
where split_part(external_id, ':', 2) in ('buyer', 'seller');
