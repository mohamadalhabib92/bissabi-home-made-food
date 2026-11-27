import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { planAccountLink, validateCredentials } from './accountLink';

test('e-mail et mot de passe sont vérifiés avant tout appel', () => {
  assert.equal(validateCredentials('a@b.c', '12345678'), null);
  assert.equal(validateCredentials('pas-un-email', '12345678'), 'email');
  assert.equal(validateCredentials('a@b.c', 'court'), 'password');
});

test('la liaison ne remplace ni le local ni un distant déjà rempli', () => {
  assert.deepEqual(planAccountLink('skip', true, false), { keepLocal: true, uploadLocal: false });
  assert.deepEqual(planAccountLink('link', true, true), { keepLocal: true, uploadLocal: false });
  assert.deepEqual(planAccountLink('link', false, false), { keepLocal: true, uploadLocal: false });
  assert.deepEqual(planAccountLink('link', true, false), { keepLocal: true, uploadLocal: true });
});

test('la migration locale isole les livreurs et le compte, sans droit anon', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261126180000_accounts_couriers_rls.sql', import.meta.url), 'utf8');
  assert.match(sql, /enable row level security/);
  assert.match(sql, /validated = false/);
  assert.match(sql, /delete_own_account/);
  assert.match(sql, /revoke all on public\.couriers_directory from anon/);
  assert.doesNotMatch(sql, /grant .* to anon/i);
});
