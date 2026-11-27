/**
 * Stripe Connect Express — mode test, aucun secret, aucun appel réseau.
 * Le client ne peut pas ouvrir l’encaissement. Le serveur refuse si la cuisine
 * n’est pas passée en hygiène ou si le drapeau de lancement n’est pas « 1 ».
 * Commission 10 % retenue sur le cuisinier (application fee), pas ajoutée au client.
 */

import { COMMISSION_RATE } from './pricing';

/** Une seule valeur : `COMMISSION_RATE` (10 %). Les centimes Stripe en dérivent. */
export const PLATFORM_FEE_BPS = Math.round(COMMISSION_RATE * 10_000);
export const CONNECT_COUNTRY = 'CH';
export const CONNECT_CURRENCY = 'chf';

/** Carte (Apple Pay et Google Pay sont des portefeuilles de la carte) et TWINT. */
export const CHECKOUT_PAYMENT_METHOD_TYPES = ['card', 'twint'] as const;

export type KitchenRecord = { hygienePassed: boolean; ofcoVerified: boolean };

/** Vrai seulement si Mohamed a posé le drapeau après hygiène, autorités, paiement et sécurité. */
export function clientMayStartCheckout(launchFlag: string | null | undefined): boolean {
  return launchFlag === '1';
}

export function serverMayCollect(launchFlag: string | null | undefined, kitchen: KitchenRecord): boolean {
  return launchFlag === '1' && kitchen.hygienePassed && kitchen.ofcoVerified;
}

export function platformFeeCents(dishSubtotalCents: number): number {
  if (!Number.isInteger(dishSubtotalCents) || dishSubtotalCents < 0) return 0;
  return Math.round((dishSubtotalCents * PLATFORM_FEE_BPS) / 10_000);
}

export function buyerChargeCents(dishSubtotalCents: number, deliveryCents: number): number {
  return dishSubtotalCents + deliveryCents;
}

export type CheckoutLine = { name: string; unitAmountCents: number; quantity: number };

export type ConnectCheckoutInput = {
  orderId: string;
  cookStripeAccountId: string;
  dishSubtotalCents: number;
  deliveryCents: number;
  lines: CheckoutLine[];
  successUrl: string;
  cancelUrl: string;
  launchFlag: string | null | undefined;
  kitchen: KitchenRecord;
  buyerId?: string;
  sellerId?: string;
};

function orderMeta(input: ConnectCheckoutInput, feeCents: number): { orderId: string; buyerId?: string; sellerId?: string; feeCents: string } {
  return {
    orderId: input.orderId,
    ...(input.buyerId ? { buyerId: input.buyerId } : {}),
    ...(input.sellerId ? { sellerId: input.sellerId } : {}),
    feeCents: String(feeCents),
  };
}

export type ConnectCheckoutParams = {
  mode: 'payment';
  currency: 'chf';
  payment_method_types: readonly ['card', 'twint'];
  line_items: { quantity: number; price_data: { currency: 'chf'; unit_amount: number; product_data: { name: string } } }[];
  payment_intent_data: {
    application_fee_amount: number;
    transfer_data: { destination: string };
    metadata: { orderId: string; buyerId?: string; sellerId?: string; feeCents?: string };
  };
  metadata: { orderId: string; buyerId?: string; sellerId?: string; feeCents?: string };
  success_url: string;
  cancel_url: string;
};

export function buildConnectCheckout(input: ConnectCheckoutInput): { ok: true; params: ConnectCheckoutParams; buyerCents: number; feeCents: number } | { ok: false; reason: 'launch_closed' | 'missing_account' | 'bad_amount' } {
  if (!serverMayCollect(input.launchFlag, input.kitchen)) return { ok: false, reason: 'launch_closed' };
  if (!input.cookStripeAccountId.startsWith('acct_')) return { ok: false, reason: 'missing_account' };
  const linesCents = input.lines.reduce((s, l) => s + l.unitAmountCents * l.quantity, 0);
  if (linesCents !== input.dishSubtotalCents || input.dishSubtotalCents <= 0 || input.deliveryCents < 0) return { ok: false, reason: 'bad_amount' };
  const feeCents = platformFeeCents(input.dishSubtotalCents);
  const items = input.lines.map((l) => ({
    quantity: l.quantity,
    price_data: { currency: 'chf' as const, unit_amount: l.unitAmountCents, product_data: { name: l.name } },
  }));
  if (input.deliveryCents > 0) {
    items.push({
      quantity: 1,
      price_data: { currency: 'chf', unit_amount: input.deliveryCents, product_data: { name: 'Livraison' } },
    });
  }
  return {
    ok: true,
    buyerCents: buyerChargeCents(input.dishSubtotalCents, input.deliveryCents),
    feeCents,
    params: {
      mode: 'payment',
      currency: 'chf',
      payment_method_types: CHECKOUT_PAYMENT_METHOD_TYPES,
      line_items: items,
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: { destination: input.cookStripeAccountId },
        metadata: orderMeta(input, feeCents),
      },
      metadata: orderMeta(input, feeCents),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    },
  };
}

export function buildExpressAccount(): { type: 'express'; country: 'CH'; business_type: 'individual'; capabilities: { card_payments: { requested: true }; transfers: { requested: true } } } {
  return {
    type: 'express',
    country: 'CH',
    business_type: 'individual',
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  };
}

export function buildAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  return { account: accountId, refresh_url: refreshUrl, return_url: returnUrl, type: 'account_onboarding' as const };
}

export type PaymentIntentParams = {
  amount: number;
  currency: 'chf';
  application_fee_amount: number;
  transfer_data: { destination: string };
  payment_method_types: readonly ['card', 'twint'];
  metadata: { orderId: string; buyerId?: string; sellerId?: string; feeCents?: string };
};

/** PaymentIntent pour Payment Element / PaymentSheet. La commission est application_fee_amount, pas une ligne client. */
export function buildPaymentIntent(input: ConnectCheckoutInput, idempotencyKey: string): { ok: true; params: PaymentIntentParams; idempotencyKey: string; buyerCents: number; feeCents: number } | { ok: false; reason: 'launch_closed' | 'missing_account' | 'bad_amount' | 'idempotency' } {
  if (!idempotencyKey.trim()) return { ok: false, reason: 'idempotency' };
  const built = buildConnectCheckout(input);
  if (!built.ok) return built;
  return {
    ok: true,
    idempotencyKey,
    buyerCents: built.buyerCents,
    feeCents: built.feeCents,
    params: {
      amount: built.buyerCents,
      currency: 'chf',
      application_fee_amount: built.feeCents,
      transfer_data: { destination: input.cookStripeAccountId },
      payment_method_types: CHECKOUT_PAYMENT_METHOD_TYPES,
      metadata: orderMeta(input, built.feeCents),
    },
  };
}

export function buildRefund(paymentIntentId: string, amountCents: number) {
  return {
    payment_intent: paymentIntentId,
    amount: amountCents,
    reverse_transfer: true,
    refund_application_fee: true,
  };
}

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export type WebhookEffect =
  | { kind: 'paid'; orderId: string; eventId: string; duplicate: boolean }
  | { kind: 'failed'; orderId: string; eventId: string; duplicate: boolean }
  | { kind: 'refunded'; orderId: string; refundId: string; eventId: string; duplicate: boolean }
  | { kind: 'account'; accountId: string; chargesEnabled: boolean; payoutsEnabled: boolean; eventId: string; duplicate: boolean }
  | { kind: 'payout'; payoutId: string; status: 'paid' | 'failed'; eventId: string; duplicate: boolean }
  | { kind: 'ignored'; type: string; eventId: string; duplicate: boolean }
  | { kind: 'invalid'; eventId: string };

function metaOrderId(object: Record<string, unknown>): string | null {
  const meta = object.metadata;
  if (!meta || typeof meta !== 'object') return null;
  const id = (meta as { orderId?: unknown }).orderId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/** Interprète un événement déjà vérifié (signature hors de ce module). Idempotent via `seen`. */
export function applyWebhook(event: StripeEvent, seen: Set<string>): WebhookEffect {
  if (!event.id) return { kind: 'invalid', eventId: '' };
  const duplicate = seen.has(event.id);
  seen.add(event.id);
  const object = event.data?.object ?? {};
  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const orderId = metaOrderId(object);
    if (!orderId) return { kind: 'invalid', eventId: event.id };
    return { kind: 'paid', orderId, eventId: event.id, duplicate };
  }
  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.async_payment_failed') {
    const orderId = metaOrderId(object);
    if (!orderId) return { kind: 'invalid', eventId: event.id };
    return { kind: 'failed', orderId, eventId: event.id, duplicate };
  }
  if (event.type === 'charge.refunded' || event.type === 'refund.created') {
    const orderId = metaOrderId(object);
    const refundId = typeof object.id === 'string' ? object.id : '';
    if (!orderId) return { kind: 'invalid', eventId: event.id };
    return { kind: 'refunded', orderId, refundId, eventId: event.id, duplicate };
  }
  if (event.type === 'payout.paid' || event.type === 'payout.failed') {
    const payoutId = typeof object.id === 'string' ? object.id : '';
    if (!payoutId) return { kind: 'invalid', eventId: event.id };
    return { kind: 'payout', payoutId, status: event.type === 'payout.paid' ? 'paid' : 'failed', eventId: event.id, duplicate };
  }
  if (event.type === 'account.updated') {
    const accountId = typeof object.id === 'string' ? object.id : '';
    if (!accountId) return { kind: 'invalid', eventId: event.id };
    return {
      kind: 'account',
      accountId,
      chargesEnabled: object.charges_enabled === true,
      payoutsEnabled: object.payouts_enabled === true,
      eventId: event.id,
      duplicate,
    };
  }
  return { kind: 'ignored', type: event.type, eventId: event.id, duplicate };
}
