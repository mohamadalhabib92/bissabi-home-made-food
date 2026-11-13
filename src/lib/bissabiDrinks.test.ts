import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BISSABI_DEMO_PRODUCTS,
  BISSABI_FREE_DELIVERY_FROM_CHF,
  bissabiOfferState,
  setBissabiQty,
} from './bissabiDrinks';

test('les produits démo n’inventent pas de prix : placeholders YOUR_*', () => {
  assert.ok(BISSABI_DEMO_PRODUCTS.length >= 2);
  for (const p of BISSABI_DEMO_PRODUCTS) {
    assert.equal(p.priceLabel, 'YOUR_PRICE_CHF');
    assert.equal(p.demo, true);
    assert.equal(p.example, true);
  }
  assert.equal(BISSABI_FREE_DELIVERY_FROM_CHF, 36);
});

test('upsell Bissabi seulement dans le canton de Vaud', () => {
  assert.equal(bissabiOfferState({ locationCanton: 'VD' }), 'available');
  assert.equal(bissabiOfferState({ canton: 'VD' }), 'available');
  assert.equal(bissabiOfferState({ address: 'Chemin de la Suettaz 17, 1008 Prilly' }), 'available');
  assert.equal(bissabiOfferState({ address: 'Rue du Rhône 1, 1204 Genève' }), 'coming_soon');
  assert.equal(bissabiOfferState({ locationCanton: 'GE' }), 'coming_soon');
  assert.equal(bissabiOfferState({}), 'coming_soon');
  // L’adresse prime : un profil VD avec livraison à Genève → bientôt
  assert.equal(bissabiOfferState({ locationCanton: 'VD', address: '1201 Genève' }), 'coming_soon');
  assert.equal(bissabiOfferState({ locationCanton: 'GE', address: '1003 Lausanne' }), 'available');
});

test('setBissabiQty retire la ligne à zéro et plafonne', () => {
  const a = setBissabiQty([], 'bissabi-demo-bottle-a', 2);
  assert.deepEqual(a, [{ productId: 'bissabi-demo-bottle-a', qty: 2 }]);
  assert.deepEqual(setBissabiQty(a, 'bissabi-demo-bottle-a', 0), []);
  assert.equal(setBissabiQty(a, 'bissabi-demo-bottle-a', 99)[0].qty, 20);
});
