import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hydrationGate, memoryAfterLoad, persistDecision, settleLoad } from './persistGuard';

/**
 * Stockage local (AsyncStorage sur mobile, localStorage sur le web).
 * Toutes les données « cœur » vivent ici : l'app fonctionne hors-ligne,
 * sans backend ni API payante.
 */
// Préfixe propre à l'app : plusieurs PWA partagent la même origine sur GitHub Pages.
const PREFIX = '@bissabi-home-made-food/';

/** ok: false = lecture échouée (ne pas traiter comme un stockage vide). */
export async function loadJSON<T>(key: string, fallback: T): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return { ok: true, value: fallback };
    try {
      return { ok: true, value: JSON.parse(raw) as T };
    } catch {
      return { ok: false };
    }
  } catch {
    return { ok: false };
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  if (!hydrationGate.canWrite(key)) return;
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // stockage plein / indisponible : on ne crashe jamais l'UI
  }
}

export async function clearAll(): Promise<boolean> {
  if (!hydrationGate.canClear()) return false;
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  return true;
}

export async function exportAll(): Promise<Record<string, unknown>> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(keys);
  const out: Record<string, unknown> = {};
  for (const [k, v] of pairs) {
    try {
      out[k.slice(PREFIX.length)] = v ? JSON.parse(v) : null;
    } catch {
      out[k.slice(PREFIX.length)] = v;
    }
  }
  return out;
}

/** État React persistant. Aucune écriture tant que la lecture de cette clé n'a pas réussi. */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const initialRef = useRef(initial);
  const valueRef = useRef(value);

  useEffect(() => {
    let alive = true;
    let marked = false;
    const fb = typeof initialRef.current === 'function' ? (initialRef.current as () => T)() : initialRef.current;
    loadJSON<T>(key, fb).then((result) => {
      if (!alive) return;
      const adopted = memoryAfterLoad(result.ok, result.ok ? result.value : fb, valueRef.current);
      if (!settleLoad(hydrationGate, key, adopted.hydrated)) return;
      marked = true;
      valueRef.current = adopted.memory;
      setValue(adopted.memory);
      setReady(true);
    });
    return () => {
      alive = false;
      if (marked) hydrationGate.unmark(key);
    };
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const decision = persistDecision(hydrationGate, key, valueRef.current, next);
      if (!decision.write) return;
      valueRef.current = decision.value;
      setValue(decision.value);
      void saveJSON(key, decision.value);
    },
    [key],
  );

  return [value, set, ready] as const;
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
