/** Interdiction des boissons maison — motif hygiène (produit 2026-11-13). */
import type { DishCategory } from './model';

export const HOMEMADE_DRINK_CATEGORY: DishCategory = 'boisson_maison';

export const HOMEMADE_DRINK_MESSAGE = {
  fr: 'Les boissons faites maison ne sont pas acceptées sur la plateforme.',
  en: 'Homemade drinks are not accepted on the platform.',
} as const;

export type HomemadeDrinkDraft = {
  category?: string | null;
  title?: string | null;
  description?: string | null;
  ingredients?: { name: string }[] | null;
};

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Catégorie « boisson maison » (et alias) — jamais autorisée. */
export function isBannedDrinkCategory(category?: string | null): boolean {
  const c = norm(category ?? '').replace(/ /g, '_');
  return (
    c === 'boisson_maison'
    || c === 'boisson'
    || c === 'drink'
    || c === 'drinks'
    || c === 'beverage'
    || c === 'beverages'
    || c === 'homemade_drink'
    || c === 'homemade_drinks'
  );
}

/**
 * Motifs clairs de boisson vendue comme fiche.
 * On évite les faux positifs culinaires : « jus de citron » en sauce, « au jus », « bouillon », « vin cuit ».
 */
const TITLE_OR_DESC_PATTERNS: RegExp[] = [
  /\bbissap\b/,
  /\bwonjo\b/,
  /\bsobolo\b/,
  /\bkarkadeh?\b/,
  /\bbouye\b/,
  /\bpain de singe\b/,
  /\blait caille\b/,
  /\blait fermente\b/,
  /\braib\b/,
  /\bleben\b/,
  /\bsmoothie\b/,
  /\bmilkshakes?\b/,
  /\bmilk shake\b/,
  /\bkombucha\b/,
  /\blimonades?\b/,
  /\blemonades?\b/,
  /\bcitronnade\b/,
  /\bhorchata\b/,
  /\bagua fresca\b/,
  /\blassis?\b/,
  /\bkefir\b/,
  /\bthe glace\b/,
  /\biced teas?\b/,
  /\bthe maison\b/,
  /\btisanes?\b/,
  /\binfusion maison\b/,
  /\bboissons?\b/,
  /\bbeverages?\b/,
  /\bdrinks?\b/,
  /\bginger beers?\b/,
  /\bjus de gingembre\b/,
  /\bgingembre presse\b/,
  /\bgingembre maison\b/,
  /\bjus maison\b/,
  /\bjus frais\b/,
  /\bfresh juices?\b/,
  /\bhomemade (juice|drink|beverage)s?\b/,
  /\bhouse juices?\b/,
  // « Jus de bissap / jus d'orange » comme produit, pas « au jus » ni « jus de citron / de veau »
  /(?:^|\s)jus d(?:e |')(?!citron\b|limon\b|viande\b|volaille\b|veau\b|boeuf\b|citron confit\b)/,
  /(?:^|\s)juices?\b/,
];

const TITLE_ONLY_PATTERNS: RegExp[] = [
  /^(le |la |l'|les |un |une |du |de la |des )?jus\b/,
  /\bthe (vert|noir|blanc|menthe|a la menthe|au gingembre)\b/,
  /\bcafe (maison|glace|liegeois)\b/,
  /\biced coffee\b/,
  /\beaux? aromatise/,
];

export function homemadeDrinkHit(draft: HomemadeDrinkDraft): boolean {
  if (isBannedDrinkCategory(draft.category)) return true;
  const title = norm(draft.title ?? '');
  const description = norm(draft.description ?? '');
  const hay = `${title} ${description}`.trim();
  if (!hay) return false;
  if (TITLE_OR_DESC_PATTERNS.some((re) => re.test(hay))) return true;
  if (title && TITLE_ONLY_PATTERNS.some((re) => re.test(title))) return true;
  return false;
}

export function homemadeDrinkMessage(lang: 'fr' | 'en' = 'fr'): string {
  return HOMEMADE_DRINK_MESSAGE[lang];
}
