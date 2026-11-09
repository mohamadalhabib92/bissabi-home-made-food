/**
 * Langues de l'app. Le pilote Lausanne est rédigé en français et en anglais.
 * Les autres langues sont au catalogue : l'interface retombe sur l'anglais, puis le français.
 * Aucune traduction d'allergène ou de texte juridique n'est inventée ici.
 */
export const COMPLETE_LOCALES = ['fr', 'en'] as const;

export const SCAFFOLD_LOCALES = ['de', 'it', 'es', 'pt', 'ar', 'zh', 'wo', 'ff', 'tr', 'ru', 'hi'] as const;

export const LOCALE_IDS = [...COMPLETE_LOCALES, ...SCAFFOLD_LOCALES] as const;

export type CompleteLocale = (typeof COMPLETE_LOCALES)[number];
export type LocaleId = (typeof LOCALE_IDS)[number];

export type LocaleMeta = {
  id: LocaleId;
  /** Nom dans la langue elle-même. */
  endonym: string;
  direction: 'ltr' | 'rtl';
  /** Balise passée à Intl. */
  intl: string;
  complete: boolean;
};

export const LOCALES: readonly LocaleMeta[] = [
  { id: 'fr', endonym: 'Français', direction: 'ltr', intl: 'fr-CH', complete: true },
  { id: 'en', endonym: 'English', direction: 'ltr', intl: 'en-GB', complete: true },
  { id: 'de', endonym: 'Deutsch', direction: 'ltr', intl: 'de-DE', complete: false },
  { id: 'it', endonym: 'Italiano', direction: 'ltr', intl: 'it-IT', complete: false },
  { id: 'es', endonym: 'Español', direction: 'ltr', intl: 'es-ES', complete: false },
  { id: 'pt', endonym: 'Português', direction: 'ltr', intl: 'pt-PT', complete: false },
  { id: 'ar', endonym: 'العربية', direction: 'rtl', intl: 'ar', complete: false },
  { id: 'zh', endonym: '中文', direction: 'ltr', intl: 'zh-Hans', complete: false },
  { id: 'wo', endonym: 'Wolof', direction: 'ltr', intl: 'wo', complete: false },
  { id: 'ff', endonym: 'Pulaar', direction: 'ltr', intl: 'ff', complete: false },
  { id: 'tr', endonym: 'Türkçe', direction: 'ltr', intl: 'tr-TR', complete: false },
  { id: 'ru', endonym: 'Русский', direction: 'ltr', intl: 'ru-RU', complete: false },
  { id: 'hi', endonym: 'हिन्दी', direction: 'ltr', intl: 'hi-IN', complete: false },
];

const BY_ID = new Map(LOCALES.map((locale) => [locale.id, locale]));

export function localeMeta(id: LocaleId): LocaleMeta {
  const meta = BY_ID.get(id);
  if (!meta) throw new Error(`unknown locale ${id}`);
  return meta;
}

export function isLocaleId(value: string | null | undefined): value is LocaleId {
  return !!value && BY_ID.has(value as LocaleId);
}

export function isCompleteLocale(id: LocaleId): boolean {
  return localeMeta(id).complete;
}

export function directionFor(id: LocaleId): 'ltr' | 'rtl' {
  return localeMeta(id).direction;
}

export function intlTag(id: LocaleId): string {
  return localeMeta(id).intl;
}

/**
 * Reconnaît une balise d'appareil (fr-CH, zh-Hant, ff-Latn-SN).
 * Une langue inconnue ne devient pas une traduction : null, l'appelant choisit le repli.
 */
export function matchLocale(tag: string | null | undefined): LocaleId | null {
  if (!tag) return null;
  const normalized = tag.trim().toLowerCase().replace(/_/g, '-');
  if (!normalized) return null;
  if (isLocaleId(normalized)) return normalized;
  const primary = normalized.split('-')[0];
  if (primary === 'zh') return 'zh';
  if (isLocaleId(primary)) return primary;
  return null;
}

/**
 * Langue proposée.
 * Rien n'est lu : on reste sur le français du pilote.
 * Une langue d'appareil inconnue (ja, …) retombe sur l'anglais, jamais sur une traduction inventée.
 */
export function suggestLocale(tag: string | null | undefined): LocaleId {
  if (!tag?.trim()) return 'fr';
  return matchLocale(tag) ?? 'en';
}
