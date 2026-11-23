import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  buyerVisibleSlots,
  checkoutOffer,
  historicalRecordsUnchanged,
  launchPayment,
  newOrderFulfilment,
  prepareLaunchCheckout,
} from './launchCheckout';
import { LOCATION_STORED_EN, LOCATION_STORED_FR } from './privacyCopy';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

const history = [
  { id: 'ord_old', mode: 'delivery' as const, address: 'Rue privée 4, 1008 Prilly', buyerName: 'Mohamed' },
  { id: 'ord_pick', mode: 'pickup' as const, address: undefined, buyerName: 'Sara' },
];
const cart = [{ cookId: 'cook_1', lines: [{ dishId: 'd1', qty: 2 }], note: 'sonnette' }];

test('le nouveau checkout ne propose que le retrait', () => {
  for (const requested of [undefined, null, '', 'pickup', 'delivery', 'stripe']) {
    const offer = checkoutOffer(requested);
    assert.equal(offer.mode, 'pickup');
    assert.equal(offer.deliveryOffered, false);
    assert.deepEqual([...offer.selectable], ['pickup']);
    assert.equal(offer.selectable.includes('delivery' as 'pickup'), false);
  }
  assert.equal(checkoutOffer('delivery').promptPickup, true);
  assert.equal(checkoutOffer('pickup').promptPickup, false);
  assert.equal(checkoutOffer(undefined).promptPickup, false);
});

test('un panier qui demandait la livraison invite au retrait sans réécrire l’historique ni le panier', () => {
  const beforeOrders = structuredClone(history);
  const beforeCart = structuredClone(cart);
  const prepared = prepareLaunchCheckout(history, cart, 'delivery');
  assert.equal(prepared.offer.promptPickup, true);
  assert.deepEqual(prepared.next, { mode: 'pickup', address: undefined });
  assert.equal(prepared.history, history);
  assert.equal(prepared.cart, cart);
  assert.deepEqual(history, beforeOrders);
  assert.deepEqual(cart, beforeCart);
  assert.equal(history[0].mode, 'delivery');
  assert.equal(history[0].address, 'Rue privée 4, 1008 Prilly');
  assert.equal(newOrderFulfilment().address, undefined);
});

test('les créneaux livraison seule sont masqués, les enregistrements d’origine restent intacts', () => {
  const slots = [
    { id: 'both', modes: ['pickup', 'delivery'] as const },
    { id: 'drop', modes: ['delivery'] as const },
    { id: 'take', modes: ['pickup'] as const },
  ];
  const visible = buyerVisibleSlots(slots);
  assert.deepEqual(visible.map((slot) => slot.id), ['both', 'take']);
  assert.equal(slots[1].modes[0], 'delivery');
  assert.equal(historicalRecordsUnchanged(slots), slots);
});

test('le paiement du lancement n’appelle ni Stripe ni un serveur', () => {
  const payment = launchPayment();
  assert.equal(payment.callsStripe, false);
  assert.equal(payment.callsBackend, false);
  assert.equal(payment.simulated, true);
});

test('les écrans de commande ne proposent plus la livraison ni un Stripe actif', () => {
  const checkout = readFileSync(new URL('../app/checkout.tsx', import.meta.url), 'utf8');
  const cartScreen = readFileSync(new URL('../app/(tabs)/cart.tsx', import.meta.url), 'utf8');
  assert.equal(checkout.includes("value: 'delivery'"), false);
  assert.equal(checkout.includes('Paiement sécurisé par Stripe'), false);
  assert.equal(cartScreen.includes("value: 'delivery'"), false);
  assert.equal(checkout.includes('launchPayment'), true);
  assert.equal(checkout.includes('prepareLaunchCheckout'), true);
});

test('la position est décrite comme enregistrée localement, pas comme absente', () => {
  assert.equal(fr.locationStored, LOCATION_STORED_FR);
  assert.equal(en.locationStored, LOCATION_STORED_EN);
  const files = ['app.json', 'store/ios-metadata.md', 'src/app/privacy.tsx', 'src/i18n/fr.ts'];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.equal(/n['’]est ni conserv/.test(text), false, file);
    assert.equal(/n['’]est pas conserv/.test(text), false, file);
  }
  const app = readFileSync('app.json', 'utf8');
  assert.equal(app.includes(LOCATION_STORED_FR), true);
  assert.equal(readFileSync('src/app/privacy.tsx', 'utf8').includes('locationStored'), true);
  assert.match(LOCATION_STORED_FR, /enregistrée dans les préférences/);
  assert.match(LOCATION_STORED_FR, /n'est pas envoyée à un serveur/);
  assert.doesNotMatch(LOCATION_STORED_FR, /effacée par défaut|déjà effacée|n'est pas conservée/);
});
