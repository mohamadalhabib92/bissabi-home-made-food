// Edge Function : crée un PaymentIntent (app native) ou une session Checkout (PWA).
// Secrets serveur uniquement : STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, PAYMENTS_LIVE=false.
import Stripe from 'npm:stripe@17.7.0';
import { createPayment } from '../../../src/server/stripe/handler.ts';
import type { ChargeOrder, ServerConfig } from '../../../src/server/stripe/connect.ts';

type CookRow = { stripe_account_id: string | null; charges_enabled: boolean; bissabi_validated: boolean };
type OrderRow = { id: string; cook_id: string; dish_subtotal_minor: number; delivery_fee_minor: number; currency: 'chf' };

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('method', { status: 405 });
  const body = await request.json() as { orderId?: string; surface?: 'native' | 'web'; returnUrl?: string; successUrl?: string; cancelUrl?: string };
  const cfg = await serverConfig();
  const order = body.orderId ? await loadOrder(body.orderId) : null;
  const secret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const stripeSdk = new Stripe(secret, { apiVersion: '2024-11-20.acacia' });
  const result = await createPayment({
    config: cfg,
    order,
    surface: body.surface === 'web' ? 'web' : 'native',
    returnUrl: body.returnUrl ?? '',
    successUrl: body.successUrl ?? '',
    cancelUrl: body.cancelUrl ?? '',
    stripe: {
      createPaymentIntent: (params, idempotencyKey) => stripeSdk.paymentIntents.create(params as Stripe.PaymentIntentCreateParams, { idempotencyKey }),
      createCheckoutSession: (params, idempotencyKey) => stripeSdk.checkout.sessions.create(params as Stripe.Checkout.SessionCreateParams, { idempotencyKey }),
      createAccount: async () => ({ id: '' }),
      createAccountLink: async () => ({ url: '' }),
      constructEvent: () => { throw new Error('unused'); },
    },
  });
  return Response.json(result.body, { status: result.status });
});

async function serverConfig(): Promise<ServerConfig> {
  const settings = await restGet<Array<{ payments_live: boolean; commission_rate_bps: number }>>('settings?id=eq.true&select=payments_live,commission_rate_bps');
  const row = settings?.[0];
  return {
    paymentsLive: row?.payments_live === true,
    secretKey: Deno.env.get('STRIPE_SECRET_KEY') ?? '',
    commissionRateBps: row?.commission_rate_bps ?? 1000,
  };
}

async function loadOrder(orderId: string): Promise<ChargeOrder | null> {
  const orders = await restGet<OrderRow[]>(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,cook_id,dish_subtotal_minor,delivery_fee_minor,currency`);
  const order = orders?.[0];
  if (!order) return null;
  const cooks = await restGet<CookRow[]>(`cook_accounts?cook_id=eq.${encodeURIComponent(order.cook_id)}&select=stripe_account_id,charges_enabled,bissabi_validated`);
  const cook = cooks?.[0];
  if (!cook) return null;
  return {
    id: order.id,
    dishSubtotalMinor: order.dish_subtotal_minor,
    deliveryFeeMinor: order.delivery_fee_minor,
    currency: 'chf',
    cook: { stripeAccountId: cook.stripe_account_id, chargesEnabled: cook.charges_enabled, bissabiValidated: cook.bissabi_validated },
  };
}

async function restGet<T>(query: string): Promise<T | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  const response = await fetch(`${url}/rest/v1/${query}`, {
    headers: { apikey: key, authorization: `Bearer ${key}`, 'accept-profile': 'payments' },
  });
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}
