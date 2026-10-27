import { hoursUntil } from './dates';
import type { Dish, Review, Slot } from './model';
import { MIN_LEAD_HOURS } from './pricing';
/** Créneaux encore commandables pour un plat (commande à l’avance : délai minimum respecté). */
export function openSlotsFor(dish: Dish, slots: Slot[]) {
  const lead = Math.max(MIN_LEAD_HOURS, dish.leadHours);
  return slots
    .filter((s) => s.cookId === dish.cookId && (!s.dishIds.length || s.dishIds.includes(dish.id)) && hoursUntil(s.date, s.from) >= lead)
    .sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
}
export function rating(reviews: Review[], cookId: string) {
  const r = reviews.filter((x) => x.cookId === cookId && x.status === 'published');
  return { avg: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0, count: r.length };
}
import type { Order } from './model';
const LIVE: Order['status'][] = ['requested', 'accepted', 'preparing', 'ready', 'completed', 'awaiting_payment'];
export function slotUsed(slotId: string, orders: Order[]) {
  return orders.filter((o) => o.slotId === slotId && LIVE.includes(o.status)).reduce((s, o) => s + o.lines.reduce((a, l) => a + l.qty, 0), 0);
}
