import { handleCrmSync, handleSyncMe } from './accounts.ts';
import { rowsFromPayment } from './crm.ts';
import { parseCreateOrder } from './orders.ts';
import type { EdgeEnv } from './env.ts';
import { configuredDeliveryCents, paymentIntentForm, platformFeeCents, refundForm } from './money.ts';
import { withCors } from './http.ts';
import { handleStripeWebhook } from './webhook.ts';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function sign(secret: string, body: string, now: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${now}.${body}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${now},v1=${hex}`;
}

const env: EdgeEnv = {
  supabaseUrl: 'https://qizhprlzeiqrngwpxjnd.supabase.co',
  serviceKey: 'service_food',
  stripeKey: 'sk_test',
  webhookSecret: 'whsec_platform',
  connectWebhookSecret: 'whsec_connect',
  launch: '1',
};

Deno.test('PaymentIntent et remboursement portent la commission et l’inversion', () => {
  assert(platformFeeCents(2000) === 200, 'fee');
  const form = paymentIntentForm({
    amountCents: 2000, feeCents: 200, destination: 'acct_test', orderId: 'ord_1', buyerId: 'b', sellerId: 's', sellerKind: 'home', subtotalCents: 2000,
  });
  assert(form.get('application_fee_amount') === '200', 'application fee');
  assert(configuredDeliveryCents('1', '') === null, 'fee unset');
  assert(configuredDeliveryCents('', '600') === null, 'flag off');
  assert(configuredDeliveryCents('1', '600') === 600, 'fee set');
  assert(form.get('transfer_data[destination]') === 'acct_test', 'destination');
  assert(form.get('currency') === 'chf', 'chf');
  assert(form.getAll('payment_method_types[]').join(',') === 'card,twint', 'methods');
  const refund = refundForm('pi_1', 2000);
  assert(refund.get('refund_application_fee') === 'true', 'fee refund');
  assert(refund.get('reverse_transfer') === 'true', 'reverse');
});

Deno.test('le webhook déduplique dans payment_events et sépare les secrets', async () => {
  const now = 1_700_000_000;
  const body = JSON.stringify({
    id: 'evt_1',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_1', amount: 2000, application_fee_amount: 200, metadata: { orderId: 'ord_1', buyerId: 'b', sellerId: 's', feeCents: '200', subtotalCents: '2000', sellerKind: 'home' } } },
  });
  let claims = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (url.includes('/payment_events') && method === 'POST') {
      claims += 1;
      return Response.json(claims === 1 ? [{ event_id: 'evt_1' }] : []);
    }
    if (url.includes('/order_payments') && method === 'POST') return new Response(null, { status: 201 });
    if (url.includes('/order_payments')) {
      return Response.json([{ order_id: 'ord_1', buyer_id: 'b', seller_id: 's', seller_kind: 'home', status: 'paid', subtotal_cents: 2000, commission_cents: 200, total_cents: 2000 }]);
    }
    return new Response(url, { status: 500 });
  };
  const header = await sign('whsec_platform', body, now);
  const request = () => new Request('https://example.test/stripe-webhook', { method: 'POST', headers: { 'stripe-signature': header }, body });
  const first = await handleStripeWebhook(request(), env, fetchImpl, now);
  assert(first.status === 200, 'first status');
  const second = await handleStripeWebhook(request(), env, fetchImpl, now);
  const duplicate = await second.json() as { duplicate?: boolean };
  assert(duplicate.duplicate === true, 'duplicate');
  const connectBody = JSON.stringify({ id: 'evt_c', type: 'account.updated', data: { object: { id: 'acct_1', charges_enabled: true, payouts_enabled: false, details_submitted: true } } });
  const wrong = await handleStripeWebhook(new Request('https://example.test/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': await sign('whsec_platform', connectBody, now) },
    body: connectBody,
  }), env, fetchImpl, now);
  assert(wrong.status === 400, 'connect event needs connect secret');
});

Deno.test('crm-sync refuse le client et ne lit que la base', async () => {
  let crmCalls = 0;
  const crmBodies: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('ppeovmfuhtidavdnrwxu')) {
      if ((init?.method ?? 'GET') === 'POST') {
        crmCalls += 1;
        crmBodies.push(String(init?.body ?? ''));
      }
      return new Response(null, { status: 201 });
    }
    if ((init?.method ?? 'GET') === 'GET' && url.includes('order_payments')) {
      return Response.json([{ order_id: 'ord_1', buyer_id: 'buyer_1', seller_id: 'seller_1', seller_kind: 'caterer', status: 'paid', subtotal_cents: 2000, commission_cents: 200, total_cents: 2000 }]);
    }
    return new Response('no', { status: 500 });
  };
  const user = await handleCrmSync(new Request('https://example.test/crm-sync', {
    method: 'POST',
    headers: { Authorization: 'Bearer user_jwt' },
    body: JSON.stringify({ orderId: 'ord_1' }),
  }), { ...env, crmUrl: 'https://ppeovmfuhtidavdnrwxu.supabase.co', crmKey: 'crm_service' }, fetchImpl);
  assert(user.status === 401, 'user jwt');
  const stuffed = await handleCrmSync(new Request('https://example.test/crm-sync', {
    method: 'POST',
    headers: { Authorization: 'Bearer service_food' },
    body: JSON.stringify({ orderId: 'ord_1', totalCents: 1 }),
  }), { ...env, crmUrl: 'https://ppeovmfuhtidavdnrwxu.supabase.co', crmKey: 'crm_service' }, fetchImpl);
  assert(stuffed.status === 400, 'extra fields');
  const ok = await handleCrmSync(new Request('https://example.test/crm-sync', {
    method: 'POST',
    headers: { Authorization: 'Bearer service_food' },
    body: JSON.stringify({ orderId: 'ord_1' }),
  }), { ...env, crmUrl: 'https://ppeovmfuhtidavdnrwxu.supabase.co', crmKey: 'crm_service' }, fetchImpl);
  assert(ok.status === 200, 'service sync');
  assert(crmCalls === 4, 'rows from db');
  assert(crmBodies.every((body) => !body.includes('display_name') && !body.includes('email')), 'no null names');
});

Deno.test('un upsert de commande n’envoie pas de nom vide', () => {
  const rows = rowsFromPayment({
    order_id: 'ord_1', buyer_id: 'b', seller_id: 's', seller_kind: 'home', status: 'paid', subtotal_cents: 2000, commission_cents: 200, total_cents: 2000,
  });
  const encoded = JSON.stringify(rows);
  assert(!encoded.includes('display_name'), 'display_name omitted');
  assert(!encoded.includes('email'), 'email omitted');
  assert(encoded.includes('bissabi-food:user:b'), 'one id per user');
  assert(encoded.includes('bissabi-food:user:s'), 'seller same scheme');
  assert(parseCreateOrder({ kitchenId: 'not-a-uuid', items: [], delivery: 'pickup' }) === null, 'cart');
  assert(parseCreateOrder({ kitchenId: '11111111-1111-4111-8111-111111111111', items: [{ dishId: '22222222-2222-4222-8222-222222222222', qty: 1, unitPrice: 10 }], delivery: 'pickup' }) === null, 'price from client refused');
});

Deno.test('le CORS n’ouvre que les origines prévues et répond au preflight', async () => {
  let called = 0;
  const wrapped = withCors(async (req) => {
    called += 1;
    if (req.method !== 'POST') return new Response(JSON.stringify({ reason: 'method' }), { status: 405 });
    throw new Error('boom');
  });
  const preflight = await wrapped(new Request('https://qizhprlzeiqrngwpxjnd.supabase.co/functions/v1/create-order', {
    method: 'OPTIONS',
    headers: { Origin: 'https://food.bissabi.ch' },
  }));
  assert(preflight.status === 204, 'options');
  assert(called === 0, 'options skips handler');
  assert(preflight.headers.get('Access-Control-Allow-Origin') === 'https://food.bissabi.ch', 'site origin');
  assert(preflight.headers.get('Vary') === 'Origin', 'vary');
  assert((preflight.headers.get('Access-Control-Allow-Headers') ?? '').includes('authorization'), 'auth header');
  assert((preflight.headers.get('Access-Control-Allow-Headers') ?? '').includes('x-client-info'), 'client header');
  assert((preflight.headers.get('Access-Control-Allow-Methods') ?? '').includes('POST'), 'post');
  const local = await wrapped(new Request('https://example.test', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081' } }));
  assert(local.headers.get('Access-Control-Allow-Origin') === 'http://localhost:8081', 'metro');
  const expo = await wrapped(new Request('https://example.test', { method: 'OPTIONS', headers: { Origin: 'http://localhost:19006' } }));
  assert(expo.headers.get('Access-Control-Allow-Origin') === 'http://localhost:19006', 'expo');
  const foreign = await wrapped(new Request('https://example.test', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }));
  assert(foreign.headers.get('Access-Control-Allow-Origin') === null, 'no echo');
  const failed = await wrapped(new Request('https://example.test', { method: 'POST', headers: { Origin: 'https://food.bissabi.ch' } }));
  assert(failed.status === 500, 'error still answered');
  assert(failed.headers.get('Access-Control-Allow-Origin') === 'https://food.bissabi.ch', 'error cors');
  const webhook = await handleStripeWebhook(new Request('https://example.test/stripe-webhook', { method: 'OPTIONS' }), env, fetch, 0);
  assert(webhook.headers.get('Access-Control-Allow-Origin') === null, 'webhook has no cors');
});

Deno.test('sync-me ne synchronise pas un autre utilisateur', async () => {
  const fetchImpl: typeof fetch = async () => Response.json({ id: 'user_1', email: 'a@b.c' });
  const refused = await handleSyncMe(new Request('https://example.test/sync-me', {
    method: 'POST',
    headers: { Authorization: 'Bearer user_jwt' },
    body: JSON.stringify({ userId: 'someone-else' }),
  }), env, fetchImpl);
  assert(refused.status === 400, 'foreign id');
});
