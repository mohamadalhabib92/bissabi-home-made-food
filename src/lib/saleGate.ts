import { checklistDone } from './cookutil';
import { ALLERGENS, type AllergenLevel, type Dish, type OfcoStatus } from './model';

const LEVELS = new Set<AllergenLevel>(['present', 'traces', 'absent']);

/** Les 14 allergènes UE/CH ont chacun Présent, Traces ou Absent. Rien n'est inventé. */
export function allergenDeclarationComplete(dish: Pick<Dish, 'allergenStatus'>): boolean {
  const status = dish.allergenStatus;
  if (!status) return false;
  return ALLERGENS.every((a) => LEVELS.has(status[a.key] as AllergenLevel));
}

export function hygieneReady(cook: { checklist?: Record<string, boolean> } | null | undefined): boolean {
  if (!cook?.checklist) return false;
  return checklistDone({ checklist: cook.checklist });
}

export type SaleBlock = 'inactive' | 'allergens' | 'hygiene';

/** Un plat incomplet reste en mémoire. Il n'est ni listé ni vendu. */
export function saleBlock(
  dish: Pick<Dish, 'active' | 'allergenStatus'>,
  cook: { checklist?: Record<string, boolean> } | null | undefined,
): SaleBlock | null {
  if (!dish.active) return 'inactive';
  if (!allergenDeclarationComplete(dish)) return 'allergens';
  if (!hygieneReady(cook)) return 'hygiene';
  return null;
}

/** Badge « Annonce OFCO (VD) » seulement après validation admin. Jamais pour pending ou absent. */
export function ofcoBadgeVisible(status: OfcoStatus | null | undefined): boolean {
  return status === 'ofco_verified';
}
