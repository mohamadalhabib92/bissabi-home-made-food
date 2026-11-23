import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALLERGENS, type Allergen, type Dish } from './model';
import { allergenDeclarationComplete, hygieneReady, ofcoBadgeVisible, saleBlock } from './saleGate';

const done = Object.fromEntries(['hands', 'cold', 'cooking', 'separation', 'allergens', 'packaging', 'traceability', 'health'].map((k) => [k, true]));

function dish(present: Allergen[], complete: boolean): Pick<Dish, 'active' | 'allergenStatus'> {
  const allergenStatus = complete
    ? Object.fromEntries(ALLERGENS.map((a) => [a.key, present.includes(a.key) ? 'present' : 'absent']))
    : Object.fromEntries(present.map((k) => [k, 'present']));
  return { active: true, allergenStatus };
}

test('les 14 allergènes sont exigés avant une vente', () => {
  assert.equal(allergenDeclarationComplete(dish(['fish'], false)), false);
  assert.equal(allergenDeclarationComplete(dish(['fish', 'celery'], true)), true);
  assert.equal(ALLERGENS.length, 14);
  assert.equal(saleBlock(dish(['fish'], false), { checklist: done }), 'allergens');
  assert.equal(saleBlock({ active: true, allergenStatus: undefined }, { checklist: done }), 'allergens');
});

test('pas de vente tant que la checklist hygiène n’est pas complète', () => {
  const ready = dish(['fish'], true);
  assert.equal(hygieneReady({ checklist: done }), true);
  assert.equal(hygieneReady({ checklist: { ...done, hands: false } }), false);
  assert.equal(hygieneReady(null), false);
  assert.equal(saleBlock(ready, { checklist: { ...done, health: false } }), 'hygiene');
  assert.equal(saleBlock(ready, { checklist: done }), null);
  assert.equal(saleBlock({ ...ready, active: false }, { checklist: done }), 'inactive');
});

test('aucun badge OFCO tant qu’un admin n’a pas vérifié', () => {
  assert.equal(ofcoBadgeVisible(undefined), false);
  assert.equal(ofcoBadgeVisible('none'), false);
  assert.equal(ofcoBadgeVisible('pending'), false);
  assert.equal(ofcoBadgeVisible('identity_verified'), false);
  assert.equal(ofcoBadgeVisible('ofco_verified'), true);
});
