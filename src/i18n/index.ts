import { useL } from '@/lib/data';
import type { LocaleId } from './locales';
import { en } from './en';
import { fr, type MsgKey } from './fr';

export type { MsgKey };
export { en, fr };

/** Français rédigé, anglais rédigé. Toute autre langue retombe sur l’anglais. */
export function tr(lang: LocaleId, key: MsgKey): string {
  return lang === 'fr' ? fr[key] : en[key];
}

export function useI18n() {
  const { L, lang } = useL();
  const t = (key: MsgKey) => tr(lang, key);
  return { t, lang, L };
}
