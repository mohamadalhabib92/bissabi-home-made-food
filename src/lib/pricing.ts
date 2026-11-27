/**
 * Tarification — source unique pour le panier, le reçu et les gains cuisinier.
 * Commission 10 % du sous-total des plats, retenue sur le versement au cuisinier (Stripe Connect, pas encore encaissé).
 * Le client paie les plats et, hors lancement, la livraison. Les commandes déjà enregistrées gardent leurs montants.
 */
export const COMMISSION_RATE = 0.1;
/** Retenue sur le cuisinier. Les totaux déjà stockés ne sont pas réécrits. */
export const COMMISSION_PAID_BY: 'buyer' | 'cook' = 'cook';
export const MIN_LEAD_HOURS = 24; // commandes à l’avance uniquement

export const r05 = (n: number) => Math.round(n * 20) / 20; // arrondi CHF 0.05
export const chf = (n: number) => `CHF ${n.toFixed(2)}`;

export function quote(lines: { qty: number; unitPrice: number }[], mode: 'pickup' | 'delivery', deliveryFeeChf: number | null = null) {
  const subtotal = r05(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const commission = r05(subtotal * COMMISSION_RATE);
  const deliveryFee = mode === 'delivery' && deliveryFeeChf !== null ? r05(deliveryFeeChf) : 0;
  const total = r05(subtotal + (COMMISSION_PAID_BY === 'buyer' ? commission : 0) + deliveryFee);
  const cookNet = r05(COMMISSION_PAID_BY === 'buyer' ? subtotal : subtotal - commission);
  return { subtotal, commission, deliveryFee, total, cookNet };
}

/** Net d'une commande déjà stockée. Si le total inclut la commission, elle a été payée par le client. */
export function cookNetFromStored(o: { subtotal: number; commission: number; deliveryFee: number; total: number }) {
  const withCommission = o.subtotal + o.deliveryFee + o.commission;
  const paidByBuyer = Math.abs(o.total - withCommission) < 0.02 || Math.abs(o.total - r05(withCommission)) < 0.02;
  return r05(paidByBuyer ? o.subtotal + o.deliveryFee : o.subtotal + o.deliveryFee - o.commission);
}
