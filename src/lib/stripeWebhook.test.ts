import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { buildPaymentIntent } from './stripeConnect';
import { handleStripeWebhook, verifyStripeSignature } from './stripeWebhook';

const kitchen = { hygienePassed: true, ofcoVerified: true };
const input = {
  orderId: 'ord_1',
  cookStripeAccountId: 'acct_test',
  dishSubtotalCents: 2000,
  deliveryCents: 0,
  lines: [{ name: 'Plat', unitAmountCents: 2000, quantity: 1 }],
  successUrl: 'https://example.test/ok',
  cancelUrl: 'https://example.test/cancel',
  launchFlag: '1',
  kitchen,
};

test('PaymentIntent retient 10 % et vise le compte Express, en francs', async () => {
  const built = buildPaymentIntent(input, 'idem_1');
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.params.amount, 2000);
  assert.equal(built.params.currency, 'chf');
  assert.equal(built.params.application_fee_amount, 200);
  assert.equal(built.params.transfer_data.destination, 'acct_test');
  assert.deepEqual(built.params.payment_method_types, ['card', 'twint']);
  assert.equal(built.idempotencyKey, 'idem_1');
  assert.equal(buildPaymentIntent(input, '  ').ok, false);
  assert.equal(buildPaymentIntent({ ...input, launchFlag: undefined }, 'idem_1').ok, false);
});

test('le webhook refuse une mauvaise signature et ignore un événement déjà vu', async () => {
  const secret = 'whsec_test';
  const now = 1_700_000_000;
  const body = JSON.stringify({ id: 'evt_1', type: 'payment_intent.succeeded', data: { object: { metadata: { orderId: 'ord_1' } } } });
  const mac = createHmac('sha256', secret).update(`${now}.${body}`).digest('hex');
  const header = `t=${now},v1=${mac}`;
  assert.equal((await verifyStripeSignature(body, header, 'YOUR_STRIPE_WEBHOOK_SECRET', now)).ok, false);
  assert.equal((await verifyStripeSignature(body, header, secret, now + 10_000)).ok, false);
  const seen = new Set<string>();
  const first = await handleStripeWebhook(body, header, secret, seen, now);
  assert.equal(first.status, 200);
  assert.equal(first.effect?.kind, 'paid');
  const second = await handleStripeWebhook(body, header, secret, seen, now);
  assert.equal(second.effect && 'duplicate' in second.effect && second.effect.duplicate, true);
  const payoutBody = JSON.stringify({ id: 'evt_2', type: 'payout.paid', data: { object: { id: 'po_1' } } });
  const payoutMac = createHmac('sha256', secret).update(`${now}.${payoutBody}`).digest('hex');
  const payout = await handleStripeWebhook(payoutBody, `t=${now},v1=${payoutMac}`, secret, seen, now);
  assert.equal(payout.effect?.kind, 'payout');
});
