import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGateway, signInWithSocial, socialProviders, validateSignUp } from './gateway';
import { ACCOUNT_LINK_KEY, linkWithoutWipe, requestDeletion } from './linkLocal';
import { accountFromSignup, grantRole, localPublishAllowed, publishAllowed } from './rules';

const cooks = [{ id: 'cook_1', name: 'Amina' }];
const dishes = [{ id: 'dish_1', title: 'Mafé' }];
const orders = [{ id: 'ord_1', mode: 'delivery', address: 'Rue privée 4' }];
const local = { prefs: { lang: 'fr', buyerName: 'Sara' }, cooks, dishes, orders };

test('un client n’atteint pas une action cuisine, un cuisinier ne se promeut pas', () => {
  const client = accountFromSignup('u1', 'client');
  assert.equal(publishAllowed(client).ok, false);
  if (!publishAllowed(client).ok) assert.equal(publishAllowed(client).error, 'not_cook');
  assert.equal(grantRole(client, 'admin').ok, false);
  const cook = accountFromSignup('u2', 'admin');
  assert.equal(cook.signupRole, 'client');
  assert.equal(cook.roles.includes('admin'), false);
  const realCook = accountFromSignup('u3', 'cook');
  assert.equal(realCook.kitchenStatus, 'dossier_en_cours');
  assert.equal(grantRole(realCook, 'admin').ok, false);
  assert.equal(grantRole(realCook, 'courier').ok, false);
});

test('un cuisinier non vérifié ou encore en dossier ne publie pas', () => {
  const cook = accountFromSignup('u3', 'cook');
  const unverified = publishAllowed(cook);
  assert.equal(unverified.ok, false);
  if (!unverified.ok) assert.equal(unverified.error, 'email_unverified');
  const confirmed = { ...cook, emailConfirmed: true };
  const pending = publishAllowed(confirmed);
  assert.equal(pending.ok, false);
  if (!pending.ok) assert.equal(pending.error, 'dossier_en_cours');
  assert.equal(localPublishAllowed(confirmed), false);
  assert.equal(localPublishAllowed(null), true);
  assert.equal(publishAllowed({ ...confirmed, kitchenStatus: 'approved' }).ok, true);
});

test('la première connexion relie les données locales sans les effacer', () => {
  const linked = linkWithoutWipe('account_1', local, '2026-11-09T12:00:00.000Z');
  assert.equal(linked.local, local);
  assert.equal(linked.local.cooks, cooks);
  assert.equal(linked.local.orders[0].address, 'Rue privée 4');
  assert.deepEqual(linked.link.cookIds, ['cook_1']);
  assert.equal(linked.link.deletionRequestedAt, null);
  const after = requestDeletion(linked.link, '2026-11-09T13:00:00.000Z');
  assert.equal(after.deletionRequestedAt, '2026-11-09T13:00:00.000Z');
  assert.equal(local.orders.length, 1);
  assert.equal(ACCOUNT_LINK_KEY.startsWith('@bissabi-home-made-food/'), false);
});

test('Apple et Google ne sont pas appelés : le courriel passe en premier', () => {
  assert.equal(socialProviders.apple.enabled, false);
  assert.equal(socialProviders.google.enabled, false);
  let called = false;
  const apple = signInWithSocial('apple', () => { called = true; });
  const google = signInWithSocial('google', () => { called = true; });
  assert.equal(apple.ok, false);
  assert.equal(google.ok, false);
  if (!apple.ok) assert.equal(apple.error, 'provider_not_connected');
  assert.equal(called, false);
  assert.equal(validateSignUp({ email: 'a@b.c', password: 'short', displayName: 'Sara', role: 'client' }), 'weak_password');
  const gateway = createGateway(null);
  return gateway.signUp({ email: 'sara@example.com', password: 'motdepasse', displayName: 'Sara', role: 'cook', redirectTo: 'bissabi://sign-in' })
    .then((result) => {
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.error, 'auth_not_configured');
    });
});
