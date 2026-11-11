import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOnboardingLink, createPayment, handleWebhook } from './handler';
import type { ChargeOrder, ServerConfig, StripeEvent, WebhookState } from './connect';
import type { StripeClient } from './handler';

const config: ServerConfig = { paymentsLive: false, secretKey: 'sk_test_example', commissionRateBps: 1000 };
const order: ChargeOrder = {
  id: 'ord_1',
  dishSubtotalMinor: 1800,
  deliveryFeeMinor: 0,
  currency: 'chf',
  cook: { stripeAccountId: 'acct_cook', chargesEnabled: true, bissabiValidated: true },
};

function mockStripe(overrides: Partial<StripeClient> = {}): StripeClient & { keys: string[] } {
  const keys: string[] = [];
  return {
    keys,
    createPaymentIntent: async (_params, key) => {
      keys.push(key);
      return { id: 'pi_test', client_secret: 'pi_test_secret' };
    },
    createCheckoutSession: async (_params, key) => {
      keys.push(key);
      return { url: 'https://checkout.stripe.test/c/cs_test' };
    },
    createAccount: async () => ({ id: 'acct_new' }),
    createAccountLink: async () => ({ url: 'https://connect.stripe.test/setup' }),
    constructEvent: (raw) => JSON.parse(raw) as StripeEvent,
    ...overrides,
  };
}

test('le PaymentIntent de test ne part pas avec une clé live', async () => {
  const stripe = mockStripe();
  const refused = await createPayment({
    config: { ...config, secretKey: 'sk_live_no' },
    order,
    surface: 'native',
    returnUrl: 'bissabihomemadefood://stripe-pay',
    successUrl: 'https://example.test/pay-return',
    cancelUrl: 'https://example.test/stripe-pay',
    stripe,
  });
  assert.equal(refused.status, 403);
  assert.equal(stripe.keys.length, 0);
});

test('la PWA reçoit une URL Checkout, l’app native un client secret, deux fois la même clé', async () => {
  const stripe = mockStripe();
  const web = await createPayment({
    config, order, surface: 'web', stripe,
    returnUrl: 'https://example.test/pay-return',
    successUrl: 'https://example.test/pay-return',
    cancelUrl: 'https://example.test/stripe-pay',
  });
  const native = await createPayment({
    config, order, surface: 'native', stripe,
    returnUrl: 'bissabihomemadefood://stripe-pay',
    successUrl: 'https://example.test/pay-return',
    cancelUrl: 'https://example.test/stripe-pay',
  });
  assert.equal(web.status, 200);
  assert.equal(web.body.checkoutUrl, 'https://checkout.stripe.test/c/cs_test');
  assert.equal(native.body.clientSecret, 'pi_test_secret');
  assert.deepEqual(stripe.keys, ['order_ord_1', 'order_ord_1']);
  const shown = native.body.plan as { applicationFeeMinor: number };
  assert.equal(shown.applicationFeeMinor, 180);
});

test('une signature fausse ne change pas la commande', () => {
  const state: WebhookState = { seen: [], orders: [] };
  const stripe = mockStripe({
    constructEvent: () => { throw new Error('bad'); },
  });
  const result = handleWebhook({
    raw: '{}', signature: 'nope', webhookSecret: 'whsec_test', paymentsLive: false, state, stripe,
  });
  assert.equal(result.status, 400);
  assert.equal(result.state.orders.length, 0);
});

test('le lien Connect Express demande TWINT et les cartes', async () => {
  const stripe = mockStripe();
  const link = await createOnboardingLink({
    config, stripeAccountId: null, stripe,
    refreshUrl: 'https://example.test/stripe-pay',
    returnUrl: 'bissabihomemadefood://stripe-pay',
  });
  assert.equal(link.status, 200);
  assert.equal(link.body.stripeAccountId, 'acct_new');
  assert.equal(link.body.url, 'https://connect.stripe.test/setup');
});
