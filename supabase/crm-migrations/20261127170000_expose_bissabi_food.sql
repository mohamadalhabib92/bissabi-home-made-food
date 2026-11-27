-- Projet bissabi-crm seulement (ppeovmfuhtidavdnrwxu).
-- Le schéma existe déjà. PostgREST ne le voit que s’il est exposé.
-- crm-sync envoie Accept-Profile et Content-Profile: bissabi_food
-- (le même choix que supabase-js { db: { schema: 'bissabi_food' } }).

grant usage on schema bissabi_food to service_role;
grant all privileges on all tables in schema bissabi_food to service_role;
grant all privileges on all sequences in schema bissabi_food to service_role;
alter default privileges in schema bissabi_food grant all privileges on tables to service_role;

grant usage on schema bissabi_food to authenticator;

do $$
begin
  execute 'alter role authenticator set pgrst.db_schemas = ''public, graphql_public, bissabi_food''';
  perform pg_notify('pgrst', 'reload config');
exception when others then
  raise notice 'Exposer bissabi_food à la main : Data API → Exposed schemas.';
end $$;
