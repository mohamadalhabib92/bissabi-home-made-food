// Edge Function : webhook Stripe. Seule cette fonction change le statut de paiement.
// Secret : STRIPE_WEBHOOK_SECRET. PAYMENTS_LIVE=false ignore les événements livemode.
import Stripe from 'npm:stripe@17.7.0';
import { handleWebhook } from '../../../src/server/stripe/handler.ts';
import type { WebhookState } from '../../../src/server/stripe/connect.ts';

Deno.serve(async (request) => {
  const raw = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  const secret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const stripeSdk = new Stripe(secret, { apiVersion: '2024-11-20.acacia' });
  const result = handleWebhook({
    raw,
    signature,
    webhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
    paymentsLive: Deno.env.get('PAYMENTS_LIVE') === 'true',
    state: await loadState(),
    stripe: {
      createPaymentIntent: async () => ({ id: '', client_secret: null }),
      createCheckoutSession: async () => ({ url: null }),
      createAccount: async () => ({ id: '' }),
      createAccountLink: async () => ({ url: '' }),
      constructEvent: (payload, header, webhookSecret) => stripeSdk.webhooks.constructEvent(payload, header, webhookSecret) as never,
    },
  });
  if (result.body.applied === true) await persist(result.state);
  return Response.json(result.body, { status: result.status });
});

async function loadState(): Promise<WebhookState> {
  return { seen: [], orders: [] };
}

async function persist(state: WebhookState): Promise<void> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const latest = state.orders[state.orders.length - 1];
  const eventId = state.seen[state.seen.length - 1];
  if (!url || !key || !latest || !eventId) return;
  await fetch(`${url}/rest/v1/rpc/record_webhook`, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-profile': 'payments',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      p_event: eventId,
      p_type: 'from_edge',
      p_livemode: false,
      p_order: latest.orderId,
      p_status: latest.status,
    }),
  });
}
