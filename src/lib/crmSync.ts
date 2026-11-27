/**
 * Envoi vers le projet Supabase « bissabi-crm » (schéma bissabi_food).
 * La clé service vient de l’environnement au moment de l’appel. Jamais dans le dépôt.
 * Les identifiants externes rendent l’upsert idempotent.
 */

export const CRM_SCHEMA = 'bissabi_food';
export const FOOD_PROJECT_REF = 'qizhprlzeiqrngwpxjnd';
export const CRM_PROJECT_REF = 'ppeovmfuhtidavdnrwxu';

export type CrmTable = 'contacts' | 'sellers' | 'orders';

export type CrmRow = {
  table: CrmTable;
  external_id: string;
  values: Record<string, string | number | null>;
};

const buyerId = (id: string) => `bissabi-food:buyer:${id}`;
const sellerId = (id: string) => `bissabi-food:seller:${id}`;
const orderId = (id: string) => `bissabi-food:order:${id}`;

export function crmRowsForPerson(person: { id: string; role: 'buyer' | 'seller'; name?: string | null; email?: string | null; sellerKind?: string | null }): CrmRow[] {
  const external_id = person.role === 'buyer' ? buyerId(person.id) : sellerId(person.id);
  const contact: CrmRow = {
    table: 'contacts',
    external_id,
    values: { external_id, kind: person.role, display_name: person.name ?? null, email: person.email ?? null },
  };
  if (person.role === 'buyer') return [contact];
  return [contact, {
    table: 'sellers',
    external_id,
    values: { external_id, kind: person.sellerKind ?? 'home', display_name: person.name ?? null },
  }];
}

export function crmRowsForOrder(order: {
  id: string;
  buyerId: string;
  sellerId: string;
  status: 'paid' | 'refunded';
  subtotalCents: number;
  commissionCents: number;
  totalCents: number;
}): CrmRow[] {
  const external_id = orderId(order.id);
  return [{
    table: 'orders',
    external_id,
    values: {
      external_id,
      status: order.status,
      currency: 'CHF',
      buyer_external_id: buyerId(order.buyerId),
      seller_external_id: sellerId(order.sellerId),
      subtotal_cents: order.subtotalCents,
      commission_cents: order.commissionCents,
      total_cents: order.totalCents,
    },
  }];
}

export function crmRowsFromStripe(type: string, object: { amount?: number; application_fee_amount?: number; metadata?: Record<string, string | undefined> }): CrmRow[] {
  if (type !== 'payment_intent.succeeded' && type !== 'charge.refunded') return [];
  const meta = object.metadata ?? {};
  if (!meta.orderId || !meta.buyerId || !meta.sellerId) return [];
  const total = Number(object.amount ?? 0);
  const fee = Number(meta.feeCents ?? object.application_fee_amount ?? 0);
  return crmRowsForOrder({
    id: meta.orderId,
    buyerId: meta.buyerId,
    sellerId: meta.sellerId,
    status: type === 'charge.refunded' ? 'refunded' : 'paid',
    subtotalCents: Number(meta.subtotalCents ?? total),
    commissionCents: fee,
    totalCents: total,
  });
}

export function rowsFromCrmRequest(body: unknown): CrmRow[] | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as { kind?: string; id?: string; role?: string; name?: string; email?: string; sellerKind?: string; orderId?: string; buyerId?: string; sellerId?: string; status?: string; subtotalCents?: number; commissionCents?: number; totalCents?: number };
  if (b.kind === 'person' && b.id && (b.role === 'buyer' || b.role === 'seller')) {
    return crmRowsForPerson({ id: b.id, role: b.role, name: b.name, email: b.email, sellerKind: b.sellerKind });
  }
  if (b.kind === 'order' && b.orderId && b.buyerId && b.sellerId && (b.status === 'paid' || b.status === 'refunded')) {
    return crmRowsForOrder({ id: b.orderId, buyerId: b.buyerId, sellerId: b.sellerId, status: b.status, subtotalCents: b.subtotalCents ?? 0, commissionCents: b.commissionCents ?? 0, totalCents: b.totalCents ?? 0 });
  }
  return null;
}

export function crmEnvReady(url: string | undefined, key: string | undefined): boolean {
  const u = (url ?? '').trim();
  const k = (key ?? '').trim();
  return u.length > 0 && !u.startsWith('YOUR_') && k.length > 0 && !k.startsWith('YOUR_');
}

export async function pushCrmRows(
  rows: CrmRow[],
  env: { url?: string; serviceKey?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; skipped: boolean } | { ok: false; status: number }> {
  if (!crmEnvReady(env.url, env.serviceKey)) return { ok: true, skipped: true };
  for (const row of rows) {
    const endpoint = `${env.url!.replace(/\/$/, '')}/rest/v1/${row.table}?on_conflict=external_id`;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        apikey: env.serviceKey!,
        Authorization: `Bearer ${env.serviceKey}`,
        'content-type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
        'Accept-Profile': CRM_SCHEMA,
        'Content-Profile': CRM_SCHEMA,
      },
      body: JSON.stringify(row.values),
    });
    if (!response.ok) return { ok: false, status: response.status };
  }
  return { ok: true, skipped: false };
}
