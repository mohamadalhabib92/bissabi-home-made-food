import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyWebhook,
  buildConnectCheckout,
  buildExpressAccount,
  buildRefund,
  buyerChargeCents,
  CHECKOUT_PAYMENT_METHOD_TYPES,
  clientMayStartCheckout,
  platformFeeCents,
  serverMayCollect,
} from './stripeConnect';

const openKitchen = { hygienePassed: true, ofcoVerified: true };
const base = {
  orderId: 'ord_1',
  cookStripeAccountId: 'acct_test',
  dishSubtotalCents: 3900,
  deliveryCents: 0,
  lines: [{ name: 'Mafé', unitAmountCents: 1950, quantity: 2 }],
  successUrl: 'https://example.test/ok',
  cancelUrl: 'https://example.test/cancel',
  launchFlag: '1',
  kitchen: openKitchen,
};

test('10 % sur le cuisinier, le client paie les plats sans la commission', () => {
  assert.equal(platformFeeCents(3900), 390);
  assert.equal(buyerChargeCents(3900, 0), 3900);
  assert.equal(platformFeeCents(1950), 195);
});

test('pas d’encaissement tant que le drapeau et la cuisine ne sont pas validés', () => {
  assert.equal(clientMayStartCheckout(undefined), false);
  assert.equal(clientMayStartCheckout('YOUR_LAUNCH'), false);
  assert.equal(clientMayStartCheckout('1'), true);
  assert.equal(serverMayCollect('1', { hygienePassed: false, ofcoVerified: true }), false);
  assert.equal(serverMayCollect('1', { hygienePassed: true, ofcoVerified: false }), false);
  assert.equal(serverMayCollect(undefined, openKitchen), false);
  assert.equal(serverMayCollect('1', openKitchen), true);
  assert.equal(buildConnectCheckout({ ...base, launchFlag: undefined }).ok, false);
  assert.equal(buildConnectCheckout({ ...base, kitchen: { hygienePassed: false, ofcoVerified: false } }).ok, false);
});

test('session Connect : carte, TWINT, frais de plateforme, compte Express', () => {
  const built = buildConnectCheckout(base);
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.deepEqual(built.params.payment_method_types, CHECKOUT_PAYMENT_METHOD_TYPES);
  assert.equal(built.params.payment_intent_data.application_fee_amount, 390);
  assert.equal(built.params.payment_intent_data.transfer_data.destination, 'acct_test');
  assert.equal(built.feeCents, 390);
  assert.equal(built.buyerCents, 3900);
  assert.equal(buildExpressAccount().country, 'CH');
  assert.equal(buildExpressAccount().type, 'express');
  const refund = buildRefund('pi_1', 3900);
  assert.equal(refund.reverse_transfer, true);
  assert.equal(refund.refund_application_fee, true);
});

test('webhook : payé, remboursé, compte, et le même événement ne s’applique qu’une fois', () => {
  const seen = new Set<string>();
  const paid = applyWebhook({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { metadata: { orderId: 'ord_1' } } } }, seen);
  assert.equal(paid.kind, 'paid');
  assert.equal('duplicate' in paid && paid.duplicate, false);
  const again = applyWebhook({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { metadata: { orderId: 'ord_1' } } } }, seen);
  assert.equal('duplicate' in again && again.duplicate, true);
  const refunded = applyWebhook({ id: 'evt_2', type: 'charge.refunded', data: { object: { id: 're_1', metadata: { orderId: 'ord_1' } } } }, seen);
  assert.equal(refunded.kind, 'refunded');
  const account = applyWebhook({ id: 'evt_3', type: 'account.updated', data: { object: { id: 'acct_test', charges_enabled: true, payouts_enabled: false } } }, seen);
  assert.equal(account.kind, 'account');
  if (account.kind === 'account') {
    assert.equal(account.chargesEnabled, true);
    assert.equal(account.payoutsEnabled, false);
  }
  assert.equal(applyWebhook({ id: '', type: 'x', data: { object: {} } }, seen).kind, 'invalid');
});
