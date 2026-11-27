import { accountLinkForm, expressAccountForm, paymentIntentForm, refundForm } from './money.ts';

const STRIPE = 'https://api.stripe.com/v1';

export type StripeResult = { ok: true; body: Record<string, unknown> } | { ok: false; status: number };

async function stripePost(secret: string, path: string, form: URLSearchParams, idempotencyKey: string | undefined, fetchImpl: typeof fetch): Promise<StripeResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
    'content-type': 'application/x-www-form-urlencoded',
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetchImpl(`${STRIPE}${path}`, { method: 'POST', headers, body: form.toString() });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, body };
}

export function createPaymentIntent(secret: string, input: Parameters<typeof paymentIntentForm>[0], idempotencyKey: string, fetchImpl: typeof fetch) {
  return stripePost(secret, '/payment_intents', paymentIntentForm(input), idempotencyKey, fetchImpl);
}

export function createExpressAccount(secret: string, idempotencyKey: string, fetchImpl: typeof fetch) {
  return stripePost(secret, '/accounts', expressAccountForm(), idempotencyKey, fetchImpl);
}

export function createAccountLink(secret: string, accountId: string, refreshUrl: string, returnUrl: string, fetchImpl: typeof fetch) {
  return stripePost(secret, '/account_links', accountLinkForm(accountId, refreshUrl, returnUrl), undefined, fetchImpl);
}

export function createRefund(secret: string, paymentIntentId: string, amountCents: number, idempotencyKey: string, fetchImpl: typeof fetch) {
  return stripePost(secret, '/refunds', refundForm(paymentIntentId, amountCents), idempotencyKey, fetchImpl);
}
