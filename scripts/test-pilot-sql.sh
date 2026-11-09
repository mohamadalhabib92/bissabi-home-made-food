#!/usr/bin/env bash
# Preuve Postgres locale. N'appelle aucun projet Supabase hébergé.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${PILOT_TEST_DB:-bissabi_pilot_test}"
PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1)

"${PSQL[@]}" -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '${DB}' and pid <> pg_backend_pid();" >/dev/null || true
"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"
"${PSQL[@]}" -d "$DB" -f supabase/migrations/20261109150000_pilot_marketplace.sql
if ! sudo -u postgres psql -Atc "select 1 from pg_roles where rolname = 'pilot_client'" | grep -q 1; then
  sudo -u postgres psql -c "create role pilot_client nologin;"
fi
"${PSQL[@]}" -d "$DB" -f supabase/tests/pilot_invariants.sql
"${PSQL[@]}" -d "$DB" -c "create table public.sentinel (id int primary key); insert into public.sentinel values (1);"
"${PSQL[@]}" -d "$DB" -f supabase/rollback/20261109150000_pilot_marketplace.sql
"${PSQL[@]}" -d "$DB" -c "select id from public.sentinel;" | grep -q 1
"${PSQL[@]}" -d "$DB" -c "select nspname from pg_namespace where nspname = 'pilot';" | grep -q '(0 rows)' || {
  rows="$("${PSQL[@]}" -d "$DB" -Atc "select count(*) from pg_namespace where nspname = 'pilot';")"
  test "$rows" = "0"
}
echo "SQL pilot : ok (migration, 6 règles, périmètre marché, rollback sans toucher public.sentinel)"
