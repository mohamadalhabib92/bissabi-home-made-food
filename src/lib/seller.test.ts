import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COMMISSION_RATE } from './pricing';
import { belowMinimum, leadHoursAllowed, leadHoursMax, minPortionsOf, sellerKindOf, slotCapacityMax } from './seller';

test('une fiche sans type reste une cuisine maison, sans valeur inventée', () => {
  assert.equal(sellerKindOf(undefined), 'home');
  assert.equal(sellerKindOf({}), 'home');
  assert.equal(sellerKindOf({ sellerKind: 'caterer' }), 'caterer');
  assert.equal(minPortionsOf({}), 1);
  assert.equal(minPortionsOf({ sellerKind: 'caterer' }), 1);
  assert.equal(minPortionsOf({ sellerKind: 'caterer', minPortions: 8 }), 8);
  assert.equal(belowMinimum({ sellerKind: 'caterer', minPortions: 8 }, 7), true);
  assert.equal(belowMinimum({ sellerKind: 'caterer', minPortions: 8 }, 8), false);
  assert.equal(belowMinimum({ sellerKind: 'home', minPortions: 8 }, 1), false);
});

test('le traiteur peut viser plus grand, la commission reste 10 % pour les deux', () => {
  assert.equal(slotCapacityMax('home'), 100);
  assert.ok(slotCapacityMax('caterer') > slotCapacityMax('home'));
  assert.equal(leadHoursMax('home'), 168);
  assert.ok(leadHoursMax('caterer') > leadHoursMax('home'));
  assert.equal(leadHoursAllowed('home', 24), true);
  assert.equal(leadHoursAllowed('home', 200), false);
  assert.equal(leadHoursAllowed('caterer', 200), true);
  assert.equal(leadHoursAllowed('caterer', 12), false);
  assert.equal(COMMISSION_RATE, 0.1);
});
