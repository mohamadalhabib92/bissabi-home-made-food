import { MIN_LEAD_HOURS } from './pricing';

/** Cuisine maison ou traiteur. Absent sur une fiche déjà enregistrée : on affiche « cuisine maison » sans réécrire. */
export type SellerKind = 'home' | 'caterer';

export function sellerKindOf(cook: { sellerKind?: string | null } | null | undefined): SellerKind {
  return cook?.sellerKind === 'caterer' ? 'caterer' : 'home';
}

/**
 * Plafonds d’interface pour ne pas bloquer un traiteur.
 * Les chiffres exacts (portions, délai max) restent à confirmer par Mohamed.
 * Le plancher de 24 h est le même pour tout le monde.
 */
export function slotCapacityMax(kind: SellerKind): number {
  return kind === 'caterer' ? 500 : 100;
}

export function leadHoursMax(kind: SellerKind): number {
  return kind === 'caterer' ? 24 * 14 : 168;
}

/** Minimum de portions. Seulement si le vendeur l’a enregistré. Sinon 1, comme avant. */
export function minPortionsOf(cook: { sellerKind?: string | null; minPortions?: number | null } | null | undefined): number {
  if (sellerKindOf(cook) !== 'caterer') return 1;
  const n = cook?.minPortions;
  if (n == null || !Number.isFinite(n) || n < 2) return 1;
  return Math.floor(n);
}

export function belowMinimum(cook: { sellerKind?: string | null; minPortions?: number | null } | null | undefined, portions: number): boolean {
  return portions < minPortionsOf(cook);
}

export function leadHoursAllowed(kind: SellerKind, hours: number): boolean {
  return hours >= MIN_LEAD_HOURS && hours <= leadHoursMax(kind);
}
