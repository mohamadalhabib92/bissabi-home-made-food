import { getLocales } from 'expo-localization';
import { suggestLocale, type LocaleId } from './locales';

/** Balise BCP 47 de l'appareil, ou chaîne vide si la plateforme ne répond pas. */
export function deviceLanguageTag(): string {
  try {
    const first = getLocales()[0];
    return first?.languageTag || first?.languageCode || '';
  } catch {
    return '';
  }
}

export function detectedLocale(): LocaleId {
  return suggestLocale(deviceLanguageTag());
}
