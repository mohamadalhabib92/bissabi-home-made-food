import type { EdgeEnv } from './env.ts';
import { restGet } from './db.ts';

export const CRM_SCHEMA = 'bissabi_food';

export type CrmRow = { table: 'contacts' | 'sellers' | 'orders'; values: Record<string, string | number | null> };

const buyer = (id: string) => `bissabi-food:buyer:${id}`;
const seller = (id: string) => `bissabi-food:seller:${id}`;
const order = (id: string) => `bissabi-food:order:${id}`;

/** Seuls `orderId` ou `userId`. Tout autre champ, même avec la clé service, est refusé. */
export function crmSyncTarget(body: unknown): { kind: 'order'; orderId: string } | { kind: 'user'; userId: string } | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const entries = Object.entries(body as Record<string, unknown>);
  if (entries.length !== 1) return null;
  const [key, value] = entries[0];
  if (typeof value !== 'string' || value.trim() === '') return null;
  if (key === 'orderId') return { kind: 'order', orderId: value.trim() };
  if (key === 'userId') return { kind: 'user', userId: value.trim() };
  return null;
}

type PaymentRow = {
  order_id: string;
  buyer_id: string;
  seller_id: string;
  seller_kind: string | null;
  status: 'paid' | 'refunded';
  subtotal_cents: number;
  commission_cents: number;
  total_cents: number;
};

/** N’envoie pas les champs vides : un upsert ne doit pas effacer un nom déjà en CRM. */
export function withoutNulls(values: Record<string, string | number | null>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) out[key] = value;
  }
  return out;
}

export function rowsFromPayment(row: PaymentRow): CrmRow[] {
  const sellerId = seller(row.seller_id);
  return [
    { table: 'contacts', values: { external_id: buyer(row.buyer_id), kind: 'buyer' } },
    { table: 'contacts', values: { external_id: sellerId, kind: 'seller' } },
    { table: 'sellers', values: { external_id: sellerId, kind: row.seller_kind === 'caterer' ? 'caterer' : 'home' } },
    {
      table: 'orders',
      values: {
        external_id: order(row.order_id),
        status: row.status,
        currency: 'CHF',
        buyer_external_id: buyer(row.buyer_id),
        seller_external_id: sellerId,
        subtotal_cents: row.subtotal_cents,
        commission_cents: row.commission_cents,
        total_cents: row.total_cents,
      },
    },
  ];
}

export async function loadOrderRows(env: EdgeEnv, orderId: string, fetchImpl: typeof fetch): Promise<CrmRow[] | null> {
  if (!env.supabaseUrl || !env.serviceKey) return null;
  const rows = await restGet<PaymentRow>(env.supabaseUrl, env.serviceKey, `order_payments?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,buyer_id,seller_id,seller_kind,status,subtotal_cents,commission_cents,total_cents`, fetchImpl);
  if (!rows || rows.length === 0) return null;
  return rowsFromPayment(rows[0]);
}

type Profile = { display_name: string | null };
type Account = { role: string };
type Cook = { id: string; display_name: string };
type Kitchen = { kind: string };

export async function loadUserRows(env: EdgeEnv, userId: string, fetchImpl: typeof fetch): Promise<CrmRow[] | 'skip' | null> {
  if (!env.supabaseUrl || !env.serviceKey) return null;
  const id = encodeURIComponent(userId);
  const [accounts, profiles, cooks] = await Promise.all([
    restGet<Account>(env.supabaseUrl, env.serviceKey, `account_profiles?user_id=eq.${id}&select=role`, fetchImpl),
    restGet<Profile>(env.supabaseUrl, env.serviceKey, `profiles?id=eq.${id}&select=display_name`, fetchImpl),
    restGet<Cook>(env.supabaseUrl, env.serviceKey, `cooks?user_id=eq.${id}&select=id,display_name`, fetchImpl),
  ]);
  if (!accounts || !profiles || !cooks) return null;
  const role = accounts[0]?.role;
  const cook = cooks[0];
  const sellerRole = role === 'cook' || role === 'traiteur' || !!cook;
  if (role === 'courier' && !sellerRole) return 'skip';
  if (!sellerRole && role !== 'client' && !profiles[0] && !cook) return null;
  const name = cook?.display_name ?? profiles[0]?.display_name ?? null;
  if (!sellerRole) {
    return [{ table: 'contacts', values: { external_id: buyer(userId), kind: 'buyer', display_name: name, email: null } }];
  }
  let kind = 'home';
  if (cook) {
    const kitchens = await restGet<Kitchen>(env.supabaseUrl, env.serviceKey, `kitchens?cook_id=eq.${encodeURIComponent(cook.id)}&select=kind`, fetchImpl);
    if (kitchens?.[0]?.kind === 'caterer' || role === 'traiteur') kind = 'caterer';
  } else if (role === 'traiteur') kind = 'caterer';
  const external = seller(userId);
  return [
    { table: 'contacts', values: { external_id: external, kind: 'seller', display_name: name, email: null } },
    { table: 'sellers', values: { external_id: external, kind, display_name: name } },
  ];
}

export async function pushCrmRows(env: EdgeEnv, rows: CrmRow[], fetchImpl: typeof fetch): Promise<{ ok: true; skipped: boolean } | { ok: false; status: number }> {
  if (!env.crmUrl || !env.crmKey) return { ok: true, skipped: true };
  for (const row of rows) {
    const response = await fetchImpl(`${env.crmUrl.replace(/\/$/, '')}/rest/v1/${row.table}?on_conflict=external_id`, {
      method: 'POST',
      headers: {
        apikey: env.crmKey,
        Authorization: `Bearer ${env.crmKey}`,
        'content-type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
        'Accept-Profile': CRM_SCHEMA,
        'Content-Profile': CRM_SCHEMA,
      },
        body: JSON.stringify(withoutNulls(row.values)),
    });
    if (!response.ok) return { ok: false, status: response.status };
  }
  return { ok: true, skipped: false };
}
