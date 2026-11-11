import { shareBps } from '../../lib/global/money';

/**
 * Paiement marketplace Stripe Connect, mode test.
 * La commission vient de la config serveur. Le client n'envoie pas le montant.
 * Destination charge : le cuisinier reçoit le plat moins la commission.
 * La livraison est dans les frais d'application, pas dans le net du cuisinier.
 * TWINT est une redirection : le retour n'est pas une preuve de paiement.
 */

export const DEFAULT_COMMISSION_BPS = 1000;
export const TWINT_MIN_MINOR = 50;
export const TWINT_MAX_MINOR = 500_000;

export type Surface = 'native' | 'web';
export type PayMethod = 'card' | 'twint';

export type ServerConfig = {
  paymentsLive: boolean;
  secretKey: string;
  commissionRateBps: number;
};

export type CookAccount = {
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  bissabiValidated: boolean;
};

export type ChargeOrder = {
  id: string;
  dishSubtotalMinor: number;
  deliveryFeeMinor: number;
  currency: 'chf';
  cook: CookAccount;
};

export type ChargePlan = {
  amountMinor: number;
  applicationFeeMinor: number;
  cookNetMinor: number;
  commissionMinor: number;
  deliveryFeeMinor: number;
  currency: 'chf';
  destination: string;
  onBehalfOf: string;
  idempotencyKey: string;
  paymentMethodTypes: PayMethod[];
  returnUrl: string;
  metadata: { orderId: string };
  mode: 'test';
};

export type Gate =
  | { ok: true; mode: 'test' }
  | { ok: false; error: 'live_blocked' | 'missing_test_key' };

export function gateCharge(config: ServerConfig): Gate {
  const liveKey = config.secretKey.startsWith('sk_live');
  // Cette livraison ne crée aucun débit réel. Le drapeau faux bloque la clé live.
  // Le drapeau vrai ne suffit pas non plus : l'ouverture réelle est une étape séparée.
  if (liveKey) return { ok: false, error: 'live_blocked' };
  if (!config.secretKey.startsWith('sk_test')) return { ok: false, error: 'missing_test_key' };
  return { ok: true, mode: 'test' };
}

export function cookCanReceiveOrders(cook: CookAccount): boolean {
  return Boolean(cook.stripeAccountId) && cook.chargesEnabled && cook.bissabiValidated;
}

export function prepareCharge(input: {
  config: ServerConfig;
  order: ChargeOrder;
  returnUrl: string;
  methods?: PayMethod[];
}): { ok: true; plan: ChargePlan } | { ok: false; error: string } {
  const gate = gateCharge(input.config);
  if (!gate.ok) return gate;
  if (input.order.currency !== 'chf') return { ok: false, error: 'currency' };
  if (!cookCanReceiveOrders(input.order.cook) || !input.order.cook.stripeAccountId) {
    return { ok: false, error: 'cook_not_ready' };
  }
  if (input.order.dishSubtotalMinor < 0 || input.order.deliveryFeeMinor < 0) {
    return { ok: false, error: 'amount' };
  }
  const commissionMinor = shareBps(input.order.dishSubtotalMinor, input.config.commissionRateBps);
  const amountMinor = input.order.dishSubtotalMinor + input.order.deliveryFeeMinor;
  const applicationFeeMinor = commissionMinor + input.order.deliveryFeeMinor;
  if (applicationFeeMinor > amountMinor || amountMinor <= 0) return { ok: false, error: 'amount' };
  const methods = input.methods ?? ['card', 'twint'];
  if (methods.includes('twint') && (amountMinor < TWINT_MIN_MINOR || amountMinor > TWINT_MAX_MINOR)) {
    return { ok: false, error: 'twint_amount' };
  }
  return {
    ok: true,
    plan: {
      amountMinor,
      applicationFeeMinor,
      cookNetMinor: amountMinor - applicationFeeMinor,
      commissionMinor,
      deliveryFeeMinor: input.order.deliveryFeeMinor,
      currency: 'chf',
      destination: input.order.cook.stripeAccountId,
      onBehalfOf: input.order.cook.stripeAccountId,
      idempotencyKey: `order_${input.order.id}`,
      paymentMethodTypes: methods,
      returnUrl: input.returnUrl,
      metadata: { orderId: input.order.id },
      mode: 'test',
    },
  };
}

/** Paramètres PaymentIntent. Le client ne les calcule pas. */
export function paymentIntentParams(plan: ChargePlan) {
  return {
    amount: plan.amountMinor,
    currency: plan.currency,
    application_fee_amount: plan.applicationFeeMinor,
    transfer_data: { destination: plan.destination },
    on_behalf_of: plan.onBehalfOf,
    payment_method_types: plan.paymentMethodTypes,
    automatic_payment_methods: { enabled: false },
    metadata: plan.metadata,
  };
}

/** Checkout hébergé pour la PWA. TWINT y redirige (application ou QR), puis revient sur success_url. */
export function checkoutSessionParams(plan: ChargePlan, successUrl: string, cancelUrl: string) {
  return {
    mode: 'payment' as const,
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_types: plan.paymentMethodTypes,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: plan.amountMinor,
          product_data: { name: `Commande ${plan.metadata.orderId}` },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: plan.applicationFeeMinor,
      transfer_data: { destination: plan.destination },
      on_behalf_of: plan.onBehalfOf,
      metadata: plan.metadata,
    },
  };
}

export function connectAccountParams() {
  return {
    type: 'express' as const,
    country: 'CH',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
      twint_payments: { requested: true },
    },
    business_type: 'individual' as const,
  };
}

export function accountLinkParams(accountId: string, refreshUrl: string, returnUrl: string) {
  return {
    account: accountId,
    type: 'account_onboarding' as const,
    refresh_url: refreshUrl,
    return_url: returnUrl,
  };
}

export type StripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  data: {
    object: {
      id?: string;
      metadata?: { orderId?: string };
      amount_refunded?: number;
      amount?: number;
      payment_intent?: string;
    };
  };
};

export type OrderPayment = {
  orderId: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed';
};

export type WebhookState = {
  seen: string[];
  orders: OrderPayment[];
};

export function reduceStripeEvent(
  state: WebhookState,
  event: StripeEvent,
  paymentsLive: boolean,
): { state: WebhookState; applied: boolean; blocked: boolean } {
  if (event.livemode && !paymentsLive) return { state, applied: false, blocked: true };
  if (state.seen.includes(event.id)) return { state, applied: false, blocked: false };
  const orderId = event.data.object.metadata?.orderId;
  if (!orderId && event.type.startsWith('payment_intent')) return { state, applied: false, blocked: false };
  const nextSeen = [...state.seen, event.id];
  const patch = (status: OrderPayment['status'], id = orderId) => {
    if (!id) return state.orders;
    const others = state.orders.filter((order) => order.orderId !== id);
    return [...others, { orderId: id, status }];
  };
  if (event.type === 'payment_intent.succeeded' && orderId) {
    return { state: { seen: nextSeen, orders: patch('paid') }, applied: true, blocked: false };
  }
  if (event.type === 'payment_intent.payment_failed' && orderId) {
    return { state: { seen: nextSeen, orders: patch('failed') }, applied: true, blocked: false };
  }
  if (event.type === 'charge.refunded' && orderId) {
    const refunded = event.data.object.amount_refunded ?? 0;
    const amount = event.data.object.amount ?? 0;
    const status = refunded > 0 && refunded < amount ? 'partially_refunded' : 'refunded';
    return { state: { seen: nextSeen, orders: patch(status) }, applied: true, blocked: false };
  }
  if (event.type === 'charge.dispute.created' && orderId) {
    return { state: { seen: nextSeen, orders: patch('disputed') }, applied: true, blocked: false };
  }
  return { state: { seen: nextSeen, orders: state.orders }, applied: false, blocked: false };
}

/** Le retour TWINT ne change pas la commande. Le webhook signé le fait. */
export function interpretPayReturn(query: Record<string, string | undefined>): {
  marksPaid: false;
  paymentIntentId: string | null;
} {
  return {
    marksPaid: false,
    paymentIntentId: query.payment_intent ?? null,
  };
}
