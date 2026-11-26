/**
 * Fonction Edge — SOURCE SEULEMENT. Ne pas déployer (`supabase functions deploy` interdit ici).
 * Aucun secret dans ce fichier. La logique testée est dans src/lib/stripeConnect.ts.
 */
import { applyWebhook, buildConnectCheckout, buildExpressAccount, buildRefund, type StripeEvent } from '../../../src/lib/stripeConnect';

export const NOT_DEPLOYED = true;

export function onboardingPayload() {
  return buildExpressAccount();
}

export function checkoutOrRefuse(input: Parameters<typeof buildConnectCheckout>[0]) {
  return buildConnectCheckout(input);
}

export function refundPayload(paymentIntentId: string, amountCents: number) {
  return buildRefund(paymentIntentId, amountCents);
}

export function webhookOrIgnore(event: StripeEvent, seen: Set<string>) {
  return applyWebhook(event, seen);
}
