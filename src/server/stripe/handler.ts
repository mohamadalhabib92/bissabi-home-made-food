import {
  accountLinkParams,
  checkoutSessionParams,
  connectAccountParams,
  gateCharge,
  interpretPayReturn,
  paymentIntentParams,
  prepareCharge,
  reduceStripeEvent,
  type ChargeOrder,
  type ServerConfig,
  type StripeEvent,
  type Surface,
  type WebhookState,
} from './connect';

export type StripeClient = {
  createPaymentIntent: (params: ReturnType<typeof paymentIntentParams>, idempotencyKey: string) => Promise<{ id: string; client_secret: string | null }>;
  createCheckoutSession: (params: ReturnType<typeof checkoutSessionParams>, idempotencyKey: string) => Promise<{ url: string | null }>;
  createAccount: (params: ReturnType<typeof connectAccountParams>) => Promise<{ id: string }>;
  createAccountLink: (params: ReturnType<typeof accountLinkParams>) => Promise<{ url: string }>;
  constructEvent: (raw: string, signature: string, secret: string) => StripeEvent;
};

export async function createPayment(input: {
  config: ServerConfig;
  order: ChargeOrder | null;
  surface: Surface;
  returnUrl: string;
  successUrl: string;
  cancelUrl: string;
  stripe: StripeClient;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const gate = gateCharge(input.config);
  if (!gate.ok) return { status: 403, body: { error: gate.error } };
  if (!input.order) return { status: 404, body: { error: 'unknown_order' } };
  const plan = prepareCharge({ config: input.config, order: input.order, returnUrl: input.returnUrl });
  if (!plan.ok) return { status: 409, body: { error: plan.error } };
  if (input.surface === 'web') {
    const session = await input.stripe.createCheckoutSession(
      checkoutSessionParams(plan.plan, input.successUrl, input.cancelUrl),
      plan.plan.idempotencyKey,
    );
    return { status: 200, body: { checkoutUrl: session.url, plan: publicPlan(plan.plan) } };
  }
  const intent = await input.stripe.createPaymentIntent(paymentIntentParams(plan.plan), plan.plan.idempotencyKey);
  return { status: 200, body: { clientSecret: intent.client_secret, paymentIntentId: intent.id, plan: publicPlan(plan.plan) } };
}

function publicPlan(plan: { amountMinor: number; applicationFeeMinor: number; cookNetMinor: number; currency: string }) {
  return { amountMinor: plan.amountMinor, applicationFeeMinor: plan.applicationFeeMinor, cookNetMinor: plan.cookNetMinor, currency: plan.currency };
}

export async function createOnboardingLink(input: {
  config: ServerConfig;
  stripeAccountId: string | null;
  refreshUrl: string;
  returnUrl: string;
  stripe: StripeClient;
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const gate = gateCharge(input.config);
  if (!gate.ok) return { status: 403, body: { error: gate.error } };
  let accountId = input.stripeAccountId;
  if (!accountId) {
    const created = await input.stripe.createAccount(connectAccountParams());
    accountId = created.id;
  }
  const link = await input.stripe.createAccountLink(accountLinkParams(accountId, input.refreshUrl, input.returnUrl));
  return { status: 200, body: { url: link.url, stripeAccountId: accountId } };
}

export function handleWebhook(input: {
  raw: string;
  signature: string;
  webhookSecret: string;
  paymentsLive: boolean;
  state: WebhookState;
  stripe: StripeClient;
}): { status: number; state: WebhookState; body: Record<string, unknown> } {
  let event: StripeEvent;
  try {
    event = input.stripe.constructEvent(input.raw, input.signature, input.webhookSecret);
  } catch {
    return { status: 400, state: input.state, body: { error: 'bad_signature' } };
  }
  const reduced = reduceStripeEvent(input.state, event, input.paymentsLive);
  return { status: 200, state: reduced.state, body: { applied: reduced.applied, blocked: reduced.blocked } };
}

export { interpretPayReturn };
