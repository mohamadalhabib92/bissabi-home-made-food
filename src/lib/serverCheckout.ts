import { getSupabase } from './supabase';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const secrets = new Map<string, string>();

export function serverCartReady(kitchenId: string, dishIds: string[]): boolean {
  return UUID.test(kitchenId) && dishIds.length > 0 && dishIds.every((id) => UUID.test(id));
}

/** Secret tenu en mémoire pour la feuille de paiement. Jamais écrit dans le stockage. */
export function holdClientSecret(orderId: string, secret: string): void {
  secrets.set(orderId, secret);
}

export function heldClientSecret(orderId: string): string | null {
  return secrets.get(orderId) ?? null;
}

export async function createServerOrder(input: {
  kitchenId: string;
  items: { dishId: string; qty: number }[];
  slotDate: string;
  delivery?: 'pickup' | 'delivery';
  address?: string;
}): Promise<
  | { ok: true; orderId: string; clientSecret: string; paymentIntentId: string | null }
  | { ok: false; reason: 'device_only' | 'launch_closed' | 'auth' | 'refused' }
> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: 'device_only' };
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return { ok: false, reason: 'auth' };
  const { data, error } = await sb.functions.invoke('create-order', {
    body: {
      kitchenId: input.kitchenId,
      items: input.items,
      delivery: input.delivery ?? 'pickup',
      slotDate: input.slotDate,
      ...(input.address ? { address: input.address } : {}),
    },
  });
  if (error) {
    const status = error instanceof Error && 'context' in error && (error as { context?: unknown }).context instanceof Response
      ? ((error as { context: Response }).context.status)
      : 0;
    if (status === 401) return { ok: false, reason: 'auth' };
    if (status === 403) return { ok: false, reason: 'launch_closed' };
    return { ok: false, reason: 'refused' };
  }
  const body = data as { orderId?: string; clientSecret?: string; paymentIntentId?: string | null };
  if (!body?.orderId || !body.clientSecret) return { ok: false, reason: 'refused' };
  return { ok: true, orderId: body.orderId, clientSecret: body.clientSecret, paymentIntentId: body.paymentIntentId ?? null };
}

/** Relit le statut posé par le webhook. Quelques essais, puis « en attente ». */
export async function refreshPaidStatus(orderId: string): Promise<'paid' | 'pending' | 'failed'> {
  const sb = getSupabase();
  if (!sb) return 'pending';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data } = await sb.from('orders').select('status').eq('id', orderId).maybeSingle();
    if (data?.status === 'paid') return 'paid';
    if (data?.status === 'refunded' || data?.status === 'payment_failed') return 'failed';
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return 'pending';
}
