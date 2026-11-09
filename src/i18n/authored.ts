import { isCompleteLocale, type LocaleId } from './locales';

export type Authored = { fr: string; en: string };

export type ResolvedText = {
  text: string;
  localeUsed: 'fr' | 'en';
  /** Vrai tant qu'un humain n'a pas relu cette langue. Jamais une traduction automatique. */
  needsReview: boolean;
};

/**
 * Texte déjà écrit par un humain en français et en anglais.
 * Toute autre langue reçoit l'anglais et le drapeau de relecture.
 * On n'ajoute pas de troisième chaîne.
 */
export function pickAuthored(row: Authored, locale: LocaleId): ResolvedText {
  if (locale === 'fr') return { text: row.fr, needsReview: false, localeUsed: 'fr' };
  if (locale === 'en') return { text: row.en, needsReview: false, localeUsed: 'en' };
  return { text: row.en, needsReview: true, localeUsed: 'en' };
}

export function authoredText(row: Authored, locale: LocaleId): string {
  return pickAuthored(row, locale).text;
}

export function reviewRequired(locale: LocaleId): boolean {
  return !isCompleteLocale(locale);
}
