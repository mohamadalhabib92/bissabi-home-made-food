// Edge Function : lien d'onboarding Stripe Connect Express (cartes + TWINT).
import Stripe from 'npm:stripe@17.7.0';
import { createOnboardingLink } from '../../../src/server/stripe/handler.ts';
import type { ServerConfig } from '../../../src/server/stripe/connect.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('method', { status: 405 });
  const body = await request.json() as { stripeAccountId?: string | null; refreshUrl?: string; returnUrl?: string };
  const secret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const stripeSdk = new Stripe(secret, { apiVersion: '2024-11-20.acacia' });
  const config: ServerConfig = {
    paymentsLive: Deno.env.get('PAYMENTS_LIVE') === 'true',
    secretKey: secret,
    commissionRateBps: 1000,
  };
  const result = await createOnboardingLink({
    config,
    stripeAccountId: body.stripeAccountId ?? null,
    refreshUrl: body.refreshUrl ?? '',
    returnUrl: body.returnUrl ?? '',
    stripe: {
      createPaymentIntent: async () => ({ id: '', client_secret: null }),
      createCheckoutSession: async () => ({ url: null }),
      createAccount: (params) => stripeSdk.accounts.create(params as Stripe.AccountCreateParams),
      createAccountLink: (params) => stripeSdk.accountLinks.create(params as Stripe.AccountLinkCreateParams),
      constructEvent: () => { throw new Error('unused'); },
    },
  });
  return Response.json(result.body, { status: result.status });
});
