import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { crmRowsForOrder, crmRowsForPerson, crmRowsFromStripe, crmSyncTarget, pushCrmRows } from './crmSync';

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
  assert.deepEqual(crmSyncTarget({ orderId: 'ord_9' }), { kind: 'order', orderId: 'ord_9' });
  assert.equal(crmSyncTarget({ orderId: 'ord_9', totalCents: 2000 }), null);
  assert.equal(crmSyncTarget({ kind: 'person', id: 'b', role: 'buyer' }), null);
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

test('le correctif RLS cache les codes et fige l’hygiène', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261127170000_rls_and_order_payments.sql', import.meta.url), 'utf8');
  const view = sql.slice(sql.indexOf('create or replace view public.courier_jobs_open'), sql.indexOf('revoke all on public.courier_jobs_open'));
  assert.match(view, /select j.id, j.order_id, j.state/);
  assert.doesNotMatch(view, /pickup_code|proof_code/);
  assert.match(sql, /role = 'courier'/);
  assert.match(sql, /kitchens_update_own/);
  assert.match(sql, /courier_jobs_update_assigned/);
  assert.match(sql, /courier_jobs_update_admin/);
  assert.match(sql, /kitchen_hygiene_frozen/);
  assert.match(sql, /create table if not exists public.order_payments/);
  assert.match(sql, /revoke all on public.order_payments from anon, authenticated/);
});

test('les fonctions Edge n’importent pas l’app et seul le webhook est sans JWT', () => {
  const root = new URL('../../supabase/functions/', import.meta.url);
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : path.endsWith('.ts') ? [path] : [];
  });
  const sources = walk(root.pathname).map((path) => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(sources, /from ['"][^'"]*src\/lib/);
  assert.doesNotMatch(sources, /NOT_DEPLOYED/);
  assert.match(sources, /Deno\.serve/);
  const config = readFileSync(new URL('../../supabase/config.toml', import.meta.url), 'utf8');
  assert.match(config, /\[functions\.stripe-webhook\]\s+verify_jwt = false/);
  assert.equal(config.match(/verify_jwt = false/g)?.length, 1);
});

test('la migration suivante cache le code de preuve et retire pg_net', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261127180000_proof_checkout_sync.sql', import.meta.url), 'utf8');
  const view = sql.slice(sql.indexOf('create or replace view public.courier_jobs_assigned'), sql.indexOf('revoke all on public.courier_jobs_assigned'));
  assert.match(view, /j.pickup_code/);
  assert.doesNotMatch(view, /proof_code/);
  assert.match(sql, /confirm_delivery_proof/);
  assert.match(sql, /revoke execute on function public.notify_crm_person\(\) from public, anon, authenticated/);
  assert.match(sql, /revoke execute on function public.courier_job_codes_unchanged\(uuid, text, text\) from public, anon, authenticated/);
  assert.match(sql, /revoke execute on function public.kitchen_hygiene_frozen\(uuid, boolean\) from public, anon, authenticated/);
  assert.match(sql, /revoke insert on public.order_items from anon, authenticated/);
  assert.match(sql, /drop trigger if exists notify_crm_profile/);
});

test('la migration CRM active la RLS et n’ouvre pas anon', () => {
  const sql = readFileSync(new URL('../../supabase/crm-migrations/20261127120000_bissabi_food_sync.sql', import.meta.url), 'utf8');
  assert.match(sql, /create schema if not exists bissabi_food/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on bissabi_food.contacts from anon/);
  assert.doesNotMatch(sql, /grant .* to anon/i);
});
