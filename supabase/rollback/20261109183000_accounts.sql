-- Retire les objets ajoutés pour les comptes.
-- Ne supprime pas public.profiles ni public.user_roles : la passe 1 a pu les créer.
-- Les colonnes de profil ajoutées ici sont retirées. Les lignes de profil restent.
-- Ce n'est pas un risque nul : une demande de suppression déjà enregistrée disparaît avec sa table.

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists profiles_protect_role on public.profiles;
drop trigger if exists user_roles_protect on public.user_roles;

drop table if exists public.account_dishes;
drop table if exists public.deletion_requests;
drop table if exists public.delivery_addresses;
drop table if exists public.kitchen_files;

drop function if exists public.request_account_deletion();
drop function if exists private.handle_new_user();
drop function if exists private.protect_profile_role();
drop function if exists private.protect_user_roles();
drop function if exists private.publish_dish(text);
drop function if exists private.set_role(uuid, text);
drop function if exists private.approve_kitchen(uuid);
drop function if exists private.request_account_deletion();
drop function if exists private.email_confirmed();
drop function if exists private.has_role(text);

alter table public.profiles drop constraint if exists profiles_signup_role_check;
alter table public.profiles drop constraint if exists profiles_kitchen_status_check;
alter table public.profiles drop column if exists phone;
alter table public.profiles drop column if exists locale;
alter table public.profiles drop column if exists signup_role;
alter table public.profiles drop column if exists kitchen_status;
