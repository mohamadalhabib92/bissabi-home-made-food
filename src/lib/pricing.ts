/**
 * Tarification — source unique pour le panier, le reçu et les gains cuisinier.
 * Commission plateforme 15 % (sur le sous-total plats) + frais de livraison.
 * ⚠️ Montant des frais de livraison et payeur de la commission : à confirmer par Mohamed (voir README).
 */
export const COMMISSION_RATE = 0.15;
/** La commission est affichée et payée côté acheteur ; le cuisinier reçoit le sous-total plats. */
export const COMMISSION_PAID_BY: 'buyer' | 'cook' = 'buyer';
export const DELIVERY_FEE_CHF = 6.0; // forfait livraison (placeholder à confirmer)
export const MIN_LEAD_HOURS = 24; // commandes à l’avance uniquement

export const r05 = (n: number) => Math.round(n * 20) / 20; // arrondi CHF 0.05
export const chf = (n: number) => `CHF ${n.toFixed(2)}`;

export function quote(lines: { qty: number; unitPrice: number }[], mode: 'pickup' | 'delivery') {
  const subtotal = r05(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const commission = r05(subtotal * COMMISSION_RATE);
  const deliveryFee = mode === 'delivery' ? DELIVERY_FEE_CHF : 0;
  const total = r05(subtotal + (COMMISSION_PAID_BY === 'buyer' ? commission : 0) + deliveryFee);
  const cookNet = r05(COMMISSION_PAID_BY === 'buyer' ? subtotal : subtotal - commission);
  return { subtotal, commission, deliveryFee, total, cookNet };
}
