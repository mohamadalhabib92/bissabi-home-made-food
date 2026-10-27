import type { Lang } from './model';
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => iso(new Date());
export const fromISO = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const addDays = (s: string, n: number) => { const d = fromISO(s); d.setDate(d.getDate() + n); return iso(d); };
export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const slotStart = (date: string, from: string) => { const d = fromISO(date); const [h, m] = from.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };
export const hoursUntil = (date: string, from: string) => (slotStart(date, from).getTime() - Date.now()) / 3.6e6;
export function parseDay(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? iso(d) : null;
}
export const dayCH = (s: string) => { const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
const WD = { fr: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const MO = { fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
export function dayLabel(s: string, lang: Lang = 'fr') {
  const d = fromISO(s);
  return lang === 'fr' ? `${WD.fr[d.getDay()]} ${d.getDate()} ${MO.fr[d.getMonth()]}` : `${WD.en[d.getDay()]} ${d.getDate()} ${MO.en[d.getMonth()]}`;
}
export const stamp = (isoStr: string, lang: Lang = 'fr') => { const d = new Date(isoStr); return `${dayLabel(iso(d), lang)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
