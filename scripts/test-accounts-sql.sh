#!/usr/bin/env bash
# Comptes : Postgres local uniquement. Aucun projet Supabase hébergé.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${ACCOUNTS_TEST_DB:-bissabi_accounts_test}"
PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1)

"${PSQL[@]}" -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '${DB}' and pid <> pg_backend_pid();" >/dev/null || true
"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"
for role in anon authenticated; do
  if ! sudo -u postgres psql -Atc "select 1 from pg_roles where rolname = '${role}'" | grep -q 1; then
    sudo -u postgres psql -c "create role ${role} nologin;"
  fi
done
"${PSQL[@]}" -d "$DB" -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to authenticated;
grant select on auth.users to authenticated;
grant execute on function auth.uid() to authenticated;
SQL
"${PSQL[@]}" -d "$DB" -f supabase/migrations/20261109183000_accounts.sql
"${PSQL[@]}" -d "$DB" -f supabase/tests/accounts.sql
"${PSQL[@]}" -d "$DB" -c "create table public.sentinel (id int primary key); insert into public.sentinel values (1); update public.profiles set display_name = 'Sara reste' where id = '00000000-0000-0000-0000-0000000000c1';"
"${PSQL[@]}" -d "$DB" -f supabase/rollback/20261109183000_accounts.sql
"${PSQL[@]}" -d "$DB" -c "select display_name from public.profiles where id = '00000000-0000-0000-0000-0000000000c1';" | grep -q 'Sara reste'
"${PSQL[@]}" -d "$DB" -c "select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'kitchen_status';" | grep -q '(0 rows)' || {
  rows="$("${PSQL[@]}" -d "$DB" -Atc "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'kitchen_status';")"
  test "$rows" = "0"
}
"${PSQL[@]}" -d "$DB" -c "select id from public.sentinel;" | grep -q 1
echo "SQL comptes : ok (client refusé, promotion refusée, publication bloquée, rollback garde le profil)"
