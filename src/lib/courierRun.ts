import type { Courier, DeliveryRun, DeliveryState, Order } from './model';

/** Le tarif par course n’est pas décidé. Ne pas inventer un montant. */
export const COURIER_FEE_LABEL = 'à définir' as const;

export function courierEarnings(deliveredCount: number) {
  return { deliveries: deliveredCount, amountChf: null as null, label: COURIER_FEE_LABEL };
}

export type RunOrder = Pick<Order, 'id' | 'mode' | 'status' | 'delivery'>;

function codes(id: string): { pickupCode: string; proofCode: string } {
  const n = (salt: string) => {
    let h = 0;
    for (const c of salt + id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
    return String(h % 10000).padStart(4, '0');
  };
  return { pickupCode: n('pickup'), proofCode: n('proof') };
}

/** Une commande de livraison prête est proposée. Les autres ne changent pas. */
export function offerIfReady<T extends RunOrder>(order: T): T {
  if (order.mode !== 'delivery' || order.status !== 'ready' || order.delivery) return order;
  return { ...order, delivery: { state: 'offered', declinedBy: [], ...codes(order.id) } };
}

export function canWork(courier: Pick<Courier, 'validated' | 'available'>): boolean {
  return courier.validated === true && courier.available === true;
}

export type RunResult<T> = { ok: true; order: T } | { ok: false; reason: 'not_ready' | 'not_validated' | 'unavailable' | 'taken' | 'bad_code' | 'wrong_courier' };

function need<T extends RunOrder>(order: T, courier: Pick<Courier, 'id' | 'validated' | 'available'>, state: DeliveryState): RunResult<T> | { delivery: DeliveryRun } {
  if (!courier.validated) return { ok: false, reason: 'not_validated' };
  if (!courier.available) return { ok: false, reason: 'unavailable' };
  const delivery = order.delivery;
  if (!delivery || delivery.state !== state) return { ok: false, reason: 'not_ready' };
  return { delivery };
}

export function acceptDelivery<T extends RunOrder>(order: T, courier: Pick<Courier, 'id' | 'validated' | 'available'>): RunResult<T> {
  const gate = need(order, courier, 'offered');
  if ('ok' in gate) return gate;
  if (gate.delivery.courierId && gate.delivery.courierId !== courier.id) return { ok: false, reason: 'taken' };
  if (gate.delivery.declinedBy.includes(courier.id)) return { ok: false, reason: 'not_ready' };
  return { ok: true, order: { ...order, delivery: { ...gate.delivery, state: 'accepted', courierId: courier.id } } };
}

export function declineDelivery<T extends RunOrder>(order: T, courierId: string): T {
  const delivery = order.delivery;
  if (!delivery || delivery.state !== 'offered') return order;
  if (delivery.declinedBy.includes(courierId)) return order;
  return { ...order, delivery: { ...delivery, declinedBy: [...delivery.declinedBy, courierId] } };
}

export function confirmPickup<T extends RunOrder>(order: T, courierId: string, code: string): RunResult<T> {
  const delivery = order.delivery;
  if (!delivery || delivery.state !== 'accepted' || delivery.courierId !== courierId) return { ok: false, reason: 'wrong_courier' };
  if (code.trim() !== delivery.pickupCode) return { ok: false, reason: 'bad_code' };
  return { ok: true, order: { ...order, delivery: { ...delivery, state: 'picked_up' } } };
}

export function markEnRoute<T extends RunOrder>(order: T, courierId: string): RunResult<T> {
  const delivery = order.delivery;
  if (!delivery || delivery.state !== 'picked_up' || delivery.courierId !== courierId) return { ok: false, reason: 'wrong_courier' };
  return { ok: true, order: { ...order, delivery: { ...delivery, state: 'en_route' } } };
}

export function confirmDropoff<T extends RunOrder>(order: T, courierId: string, code: string, at: string): RunResult<T> {
  const delivery = order.delivery;
  if (!delivery || delivery.state !== 'en_route' || delivery.courierId !== courierId) return { ok: false, reason: 'wrong_courier' };
  if (code.trim() !== delivery.proofCode) return { ok: false, reason: 'bad_code' };
  return { ok: true, order: { ...order, status: 'completed', delivery: { ...delivery, state: 'delivered', proofAt: at } } };
}

export function visibleDeliveries<T extends RunOrder>(orders: T[], courier: Pick<Courier, 'id' | 'validated' | 'available'>): T[] {
  if (!canWork(courier)) return [];
  return orders.filter((order) => {
    const delivery = order.delivery;
    if (order.mode !== 'delivery' || !delivery) return false;
    if (delivery.courierId === courier.id && delivery.state !== 'offered') return true;
    return delivery.state === 'offered' && !delivery.declinedBy.includes(courier.id) && !delivery.courierId;
  });
}

/** L’inscription ne peut pas s’auto-valider. */
export function courierFromDraft(draft: Omit<Courier, 'validated' | 'id' | 'createdAt'>, id: string, createdAt: string, previous?: Courier): Courier {
  return {
    ...draft,
    id,
    createdAt,
    validated: previous?.validated === true,
    available: draft.available,
  };
}
