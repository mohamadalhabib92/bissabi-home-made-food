/**
 * SOURCE SEULEMENT. Construit le PaymentIntent. Aucun appel Stripe dans ce dépôt.
 * STRIPE_SECRET_KEY est lu au déploiement, jamais commité.
 */
import { buildPaymentIntent, type ConnectCheckoutInput } from '../../../src/lib/stripeConnect';
import { readEnv } from '../_shared/env';

export const NOT_DEPLOYED = true;

export function handleCreatePaymentIntent(input: ConnectCheckoutInput, idempotencyKey: string): { status: number; body: unknown } {
  if (!readEnv('STRIPE_SECRET_KEY')) return { status: 503, body: { reason: 'stripe_unconfigured' } };
  const built = buildPaymentIntent(input, idempotencyKey);
  if (!built.ok) return { status: 403, body: built };
  return { status: 200, body: { params: built.params, idempotencyKey: built.idempotencyKey } };
}
