import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hydrationGate, persistDecision, settleLoad } from './persistGuard';
import { createQuarantineIndex } from './quarantineWrite';
import {
  APP_PREFIX,
  QUARANTINE_INDEX_KEY,
  classifyRaw,
  clearPreservation,
  emptyUnknown,
  keysToClear,
  mergeQuarantine,
  neutralJson,
  neutralValue,
  publishPreservation,
  reattachUnknown,
  releaseDecision,
  restoreDecision,
  toRecoverySummary,
  unknownCount,
  type PreserveReason,
  type RecoverySummary,
  type UnknownBag,
} from './preserve';

/**
 * Stockage local (AsyncStorage sur mobile, localStorage sur le web).
 * Toutes les données « cœur » vivent ici : l'app fonctionne hors-ligne,
 * sans backend ni API payante.
 * La copie de récupération vit sous un autre préfixe et n'est pas journalisée.
 */
const PREFIX = APP_PREFIX;

const quarantine = createQuarantineIndex({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
});

function readQuarantineMap() {
  return quarantine.read();
}

/** Première copie seulement. N'écrase jamais une copie déjà là. */
function captureOriginal(key: string, reason: PreserveReason, raw: string): Promise<void> {
  return quarantine.capture(key, reason, raw);
}

/** Archive les chaînes de travail avant un effacement. Échoue sans rien effacer si la copie ne peut pas être écrite. */
export async function archiveWorkingCopies(): Promise<boolean> {
  return quarantine.exclusive(async () => {
    const read = await readQuarantineMap();
    if (!read.ok) return false;
    let storageKeys: readonly string[];
    try {
      storageKeys = await AsyncStorage.getAllKeys();
    } catch {
      return false;
    }
    let pairs: readonly (readonly [string, string | null])[];
    try {
      pairs = await AsyncStorage.multiGet(keysToClear(storageKeys));
    } catch {
      return false;
    }
    let changed = false;
    for (const [storageKey, raw] of pairs) {
      if (raw == null) continue;
      const key = storageKey.startsWith(PREFIX) ? storageKey.slice(PREFIX.length) : storageKey;
      const prev = read.map[key] ?? null;
      const next = mergeQuarantine(prev, { key, reason: 'current', raw, at: new Date().toISOString() });
      if (next !== prev) {
        read.map[key] = next;
        changed = true;
      }
    }
    if (!changed) return true;
    return quarantine.write(read.map);
  });
}

/** ok: false = lecture échouée (ne pas traiter comme un stockage vide). */
export async function loadJSON<T>(key: string, fallback: T): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw == null) return { ok: true, value: fallback };
    const neutral = (Array.isArray(fallback) ? neutralValue(key) : fallback) as T;
    const classified = classifyRaw({ key, raw, absentFallback: fallback, neutral });
    if (!classified.hydrated) return { ok: false };
    return { ok: true, value: classified.editable };
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
  const archived = await archiveWorkingCopies();
  if (!archived) return false;
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keysToClear(keys));
    return true;
  } catch {
    return false;
  }
}

export async function exportAll(): Promise<Record<string, unknown>> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX) || key === QUARANTINE_INDEX_KEY);
  const pairs = await AsyncStorage.multiGet(keys);
  const out: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    const name = key === QUARANTINE_INDEX_KEY ? '__recovery' : key.slice(PREFIX.length);
    try {
      out[name] = value ? JSON.parse(value) : null;
    } catch {
      out[name] = value;
    }
  }
  return out;
}

/** Chaîne brute de la copie de récupération, pour un export local demandé par la personne. */
export async function exportRecoveryRaw(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(QUARANTINE_INDEX_KEY);
  } catch {
    return null;
  }
}

export async function recoveryState(): Promise<{ readable: boolean; copies: RecoverySummary[] }> {
  const read = await readQuarantineMap();
  if (!read.ok) return { readable: false, copies: [] };
  const copies = Object.values(read.map)
    .map(toRecoverySummary)
    .sort((a, b) => a.key.localeCompare(b.key));
  return { readable: true, copies };
}

export async function restoreQuarantineKey(key: string, replace: boolean): Promise<'noop' | 'restored' | 'blocked' | 'missing' | 'unreadable'> {
  const read = await readQuarantineMap();
  if (!read.ok) return 'unreadable';
  const record = read.map[key];
  if (!record) return 'missing';
  let current: string | null;
  try {
    current = await AsyncStorage.getItem(PREFIX + key);
  } catch {
    return 'unreadable';
  }
  const decision = restoreDecision(current, record, neutralJson(key), replace);
  if (decision.action === 'noop') return 'noop';
  if (decision.action === 'blocked') return 'blocked';
  try {
    await AsyncStorage.setItem(PREFIX + key, decision.raw);
    return 'restored';
  } catch {
    return 'unreadable';
  }
}

export async function releaseLockedKey(key: string): Promise<'released' | 'already' | 'refused' | 'missing' | 'unreadable'> {
  const read = await readQuarantineMap();
  if (!read.ok) return 'unreadable';
  const record = read.map[key];
  if (!record) return 'missing';
  let current: string | null;
  try {
    current = await AsyncStorage.getItem(PREFIX + key);
  } catch {
    return 'unreadable';
  }
  const decision = releaseDecision(record, current, neutralJson(key));
  if (!decision.ok) return 'refused';
  if (decision.writeRaw == null) return 'already';
  try {
    await AsyncStorage.setItem(PREFIX + key, decision.writeRaw);
    return 'released';
  } catch {
    return 'unreadable';
  }
}

/** Efface uniquement la copie de récupération. Ne touche pas aux clés de travail. */
export function purgeQuarantine(): Promise<boolean> {
  return quarantine.purge();
}

/** État React persistant. Aucune écriture tant que la lecture de cette clé n'a pas réussi. */
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const resolve = (input: T | (() => T)): T => (typeof input === 'function' ? (input as () => T)() : input);
  const [value, setValue] = useState<T>(() => {
    const seed = resolve(initial);
    return (Array.isArray(seed) ? neutralValue(key) : seed) as T;
  });
  const [ready, setReady] = useState(false);
  const initialRef = useRef(initial);
  const valueRef = useRef(value);
  const unknownRef = useRef<UnknownBag>(emptyUnknown());

  useEffect(() => {
    let alive = true;
    let marked = false;
    const absentFallback = resolve(initialRef.current);
    const neutral = (Array.isArray(absentFallback) ? neutralValue(key) : absentFallback) as T;
    const adopt = (next: T, unknown: UnknownBag, entry: Parameters<typeof publishPreservation>[0]) => {
      if (!alive) return;
      unknownRef.current = unknown;
      valueRef.current = next;
      setValue(next);
      publishPreservation(entry);
    };
    (async () => {
      let raw: string | null = null;
      try {
        raw = await AsyncStorage.getItem(PREFIX + key);
      } catch {
        adopt(neutral, emptyUnknown(), { key, reason: 'malformed', heldOriginal: true, unknownCount: 0, hydrated: false });
        if (alive) setReady(true);
        return;
      }
      const classified = classifyRaw({ key, raw, absentFallback, neutral });
      if (classified.rawLocked != null) await captureOriginal(key, classified.reason, classified.rawLocked);
      else if (classified.reason === 'unknown-fields' && raw != null) await captureOriginal(key, classified.reason, raw);
      adopt(classified.editable, classified.unknown, {
        key,
        reason: classified.reason,
        heldOriginal: classified.heldOriginal,
        unknownCount: unknownCount(classified.unknown),
        hydrated: classified.hydrated,
      });
      if (!alive) return;
      if (settleLoad(hydrationGate, key, classified.hydrated)) marked = true;
      setReady(true);
    })();
    return () => {
      alive = false;
      if (marked) hydrationGate.unmark(key);
      clearPreservation(key);
    };
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const decision = persistDecision(hydrationGate, key, valueRef.current, next);
      if (!decision.write) return;
      const stored = reattachUnknown(decision.value, unknownRef.current);
      valueRef.current = stored;
      setValue(stored);
      void saveJSON(key, stored);
    },
    [key],
  );

  return [value, set, ready] as const;
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
