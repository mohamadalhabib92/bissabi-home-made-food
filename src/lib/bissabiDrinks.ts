/**
 * Boissons Bissabi (marque sœur) — upsell checkout + revente cook.
 * Aucun tarif réel n’est inventé : les prix produits sont des placeholders YOUR_*.
 * Livraison Bissabi : canton de Vaud uniquement, offerte dès CHF 36 (règle produit connue).
 */
import { deliveryZone } from './geo';

export const BISSABI_SITE = 'https://bissabi.ch';
export const BISSABI_DELIVERY_CANTON = 'VD';
/** Seuil connu de livraison offerte Bissabi (canton de Vaud). Ce n’est pas un prix de bouteille. */
export const BISSABI_FREE_DELIVERY_FROM_CHF = 36;

/** Produits de démo / exemple — prix à remplacer par les tarifs réels de bissabi.ch (YOUR_*). */
export type BissabiDemoProduct = {
  id: string;
  nameFr: string;
  nameEn: string;
  volumeLabel: string;
  /** Placeholder, jamais un montant inventé. */
  priceLabel: 'YOUR_PRICE_CHF';
  demo: true;
  example: true;
};

export const BISSABI_DEMO_PRODUCTS: BissabiDemoProduct[] = [
  {
    id: 'bissabi-demo-bottle-a',
    nameFr: 'Bissabi — bouteille (exemple)',
    nameEn: 'Bissabi — bottle (example)',
    volumeLabel: '33 cl (exemple)',
    priceLabel: 'YOUR_PRICE_CHF',
    demo: true,
    example: true,
  },
  {
    id: 'bissabi-demo-bottle-b',
    nameFr: 'Bissabi — bouteille (exemple)',
    nameEn: 'Bissabi — bottle (example)',
    volumeLabel: '75 cl (exemple)',
    priceLabel: 'YOUR_PRICE_CHF',
    demo: true,
    example: true,
  },
  {
    id: 'bissabi-demo-pack',
    nameFr: 'Bissabi — pack (exemple)',
    nameEn: 'Bissabi — pack (example)',
    volumeLabel: 'pack (exemple)',
    priceLabel: 'YOUR_PRICE_CHF',
    demo: true,
    example: true,
  },
];

export type BissabiLine = { productId: string; qty: number };
export type BissabiOfferState = 'available' | 'coming_soon';

function cantonIsVaud(canton?: string | null): boolean | null {
  if (!canton || !canton.trim()) return null;
  const c = canton.trim().toUpperCase();
  if (c === 'VD' || c === 'VAUD') return true;
  return false;
}

/**
 * Offre Bissabi seulement si l’adresse ou le canton de livraison est Vaud.
 * Sinon : « bientôt disponible » (pas d’ajout).
 * L’adresse, si elle est renseignée, prime sur le canton du profil.
 */
export function bissabiOfferState(input: {
  address?: string | null;
  canton?: string | null;
  locationCanton?: string | null;
}): BissabiOfferState {
  const address = input.address?.trim() ?? '';
  if (address) {
    const zone = deliveryZone(address);
    if (zone === 'vaud') return 'available';
    if (zone === 'outside') return 'coming_soon';
  }
  const known = cantonIsVaud(input.canton) ?? cantonIsVaud(input.locationCanton);
  return known === true ? 'available' : 'coming_soon';
}

export function setBissabiQty(lines: BissabiLine[], productId: string, qty: number): BissabiLine[] {
  const next = Math.max(0, Math.min(20, Math.floor(qty)));
  const rest = lines.filter((l) => l.productId !== productId);
  if (next <= 0) return rest;
  return [...rest, { productId, qty: next }];
}

export function bissabiLineDetails(lines: BissabiLine[] | undefined) {
  return (lines ?? []).map((l) => {
    const product = BISSABI_DEMO_PRODUCTS.find((p) => p.id === l.productId);
    return product ? { ...l, product } : null;
  }).filter((x): x is { productId: string; qty: number; product: BissabiDemoProduct } => !!x);
}
