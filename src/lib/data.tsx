import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { km } from './geo';
import { acceptDelivery, confirmDropoff, confirmPickup, courierFromDraft, declineDelivery, markEnRoute, offerIfReady, visibleDeliveries } from './courierRun';
import type { Cook, Courier, Dish, FulfilMode, Lang, Order, OrderStatus, Report, Review, Slot, VehicleType, CourierZone } from './model';
import { quote } from './pricing';
import { saleBlock } from './saleGate';
import { belowMinimum } from './seller';
import { getPreservationSnapshot, neutralValue, subscribePreservation, type KeyPreservation } from './preserve';
import { demoKitchenOrders, demoMarket } from './seed';
import { STORAGE_KEY } from './persistGuard';
import { deleteRemoteAccount } from './authPort';
import { clearAll, deleteLocalAccount, uid, usePersistentState } from './storage';

type Setter<T> = (v: T | ((p: T) => T)) => void;
export type Loc = { lat: number; lng: number; label: string; source: 'gps' | 'commune'; canton?: string };
export type Prefs = {
  lang: Lang; onboarded: boolean; mode: 'buyer' | 'cook' | 'courier';
  consents: { terms: boolean; location: boolean; marketing: boolean; at?: string };
  accountLink?: { userId: string; choice: 'skip' | 'link'; at: string };
  pendingSellerKind?: 'home' | 'caterer';
  location: Loc | null; radiusKm: number; halalOnly: boolean; buyerName: string;
};
const DEFAULT_PREFS = neutralValue('prefs') as Prefs;
export type Cart = { cookId: string | null; lines: { dishId: string; qty: number }[] };

type Ctx = {
  ready: boolean; storageReady: boolean; bootFallback: boolean; forceReady: () => void; prefs: Prefs; setPrefs: Setter<Prefs>;
  cooks: Cook[]; setCooks: Setter<Cook[]>; dishes: Dish[]; setDishes: Setter<Dish[]>; slots: Slot[]; setSlots: Setter<Slot[]>;
  orders: Order[]; setOrders: Setter<Order[]>; reviews: Review[]; setReviews: Setter<Review[]>; reports: Report[]; setReports: Setter<Report[]>;
  favorites: { dishes: string[]; cooks: string[] }; toggleFav: (k: 'dishes' | 'cooks', id: string) => void;
  cart: Cart; setCart: Setter<Cart>; addToCart: (d: Dish, qty?: number) => 'ok' | 'other_cook' | 'blocked'; clearCart: () => void;
  myCook: Cook | null; distanceTo: (c: Cook) => number | null;
  placeOrder: (p: { slot: Slot; mode: FulfilMode; address?: string; note?: string; buyerName?: string }) => Order | null;
  setOrderStatus: (id: string, status: OrderStatus, patch?: Partial<Order>, note?: string) => void;
  couriers: Courier[]; myCourier: Courier | null;
  saveCourier: (draft: { displayName: string; vehicle: VehicleType; zone: CourierZone; available: boolean }) => void;
  setCourierValidated: (id: string, validated: boolean) => void;
  setCourierAvailable: (available: boolean) => void;
  courierJobs: Order[];
  courierAct: (orderId: string, action: 'accept' | 'decline' | 'pickup' | 'en_route' | 'deliver', code?: string) => 'ok' | 'refused';
  loadDemo: () => void; hasDemo: boolean; removeDemo: () => void; addKitchenDemo: () => void; wipe: () => Promise<boolean>; deleteAccount: () => Promise<boolean>;
  preservation: KeyPreservation[];
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
  const [couriers, setCouriers, r10] = usePersistentState<Courier[]>(STORAGE_KEY.couriers, []);
  const storageReady = r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10;
  const preservation = useSyncExternalStore(subscribePreservation, getPreservationSnapshot, getPreservationSnapshot);
  const [bootFallback, setBootFallback] = useState(false);
  const forceReady = useCallback(() => setBootFallback(true), []);
  const ready = storageReady || bootFallback;
  const myCook = cooks.find((c) => c.isMe) ?? null;
  const myCourier = couriers.find((c) => c.isMe) ?? null;
  const loc = prefs.location;

  const value = useMemo<Ctx>(() => {
    const distanceTo = (c: Cook) => (loc ? km(loc, c) : null);
    const addToCart: Ctx['addToCart'] = (d, qty = 1) => {
      if (saleBlock(d, cooks.find((c) => c.id === d.cookId))) return 'blocked';
      if (cart.cookId && cart.cookId !== d.cookId && cart.lines.length) return 'other_cook';
      setCart((c) => {
        const ex = c.lines.find((l) => l.dishId === d.id);
        return { cookId: d.cookId, lines: ex ? c.lines.map((l) => (l.dishId === d.id ? { ...l, qty: Math.min(20, l.qty + qty) } : l)) : [...c.lines, { dishId: d.id, qty }] };
      });
      return 'ok';
    };
    const placeOrder: Ctx['placeOrder'] = ({ slot, mode, address, note, buyerName }) => {
      const cook = cooks.find((c) => c.id === cart.cookId);
      const lines = cart.lines.flatMap((l) => {
        const d = dishes.find((x) => x.id === l.dishId);
        if (!d || saleBlock(d, cook)) return [];
        return [{ dishId: d.id, title: d.title, qty: l.qty, unitPrice: d.price }];
      });
      if (!cart.cookId || lines.length !== cart.lines.length) return null;
      if (belowMinimum(cook, lines.reduce((s, l) => s + l.qty, 0))) return null;
      const q = quote(lines, mode);
      const at = new Date().toISOString();
      const o: Order = {
        id: uid('ord_'), number: `HMF-${at.slice(2, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, side: 'buyer',
        cookId: cart.cookId!, buyerName: buyerName || prefs.buyerName || 'Moi', lines, slotId: slot.id, slotDate: slot.date, slotFrom: slot.from, slotTo: slot.to,
        mode, address, note, ...q, status: 'awaiting_payment', timeline: [{ status: 'awaiting_payment', at }], payment: { method: 'demo' }, createdAt: at,
      };
      setOrders((l) => [o, ...l]);
      return o;
    };
    const setOrderStatus: Ctx['setOrderStatus'] = (id, status, patch, note) =>
      setOrders((l) => l.map((o) => (o.id === id ? offerIfReady({ ...o, ...patch, status, timeline: [...o.timeline, { status, at: new Date().toISOString(), note }] }) : o)));
    const saveCourier: Ctx['saveCourier'] = (draft) => {
      const prev = couriers.find((c) => c.isMe);
      const next = courierFromDraft({ ...draft, isMe: true }, prev?.id ?? uid('liv_'), prev?.createdAt ?? new Date().toISOString(), prev);
      setCouriers((l) => (prev ? l.map((c) => (c.id === next.id ? next : c)) : [...l, next]));
      setPrefs((p) => ({ ...p, mode: 'courier' }));
    };
    const setCourierValidated: Ctx['setCourierValidated'] = (id, validated) =>
      setCouriers((l) => l.map((c) => (c.id === id ? { ...c, validated } : c)));
    const setCourierAvailable: Ctx['setCourierAvailable'] = (available) =>
      setCouriers((l) => l.map((c) => (c.isMe ? { ...c, available } : c)));
    const courierAct: Ctx['courierAct'] = (orderId, action, code) => {
      if (!myCourier) return 'refused';
      let outcome: 'ok' | 'refused' = 'refused';
      setOrders((list) => list.map((order) => {
        if (order.id !== orderId) return order;
        const offered = offerIfReady(order);
        if (action === 'decline') return declineDelivery(offered, myCourier.id);
        const result = action === 'accept' ? acceptDelivery(offered, myCourier)
          : action === 'pickup' ? confirmPickup(offered, myCourier.id, code ?? '')
            : action === 'en_route' ? markEnRoute(offered, myCourier.id)
              : confirmDropoff(offered, myCourier.id, code ?? '', new Date().toISOString());
        if (!result.ok) return order;
        outcome = 'ok';
        const note = action === 'accept' ? 'Livreur accepté' : action === 'pickup' ? 'Retrait cuisine' : action === 'en_route' ? 'En route' : 'Livré';
        return { ...result.order, timeline: [...result.order.timeline, { status: result.order.status, at: new Date().toISOString(), note }] };
      }));
      return outcome;
    };
    const toggleFav: Ctx['toggleFav'] = (k, id) => setFavorites((f) => ({ ...f, [k]: f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id] }));
    const hasDemo = cooks.some((c) => c.demo) || orders.some((o) => o.demo);
    const catalogueHeld = ['cooks', 'dishes', 'slots', 'orders', 'reviews'].some((key) => preservation.some((entry) => entry.key === key && !entry.hydrated));
    const removeDemo = () => {
      setCooks((l) => l.filter((x) => !x.demo)); setDishes((l) => l.filter((x) => !x.demo)); setSlots((l) => l.filter((x) => !x.demo));
      setOrders((l) => l.filter((x) => !x.demo)); setReviews((l) => l.filter((x) => !x.demo));
      setCart({ cookId: null, lines: [] });
    };
    const loadDemo = () => {
      if (catalogueHeld) return;
      const d = demoMarket();
      setCooks((l) => [...l.filter((x) => !x.demo), ...d.cooks]); setDishes((l) => [...l.filter((x) => !x.demo), ...d.dishes]);
      setSlots((l) => [...l.filter((x) => !x.demo), ...d.slots]); setReviews((l) => [...l.filter((x) => !x.demo), ...d.reviews]);
      setOrders((l) => [...l.filter((x) => !x.demo), ...d.orders]);
    };
    const addKitchenDemo = () => {
      if (!myCook || preservation.some((entry) => entry.key === 'orders' && !entry.hydrated)) return;
      const mine = dishes.filter((d) => d.cookId === myCook.id);
      setOrders((l) => [...l.filter((o) => !(o.demo && o.side === 'cook')), ...demoKitchenOrders(myCook.id, mine)]);
    };
    const resetMemory = () => {
      setPrefs(neutralValue('prefs') as Prefs);
      setCooks([]); setDishes([]); setSlots([]); setOrders([]); setReviews([]); setReports([]); setCouriers([]);
      setFavorites(neutralValue('favorites') as { dishes: string[]; cooks: string[] });
      setCart(neutralValue('cart') as Cart);
    };
    const wipe = async () => {
      const cleared = await clearAll();
      if (!cleared) return false;
      resetMemory();
      return true;
    };
    const deleteAccount = async () => {
      const remote = await deleteRemoteAccount();
      if (remote === 'failed') return false;
      const cleared = await deleteLocalAccount();
      if (!cleared) return false;
      resetMemory();
      return true;
    };
    return {
      ready, storageReady, bootFallback, forceReady, prefs, setPrefs, cooks, setCooks, dishes, setDishes, slots, setSlots, orders, setOrders, reviews, setReviews, reports, setReports,
      favorites, toggleFav, cart, setCart, addToCart, clearCart: () => setCart({ cookId: null, lines: [] }), myCook, distanceTo,
      placeOrder, setOrderStatus, couriers, myCourier, saveCourier, setCourierValidated, setCourierAvailable,
      courierJobs: visibleDeliveries(orders.map(offerIfReady), myCourier ?? { id: '', validated: false, available: false }),
      courierAct, loadDemo, hasDemo, removeDemo, addKitchenDemo, wipe, deleteAccount, preservation,
    };
  }, [ready, storageReady, bootFallback, forceReady, prefs, cooks, dishes, slots, orders, reviews, reports, favorites, cart, couriers, myCook, myCourier, loc, preservation, setPrefs, setCooks, setDishes, setSlots, setOrders, setReviews, setReports, setFavorites, setCart, setCouriers]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

/** Bilingue FR/EN : L('Panier', 'Cart'). */
export function useL() {
  const { prefs } = useData();
  const L = (fr: string, en: string) => (prefs.lang === 'en' ? en : fr);
  return { L, lang: prefs.lang };
}
