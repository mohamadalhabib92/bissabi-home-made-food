/** Filtrage marketplace — pur, testable. */
import type { Cook, Cuisine, Dish, Review, Slot } from './model';
import { openSlotsFor, rating } from './market';

export type DietFilter = 'halal' | 'vegetarian' | 'vegan' | 'glutenFree';
export type SortKey = 'distance' | 'priceAsc' | 'priceDesc' | 'rating' | 'available';

export type MarketFilters = {
  query?: string;
  cuisine?: Cuisine | null;
  diets?: DietFilter[];
  /** Allergènes à éviter (plats contenant `present` exclus). */
  avoidAllergens?: string[];
  maxPrice?: number | null;
  minRating?: number | null;
  canton?: string | null;
  availableToday?: boolean;
  familySize?: boolean;
  favOnly?: boolean;
  favDishIds?: string[];
  favCookIds?: string[];
  sort?: SortKey;
};

export type DishRow = {
  dish: Dish;
  cook: Cook;
  dist: number | null;
  nextSlot?: Slot;
  ratingAvg: number;
  ratingCount: number;
};

export function dishMatchesDiets(dish: Dish, diets: DietFilter[] = []): boolean {
  for (const d of diets) {
    if (d === 'halal' && !dish.halal) return false;
    if (d === 'vegetarian' && !dish.vegetarian) return false;
    if (d === 'vegan' && !dish.vegan) return false;
    if (d === 'glutenFree' && !(dish.glutenFree || !dish.allergens.includes('gluten'))) return false;
  }
  return true;
}

export function dishAvoidsAllergens(dish: Dish, avoid: string[] = []): boolean {
  if (!avoid.length) return true;
  const present = new Set<string>(dish.allergens as string[]);
  if (dish.allergenStatus) {
    for (const [k, v] of Object.entries(dish.allergenStatus)) {
      if (v === 'present') present.add(k);
      if (v === 'absent') present.delete(k);
    }
  }
  return !avoid.some((a) => present.has(a));
}

export function filterDishes(
  dishes: Dish[],
  cooks: Cook[],
  slots: Slot[],
  reviews: Review[],
  distanceTo: (c: Cook) => number | null,
  radiusKm: number,
  f: MarketFilters = {},
): DishRow[] {
  const cookMap = new Map(cooks.map((c) => [c.id, c]));
  const needle = (f.query ?? '').trim().toLowerCase();
  const diets = f.diets ?? [];
  const avoid = f.avoidAllergens ?? [];

  const rows: DishRow[] = [];
  for (const dish of dishes) {
    if (!dish.active) continue;
    const cook = cookMap.get(dish.cookId);
    if (!cook || cook.isMe) continue;
    const dist = distanceTo(cook);
    if (dist != null && dist > radiusKm) continue;
    if (f.cuisine && dish.cuisine !== f.cuisine) continue;
    if (!dishMatchesDiets(dish, diets)) continue;
    if (!dishAvoidsAllergens(dish, avoid)) continue;
    if (f.maxPrice != null && dish.price > f.maxPrice) continue;
    if (f.canton && cook.canton && cook.canton !== f.canton) continue;
    if (f.availableToday && !dish.availableToday) continue;
    if (f.familySize && !dish.familySize) continue;
    if (f.favOnly) {
      const ok = (f.favDishIds ?? []).includes(dish.id) || (f.favCookIds ?? []).includes(dish.cookId);
      if (!ok) continue;
    }
    if (needle) {
      const hay = `${dish.title} ${dish.description} ${cook.name} ${cook.commune} ${cook.originCountry ?? ''} ${(cook.specialties ?? []).join(' ')}`.toLowerCase();
      if (!hay.includes(needle)) continue;
    }
    const r = rating(reviews, cook.id);
    if (f.minRating != null && (r.count === 0 || r.avg < f.minRating)) continue;
    const next = openSlotsFor(dish, slots)[0];
    rows.push({ dish, cook, dist, nextSlot: next, ratingAvg: r.avg, ratingCount: r.count });
  }

  const sort = f.sort ?? 'distance';
  rows.sort((a, b) => {
    if (sort === 'priceAsc') return a.dish.price - b.dish.price;
    if (sort === 'priceDesc') return b.dish.price - a.dish.price;
    if (sort === 'rating') return (b.ratingAvg || 0) - (a.ratingAvg || 0) || b.ratingCount - a.ratingCount;
    if (sort === 'available') return (a.nextSlot ? 0 : 1) - (b.nextSlot ? 0 : 1) || (a.dist ?? 99) - (b.dist ?? 99);
    return (a.dist ?? 99) - (b.dist ?? 99) || (a.nextSlot ? 0 : 1) - (b.nextSlot ? 0 : 1);
  });
  return rows;
}

export function curatedRails(rows: DishRow[], cooks: Cook[], reviews: Review[]) {
  const byCuisine = new Map<string, DishRow>();
  for (const r of rows) {
    if (!byCuisine.has(r.dish.cuisine)) byCuisine.set(r.dish.cuisine, r);
  }
  const topCookIds = [...cooks]
    .filter((c) => !c.isMe)
    .map((c) => ({ c, r: rating(reviews, c.id) }))
    .filter((x) => x.r.count > 0)
    .sort((a, b) => b.r.avg - a.r.avg || b.r.count - a.r.count)
    .slice(0, 8)
    .map((x) => x.c.id);
  return {
    nearYou: rows.filter((r) => r.dist != null).slice(0, 12),
    worldCuisines: [...byCuisine.values()].slice(0, 14),
    topCookIds,
    newThisWeek: rows.filter((r) => r.ratingCount === 0).slice(0, 10),
    familySize: rows.filter((r) => r.dish.familySize).slice(0, 10),
    availableToday: rows.filter((r) => r.dish.availableToday).slice(0, 10),
  };
}

/** Panier : une commande = un cuisinier. */
export type CartLine = { dishId: string; qty: number };
export type CartState = { cookId: string | null; lines: CartLine[] };

export function canAddToCart(cart: CartState, dishCookId: string): 'ok' | 'other_cook' {
  if (cart.cookId && cart.cookId !== dishCookId && cart.lines.length) return 'other_cook';
  return 'ok';
}

export function applyAddToCart(cart: CartState, dishId: string, cookId: string, qty = 1): CartState | 'other_cook' {
  if (canAddToCart(cart, cookId) === 'other_cook') return 'other_cook';
  const lines = [...cart.lines];
  const i = lines.findIndex((l) => l.dishId === dishId);
  if (i >= 0) lines[i] = { ...lines[i], qty: lines[i].qty + qty };
  else lines.push({ dishId, qty });
  return { cookId, lines };
}

export function cartSubtotal(lines: { qty: number; unitPrice: number }[]): number {
  return Math.round(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0) * 100) / 100;
}
