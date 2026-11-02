import { ALLERGENS, type Allergen, type AllergenLevel, type AnimalOrigin, type Dish } from './model';

export type PublishIssue =
  | 'allergens'
  | 'ingredients'
  | 'photo'
  | 'conservation'
  | 'reheating'
  | 'animal'
  | 'provenance'
  | 'bakery'
  | 'country';

export type AllergenDraft = Partial<Record<Allergen, AllergenLevel>>;

/** Statut explicite des 14 allergènes, ou reprise additive d'une fiche déjà confirmée. */
export function statusFromDish(dish: Pick<Dish, 'allergens' | 'allergensConfirmed' | 'allergenStatus'> | undefined): AllergenDraft {
  if (!dish) return {};
  if (dish.allergenStatus && ALLERGENS.every((a) => dish.allergenStatus?.[a.key])) return { ...dish.allergenStatus };
  if (dish.allergensConfirmed) {
    const next: AllergenDraft = {};
    for (const a of ALLERGENS) next[a.key] = dish.allergens.includes(a.key) ? 'present' : 'absent';
    return next;
  }
  return dish.allergenStatus ? { ...dish.allergenStatus } : {};
}

export function allergensFromStatus(status: AllergenDraft): Allergen[] {
  return ALLERGENS.filter((a) => status[a.key] === 'present').map((a) => a.key);
}

export function splitAllergens(dish: Pick<Dish, 'allergens' | 'allergenStatus'>): { present: Allergen[]; traces: Allergen[]; complete: boolean } {
  const status = dish.allergenStatus;
  if (status && ALLERGENS.every((a) => status[a.key])) {
    return {
      present: ALLERGENS.filter((a) => status[a.key] === 'present').map((a) => a.key),
      traces: ALLERGENS.filter((a) => status[a.key] === 'traces').map((a) => a.key),
      complete: true,
    };
  }
  return { present: dish.allergens, traces: [], complete: false };
}

type Draft = {
  allergenStatus?: AllergenDraft;
  ingredients?: { name: string; qty: number }[];
  photo?: string;
  conservation?: string;
  reheating?: string;
  animalOrigin?: AnimalOrigin | null;
  provenance?: string;
  isBakery?: boolean | null;
  productionCountry?: string;
};

const filled = (v: string | undefined | null) => !!v && v.trim().length > 0;

/** Points qui bloquent la mise en ligne. Les plats déjà enregistrés restent visibles. */
export function publishIssues(d: Draft): PublishIssue[] {
  const issues: PublishIssue[] = [];
  const status = d.allergenStatus ?? {};
  if (!ALLERGENS.every((a) => status[a.key] === 'present' || status[a.key] === 'traces' || status[a.key] === 'absent')) issues.push('allergens');
  if (!d.ingredients?.some((i) => i.name.trim() && i.qty > 0)) issues.push('ingredients');
  if (!filled(d.photo)) issues.push('photo');
  if (!filled(d.conservation)) issues.push('conservation');
  if (!filled(d.reheating)) issues.push('reheating');
  if (d.animalOrigin == null) issues.push('animal');
  else if (d.animalOrigin !== 'none' && !filled(d.provenance)) issues.push('provenance');
  if (d.isBakery == null) issues.push('bakery');
  else if (d.isBakery && !filled(d.productionCountry)) issues.push('country');
  return issues;
}

export function activeDishesMissingPublish(dishes: Dish[]): Dish[] {
  return dishes.filter((d) => d.active && !d.demo && publishIssues(d).length > 0);
}
