/**
 * Écritures locales autorisées seulement après une lecture réussie de la clé.
 * Sinon un « Continuer » avant la fin du chargement réenregistre l'état vide
 * par-dessus les données déjà présentes.
 */
export const STORAGE_KEY = {
  prefs: 'prefs',
  cooks: 'cooks',
  dishes: 'dishes',
  slots: 'slots',
  orders: 'orders',
  reviews: 'reviews',
  reports: 'reports',
  favorites: 'favorites',
  cart: 'cart',
} as const;

export const STORAGE_KEYS = [
  STORAGE_KEY.prefs,
  STORAGE_KEY.cooks,
  STORAGE_KEY.dishes,
  STORAGE_KEY.slots,
  STORAGE_KEY.orders,
  STORAGE_KEY.reviews,
  STORAGE_KEY.reports,
  STORAGE_KEY.favorites,
  STORAGE_KEY.cart,
] as const;

export type StorageKey = (typeof STORAGE_KEYS)[number];

export function createHydrationGate(keys: readonly string[] = STORAGE_KEYS) {
  const counts = new Map<string, number>();
  return {
    /** Lecture réussie (clé absente = état initial légitime, ou JSON valide). */
    mark(key: string) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    },
    /** Démontage : la permission ne survit pas à un remount tant que la nouvelle lecture n'a pas réussi. */
    unmark(key: string) {
      const n = (counts.get(key) ?? 0) - 1;
      if (n <= 0) counts.delete(key);
      else counts.set(key, n);
    },
    canWrite(key: string) {
      return (counts.get(key) ?? 0) > 0;
    },
    canClear() {
      return keys.every((k) => (counts.get(k) ?? 0) > 0);
    },
  };
}

export const hydrationGate = createHydrationGate();

/**
 * N'écrit pas, et ne remplace pas la valeur chargée, tant que la clé n'est pas hydratée.
 * `prev` doit être la valeur issue de la lecture, pas l'état vide affiché en secours.
 */
export function persistDecision<T>(gate: { canWrite(key: string): boolean }, key: string, prev: T, next: T | ((p: T) => T)): { value: T; write: boolean } {
  if (!gate.canWrite(key)) return { value: prev, write: false };
  const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
  return { value, write: true };
}

/** Échec de lecture : ne pas marquer, pour ne jamais réécrire par-dessus un stockage illisible. */
export function settleLoad(gate: { mark(key: string): void }, key: string, ok: boolean): boolean {
  if (!ok) return false;
  gate.mark(key);
  return true;
}

/**
 * La valeur lue remplace l'état affiché en secours.
 * Une édition tentée avant la lecture est abandonnée : elle ne doit pas masquer les données réelles.
 */
export function memoryAfterLoad<T>(loadedOk: boolean, loaded: T, fallbackMemory: T): { memory: T; hydrated: boolean } {
  if (!loadedOk) return { memory: fallbackMemory, hydrated: false };
  return { memory: loaded, hydrated: true };
}
