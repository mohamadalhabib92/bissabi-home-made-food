import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COMPANY } from '../company';
import { chPilotMarket, liveGaps } from '../global/markets';
import { quotePortion } from './engine';
import { describeHomeOffer } from './homeOffer';
import {
  activateKitchen,
  applyPaymentEvent,
  assignCourier,
  confirmHandover,
  confirmPickup,
  linkBatch,
  openMission,
  orderableDishes,
  paySimulated,
  publishDish,
  readOrder,
  recallLot,
  recordControl,
  reservePortion,
  saveKitchenFile,
  saveRecipe,
  type Actor,
} from './engine';
import { PILOT_AT, absentAllergens, incompleteMarket, readyToOrder } from './demo';

const at = PILOT_AT;
const payAt = '2026-11-10T08:05:00.000Z';
const admin: Actor = { id: 'admin', role: 'admin', mfa: true, marketIds: ['ch-vd'] };
const amina: Actor = { id: 'amina', role: 'kitchen', kitchenId: 'kitchen_amina' };
const sara: Actor = { id: 'sara', role: 'buyer' };
const noah: Actor = { id: 'noah', role: 'buyer' };
const luc: Actor = { id: 'luc', role: 'courier' };
const other: Actor = { id: 'other', role: 'courier' };

const orderInput = { dishId: 'dish_mafe', slotId: 'slot_1', qty: 1, mode: 'delivery' as const, postal: '1008', at };

test('un dossier cuisine incomplet empêche de commander', () => {
  const state = incompleteMarket();
  assert.equal(orderableDishes(state, '1008', at).length, 0);
  const reserved = reservePortion(state, sara, orderInput);
  assert.equal(reserved.ok, false);
  if (!reserved.ok) assert.equal(reserved.error, 'kitchen_file_incomplete');
  assert.equal(reserved.state.orders.length, 0);
  assert.equal(reserved.state, state);
});

test('deux clients sur la dernière portion : une seule réservation', () => {
  const state = readyToOrder(1);
  const first = reservePortion(state, sara, { ...orderInput, mode: 'pickup' });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const second = reservePortion(first.state, noah, { ...orderInput, mode: 'pickup' });
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.error, 'portion_taken');
  assert.equal(second.state.orders.length, 1);
  assert.equal(second.state.slots[0].held, 1);
  assert.equal(second.state.slots[0].sold, 0);
});

test('un allergène ajouté après commande fige la recette et signale la commande', () => {
  const state = readyToOrder();
  const reserved = reservePortion(state, sara, { ...orderInput, mode: 'pickup' });
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const pinned = reserved.value.recipeVersionId;
  const revised = saveRecipe(reserved.state, amina, 'dish_mafe', {
    ingredients: [{ name: 'Lait', qty: 20, unit: 'ml' }, { name: 'Riz', qty: 150, unit: 'g' }],
    allergens: { ...absentAllergens(), peanuts: 'present', milk: 'present' },
    crossContamination: ['Des fruits à coque sont préparés dans la même cuisine.'],
    crossDeclared: true,
  }, payAt);
  assert.equal(revised.ok, true);
  if (!revised.ok) return;
  const order = revised.state.orders[0];
  assert.equal(order.recipeVersionId, pinned);
  assert.equal(order.flags.includes('recipe_changed'), true);
  const frozen = revised.state.recipes.find((recipe) => recipe.id === pinned);
  const current = revised.state.recipes.find((recipe) => recipe.id === revised.value.id);
  assert.equal(frozen?.allergens.milk, 'absent');
  assert.equal(current?.allergens.milk, 'present');
  assert.notEqual(current?.id, pinned);
});

test('un événement de paiement reçu deux fois ne confirme qu’une commande et qu’une écriture', () => {
  const state = readyToOrder();
  const reserved = reservePortion(state, sara, orderInput);
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const first = paySimulated(reserved.state, reserved.value.id, payAt);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const again = applyPaymentEvent(first.state, first.value.event, `simulated.${first.value.event.id}.test`, payAt);
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.equal(again.value.duplicate, true);
  assert.equal(again.value.applied, false);
  assert.equal(again.state.ledger.length, 1);
  assert.equal(again.state.orders.filter((order) => order.paymentStatus === 'paid').length, 1);
  assert.equal(again.state, first.state);
  const forged = applyPaymentEvent(first.state, { ...first.value.event, id: 'evt_forged' }, 'nope', payAt);
  assert.equal(forged.ok, false);
  if (!forged.ok) assert.equal(forged.error, 'forged_payment');
  assert.equal(forged.state.ledger.length, 1);
});

test('un coursier qui ouvre la mission d’un autre est refusé', () => {
  const state = readyToOrder();
  const reserved = reservePortion(state, sara, orderInput);
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const paid = paySimulated(reserved.state, reserved.value.id, payAt);
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  const mission = assignCourier(paid.state, admin, reserved.value.id, luc.id, 'Rue de la Suettaz 3, 1008 Prilly', payAt);
  assert.equal(mission.ok, true);
  if (!mission.ok) return;
  const refused = openMission(mission.state, other, mission.value.id);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.error, 'courier_refused');
  assert.equal('preciseAddress' in refused, false);
  assert.equal(refused.state, mission.state);
  const opened = openMission(mission.state, luc, mission.value.id);
  assert.equal(opened.ok, true);
  if (opened.ok) assert.match(opened.value.preciseAddress, /Suettaz/);
});

test('un lot rappelé bloque la vente et retrouve les commandes liées', () => {
  const state = readyToOrder();
  const reserved = reservePortion(state, sara, { ...orderInput, mode: 'pickup' });
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const paid = paySimulated(reserved.state, reserved.value.id, payAt);
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  const linked = linkBatch(paid.state, amina, { dishId: 'dish_mafe', lotCode: 'LOT-24', ingredient: 'Pâte d’arachide', orderId: reserved.value.id, at: payAt });
  assert.equal(linked.ok, true);
  if (!linked.ok) return;
  const lotId = linked.state.lots[0].id;
  const recalled = recallLot(linked.state, admin, lotId, payAt);
  assert.equal(recalled.ok, true);
  if (!recalled.ok) return;
  assert.deepEqual(recalled.value.affectedOrderIds, [reserved.value.id]);
  assert.equal(recalled.state.dishes[0].salesBlocked, true);
  assert.equal(recalled.state.orders[0].flags.includes('recall'), true);
  const later = reservePortion(recalled.state, noah, { ...orderInput, mode: 'pickup', at: payAt });
  assert.equal(later.ok, false);
  if (!later.ok) assert.equal(later.error, 'sales_blocked');
});

test('parcours test : cuisine activée, plat, précommande, paiement simulé, livraison, reçu', () => {
  let state = incompleteMarket();
  const blocked = reservePortion(state, sara, orderInput);
  assert.equal(blocked.ok, false);
  const filed = saveKitchenFile(state, amina, 'kitchen_amina', {
    responsibleName: 'Amina Diop', documentsOk: true, hygieneOk: true, trainingOk: true,
  }, at);
  assert.equal(filed.ok, true);
  if (!filed.ok) return;
  const active = activateKitchen(filed.state, admin, 'kitchen_amina', at);
  assert.equal(active.ok, true);
  if (!active.ok) return;
  const published = publishDish(active.state, amina, 'dish_mafe', at);
  assert.equal(published.ok, true);
  if (!published.ok) return;
  state = published.state;
  const delivery = reservePortion(state, sara, orderInput);
  assert.equal(delivery.ok, true);
  if (!delivery.ok) return;
  assert.equal(delivery.value.deliveryFeeMinor, 600);
  assert.equal(delivery.value.commissionMinor, 180);
  assert.equal(delivery.value.totalMinor, 1800 + 600);
  const paid = paySimulated(delivery.state, delivery.value.id, payAt);
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  const replay = paySimulated(paid.state, delivery.value.id, payAt);
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.value.duplicate, true);
  assert.equal(replay.state.ledger.length, 1);
  const mission = assignCourier(replay.state, admin, delivery.value.id, luc.id, 'Rue de test 1, 1008 Prilly', payAt);
  assert.equal(mission.ok, true);
  if (!mission.ok) return;
  const picked = confirmPickup(mission.state, luc, mission.value.id, payAt);
  assert.equal(picked.ok, true);
  if (!picked.ok) return;
  const handed = confirmHandover(picked.state, luc, delivery.value.id, delivery.value.handoverCode ?? '', payAt);
  assert.equal(handed.ok, true);
  if (!handed.ok) return;
  assert.equal(handed.value.prepStatus, 'handed');
  assert.match(handed.value.areaLabel, /Prilly/);
  assert.equal(JSON.stringify(handed.value).includes('Rue de test'), false);
  const pickup = reservePortion(handed.state, noah, { ...orderInput, mode: 'pickup' });
  assert.equal(pickup.ok, true);
  if (!pickup.ok) return;
  assert.equal(pickup.value.deliveryFeeMinor, 0);
  const pickupPaid = paySimulated(pickup.state, pickup.value.id, payAt);
  assert.equal(pickupPaid.ok, true);
  if (!pickupPaid.ok) return;
  const pickupHand = confirmHandover(pickupPaid.state, amina, pickup.value.id, pickup.value.handoverCode ?? '', payAt);
  assert.equal(pickupHand.ok, true);
  const seller = pickupHand.state.market.compliance;
  assert.equal(seller.sellerRegistration, COMPANY.uid);
  assert.equal(liveGaps(chPilotMarket()).includes('counsel'), true);
  const priced = quotePortion(chPilotMarket(), 1800, 1, 'delivery', '1008');
  const custom = chPilotMarket();
  custom.zones = custom.zones.map((zone) => ({ ...zone, deliveryFeeMinor: 900 }));
  const repriced = quotePortion(custom, 1800, 1, 'delivery', '1008');
  assert.equal(repriced.deliveryFeeMinor - priced.deliveryFeeMinor, 300);
});

test('un écart de température au-dessus du seuil du marché suspend la vente', () => {
  const state = readyToOrder();
  const control = recordControl(state, amina, 'kitchen_amina', 'cold', 9, at);
  assert.equal(control.ok, true);
  if (!control.ok) return;
  assert.equal(control.value.blocked, true);
  assert.equal(control.state.kitchens[0].suspended, true);
  const reserved = reservePortion(control.state, sara, orderInput);
  assert.equal(reserved.ok, false);
  if (!reserved.ok) assert.equal(reserved.error, 'kitchen_suspended');
});

test('un admin d’un autre marché ne lit pas la commande', () => {
  const state = readyToOrder();
  const reserved = reservePortion(state, sara, { ...orderInput, mode: 'pickup' });
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const foreign: Actor = { id: 'admin_sn', role: 'admin', mfa: true, marketIds: ['sn-dk'] };
  const refused = readOrder(reserved.state, foreign, reserved.value.id);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.equal(refused.error, 'market_scope_refused');
  const allowed = readOrder(reserved.state, admin, reserved.value.id);
  assert.equal(allowed.ok, true);
});

test('l’accueil répond avec le plat, le créneau et le prix, sans créneau livraison seule', () => {
  const lines = describeHomeOffer({
    locale: 'fr',
    now: new Date('2026-11-10T08:00:00.000Z'),
    dishes: [
      { id: 'd1', title: 'Mafé', price: 18, active: true, cookId: 'c1', leadHours: 24 },
      { id: 'd2', title: 'Masqué', price: 9, active: false, cookId: 'c1', leadHours: 24 },
    ],
    cooks: [{ id: 'c1', name: 'Amina' }],
    slots: [
      { cookId: 'c1', date: '2026-11-12', from: '18:00', to: '19:00', modes: ['delivery'], dishIds: [] },
      { cookId: 'c1', date: '2026-11-13', from: '18:30', to: '20:00', modes: ['pickup'], dishIds: [] },
    ],
  });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].title, 'Mafé');
  assert.match(lines[0].price, /18/);
  assert.match(lines[0].when, /13/);
});
