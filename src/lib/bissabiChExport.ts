/**
 * Flux public lecture seule pour la section « Home Made Food by Bissabi » sur bissabi.ch.
 * Ne touche pas au site Wix. Données de démo jusqu’au lancement.
 * Pas de données personnelles au-delà du nom affiché, de la ville / du canton et de la photo publique.
 */
import { isBadgeValid } from './cookQualification';
import { homemadeDrinkHit } from './homemadeDrinks';
import type { Cook, Dish } from './model';
import { demoMarket } from './seed';

export const BISSABI_CH_FEED_VERSION = 1;

export type PublicBissabiChBadge = 'cuisinier_independant' | 'halal' | 'qualification';

export type PublicBissabiChCook = {
  id: string;
  displayName: string;
  city: string;
  canton?: string;
  photo?: string;
  badges: PublicBissabiChBadge[];
  demo: boolean;
};

export type PublicBissabiChDish = {
  id: string;
  cookId: string;
  title: string;
  photo?: string;
  cuisine?: string;
  halal?: boolean;
  demo: boolean;
};

export type BissabiChFeed = {
  version: number;
  generatedAt: string;
  brand: 'Home Made Food by Bissabi';
  untilLaunch: 'demo';
  notice: { fr: string; en: string; de: string; it: string };
  cooks: PublicBissabiChCook[];
  dishes: PublicBissabiChDish[];
};

export const BISSABI_CH_LIABILITY_NOTICE = {
  fr: 'Chaque cuisinier·ère est un·e cuisinier indépendant, seul·e responsable de ses plats. Home Made Food by Bissabi et Bissabi sont uniquement l’intermédiaire.',
  en: 'Each cook is an independent cook, solely responsible for their dishes. Home Made Food by Bissabi and Bissabi are only the intermediary.',
  de: 'Jede Köchin und jeder Koch ist selbstständig und allein verantwortlich für die Gerichte. Home Made Food by Bissabi und Bissabi sind lediglich Vermittler.',
  it: 'Ogni cuoco o cuoca è indipendente e unicamente responsabile dei propri piatti. Home Made Food by Bissabi e Bissabi sono solo l’intermediario.',
} as const;

function publicPhoto(photoKey?: string, photo?: string): string | undefined {
  if (photoKey) return `dishes/${photoKey}.webp`;
  if (photo && /^https?:\/\//i.test(photo)) return photo;
  return undefined;
}

export function cookEligibleForBissabiCh(cook: Cook, dishes: Dish[], now = new Date()): boolean {
  if (!isBadgeValid(cook.qualification, now)) return false;
  return dishes.some((d) => d.cookId === cook.id && d.active && !homemadeDrinkHit({
    category: d.category,
    title: d.title,
    description: d.description,
  }));
}

export function toPublicCook(cook: Cook): PublicBissabiChCook {
  const badges: PublicBissabiChBadge[] = ['cuisinier_independant'];
  if (isBadgeValid(cook.qualification)) badges.push('qualification');
  if (cook.halalKitchen) badges.push('halal');
  return {
    id: cook.id,
    displayName: cook.name,
    city: cook.commune,
    canton: cook.canton,
    badges,
    demo: !!cook.demo,
  };
}

export function toPublicDish(dish: Dish): PublicBissabiChDish {
  return {
    id: dish.id,
    cookId: dish.cookId,
    title: dish.title,
    photo: publicPhoto(dish.photoKey, dish.photo),
    cuisine: dish.cuisine,
    halal: dish.halal,
    demo: !!dish.demo,
  };
}

/** Construit le flux. Par défaut : catalogue de démo. */
export function buildBissabiChFeed(input?: {
  cooks?: Cook[];
  dishes?: Dish[];
  now?: Date;
  generatedAt?: string;
}): BissabiChFeed {
  const market = demoMarket();
  const cooks = input?.cooks ?? market.cooks;
  const dishes = input?.dishes ?? market.dishes;
  const now = input?.now ?? new Date();
  const eligible = cooks.filter((c) => cookEligibleForBissabiCh(c, dishes, now));
  const ids = new Set(eligible.map((c) => c.id));
  const publicDishes = dishes.filter((d) => (
    ids.has(d.cookId) && d.active && !homemadeDrinkHit({ category: d.category, title: d.title, description: d.description })
  ));
  return {
    version: BISSABI_CH_FEED_VERSION,
    generatedAt: input?.generatedAt ?? now.toISOString(),
    brand: 'Home Made Food by Bissabi',
    untilLaunch: 'demo',
    notice: { ...BISSABI_CH_LIABILITY_NOTICE },
    cooks: eligible.map(toPublicCook),
    dishes: publicDishes.map(toPublicDish),
  };
}

const PERSONAL_KEYS = [
  'npa', 'lat', 'lng', 'bio', 'story', 'email', 'address', 'phone', 'iban',
  'languages', 'checklist', 'qualification', 'liabilityAcceptedAt',
];

export function feedContainsPersonalField(feed: BissabiChFeed): string | null {
  const blobs = [feed.cooks, feed.dishes];
  for (const list of blobs) {
    for (const row of list) {
      for (const key of Object.keys(row as object)) {
        if (PERSONAL_KEYS.includes(key)) return key;
      }
    }
  }
  return null;
}
