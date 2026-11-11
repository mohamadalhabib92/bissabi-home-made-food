import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  accountLinkParams,
  checkoutSessionParams,
  connectAccountParams,
  cookCanReceiveOrders,
  gateCharge,
  interpretPayReturn,
  paymentIntentParams,
  prepareCharge,
  reduceStripeEvent,
  type ChargeOrder,
  type ServerConfig,
  type WebhookState,
} from './connect';

const config: ServerConfig = { paymentsLive: false, secretKey: 'sk_test_example', commissionRateBps: 1000 };

const readyCook = { stripeAccountId: 'acct_cook', chargesEnabled: true, bissabiValidated: true };

const order: ChargeOrder = {
  id: 'ord_1',
  dishSubtotalMinor: 1800,
  deliveryFeeMinor: 600,
  currency: 'chf',
  cook: readyCook,
};

test('une clé live est refusée tant que payments_live est faux', () => {
  assert.deepEqual(gateCharge({ ...config, secretKey: 'sk_live_real' }), { ok: false, error: 'live_blocked' });
  assert.equal(gateCharge(config).ok, true);
  const blocked = prepareCharge({ config: { ...config, secretKey: 'sk_live_real' }, order, returnUrl: 'bissabihomemadefood://stripe-pay' });
  assert.equal(blocked.ok, false);
});

test('le serveur calcule 10 % et ignore un montant envoyé par le client', () => {
  const plan = prepareCharge({ config, order, returnUrl: 'bissabihomemadefood://stripe-pay' });
  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.plan.commissionMinor, 180);
  assert.equal(plan.plan.amountMinor, 2400);
  assert.equal(plan.plan.applicationFeeMinor, 780);
  assert.equal(plan.plan.cookNetMinor, 1620);
  assert.equal(plan.plan.idempotencyKey, 'order_ord_1');
  const params = paymentIntentParams(plan.plan);
  assert.equal(params.application_fee_amount, 780);
  assert.equal(params.transfer_data.destination, 'acct_cook');
  assert.equal(params.on_behalf_of, 'acct_cook');
  assert.deepEqual(params.payment_method_types, ['card', 'twint']);
  const session = checkoutSessionParams(plan.plan, 'https://example.test/pay-return', 'https://example.test/stripe-pay');
  assert.equal(session.payment_intent_data.application_fee_amount, 780);
  assert.equal(session.success_url.includes('pay-return'), true);
});

test('un cuisinier sans Stripe ou sans validation Bissabi ne reçoit pas de commande', () => {
  assert.equal(cookCanReceiveOrders({ stripeAccountId: null, chargesEnabled: false, bissabiValidated: false }), false);
  assert.equal(cookCanReceiveOrders({ stripeAccountId: 'acct_x', chargesEnabled: true, bissabiValidated: false }), false);
  assert.equal(cookCanReceiveOrders({ stripeAccountId: 'acct_x', chargesEnabled: false, bissabiValidated: true }), false);
  const refused = prepareCharge({
    config,
    order: { ...order, cook: { stripeAccountId: 'acct_x', chargesEnabled: true, bissabiValidated: false } },
    returnUrl: 'https://example.test/pay-return',
  });
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.error, 'cook_not_ready');
});

test('le webhook signé change le statut, un doublon et un événement live non', () => {
  const empty: WebhookState = { seen: [], orders: [] };
  const succeeded = {
    id: 'evt_1',
    type: 'payment_intent.succeeded',
    livemode: false,
    data: { object: { metadata: { orderId: 'ord_1' } } },
  };
  const first = reduceStripeEvent(empty, succeeded, false);
  assert.equal(first.applied, true);
  assert.equal(first.state.orders[0].status, 'paid');
  const second = reduceStripeEvent(first.state, succeeded, false);
  assert.equal(second.applied, false);
  assert.equal(second.state.orders.length, 1);
  const live = reduceStripeEvent(empty, { ...succeeded, id: 'evt_live', livemode: true }, false);
  assert.equal(live.blocked, true);
  assert.equal(live.state.orders.length, 0);
  const dispute = reduceStripeEvent(first.state, {
    id: 'evt_dispute',
    type: 'charge.dispute.created',
    livemode: false,
    data: { object: { metadata: { orderId: 'ord_1' } } },
  }, false);
  assert.equal(dispute.state.orders[0].status, 'disputed');
});

test('le retour TWINT ne marque pas la commande payée', () => {
  const back = interpretPayReturn({ payment_intent: 'pi_123', payment_intent_client_secret: 'secret' });
  assert.equal(back.marksPaid, false);
  assert.equal(back.paymentIntentId, 'pi_123');
  const link = accountLinkParams('acct_cook', 'https://example.test/refresh', 'bissabihomemadefood://stripe-pay');
  assert.equal(link.type, 'account_onboarding');
  assert.equal(connectAccountParams().capabilities.twint_payments.requested, true);
});
