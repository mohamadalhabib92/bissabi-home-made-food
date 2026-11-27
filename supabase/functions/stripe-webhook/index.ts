/**
 * SOURCE SEULEMENT. Vérifie la signature, applique l’événement, puis pousse le CRM si payé ou remboursé.
 */
import { crmRowsFromStripe, pushCrmRows } from '../../../src/lib/crmSync';
import { handleStripeWebhook } from '../../../src/lib/stripeWebhook';
import { readEnv } from '../_shared/env';

export const NOT_DEPLOYED = true;

export async function handleStripeRequest(rawBody: string, signature: string, seen: Set<string>, nowSeconds: number, fetchImpl: typeof fetch = fetch): Promise<{ status: number }> {
  const result = await handleStripeWebhook(rawBody, signature, readEnv('STRIPE_WEBHOOK_SECRET') ?? '', seen, nowSeconds);
  if (result.status !== 200) return { status: result.status };
  let event: { type?: string; data?: { object?: { amount?: number; application_fee_amount?: number; metadata?: Record<string, string> } } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return { status: 400 };
  }
  const rows = crmRowsFromStripe(event.type ?? '', event.data?.object ?? {});
  if (rows.length === 0) return { status: 200 };
  const pushed = await pushCrmRows(rows, { url: readEnv('CRM_SUPABASE_URL'), serviceKey: readEnv('CRM_SERVICE_ROLE_KEY') }, fetchImpl);
  return { status: pushed.ok ? 200 : 502 };
}
