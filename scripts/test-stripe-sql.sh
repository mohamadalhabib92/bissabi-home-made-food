#!/usr/bin/env bash
# Stripe Connect : Postgres local uniquement. Aucun projet Supabase.
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${STRIPE_TEST_DB:-bissabi_stripe_test}"
PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1)
"${PSQL[@]}" -d postgres -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '${DB}' and pid <> pg_backend_pid();" >/dev/null || true
"${PSQL[@]}" -d postgres -c "drop database if exists ${DB};"
"${PSQL[@]}" -d postgres -c "create database ${DB};"
if ! sudo -u postgres psql -Atc "select 1 from pg_roles where rolname = 'authenticated'" | grep -q 1; then
  sudo -u postgres psql -c "create role authenticated nologin;"
fi
if ! sudo -u postgres psql -Atc "select 1 from pg_roles where rolname = 'anon'" | grep -q 1; then
  sudo -u postgres psql -c "create role anon nologin;"
fi
"${PSQL[@]}" -d "$DB" -f supabase/migrations/20261111170000_stripe_connect.sql
"${PSQL[@]}" -d "$DB" -f supabase/tests/stripe_connect.sql
"${PSQL[@]}" -d "$DB" -c "create table public.sentinel (id int); insert into public.sentinel values (1);"
"${PSQL[@]}" -d "$DB" -c "drop schema payments cascade;"
"${PSQL[@]}" -d "$DB" -c "select id from public.sentinel;" | grep -q 1
echo "SQL Stripe : ok (10 %, cuisinier validé, webhook idempotent, live bloqué)"
