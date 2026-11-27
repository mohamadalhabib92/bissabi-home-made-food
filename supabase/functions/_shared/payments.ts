import { authUserId, restGet, restWrite } from './db.ts';
import type { EdgeEnv } from './env.ts';
import { bearer, isServiceRole } from './env.ts';
import { httpsUrl, json, readJson } from './http.ts';
import { platformFeeCents } from './money.ts';
import { createAccountLink, createExpressAccount, createPaymentIntent, createRefund } from './stripe.ts';

type OrderRow = { id: string; buyer_id: string; cook_id: string };
type ItemRow = { qty: number; unit_price_cents: number };
type CookRow = { user_id: string; ofco_status: string };
type KitchenRow = { hygiene_passed: boolean; kind: string };
type AccountRow = { stripe_account_id: string | null; charges_enabled: boolean };
type PaymentRow = { order_id: string; seller_id: string; total_cents: number; status: string; stripe_payment_intent_id: string | null };

function onlyKey(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const entries = Object.entries(body as Record<string, unknown>);
  if (entries.length !== 1 || entries[0][0] !== key || typeof entries[0][1] !== 'string' || !entries[0][1].trim()) return null;
  return entries[0][1].trim();
}

export async function handleCreatePaymentIntent(req: Request, env: EdgeEnv, fetchImpl: typeof fetch): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!env.supabaseUrl || !env.serviceKey || !env.stripeKey) return json({ reason: 'unconfigured' }, 503);
  const orderId = onlyKey(await readJson(req), 'orderId');
  if (!orderId) return json({ reason: 'order_id' }, 400);
  const userId = await authUserId(env.supabaseUrl, env.serviceKey, bearer(req.headers.get('authorization')), fetchImpl);
  if (!userId) return json({ reason: 'auth' }, 401);
  const orders = await restGet<OrderRow>(env.supabaseUrl, env.serviceKey, `orders?id=eq.${encodeURIComponent(orderId)}&select=id,buyer_id,cook_id`, fetchImpl);
  const order = orders?.[0];
  if (!order || order.buyer_id !== userId) return json({ reason: 'order' }, 404);
  const [items, cooks, kitchens, accounts] = await Promise.all([
    restGet<ItemRow>(env.supabaseUrl, env.serviceKey, `order_items?order_id=eq.${encodeURIComponent(orderId)}&select=qty,unit_price_cents`, fetchImpl),
    restGet<CookRow>(env.supabaseUrl, env.serviceKey, `cooks?id=eq.${encodeURIComponent(order.cook_id)}&select=user_id,ofco_status`, fetchImpl),
    restGet<KitchenRow>(env.supabaseUrl, env.serviceKey, `kitchens?cook_id=eq.${encodeURIComponent(order.cook_id)}&select=hygiene_passed,kind`, fetchImpl),
    restGet<AccountRow>(env.supabaseUrl, env.serviceKey, `stripe_connect_accounts?cook_id=eq.${encodeURIComponent(order.cook_id)}&select=stripe_account_id,charges_enabled`, fetchImpl),
  ]);
  if (!items || !cooks || !kitchens || !accounts) return json({ reason: 'db' }, 500);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unit_price_cents, 0);
  const destination = accounts[0]?.stripe_account_id ?? '';
  const open = env.launch === '1' && kitchens[0]?.hygiene_passed === true && cooks[0]?.ofco_status === 'ofco_verified' && destination.startsWith('acct_');
  if (!open || subtotal <= 0) return json({ reason: 'launch_closed' }, 403);
  const fee = platformFeeCents(subtotal);
  const created = await createPaymentIntent(env.stripeKey, {
    amountCents: subtotal,
    feeCents: fee,
    destination,
    orderId,
    buyerId: userId,
    sellerId: cooks[0].user_id,
    sellerKind: kitchens[0]?.kind === 'caterer' ? 'caterer' : 'home',
    subtotalCents: subtotal,
  }, `pi_${orderId}`, fetchImpl);
  if (!created.ok) return json({ reason: 'stripe' }, 502);
  return json({ clientSecret: created.body.client_secret ?? null, paymentIntentId: created.body.id ?? null }, 200);
}

export async function handleConnectOnboarding(req: Request, env: EdgeEnv, fetchImpl: typeof fetch): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!env.supabaseUrl || !env.serviceKey || !env.stripeKey) return json({ reason: 'unconfigured' }, 503);
  const body = await readJson(req);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ reason: 'body' }, 400);
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => key !== 'refreshUrl' && key !== 'returnUrl')) return json({ reason: 'body' }, 400);
  const refreshUrl = httpsUrl(record.refreshUrl);
  const returnUrl = httpsUrl(record.returnUrl);
  if (!refreshUrl || !returnUrl) return json({ reason: 'url' }, 400);
  const userId = await authUserId(env.supabaseUrl, env.serviceKey, bearer(req.headers.get('authorization')), fetchImpl);
  if (!userId) return json({ reason: 'auth' }, 401);
  const cooks = await restGet<{ id: string }>(env.supabaseUrl, env.serviceKey, `cooks?user_id=eq.${encodeURIComponent(userId)}&select=id`, fetchImpl);
  if (!cooks) return json({ reason: 'db' }, 500);
  const cook = cooks[0];
  if (!cook) return json({ reason: 'cook' }, 403);
  const existing = await restGet<AccountRow>(env.supabaseUrl, env.serviceKey, `stripe_connect_accounts?cook_id=eq.${encodeURIComponent(cook.id)}&select=stripe_account_id,charges_enabled`, fetchImpl);
  if (!existing) return json({ reason: 'db' }, 500);
  let accountId = existing?.[0]?.stripe_account_id ?? '';
  if (!accountId.startsWith('acct_')) {
    const created = await createExpressAccount(env.stripeKey, `acct_${cook.id}`, fetchImpl);
    if (!created.ok || typeof created.body.id !== 'string') return json({ reason: 'stripe' }, 502);
    accountId = created.body.id;
    const saved = await restWrite(env.supabaseUrl, env.serviceKey, 'stripe_connect_accounts?on_conflict=cook_id', 'POST', {
      cook_id: cook.id,
      stripe_account_id: accountId,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    }, fetchImpl, 'resolution=merge-duplicates');
    if (!saved) return json({ reason: 'db' }, 500);
  }
  const link = await createAccountLink(env.stripeKey, accountId, refreshUrl, returnUrl, fetchImpl);
  if (!link.ok || typeof link.body.url !== 'string') return json({ reason: 'stripe' }, 502);
  return json({ url: link.body.url }, 200);
}

export async function handleCreateRefund(req: Request, env: EdgeEnv, fetchImpl: typeof fetch): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!env.supabaseUrl || !env.serviceKey || !env.stripeKey) return json({ reason: 'unconfigured' }, 503);
  const orderId = onlyKey(await readJson(req), 'orderId');
  if (!orderId) return json({ reason: 'order_id' }, 400);
  const payments = await restGet<PaymentRow>(env.supabaseUrl, env.serviceKey, `order_payments?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,seller_id,total_cents,status,stripe_payment_intent_id`, fetchImpl);
  const payment = payments?.[0];
  if (!payment?.stripe_payment_intent_id) return json({ reason: 'payment' }, 404);
  const service = isServiceRole(req.headers.get('authorization'), env.serviceKey);
  const userId = service ? payment.seller_id : await authUserId(env.supabaseUrl, env.serviceKey, bearer(req.headers.get('authorization')), fetchImpl);
  if (!userId || userId !== payment.seller_id) return json({ reason: 'auth' }, 401);
  if (payment.status === 'refunded') return json({ reason: 'already' }, 409);
  const refund = await createRefund(env.stripeKey, payment.stripe_payment_intent_id, payment.total_cents, `re_${orderId}`, fetchImpl);
  if (!refund.ok) return json({ reason: 'stripe' }, 502);
  return json({ refundId: refund.body.id ?? null }, 200);
}
