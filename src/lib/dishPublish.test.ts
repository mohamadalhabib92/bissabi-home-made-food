import assert from 'node:assert/strict';
import { test } from 'node:test';
import { statusFromDish } from './dishPublish';

test('une fiche ancienne ne pré-coche pas Absent : seuls les Présents sont repris', () => {
  const status = statusFromDish({
    allergens: ['fish', 'celery'],
    allergensConfirmed: true,
  });
  assert.equal(status.fish, 'present');
  assert.equal(status.celery, 'present');
  assert.equal(status.milk, undefined);
  assert.equal(status.gluten, undefined);
  assert.equal(Object.values(status).includes('absent'), false);
});

test('un statut déjà enregistré, y compris Absent choisi, est recopié tel quel', () => {
  const status = statusFromDish({
    allergens: ['fish'],
    allergensConfirmed: true,
    allergenStatus: { fish: 'present', milk: 'absent' },
  });
  assert.equal(status.fish, 'present');
  assert.equal(status.milk, 'absent');
  assert.equal(status.gluten, undefined);
});
