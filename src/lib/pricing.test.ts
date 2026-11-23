import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COMMISSION_PAID_BY, COMMISSION_RATE, cookNetFromStored, quote } from './pricing';

test('les nouvelles commandes retiennent 10 % sur le cuisinier', () => {
  assert.equal(COMMISSION_RATE, 0.1);
  assert.equal(COMMISSION_PAID_BY, 'cook');
  const q = quote([{ qty: 2, unitPrice: 19.5 }], 'pickup');
  assert.equal(q.subtotal, 39);
  assert.equal(q.commission, 3.9);
  assert.equal(q.deliveryFee, 0);
  assert.equal(q.total, 39);
  assert.equal(q.cookNet, 35.1);
});

test('une commande déjà enregistrée à 15 % côté client n’est pas réinterprétée', () => {
  const stored = { subtotal: 39, commission: 5.85, deliveryFee: 0, total: 44.85 };
  assert.equal(cookNetFromStored(stored), 39);
  const next = quote([{ qty: 2, unitPrice: 19.5 }], 'pickup');
  assert.equal(cookNetFromStored({ subtotal: next.subtotal, commission: next.commission, deliveryFee: next.deliveryFee, total: next.total }), next.cookNet);
});
