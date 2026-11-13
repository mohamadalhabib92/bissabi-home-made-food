import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { km } from './geo';
import type { Cook, Dish, FulfilMode, Lang, Order, OrderStatus, Report, Review, Slot } from './model';
import { quote } from './pricing';
import { bissabiLineDetails } from './bissabiDrinks';
import { demoKitchenOrders, demoMarket } from './seed';
import { STORAGE_KEY } from './persistGuard';
import { clearAll, uid, usePersistentState } from './storage';

type Setter<T> = (v: T | ((p: T) => T)) => void;
export type Loc = { lat: number; lng: number; label: string; source: 'gps' | 'commune'; canton?: string };
export type Prefs = {
  lang: Lang; onboarded: boolean; mode: 'buyer' | 'cook';
  consents: { terms: boolean; location: boolean; marketing: boolean; at?: string };
  location: Loc | null; radiusKm: number; halalOnly: boolean; buyerName: string;
};
const DEFAULT_PREFS: Prefs = { lang: 'fr', onboarded: false, mode: 'buyer', consents: { terms: false, location: false, marketing: false }, location: null, radiusKm: 50, halalOnly: false, buyerName: '' };
export type Cart = { cookId: string | null; lines: { dishId: string; qty: number }[]; bissabiLines?: { productId: string; qty: number }[] };

type Ctx = {
  ready: boolean; storageReady: boolean; bootFallback: boolean; forceReady: () => void; prefs: Prefs; setPrefs: Setter<Prefs>;
  cooks: Cook[]; setCooks: Setter<Cook[]>; dishes: Dish[]; setDishes: Setter<Dish[]>; slots: Slot[]; setSlots: Setter<Slot[]>;
  orders: Order[]; setOrders: Setter<Order[]>; reviews: Review[]; setReviews: Setter<Review[]>; reports: Report[]; setReports: Setter<Report[]>;
  favorites: { dishes: string[]; cooks: string[] }; toggleFav: (k: 'dishes' | 'cooks', id: string) => void;
  cart: Cart; setCart: Setter<Cart>; addToCart: (d: Dish, qty?: number) => 'ok' | 'other_cook'; clearCart: () => void;
  myCook: Cook | null; distanceTo: (c: Cook) => number | null;
  placeOrder: (p: { slot: Slot; mode: FulfilMode; address?: string; note?: string; buyerName?: string }) => Order;
  setOrderStatus: (id: string, status: OrderStatus, patch?: Partial<Order>, note?: string) => void;
  loadDemo: () => void; hasDemo: boolean; removeDemo: () => void; addKitchenDemo: () => void; wipe: () => Promise<void>;
};
const C = createContext<Ctx | null>(null);
export const useData = () => { const c = useContext(C); if (!c) throw new Error('DataProvider manquant'); return c; };

export function DataProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs, r1] = usePersistentState<Prefs>(STORAGE_KEY.prefs, DEFAULT_PREFS);
  const [cooks, setCooks, r2] = usePersistentState<Cook[]>(STORAGE_KEY.cooks, () => demoMarket().cooks);
  const [dishes, setDishes, r3] = usePersistentState<Dish[]>(STORAGE_KEY.dishes, () => demoMarket().dishes);
  const [slots, setSlots, r4] = usePersistentState<Slot[]>(STORAGE_KEY.slots, () => demoMarket().slots);
  const [orders, setOrders, r5] = usePersistentState<Order[]>(STORAGE_KEY.orders, () => demoMarket().orders);
  const [reviews, setReviews, r6] = usePersistentState<Review[]>(STORAGE_KEY.reviews, () => demoMarket().reviews);
  const [reports, setReports, r7] = usePersistentState<Report[]>(STORAGE_KEY.reports, []);
  const [favorites, setFavorites, r8] = usePersistentState<{ dishes: string[]; cooks: string[] }>(STORAGE_KEY.favorites, { dishes: [], cooks: [] });
  const [cart, setCart, r9] = usePersistentState<Cart>(STORAGE_KEY.cart, { cookId: null, lines: [] });
  const storageReady = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9;
  const [bootFallback, setBootFallback] = useState(false);
  const forceReady = useCallback(() => setBootFallback(true), []);
  const ready = storageReady || bootFallback;
  const myCook = cooks.find((c) => c.isMe) ?? null;
  const loc = prefs.location;

  const value = useMemo<Ctx>(() => {
    const distanceTo = (c: Cook) => (loc ? km(loc, c) : null);
    const addToCart: Ctx['addToCart'] = (d, qty = 1) => {
      if (cart.cookId && cart.cookId !== d.cookId && cart.lines.length) return 'other_cook';
      setCart((c) => {
        const ex = c.lines.find((l) => l.dishId === d.id);
        return { cookId: d.cookId, lines: ex ? c.lines.map((l) => (l.dishId === d.id ? { ...l, qty: Math.min(20, l.qty + qty) } : l)) : [...c.lines, { dishId: d.id, qty }] };
      });
      return 'ok';
    };
    const placeOrder: Ctx['placeOrder'] = ({ slot, mode, address, note, buyerName }) => {
      const lines = cart.lines.map((l) => { const d = dishes.find((x) => x.id === l.dishId)!; return { dishId: d.id, title: d.title, qty: l.qty, unitPrice: d.price }; });
      const q = quote(lines, mode);
      const bissabiLines = bissabiLineDetails(cart.bissabiLines).map((l) => ({ productId: l.productId, title: l.product.nameFr, qty: l.qty, priceLabel: l.product.priceLabel }));
      const at = new Date().toISOString();
      const o: Order = {
        id: uid('ord_'), number: `HMF-${at.slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, side: 'buyer',
        cookId: cart.cookId!, buyerName: buyerName || prefs.buyerName || 'Moi', lines, slotId: slot.id, slotDate: slot.date, slotFrom: slot.from, slotTo: slot.to,
        mode, address, note, ...q, status: 'awaiting_payment', timeline: [{ status: 'awaiting_payment', at }], payment: { method: 'demo' }, createdAt: at,
        bissabiLines: bissabiLines.length ? bissabiLines : undefined,
      };
      setOrders((l) => [o, ...l]);
      return o;
    };
    const setOrderStatus: Ctx['setOrderStatus'] = (id, status, patch, note) =>
      setOrders((l) => l.map((o) => (o.id === id ? { ...o, ...patch, status, timeline: [...o.timeline, { status, at: new Date().toISOString(), note }] } : o)));
    const toggleFav: Ctx['toggleFav'] = (k, id) => setFavorites((f) => ({ ...f, [k]: f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id] }));
    const hasDemo = cooks.some((c) => c.demo) || orders.some((o) => o.demo);
    const removeDemo = () => {
      setCooks((l) => l.filter((x) => !x.demo)); setDishes((l) => l.filter((x) => !x.demo)); setSlots((l) => l.filter((x) => !x.demo));
      setOrders((l) => l.filter((x) => !x.demo)); setReviews((l) => l.filter((x) => !x.demo));
      setCart({ cookId: null, lines: [] });
    };
    const loadDemo = () => {
      const d = demoMarket();
      setCooks((l) => [...l.filter((x) => !x.demo), ...d.cooks]); setDishes((l) => [...l.filter((x) => !x.demo), ...d.dishes]);
      setSlots((l) => [...l.filter((x) => !x.demo), ...d.slots]); setReviews((l) => [...l.filter((x) => !x.demo), ...d.reviews]);
      setOrders((l) => [...l.filter((x) => !x.demo), ...d.orders]);
    };
    const addKitchenDemo = () => {
      if (!myCook) return;
      const mine = dishes.filter((d) => d.cookId === myCook.id);
      setOrders((l) => [...l.filter((o) => !(o.demo && o.side === 'cook')), ...demoKitchenOrders(myCook.id, mine)]);
    };
    const wipe = async () => {
      const cleared = await clearAll();
      if (!cleared) return;
      setPrefs(DEFAULT_PREFS); setCooks([]); setDishes([]); setSlots([]); setOrders([]); setReviews([]); setReports([]);
      setFavorites({ dishes: [], cooks: [] }); setCart({ cookId: null, lines: [] });
    };
    return {
      ready, storageReady, bootFallback, forceReady, prefs, setPrefs, cooks, setCooks, dishes, setDishes, slots, setSlots, orders, setOrders, reviews, setReviews, reports, setReports,
      favorites, toggleFav, cart, setCart, addToCart, clearCart: () => setCart({ cookId: null, lines: [] }), myCook, distanceTo,
      placeOrder, setOrderStatus, loadDemo, hasDemo, removeDemo, addKitchenDemo, wipe,
    };
  }, [ready, storageReady, bootFallback, forceReady, prefs, cooks, dishes, slots, orders, reviews, reports, favorites, cart, myCook, loc, setPrefs, setCooks, setDishes, setSlots, setOrders, setReviews, setReports, setFavorites, setCart]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

/** Bilingue FR/EN : L('Panier', 'Cart'). */
export function useL() {
  const { prefs } = useData();
  const L = (fr: string, en: string) => (prefs.lang === 'en' ? en : fr);
  return { L, lang: prefs.lang };
}
