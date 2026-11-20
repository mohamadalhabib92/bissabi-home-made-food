import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STORAGE_KEYS } from './persistGuard';
import { QUARANTINE_INDEX_KEY, type QuarantineRecord } from './preserve';
import { createQuarantineIndex } from './quarantineWrite';

function memoryIndex() {
  const mem = new Map<string, string>();
  let writes = 0;
  const index = createQuarantineIndex({
    async getItem(key) {
      const value = mem.get(key) ?? null;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return value;
    },
    async setItem(key, value) {
      writes += 1;
      mem.set(key, value);
    },
    async removeItem(key) {
      mem.delete(key);
    },
  });
  return {
    index,
    read(): Record<string, QuarantineRecord> {
      return JSON.parse(mem.get(QUARANTINE_INDEX_KEY) ?? '{}') as Record<string, QuarantineRecord>;
    },
    get writes() {
      return writes;
    },
    seed(map: Record<string, QuarantineRecord>) {
      mem.set(QUARANTINE_INDEX_KEY, JSON.stringify(map));
    },
  };
}

test('neuf captures simultanées gardent chaque copie, y compris celle déjà là', async () => {
  const store = memoryIndex();
  const existing: QuarantineRecord = {
    key: 'prefs',
    reason: 'malformed',
    raw: 'deja-la',
    capturedAt: '2026-11-01T00:00:00.000Z',
    conflicts: [{ raw: 'ancien', reason: 'current', at: '2026-11-02T00:00:00.000Z' }],
  };
  store.seed({ prefs: existing });

  await Promise.all(
    STORAGE_KEYS.map((key) => store.index.capture(key, 'malformed', `brut-${key}`)),
  );

  const stored = store.read();
  assert.deepEqual(Object.keys(stored).sort(), [...STORAGE_KEYS].sort());
  assert.deepEqual(stored.prefs, existing);
  for (const key of STORAGE_KEYS) {
    if (key === 'prefs') continue;
    assert.equal(stored[key].key, key);
    assert.equal(stored[key].reason, 'malformed');
    assert.equal(stored[key].raw, `brut-${key}`);
    assert.deepEqual(stored[key].conflicts, []);
    assert.equal(typeof stored[key].capturedAt, 'string');
  }
});

test('deux captures simultanées de la même clé gardent la première chaîne', async () => {
  const store = memoryIndex();
  await Promise.all([
    store.index.capture('orders', 'malformed', 'premiere'),
    store.index.capture('orders', 'future-schema', 'seconde'),
  ]);
  const stored = store.read();
  assert.deepEqual(Object.keys(stored), ['orders']);
  assert.equal(stored.orders.raw, 'premiere');
  assert.equal(stored.orders.reason, 'malformed');
  assert.deepEqual(stored.orders.conflicts, []);
  assert.equal(store.writes, 1);
});

test('index illisible : la capture n’écrit rien', async () => {
  let writes = 0;
  const index = createQuarantineIndex({
    async getItem() {
      return '{';
    },
    async setItem() {
      writes += 1;
    },
    async removeItem() {},
  });
  await index.capture('orders', 'malformed', 'brut');
  assert.equal(writes, 0);
});
