import { ALLERGENS, type Allergen } from '@/lib/model';
import { pickAuthored, type ResolvedText } from './authored';
import type { LocaleId } from './locales';

/** Noms relus en français et en anglais. Les autres langues ne reçoivent pas une traduction automatique. */
export function allergenLabel(key: Allergen, locale: LocaleId): ResolvedText {
  const row = ALLERGENS.find((item) => item.key === key);
  if (!row) return { text: key, needsReview: true, localeUsed: 'en' };
  const resolved = pickAuthored(row, locale);
  if (locale !== 'fr' && locale !== 'en') return { ...resolved, needsReview: true };
  return resolved;
}

export function allergenLabels(keys: readonly Allergen[], locale: LocaleId): { text: string; needsReview: boolean } {
  const labels = keys.map((key) => allergenLabel(key, locale));
  return {
    text: labels.map((item) => item.text).join(', '),
    needsReview: labels.some((item) => item.needsReview),
  };
}
