import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { handleCrmSync } from '../../supabase/functions/crm-sync/index';
import { crmRowsForOrder, crmRowsForPerson, crmRowsFromStripe, pushCrmRows, rowsFromCrmRequest } from './crmSync';

test('les upserts CRM réutilisent le même identifiant externe', () => {
  const person = crmRowsForPerson({ id: 'cook_1', role: 'seller', name: 'Awa', sellerKind: 'caterer' });
  const again = crmRowsForPerson({ id: 'cook_1', role: 'seller', name: 'Awa D.', sellerKind: 'caterer' });
  assert.equal(person[0].external_id, again[0].external_id);
  assert.equal(person[1].table, 'sellers');
  const paid = crmRowsForOrder({ id: 'ord_1', buyerId: 'b1', sellerId: 'cook_1', status: 'paid', subtotalCents: 2000, commissionCents: 200, totalCents: 2000 });
  const refunded = crmRowsForOrder({ id: 'ord_1', buyerId: 'b1', sellerId: 'cook_1', status: 'refunded', subtotalCents: 2000, commissionCents: 200, totalCents: 2000 });
  assert.equal(paid[0].external_id, refunded[0].external_id);
  assert.equal(paid[0].values.commission_cents, 200);
  assert.equal(paid[0].values.currency, 'CHF');
});

test('sans clé CRM rien n’est envoyé, et une clé YOUR_* ne part pas', async () => {
  let calls = 0;
  const fetchImpl: typeof fetch = async () => { calls += 1; return new Response(null, { status: 201 }); };
  const skipped = await pushCrmRows(crmRowsForPerson({ id: 'b', role: 'buyer' }), { url: 'YOUR_CRM_URL', serviceKey: 'YOUR_CRM_SERVICE_ROLE_KEY' }, fetchImpl);
  assert.equal(skipped.ok && skipped.skipped, true);
  assert.equal(calls, 0);
  const sent = await pushCrmRows(crmRowsForPerson({ id: 'b', role: 'buyer' }), { url: 'https://ppeovmfuhtidavdnrwxu.supabase.co', serviceKey: 'service_test' }, fetchImpl);
  assert.equal(sent.ok && sent.skipped, false);
  assert.equal(calls, 1);
});

test('un paiement et un remboursement partagent l’identifiant de commande', () => {
  const paid = crmRowsFromStripe('payment_intent.succeeded', { amount: 2000, metadata: { orderId: 'ord_9', buyerId: 'b', sellerId: 's', feeCents: '200' } });
  const refunded = crmRowsFromStripe('charge.refunded', { amount: 2000, metadata: { orderId: 'ord_9', buyerId: 'b', sellerId: 's', feeCents: '200' } });
  assert.equal(paid[0].external_id, refunded[0].external_id);
  assert.equal(refunded[0].values.status, 'refunded');
  assert.equal(rowsFromCrmRequest({ kind: 'person', id: 'b', role: 'buyer' })?.[0].external_id, 'bissabi-food:buyer:b');
  assert.equal(rowsFromCrmRequest({ kind: 'person', id: 'x', role: 'admin' }), null);
});

test('crm-sync sans secret ne contacte pas le CRM', async () => {
  let calls = 0;
  const result = await handleCrmSync({ kind: 'person', id: 'b', role: 'buyer' }, async () => {
    calls += 1;
    return new Response(null, { status: 201 });
  });
  assert.equal(result.status, 202);
  assert.equal(calls, 0);
});

test('la migration food ajoute les tables et refuse l’hygiène posée par le vendeur', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261127120000_live_marketplace.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public.kitchens/);
  assert.match(sql, /public.order_items/);
  assert.match(sql, /public.payouts/);
  assert.match(sql, /public.courier_jobs/);
  assert.match(sql, /hygiene_passed = false/);
  assert.match(sql, /'traiteur'/);
  assert.doesNotMatch(sql, /grant .* to anon/i);
});

test('la migration CRM active la RLS et n’ouvre pas anon', () => {
  const sql = readFileSync(new URL('../../supabase/crm-migrations/20261127120000_bissabi_food_sync.sql', import.meta.url), 'utf8');
  assert.match(sql, /create schema if not exists bissabi_food/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on bissabi_food.contacts from anon/);
  assert.doesNotMatch(sql, /grant .* to anon/i);
});
