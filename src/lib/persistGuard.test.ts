import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STORAGE_KEYS, createHydrationGate, memoryAfterLoad, persistDecision, settleLoad } from './persistGuard';

test('aucune écriture avant une lecture réussie, même si l’écran de secours a modifié l’état vide', () => {
  const gate = createHydrationGate();
  const saved = { buyerName: 'Mohamed', radiusKm: 3, onboarded: true };
  const empty = { buyerName: '', radiusKm: 3, onboarded: false };

  for (const key of STORAGE_KEYS) {
    const blocked = persistDecision(gate, key, empty, { ...empty, radiusKm: 5 });
    assert.equal(blocked.write, false, key);
    assert.deepEqual(blocked.value, empty);
  }

  assert.equal(settleLoad(gate, 'prefs', false), false);
  const stillBlocked = persistDecision(gate, 'prefs', empty, { ...empty, radiusKm: 5 });
  assert.equal(stillBlocked.write, false);

  assert.equal(settleLoad(gate, 'prefs', true), true);
  const allowed = persistDecision(gate, 'prefs', saved, (p) => ({ ...p, radiusKm: 5 }));
  assert.equal(allowed.write, true);
  assert.equal(allowed.value.buyerName, 'Mohamed');
  assert.equal(allowed.value.onboarded, true);
  assert.equal(allowed.value.radiusKm, 5);
});

test('clearAll est refusé tant qu’une clé parmi les neuf n’est pas chargée', () => {
  const gate = createHydrationGate();
  assert.equal(gate.canClear(), false);
  for (const key of STORAGE_KEYS.slice(0, -1)) gate.mark(key);
  assert.equal(gate.canClear(), false);
  gate.mark(STORAGE_KEYS[STORAGE_KEYS.length - 1]);
  assert.equal(gate.canClear(), true);
  assert.deepEqual([...STORAGE_KEYS], ['prefs', 'cooks', 'dishes', 'slots', 'orders', 'reviews', 'reports', 'favorites', 'cart']);
});

test('Continuer quand même : orders, prefs, favorites et cart ne sont pas écrasés, la lecture tardive gagne', () => {
  const gate = createHydrationGate();
  const cases = [
    { key: 'orders', empty: [] as string[], saved: ['ord_real'] },
    { key: 'prefs', empty: { buyerName: '' }, saved: { buyerName: 'Mohamed' } },
    { key: 'favorites', empty: { dishes: [] as string[] }, saved: { dishes: ['demo-d1'] } },
    { key: 'cart', empty: { cookId: null, lines: [] as string[] }, saved: { cookId: 'demo-c1', lines: ['demo-d1'] } },
  ] as const;
  for (const row of cases) {
    const blocked = persistDecision(gate, row.key, row.empty, row.empty);
    assert.equal(blocked.write, false, row.key);
    const waiting = memoryAfterLoad(false, row.saved, row.empty);
    assert.equal(waiting.hydrated, false);
    assert.deepEqual(waiting.memory, row.empty);
    const arrived = memoryAfterLoad(true, row.saved, row.empty);
    assert.equal(arrived.hydrated, true);
    assert.deepEqual(arrived.memory, row.saved);
    assert.equal(settleLoad(gate, row.key, true), true);
    const later = persistDecision(gate, row.key, arrived.memory, arrived.memory);
    assert.equal(later.write, true);
    assert.deepEqual(later.value, row.saved);
  }
});

test('un remount retire la permission : le prochain save ne peut pas écraser avec le panier vide', () => {
  const gate = createHydrationGate();
  gate.mark('cart');
  gate.unmark('cart');
  const empty = { cookId: null, lines: [] as { dishId: string; qty: number }[] };
  const decision = persistDecision(gate, 'cart', empty, { cookId: 'cook_x', lines: [{ dishId: 'd', qty: 1 }] });
  assert.equal(decision.write, false);
  assert.deepEqual(decision.value, empty);
});
