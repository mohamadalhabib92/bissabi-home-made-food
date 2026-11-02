import { useL } from '@/lib/data';
import { en } from './en';
import { fr, type MsgKey } from './fr';

export type { MsgKey };
export { en, fr };

export function tr(lang: 'fr' | 'en', key: MsgKey): string {
  return lang === 'en' ? en[key] : fr[key];
}

export function useI18n() {
  const { L, lang } = useL();
  const t = (key: MsgKey) => tr(lang, key);
  return { t, lang, L };
}
