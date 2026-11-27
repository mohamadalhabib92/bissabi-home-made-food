import { handleCrmSync } from './accounts.ts';
import type { EdgeEnv } from './env.ts';
import { paymentIntentForm, platformFeeCents, refundForm } from './money.ts';
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
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('ppeovmfuhtidavdnrwxu')) {
      crmCalls += 1;
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
});
