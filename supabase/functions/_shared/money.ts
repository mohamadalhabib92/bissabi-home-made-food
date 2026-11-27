/** Même taux que `COMMISSION_RATE` (10 %). Une seule valeur, en CHF. */
export const PLATFORM_FEE_BPS = 1000;

export function platformFeeCents(dishSubtotalCents: number): number {
  if (!Number.isInteger(dishSubtotalCents) || dishSubtotalCents < 0) return 0;
  return Math.round((dishSubtotalCents * PLATFORM_FEE_BPS) / 10_000);
}

export function paymentIntentForm(input: {
  amountCents: number;
  feeCents: number;
  destination: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  sellerKind: string;
  subtotalCents: number;
}): URLSearchParams {
  const body = new URLSearchParams();
  body.set('amount', String(input.amountCents));
  body.set('currency', 'chf');
  body.set('application_fee_amount', String(input.feeCents));
  body.set('transfer_data[destination]', input.destination);
  body.append('payment_method_types[]', 'card');
  body.append('payment_method_types[]', 'twint');
  body.set('metadata[orderId]', input.orderId);
  body.set('metadata[buyerId]', input.buyerId);
  body.set('metadata[sellerId]', input.sellerId);
  body.set('metadata[sellerKind]', input.sellerKind === 'caterer' ? 'caterer' : 'home');
  body.set('metadata[feeCents]', String(input.feeCents));
  body.set('metadata[subtotalCents]', String(input.subtotalCents));
  return body;
}

export function expressAccountForm(): URLSearchParams {
  const body = new URLSearchParams();
  body.set('type', 'express');
  body.set('country', 'CH');
  body.set('business_type', 'individual');
  body.set('capabilities[card_payments][requested]', 'true');
  body.set('capabilities[transfers][requested]', 'true');
  return body;
}

export function accountLinkForm(accountId: string, refreshUrl: string, returnUrl: string): URLSearchParams {
  const body = new URLSearchParams();
  body.set('account', accountId);
  body.set('refresh_url', refreshUrl);
  body.set('return_url', returnUrl);
  body.set('type', 'account_onboarding');
  return body;
}

export function refundForm(paymentIntentId: string, amountCents: number): URLSearchParams {
  const body = new URLSearchParams();
  body.set('payment_intent', paymentIntentId);
  body.set('amount', String(amountCents));
  body.set('refund_application_fee', 'true');
  body.set('reverse_transfer', 'true');
  return body;
}
