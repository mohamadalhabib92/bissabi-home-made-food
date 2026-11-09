import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chPilotMarket, liveGaps, pilotGaps, zoneForPostal } from './markets';
import { formatMoney, minorFromDecimal, money, percentMinor, roundMinor } from './money';
import { formatZoned, utcFromLocal } from './time';

test('les montants restent des entiers, et l’arrondi suit la devise', () => {
  assert.throws(() => money(1.5, 'CHF'), /minor_not_integer/);
  assert.equal(percentMinor(1800, 1500, 5), 270);
  assert.equal(percentMinor(1950, 1500, 5), 295);
  assert.equal(percentMinor(1950, 1500, 1), 293);
  assert.equal(roundMinor(10, 1), 10);
  assert.equal(minorFromDecimal(17, 'CHF'), 1700);
  assert.equal(minorFromDecimal(17, 'JPY'), 17);
  const label = formatMoney(money(1800, 'EUR'), 'fr-CH');
  assert.match(label, /18/);
  assert.equal(label.includes('CHF'), false);
});

test('un créneau garde l’UTC et le fuseau, l’heure d’été change l’instant', () => {
  assert.equal(utcFromLocal('2026-11-12', '18:00', 'Europe/Zurich'), '2026-11-12T17:00:00.000Z');
  assert.equal(utcFromLocal('2026-07-12', '18:00', 'Europe/Zurich'), '2026-07-12T16:00:00.000Z');
  const winter = formatZoned({ at: '2026-11-12T17:00:00.000Z', zone: 'Europe/Zurich' }, 'fr-CH');
  const dakar = formatZoned({ at: '2026-11-12T17:00:00.000Z', zone: 'Africa/Dakar' }, 'fr-CH');
  assert.notEqual(winter, dakar);
  assert.match(winter, /18:00|18 h/);
});

test('le marché suisse est une donnée, et il n’est pas prêt pour une vente réelle', () => {
  const market = chPilotMarket();
  assert.equal(pilotGaps(market).length, 0);
  assert.equal(liveGaps(market).includes('counsel'), true);
  assert.equal(liveGaps(market).includes('live_payment'), true);
  assert.equal(liveGaps(market).includes('tax'), true);
  assert.equal(zoneForPostal(market, '1008')?.city, 'Prilly');
  assert.equal(zoneForPostal(market, '1200'), null);
  const other = chPilotMarket();
  other.currency = 'EUR';
  other.zones = other.zones.map((zone) => ({ ...zone, deliveryFeeMinor: 450 }));
  assert.equal(other.zones[0].deliveryFeeMinor, 450);
  assert.equal(chPilotMarket().currency, 'CHF');
  assert.equal(market.compliance.claim, 'internal_only');
});
