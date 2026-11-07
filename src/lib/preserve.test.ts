import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  captureIfAbsent,
  classifyRaw,
  fillMissingKnown,
  keysToClear,
  mergeQuarantine,
  neutralJson,
  neutralValue,
  QUARANTINE_PREFIX,
  reattachUnknown,
  recoverableRaw,
  releaseDecision,
  restoreDecision,
  unknownCount,
  type QuarantineRecord,
} from './preserve';

const demoCooks = [{ id: 'demo-c1', name: 'Aïssatou (démo)', demo: true }];
const neutralCooks: typeof demoCooks = [];

test('clé absente : le repli (démo au premier lancement) est adopté', () => {
  const result = classifyRaw({ key: 'cooks', raw: null, absentFallback: demoCooks, neutral: neutralCooks });
  assert.equal(result.reason, 'absent');
  assert.equal(result.hydrated, true);
  assert.equal(result.heldOriginal, false);
  assert.deepEqual(result.editable, demoCooks);
});

test('JSON illisible : copie neutre, pas la démo, octets verrouillés', () => {
  const raw = '{"orders":[';
  const result = classifyRaw({ key: 'orders', raw, absentFallback: [{ id: 'demo-o1', demo: true }], neutral: [] });
  assert.equal(result.reason, 'malformed');
  assert.equal(result.hydrated, false);
  assert.equal(result.heldOriginal, true);
  assert.equal(result.rawLocked, raw);
  assert.deepEqual(result.editable, []);
  assert.notDeepEqual(result.editable, [{ id: 'demo-o1', demo: true }]);
});

test('version future : document entier conservé, non adopté', () => {
  const raw = JSON.stringify({ schemaVersion: 2, records: [{ id: 'ord_user', address: 'Rue privée 1' }], extra: true });
  const result = classifyRaw({ key: 'orders', raw, absentFallback: [], neutral: [] });
  assert.equal(result.reason, 'future-schema');
  assert.equal(result.hydrated, false);
  assert.equal(result.rawLocked, raw);
  assert.deepEqual(result.editable, []);
});

test('un enregistrement schemaVersion 2 dans un tableau verrouille tout le tableau', () => {
  const raw = JSON.stringify([
    { id: 'ord_old', buyerName: 'Mohamed', schemaVersion: 1 },
    { id: 'ord_next', buyerName: 'Sara', schemaVersion: 2 },
  ]);
  const result = classifyRaw({ key: 'orders', raw, absentFallback: [], neutral: [] });
  assert.equal(result.reason, 'future-schema');
  assert.equal(result.hydrated, false);
  assert.equal(result.rawLocked, raw);
});

test('forme incompatible : objet là où un tableau est attendu', () => {
  const raw = JSON.stringify({ orders: [{ id: 'ord_user' }] });
  const result = classifyRaw({ key: 'orders', raw, absentFallback: demoCooks, neutral: [] });
  assert.equal(result.reason, 'incompatible-shape');
  assert.equal(result.hydrated, false);
  assert.deepEqual(result.editable, []);
});

test('commande v1 sans champs nouveaux : rétrocompatible, identique', () => {
  const order = {
    id: 'ord_1',
    number: 'HMF-1',
    side: 'buyer',
    cookId: 'c1',
    buyerName: 'Mohamed',
    lines: [{ dishId: 'd1', title: 'Mafé', qty: 1, unitPrice: 17 }],
    slotId: 's1',
    slotDate: '2026-11-08',
    slotFrom: '18:30',
    slotTo: '20:00',
    mode: 'pickup',
    subtotal: 17,
    commission: 2.55,
    deliveryFee: 0,
    total: 19.55,
    status: 'requested',
    timeline: [{ status: 'requested', at: '2026-11-07T12:00:00.000Z' }],
    payment: { method: 'demo', ref: 'DEMO' },
    createdAt: '2026-11-07T12:00:00.000Z',
  };
  const raw = JSON.stringify([order]);
  const result = classifyRaw({ key: 'orders', raw, absentFallback: [], neutral: [] });
  assert.equal(result.reason, 'current');
  assert.equal(result.hydrated, true);
  assert.equal(result.heldOriginal, false);
  assert.deepEqual(result.editable, [order]);
  assert.equal(unknownCount(result.unknown), 0);
});

test('schemaVersion 1 explicite reste lisible', () => {
  const raw = JSON.stringify([{ id: 'ord_1', schemaVersion: 1, buyerName: 'Mohamed' }]);
  const result = classifyRaw({ key: 'orders', raw, absentFallback: [], neutral: [] });
  assert.equal(result.reason, 'current');
  assert.equal(result.hydrated, true);
});

test('champs inconnus : conservés, comptés, réattachés si un enregistrement les oublie', () => {
  const raw = JSON.stringify([
    { id: 'ord_1', buyerName: 'Mohamed', address: 'Chemin privé 2', loyaltyCode: 'ABC', importBatch: 'lot-9' },
  ]);
  const result = classifyRaw({ key: 'orders', raw, absentFallback: [], neutral: [] });
  assert.equal(result.reason, 'unknown-fields');
  assert.equal(result.hydrated, true);
  assert.equal(result.heldOriginal, false);
  assert.deepEqual(result.unknown.records.ord_1, { loyaltyCode: 'ABC', importBatch: 'lot-9' });
  const stripped = (result.editable as { id: string; buyerName: string }[]).map((order) => ({
    id: order.id,
    buyerName: order.buyerName,
    status: 'ready',
  }));
  const once = reattachUnknown(stripped, result.unknown);
  const twice = reattachUnknown(once, result.unknown);
  assert.deepEqual(twice, once);
  const row = once[0] as { loyaltyCode?: string; importBatch?: string; buyerName: string; status: string };
  assert.equal(row.loyaltyCode, 'ABC');
  assert.equal(row.importBatch, 'lot-9');
  assert.equal(row.buyerName, 'Mohamed');
  assert.equal(row.status, 'ready');
});

test('réattachement n’écrase pas une valeur déjà posée par l’app', () => {
  const bag = { root: {}, records: { ord_1: { loyaltyCode: 'ABC' } } };
  const edited = [{ id: 'ord_1', loyaltyCode: 'KEPT' }];
  const next = reattachUnknown(edited, bag);
  assert.equal(next[0].loyaltyCode, 'KEPT');
  assert.deepEqual(reattachUnknown(next, bag), next);
});

test('préférences partielles : défauts connus complétés, champ futur intact', () => {
  const raw = JSON.stringify({ buyerName: 'Mohamed', lang: 'fr', futureFlag: true });
  const fallback = neutralValue('prefs') as { buyerName: string; consents: { terms: boolean }; futureFlag?: boolean };
  const result = classifyRaw({ key: 'prefs', raw, absentFallback: fallback, neutral: fallback });
  assert.equal(result.reason, 'unknown-fields');
  assert.equal(result.hydrated, true);
  const prefs = result.editable as { buyerName: string; consents: { terms: boolean }; radiusKm: number; futureFlag: boolean };
  assert.equal(prefs.buyerName, 'Mohamed');
  assert.equal(prefs.futureFlag, true);
  assert.equal(prefs.consents.terms, false);
  assert.equal(prefs.radiusKm, 3);
  const renamed = { ...prefs, lang: 'en' };
  delete (renamed as { futureFlag?: boolean }).futureFlag;
  const saved = reattachUnknown(renamed, result.unknown) as typeof prefs;
  assert.equal(saved.lang, 'en');
  assert.equal(saved.futureFlag, true);
  assert.equal(saved.buyerName, 'Mohamed');
});

test('fillMissingKnown ne fabrique pas de commandes', () => {
  const orders = [{ id: 'ord_user', buyerName: 'Mohamed' }];
  assert.deepEqual(fillMissingKnown('orders', orders, [{ id: 'demo-o1', demo: true }]), orders);
});

test('captureIfAbsent est idempotente et n’empile pas', () => {
  const first = captureIfAbsent(null, { key: 'orders', reason: 'malformed', raw: '{', at: '2026-11-07T00:00:00.000Z' });
  assert.ok(first);
  assert.equal(captureIfAbsent(first, { key: 'orders', reason: 'malformed', raw: '{', at: '2026-11-07T01:00:00.000Z' }), null);
  assert.equal(captureIfAbsent(first, { key: 'orders', reason: 'future-schema', raw: '{"schemaVersion":9}', at: '2026-11-07T02:00:00.000Z' }), null);
});

test('mergeQuarantine garde la première chaîne et n’ajoute un conflit qu’une fois', () => {
  const original = '{bad';
  const later = '[]';
  let record = mergeQuarantine(null, { key: 'orders', reason: 'malformed', raw: original, at: 't0' });
  record = mergeQuarantine(record, { key: 'orders', reason: 'malformed', raw: original, at: 't1' });
  assert.equal(record.raw, original);
  assert.equal(record.capturedAt, 't0');
  assert.deepEqual(record.conflicts, []);
  record = mergeQuarantine(record, { key: 'orders', reason: 'current', raw: later, at: 't2' });
  const again = mergeQuarantine(record, { key: 'orders', reason: 'current', raw: later, at: 't3' });
  assert.equal(again, record);
  assert.equal(again.conflicts.length, 1);
  assert.equal(again.conflicts[0].raw, later);
  assert.equal(again.raw, original);
});

test('restauration isolée : neutre oui, copie différente non, remplacement explicite oui', () => {
  const record: QuarantineRecord = {
    key: 'orders',
    reason: 'malformed',
    raw: '{"id":"ord_user","address":"secret"}',
    capturedAt: 't0',
    conflicts: [],
  };
  const neutral = neutralJson('orders');
  assert.equal(restoreDecision(null, record, neutral, false).action, 'write');
  assert.equal(restoreDecision(neutral, record, neutral, false).action, 'write');
  assert.equal(restoreDecision(record.raw, record, neutral, false).action, 'noop');
  const blocked = restoreDecision('[{"id":"autre"}]', record, neutral, false);
  assert.equal(blocked.action, 'blocked');
  assert.equal(blocked.raw, record.raw);
  const replaced = restoreDecision('[{"id":"autre"}]', record, neutral, true);
  assert.equal(replaced.action, 'write');
  assert.equal(replaced.raw, record.raw);
});

test('release n’écrit le neutre que si les octets actuels sont déjà archivés', () => {
  const record: QuarantineRecord = {
    key: 'cart',
    reason: 'malformed',
    raw: '{panier',
    capturedAt: 't0',
    conflicts: [],
  };
  const neutral = neutralJson('cart');
  assert.deepEqual(releaseDecision(null, '{panier', neutral), { ok: false, writeRaw: null });
  assert.deepEqual(releaseDecision(record, '{"autre"}', neutral), { ok: false, writeRaw: null });
  assert.deepEqual(releaseDecision(record, record.raw, neutral), { ok: true, writeRaw: neutral });
  assert.deepEqual(releaseDecision(record, neutral, neutral), { ok: false, writeRaw: null });
  const withNeutralConflict: QuarantineRecord = { ...record, conflicts: [{ raw: neutral, reason: 'current', at: 't1' }] };
  assert.deepEqual(releaseDecision(withNeutralConflict, neutral, neutral), { ok: true, writeRaw: null });
});

test('la restauration reprend la dernière chaîne non neutre et ignore un tableau vide archivé', () => {
  const original = '{"buyerName":"Mohamed","address":"Chemin privé"}';
  const edited = '{"buyerName":"Mohamed","address":"Chemin privé","note":"sans piment"}';
  const neutral = neutralJson('prefs');
  const record: QuarantineRecord = {
    key: 'prefs',
    reason: 'unknown-fields',
    raw: original,
    capturedAt: 't0',
    conflicts: [
      { raw: edited, reason: 'current', at: 't1' },
      { raw: neutral, reason: 'current', at: 't2' },
    ],
  };
  assert.equal(recoverableRaw(record, neutral), edited);
  assert.equal(restoreDecision(neutral, record, neutral, false).raw, edited);
  assert.equal(restoreDecision(edited, record, neutral, false).action, 'noop');
});

test('l’effacement du préfixe applicatif ignore la quarantaine', () => {
  const keys = [
    '@bissabi-home-made-food/orders',
    '@bissabi-home-made-food/prefs',
    `${QUARANTINE_PREFIX}index`,
    '@autre-app/orders',
  ];
  assert.deepEqual(keysToClear(keys), ['@bissabi-home-made-food/orders', '@bissabi-home-made-food/prefs']);
});

test('le neutre commandes est un tableau vide, pas une commande fictive', () => {
  assert.equal(neutralJson('orders'), '[]');
  assert.deepEqual(neutralValue('orders'), []);
  assert.equal(JSON.stringify(neutralValue('prefs')).includes('Mohamed'), false);
});
