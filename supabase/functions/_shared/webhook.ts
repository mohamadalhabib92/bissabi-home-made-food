import { claimRow, restDelete, restGet, restWrite } from './db.ts';
import { loadOrderRows, pushCrmRows } from './crm.ts';
import type { EdgeEnv } from './env.ts';
import { json } from './http.ts';
import { isConnectEvent, signatureMatches } from './signature.ts';

type StripeObject = Record<string, unknown>;

function meta(object: StripeObject): Record<string, string> {
  const raw = object.metadata;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

function digits(length: number): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 10 ** length).padStart(length, '0');
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

export async function handleStripeWebhook(req: Request, env: EdgeEnv, fetchImpl: typeof fetch, nowSeconds = Math.floor(Date.now() / 1000)): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!env.supabaseUrl || !env.serviceKey) return json({ reason: 'supabase_unconfigured' }, 503);
  const payload = await req.text();
  const header = req.headers.get('stripe-signature') ?? '';
  const platformOk = await signatureMatches(payload, header, env.webhookSecret, nowSeconds);
  const connectOk = await signatureMatches(payload, header, env.connectWebhookSecret, nowSeconds);
  let event: { id?: string; type?: string; account?: string; data?: { object?: StripeObject } };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return json({ reason: 'malformed' }, 400);
  }
  const type = event.type ?? '';
  const signed = isConnectEvent(type) ? connectOk : platformOk;
  if (!signed || !event.id) return json({ reason: 'bad_signature' }, 400);
  const object = event.data?.object ?? {};
  const orderId = meta(object).orderId ?? null;
  const claim = await claimRow(env.supabaseUrl, env.serviceKey, 'payment_events', {
    event_id: event.id,
    order_id: orderId,
    event_type: type,
  }, fetchImpl);
  if (claim === 'duplicate') return json({ received: true, duplicate: true }, 200);
  if (claim === 'error') return json({ reason: 'dedup' }, 500);
  const applied = await applyEvent(env, event.id, type, object, event.account, fetchImpl);
  if (!applied) {
    await restDelete(env.supabaseUrl, env.serviceKey, `payment_events?event_id=eq.${encodeURIComponent(event.id)}`, fetchImpl);
    return json({ reason: 'apply' }, 500);
  }
  return json({ received: true }, 200);
}

async function applyEvent(env: EdgeEnv, eventId: string, type: string, object: StripeObject, account: string | undefined, fetchImpl: typeof fetch): Promise<boolean> {
  const base = env.supabaseUrl!;
  const key = env.serviceKey!;
  const info = meta(object);
  if (type === 'payment_intent.succeeded' || type === 'checkout.session.completed') {
    if (!info.orderId || !info.buyerId || !info.sellerId) return true;
    const total = num(object.amount) ?? num(object.amount_total) ?? 0;
    const fee = info.feeCents !== undefined ? Number(info.feeCents) : (num(object.application_fee_amount) ?? 0);
    const subtotal = Number(info.subtotalCents ?? total);
    const deliveryCents = Number(info.deliveryCents ?? '0');
    const pi = typeof object.id === 'string' && object.id.startsWith('pi_')
      ? object.id
      : typeof object.payment_intent === 'string' ? object.payment_intent : null;
    const wrote = await restWrite(base, key, 'order_payments?on_conflict=order_id', 'POST', {
      order_id: info.orderId,
      buyer_id: info.buyerId,
      seller_id: info.sellerId,
      seller_kind: info.sellerKind === 'caterer' ? 'caterer' : 'home',
      status: 'paid',
      subtotal_cents: subtotal,
      commission_cents: fee,
      total_cents: total,
      delivery_cents: Number.isInteger(deliveryCents) ? deliveryCents : 0,
      stripe_payment_intent_id: pi,
    }, fetchImpl, 'resolution=merge-duplicates');
    if (!wrote) return false;
    await restWrite(base, key, `orders?id=eq.${encodeURIComponent(info.orderId)}`, 'PATCH', { status: 'paid' }, fetchImpl);
    if (info.fulfilment === 'delivery') {
      await restWrite(base, key, 'courier_jobs?on_conflict=order_id', 'POST', {
        order_id: info.orderId,
        state: 'offered',
        pickup_code: digits(4),
        proof_code: digits(6),
      }, fetchImpl, 'resolution=ignore-duplicates');
    }
    const rows = await loadOrderRows(env, info.orderId, fetchImpl);
    if (!rows) return false;
    const pushed = await pushCrmRows(env, rows, fetchImpl);
    return pushed.ok;
  }
  if (type === 'charge.refunded' || type === 'refund.created') {
    if (!info.orderId) return true;
    const updated = await restWrite(base, key, `order_payments?order_id=eq.${encodeURIComponent(info.orderId)}`, 'PATCH', { status: 'refunded' }, fetchImpl);
    await restWrite(base, key, `orders?id=eq.${encodeURIComponent(info.orderId)}`, 'PATCH', { status: 'refunded' }, fetchImpl);
    if (!updated) return false;
    if (typeof object.id === 'string') {
      await restWrite(base, key, 'refunds?on_conflict=refund_id', 'POST', {
        refund_id: object.id,
        order_id: info.orderId,
        amount_cents: num(object.amount) ?? num(object.amount_refunded) ?? 0,
      }, fetchImpl, 'resolution=merge-duplicates');
    }
    const rows = await loadOrderRows(env, info.orderId, fetchImpl);
    if (!rows) return true;
    const pushed = await pushCrmRows(env, rows, fetchImpl);
    return pushed.ok;
  }
  if (type === 'account.updated') {
    const accountId = typeof object.id === 'string' ? object.id : '';
    if (!accountId) return true;
    return restWrite(base, key, `stripe_connect_accounts?stripe_account_id=eq.${encodeURIComponent(accountId)}`, 'PATCH', {
      charges_enabled: object.charges_enabled === true,
      payouts_enabled: object.payouts_enabled === true,
      details_submitted: object.details_submitted === true,
      updated_at: new Date().toISOString(),
    }, fetchImpl);
  }
  if (type === 'payout.paid' || type === 'payout.failed') {
    const payoutId = typeof object.id === 'string' ? object.id : '';
    if (!payoutId) return true;
    let cookId: string | null = null;
    if (account) {
      const found = await restGet<{ cook_id: string }>(base, key, `stripe_connect_accounts?stripe_account_id=eq.${encodeURIComponent(account)}&select=cook_id`, fetchImpl);
      cookId = found?.[0]?.cook_id ?? null;
    }
    return restWrite(base, key, 'payouts?on_conflict=stripe_payout_id', 'POST', {
      stripe_payout_id: payoutId,
      cook_id: cookId,
      amount_cents: num(object.amount),
      status: type === 'payout.paid' ? 'paid' : 'failed',
    }, fetchImpl, 'resolution=merge-duplicates');
  }
  void eventId;
  return true;
}
