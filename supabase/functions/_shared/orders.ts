import { authUserId, restDelete, restGet, restInsert } from './db.ts';
import type { EdgeEnv } from './env.ts';
import { bearer } from './env.ts';
import { json, readJson } from './http.ts';
import { platformFeeCents } from './money.ts';
import { createPaymentIntent } from './stripe.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DishRow = { id: string; cook_id: string; title: string; price_chf: number | string; active: boolean };
type KitchenRow = { id: string; cook_id: string; hygiene_passed: boolean; kind: string };
type CookRow = { user_id: string; ofco_status: string };
type AccountRow = { stripe_account_id: string | null };
type AllergenRow = { dish_id: string; allergen: string };

export function parseCreateOrder(body: unknown): { kitchenId: string; items: { dishId: string; qty: number }[]; delivery: string; slotDate: string } | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => !['kitchenId', 'items', 'delivery', 'slotDate'].includes(key))) return null;
  if (typeof record.kitchenId !== 'string' || !UUID.test(record.kitchenId)) return null;
  if (record.delivery !== 'pickup' && record.delivery !== 'delivery') return null;
  if (!Array.isArray(record.items) || record.items.length === 0 || record.items.length > 40) return null;
  const items: { dishId: string; qty: number }[] = [];
  for (const item of record.items) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    if (Object.keys(row).some((key) => key !== 'dishId' && key !== 'qty')) return null;
    if (typeof row.dishId !== 'string' || !UUID.test(row.dishId)) return null;
    if (!Number.isInteger(row.qty) || (row.qty as number) < 1 || (row.qty as number) > 500) return null;
    const existing = items.find((line) => line.dishId === row.dishId);
    if (existing) existing.qty += row.qty as number;
    else items.push({ dishId: row.dishId, qty: row.qty as number });
  }
  const slotDate = typeof record.slotDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.slotDate)
    ? record.slotDate
    : new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
  return { kitchenId: record.kitchenId, items, delivery: record.delivery, slotDate };
}

function centsFromChf(value: number | string): number | null {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 0.01) return null;
  return cents;
}

export async function handleCreateOrder(req: Request, env: EdgeEnv, fetchImpl: typeof fetch): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!env.supabaseUrl || !env.serviceKey || !env.stripeKey) return json({ reason: 'unconfigured' }, 503);
  const cart = parseCreateOrder(await readJson(req));
  if (!cart) return json({ reason: 'cart' }, 400);
  if (cart.delivery !== 'pickup') return json({ reason: 'delivery_undefined' }, 403);
  const userId = await authUserId(env.supabaseUrl, env.serviceKey, bearer(req.headers.get('authorization')), fetchImpl);
  if (!userId) return json({ reason: 'auth' }, 401);
  const base = env.supabaseUrl;
  const key = env.serviceKey;
  let kitchens = await restGet<KitchenRow>(base, key, `kitchens?id=eq.${cart.kitchenId}&select=id,cook_id,hygiene_passed,kind`, fetchImpl);
  if (kitchens && kitchens.length === 0) {
    kitchens = await restGet<KitchenRow>(base, key, `kitchens?cook_id=eq.${cart.kitchenId}&select=id,cook_id,hygiene_passed,kind`, fetchImpl);
  }
  const kitchen = kitchens?.[0];
  if (!kitchens) return json({ reason: 'db' }, 500);
  if (!kitchen) return json({ reason: 'kitchen' }, 404);
  const ids = cart.items.map((item) => item.dishId).join(',');
  const [dishes, allergens, cooks, accounts] = await Promise.all([
    restGet<DishRow>(base, key, `dishes?id=in.(${ids})&select=id,cook_id,title,price_chf,active`, fetchImpl),
    restGet<AllergenRow>(base, key, `dish_allergens?dish_id=in.(${ids})&select=dish_id,allergen`, fetchImpl),
    restGet<CookRow>(base, key, `cooks?id=eq.${kitchen.cook_id}&select=user_id,ofco_status`, fetchImpl),
    restGet<AccountRow>(base, key, `stripe_connect_accounts?cook_id=eq.${kitchen.cook_id}&select=stripe_account_id`, fetchImpl),
  ]);
  if (!dishes || !allergens || !cooks || !accounts) return json({ reason: 'db' }, 500);
  const cook = cooks[0];
  const destination = accounts[0]?.stripe_account_id ?? '';
  const open = env.launch === '1' && kitchen.hygiene_passed === true && cook?.ofco_status === 'ofco_verified' && destination.startsWith('acct_');
  if (!open) return json({ reason: 'launch_closed' }, 403);
  const lines: { dishId: string; title: string; qty: number; unitCents: number }[] = [];
  for (const item of cart.items) {
    const dish = dishes.find((row) => row.id === item.dishId);
    if (!dish || dish.cook_id !== kitchen.cook_id || dish.active !== true) return json({ reason: 'dish' }, 400);
    const declared = new Set(allergens.filter((row) => row.dish_id === dish.id).map((row) => row.allergen));
    if (declared.size !== 14) return json({ reason: 'allergens' }, 400);
    const unitCents = centsFromChf(dish.price_chf);
    if (unitCents === null) return json({ reason: 'price' }, 400);
    lines.push({ dishId: dish.id, title: dish.title, qty: item.qty, unitCents });
  }
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.unitCents, 0);
  if (subtotal <= 0) return json({ reason: 'price' }, 400);
  const created = await restInsert<{ id: string }>(base, key, 'orders', {
    buyer_id: userId,
    cook_id: kitchen.cook_id,
    status: 'sent',
    slot_date: cart.slotDate,
  }, fetchImpl);
  const orderId = created?.[0]?.id;
  if (!orderId) return json({ reason: 'db' }, 500);
  const itemsInserted = await restInsert<{ id: string }>(base, key, 'order_items', lines.map((line) => ({
    order_id: orderId,
    dish_id: line.dishId,
    title: line.title,
    qty: line.qty,
    unit_price_cents: line.unitCents,
  })), fetchImpl);
  if (!itemsInserted || itemsInserted.length !== lines.length) {
    await restDelete(base, key, `order_items?order_id=eq.${orderId}`, fetchImpl);
    await restDelete(base, key, `orders?id=eq.${orderId}`, fetchImpl);
    return json({ reason: 'db' }, 500);
  }
  const fee = platformFeeCents(subtotal);
  const payment = await createPaymentIntent(env.stripeKey, {
    amountCents: subtotal,
    feeCents: fee,
    destination,
    orderId,
    buyerId: userId,
    sellerId: cook.user_id,
    sellerKind: kitchen.kind === 'caterer' ? 'caterer' : 'home',
    subtotalCents: subtotal,
  }, `pi_${orderId}`, fetchImpl);
  if (!payment.ok) {
    await restDelete(base, key, `order_items?order_id=eq.${orderId}`, fetchImpl);
    await restDelete(base, key, `orders?id=eq.${orderId}`, fetchImpl);
    return json({ reason: 'stripe' }, 502);
  }
  return json({
    orderId,
    clientSecret: payment.body.client_secret ?? null,
    paymentIntentId: payment.body.id ?? null,
  }, 200);
}
