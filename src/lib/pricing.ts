/**
 * Tarification du panier local.
 * Commission 10 % du sous-total des plats, retenue sur le cuisinier, pas ajoutée au client.
 * Stockée au centime. Le pas de 5 centimes ne sert qu'à l'arrondi historique du sous-total déjà affiché.
 * Les frais de livraison ne sont pas dans l'assiette. Le client les paie en plus. Ils ne vont pas au cuisinier.
 */
import { shareBps } from './global/money';

export const COMMISSION_RATE = 0.1;
export const COMMISSION_RATE_BPS = 1000;
/** La commission est déduite du versement au cuisinier. */
export const COMMISSION_PAID_BY: 'buyer' | 'cook' = 'cook';
export const DELIVERY_FEE_CHF = 6.0;
export const MIN_LEAD_HOURS = 24;

export const r05 = (n: number) => Math.round(n * 20) / 20;
export const chf = (n: number) => `CHF ${n.toFixed(2)}`;

export function quote(lines: { qty: number; unitPrice: number }[], mode: 'pickup' | 'delivery') {
  const subtotal = r05(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
  const subtotalMinor = Math.round(subtotal * 100);
  const commissionMinor = shareBps(subtotalMinor, COMMISSION_RATE_BPS);
  const deliveryMinor = mode === 'delivery' ? Math.round(DELIVERY_FEE_CHF * 100) : 0;
  const commission = commissionMinor / 100;
  const deliveryFee = deliveryMinor / 100;
  const total = (subtotalMinor + deliveryMinor) / 100;
  const cookNet = (subtotalMinor - commissionMinor) / 100;
  return { subtotal, commission, deliveryFee, total, cookNet, commissionRateBps: COMMISSION_RATE_BPS };
}
