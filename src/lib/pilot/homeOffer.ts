import { intlTag, type LocaleId } from '@/i18n/locales';
import { chPilotMarket, type Market } from '@/lib/global/markets';
import { formatMoney, minorFromDecimal } from '@/lib/global/money';
import { formatSlotRange, utcFromLocal } from '@/lib/global/time';

type Dish = { id: string; title: string; price: number; active: boolean; cookId: string; leadHours: number };
type Slot = { cookId: string; date: string; from: string; to: string; modes: readonly string[]; dishIds: readonly string[] };
type Cook = { id: string; name: string };

export type HomeLine = { dishId: string; title: string; cookName: string; when: string; price: string };

/**
 * Réponse de l'accueil à partir du catalogue déjà enregistré.
 * Les créneaux legacy sont une heure murale dans le fuseau du marché, sans réécrire le stockage.
 * Seuls les créneaux de retrait sont proposés ici : la livraison du pilote vit dans l'écran de test.
 */
export function describeHomeOffer(input: {
  dishes: readonly Dish[];
  slots: readonly Slot[];
  cooks: readonly Cook[];
  locale: LocaleId;
  now: Date;
  market?: Market;
}): HomeLine[] {
  const market = input.market ?? chPilotMarket();
  const intl = intlTag(input.locale);
  const lines: (HomeLine & { start: number })[] = [];
  for (const dish of input.dishes) {
    if (!dish.active) continue;
    const cook = input.cooks.find((item) => item.id === dish.cookId);
    if (!cook) continue;
    const leadMs = Math.max(market.minLeadHours, dish.leadHours) * 3_600_000;
    const slots = input.slots
      .filter((slot) => slot.cookId === dish.cookId && slot.modes.includes('pickup') && (slot.dishIds.length === 0 || slot.dishIds.includes(dish.id)))
      .map((slot) => {
        const startsAt = utcFromLocal(slot.date, slot.from, market.timezone);
        const endsAt = utcFromLocal(slot.date, slot.to, market.timezone);
        return { startsAt, endsAt, start: Date.parse(startsAt) };
      })
      .filter((slot) => slot.start - input.now.getTime() >= leadMs)
      .sort((a, b) => a.start - b.start);
    const next = slots[0];
    if (!next) continue;
    lines.push({
      dishId: dish.id,
      title: dish.title,
      cookName: cook.name,
      when: formatSlotRange({ at: next.startsAt, zone: market.timezone }, next.endsAt, intl),
      price: formatMoney({ amountMinor: minorFromDecimal(dish.price, market.currency), currency: market.currency }, intl),
      start: next.start,
    });
  }
  return lines.sort((a, b) => a.start - b.start).map(({ start: _start, ...line }) => line);
}
