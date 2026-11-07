/**
 * Conservation locale — Bissabi Home Made Food.
 *
 * Le garde de la Passe 1 empêche d'écrire avant une lecture réussie.
 * Ici, une lecture « réussie » n'est plus un simple JSON.parse :
 * une forme incompatible, une version future ou des octets illisibles
 * ne sont jamais adoptés, jamais remplacés par la démo, et la chaîne
 * d'origine reste dans une copie de récupération hors du préfixe effaçable.
 *
 * Les champs inconnus d'un document compatible restent sur l'objet et sont
 * réattachés à l'enregistrement s'ils ont été perdus en mémoire.
 * Aucune donnée n'est journalisée.
 */

export const LOCAL_SCHEMA_VERSION = 1;

export const APP_PREFIX = '@bissabi-home-made-food/';
/** Préfixe distinct : un effacement du préfixe applicatif ne l'emporte pas. */
export const QUARANTINE_PREFIX = '@bissabi-home-made-food-quarantine/';
export const QUARANTINE_INDEX_KEY = `${QUARANTINE_PREFIX}index`;

export type PreserveReason =
  | 'absent'
  | 'current'
  | 'unknown-fields'
  | 'malformed'
  | 'future-schema'
  | 'incompatible-shape';

export type KeyShape = 'array' | 'object';

export const KEY_SHAPE: Record<string, KeyShape> = {
  prefs: 'object',
  cooks: 'array',
  dishes: 'array',
  slots: 'array',
  orders: 'array',
  reviews: 'array',
  reports: 'array',
  favorites: 'object',
  cart: 'object',
};

const COOK_FIELDS = [
  'id', 'name', 'commune', 'npa', 'lat', 'lng', 'bio', 'halalKitchen', 'languages', 'checklist', 'checklistAt',
  'delivers', 'avatarColor', 'isMe', 'demo', 'createdAt', 'canton', 'ofcoStatus', 'schemaVersion',
] as const;

const DISH_FIELDS = [
  'id', 'cookId', 'title', 'description', 'cuisine', 'price', 'allergens', 'allergensConfirmed', 'halal',
  'vegetarian', 'spicy', 'ingredients', 'leadHours', 'photo', 'emoji', 'active', 'demo', 'allergenStatus',
  'animalOrigin', 'provenance', 'isBakery', 'productionCountry', 'conservation', 'reheating', 'portionLabel',
  'schemaVersion',
] as const;

const SLOT_FIELDS = ['id', 'cookId', 'date', 'from', 'to', 'modes', 'capacity', 'dishIds', 'demo', 'schemaVersion'] as const;

const ORDER_FIELDS = [
  'id', 'number', 'side', 'cookId', 'buyerName', 'lines', 'slotId', 'slotDate', 'slotFrom', 'slotTo', 'mode',
  'address', 'note', 'subtotal', 'commission', 'deliveryFee', 'total', 'status', 'timeline', 'payment',
  'refuseReason', 'createdAt', 'demo', 'schemaVersion',
] as const;

const REVIEW_FIELDS = ['id', 'orderId', 'cookId', 'dishId', 'rating', 'text', 'author', 'status', 'at', 'demo', 'schemaVersion'] as const;
const REPORT_FIELDS = ['id', 'target', 'targetId', 'reason', 'text', 'at', 'schemaVersion'] as const;

export const KNOWN_FIELDS: Record<string, readonly string[]> = {
  prefs: ['lang', 'onboarded', 'mode', 'consents', 'location', 'radiusKm', 'halalOnly', 'buyerName', 'schemaVersion'],
  cooks: COOK_FIELDS,
  dishes: DISH_FIELDS,
  slots: SLOT_FIELDS,
  orders: ORDER_FIELDS,
  reviews: REVIEW_FIELDS,
  reports: REPORT_FIELDS,
  favorites: ['dishes', 'cooks', 'schemaVersion'],
  cart: ['cookId', 'lines', 'schemaVersion'],
};

export type UnknownBag = {
  root: Record<string, unknown>;
  records: Record<string, Record<string, unknown>>;
};

export type Classification<T> = {
  reason: PreserveReason;
  editable: T;
  hydrated: boolean;
  /** Chaîne d'origine quand elle ne doit pas être réécrite. */
  rawLocked: string | null;
  unknown: UnknownBag;
  /** Vrai quand le document présent n'est pas adopté (pas de démo à la place). */
  heldOriginal: boolean;
};

export type QuarantineConflict = { raw: string; reason: PreserveReason; at: string };

export type QuarantineRecord = {
  key: string;
  reason: PreserveReason;
  raw: string;
  capturedAt: string;
  conflicts: QuarantineConflict[];
};

export type RecoverySummary = {
  key: string;
  reason: PreserveReason;
  capturedAt: string;
  bytes: number;
  conflictCount: number;
};

export type KeyPreservation = {
  key: string;
  reason: PreserveReason;
  heldOriginal: boolean;
  unknownCount: number;
  hydrated: boolean;
};

const EMPTY_BAG: UnknownBag = { root: {}, records: {} };

export function emptyUnknown(): UnknownBag {
  return { root: {}, records: {} };
}

export function neutralValue(key: string): unknown {
  switch (key) {
    case 'prefs':
      return {
        lang: 'fr',
        onboarded: false,
        mode: 'buyer',
        consents: { terms: false, location: false, marketing: false },
        location: null,
        radiusKm: 3,
        halalOnly: false,
        buyerName: '',
      };
    case 'favorites':
      return { dishes: [], cooks: [] };
    case 'cart':
      return { cookId: null, lines: [] };
    default:
      return [];
  }
}

export function neutralJson(key: string): string {
  return JSON.stringify(neutralValue(key));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readSchemaVersion(value: unknown): number | null {
  if (Array.isArray(value)) {
    let max: number | null = null;
    for (const item of value) {
      const n = readSchemaVersion(item);
      if (n == null) continue;
      max = max == null ? n : Math.max(max, n);
    }
    return max;
  }
  if (!isPlainObject(value) || !('schemaVersion' in value)) return null;
  const version = value.schemaVersion;
  return typeof version === 'number' && Number.isFinite(version) ? version : null;
}

function peelUnknown(key: string, value: unknown): UnknownBag {
  const known = new Set(KNOWN_FIELDS[key] ?? []);
  const bag = emptyUnknown();
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (!isPlainObject(item)) return;
      const id = typeof item.id === 'string' && item.id ? item.id : `#${index}`;
      const extra: Record<string, unknown> = {};
      for (const [field, fieldValue] of Object.entries(item)) {
        if (!known.has(field)) extra[field] = fieldValue;
      }
      if (Object.keys(extra).length) bag.records[id] = extra;
    });
    return bag;
  }
  if (isPlainObject(value)) {
    for (const [field, fieldValue] of Object.entries(value)) {
      if (!known.has(field)) bag.root[field] = fieldValue;
    }
  }
  return bag;
}

export function unknownCount(bag: UnknownBag): number {
  return Object.keys(bag.root).length + Object.values(bag.records).reduce((sum, extra) => sum + Object.keys(extra).length, 0);
}

/** Complète les clés connues manquantes d'un objet. N'écrase rien, n'invente aucune ligne de tableau. */
export function fillMissingKnown<T>(key: string, editable: T, absentFallback: T): T {
  if (KEY_SHAPE[key] !== 'object') return editable;
  if (!isPlainObject(editable) || !isPlainObject(absentFallback)) return editable;
  const known = new Set(KNOWN_FIELDS[key] ?? []);
  const next: Record<string, unknown> = { ...editable };
  for (const [field, fieldValue] of Object.entries(absentFallback)) {
    if (known.has(field) && !(field in next)) next[field] = fieldValue;
  }
  return next as T;
}

function locked<T>(reason: PreserveReason, raw: string, neutral: T): Classification<T> {
  return {
    reason,
    editable: neutral,
    hydrated: false,
    rawLocked: raw,
    unknown: emptyUnknown(),
    heldOriginal: true,
  };
}

export function classifyRaw<T>(args: {
  key: string;
  raw: string | null;
  absentFallback: T;
  neutral: T;
}): Classification<T> {
  const { key, raw, absentFallback, neutral } = args;
  if (raw == null) {
    return {
      reason: 'absent',
      editable: absentFallback,
      hydrated: true,
      rawLocked: null,
      unknown: emptyUnknown(),
      heldOriginal: false,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return locked('malformed', raw, neutral);
  }
  const version = readSchemaVersion(parsed);
  if (version != null && version > LOCAL_SCHEMA_VERSION) return locked('future-schema', raw, neutral);
  const shape = KEY_SHAPE[key];
  const matches = shape === 'array' ? Array.isArray(parsed) : isPlainObject(parsed);
  if (!shape || !matches) return locked('incompatible-shape', raw, neutral);
  const unknown = peelUnknown(key, parsed);
  const editable = fillMissingKnown(key, parsed as T, absentFallback);
  const hasUnknown = unknownCount(unknown) > 0;
  return {
    reason: hasUnknown ? 'unknown-fields' : 'current',
    editable,
    hydrated: true,
    rawLocked: null,
    unknown,
    heldOriginal: false,
  };
}

/**
 * Réécrit les champs inconnus absents de la copie de travail.
 * Une seconde passe est identique à la première. Une valeur déjà présente n'est pas écrasée.
 */
export function reattachUnknown<T>(editable: T, bag: UnknownBag | null | undefined): T {
  if (!bag || (Object.keys(bag.root).length === 0 && Object.keys(bag.records).length === 0)) return editable;
  if (Array.isArray(editable)) {
    return editable.map((item, index) => {
      if (!isPlainObject(item)) return item;
      const id = typeof item.id === 'string' && item.id ? item.id : `#${index}`;
      const extra = bag.records[id];
      if (!extra) return item;
      const next: Record<string, unknown> = { ...item };
      for (const [field, fieldValue] of Object.entries(extra)) {
        if (!(field in next)) next[field] = fieldValue;
      }
      return next;
    }) as T;
  }
  if (isPlainObject(editable)) {
    const next: Record<string, unknown> = { ...editable };
    for (const [field, fieldValue] of Object.entries(bag.root)) {
      if (!(field in next)) next[field] = fieldValue;
    }
    return next as T;
  }
  return editable;
}

/** Première capture seulement. Ne remplace pas et n'empile pas un conflit. */
export function captureIfAbsent(
  prev: QuarantineRecord | null,
  incoming: { key: string; reason: PreserveReason; raw: string; at: string },
): QuarantineRecord | null {
  if (prev) return null;
  return { key: incoming.key, reason: incoming.reason, raw: incoming.raw, capturedAt: incoming.at, conflicts: [] };
}

/**
 * Archive avant effacement. La première chaîne reste canonique.
 * Une chaîne différente est ajoutée une seule fois aux conflits.
 */
export function mergeQuarantine(
  prev: QuarantineRecord | null,
  incoming: { key: string; reason: PreserveReason; raw: string; at: string },
): QuarantineRecord {
  if (!prev) {
    return { key: incoming.key, reason: incoming.reason, raw: incoming.raw, capturedAt: incoming.at, conflicts: [] };
  }
  if (prev.raw === incoming.raw) return prev;
  if (prev.conflicts.some((conflict) => conflict.raw === incoming.raw)) return prev;
  return {
    ...prev,
    conflicts: [...prev.conflicts, { raw: incoming.raw, reason: incoming.reason, at: incoming.at }],
  };
}

export function toRecoverySummary(record: QuarantineRecord): RecoverySummary {
  return {
    key: record.key,
    reason: record.reason,
    capturedAt: record.capturedAt,
    bytes: record.raw.length,
    conflictCount: record.conflicts.length,
  };
}

export type RestoreAction = 'noop' | 'write' | 'blocked';

/** Dernière chaîne archivée qui n'est pas le document neutre. La première reste dans `record.raw`. */
export function recoverableRaw(record: QuarantineRecord, neutral: string): string {
  const chain = [record.raw, ...record.conflicts.map((conflict) => conflict.raw)];
  for (let i = chain.length - 1; i >= 0; i -= 1) {
    if (chain[i] !== neutral) return chain[i];
  }
  return record.raw;
}

/**
 * Porte de restauration isolée.
 * Sans `replace`, on ne réécrit que si la copie de travail est absente ou neutre.
 * `replace` est le geste explicite qui substitue la copie de récupération.
 * Dans les deux cas, on relit la dernière chaîne non neutre, pas un tableau vide archivé par erreur.
 */
export function restoreDecision(
  currentRaw: string | null,
  record: QuarantineRecord,
  neutral: string,
  replace: boolean,
): { action: RestoreAction; raw: string } {
  const raw = recoverableRaw(record, neutral);
  if (currentRaw === raw) return { action: 'noop', raw };
  if (replace || currentRaw == null || currentRaw === neutral) return { action: 'write', raw };
  return { action: 'blocked', raw };
}

/**
 * Repartir à vide seulement si les octets actuels sont déjà dans la copie de récupération.
 * La copie elle-même n'est pas modifiée.
 */
export function releaseDecision(
  record: QuarantineRecord | null,
  currentRaw: string | null,
  neutral: string,
): { ok: boolean; writeRaw: string | null } {
  if (!record || currentRaw == null) return { ok: false, writeRaw: null };
  const captured = currentRaw === record.raw || record.conflicts.some((conflict) => conflict.raw === currentRaw);
  if (!captured) return { ok: false, writeRaw: null };
  if (currentRaw === neutral) return { ok: true, writeRaw: null };
  return { ok: true, writeRaw: neutral };
}

export function keysToClear(allKeys: readonly string[]): string[] {
  return allKeys.filter((key) => key.startsWith(APP_PREFIX));
}

export function isQuarantineKey(key: string): boolean {
  return key.startsWith(QUARANTINE_PREFIX);
}

const preservationState = new Map<string, KeyPreservation>();
const preservationListeners = new Set<() => void>();
let preservationSnapshot: KeyPreservation[] = [];

function emitPreservation() {
  preservationSnapshot = [...preservationState.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const listener of preservationListeners) listener();
}

export function publishPreservation(entry: KeyPreservation) {
  preservationState.set(entry.key, entry);
  emitPreservation();
}

export function clearPreservation(key: string) {
  if (!preservationState.delete(key)) return;
  emitPreservation();
}

export function getPreservationSnapshot(): KeyPreservation[] {
  return preservationSnapshot;
}

export function subscribePreservation(listener: () => void): () => void {
  preservationListeners.add(listener);
  return () => {
    preservationListeners.delete(listener);
  };
}

/** Réservé aux tests. */
export function resetPreservationState() {
  preservationState.clear();
  preservationSnapshot = [];
}

export { EMPTY_BAG };
