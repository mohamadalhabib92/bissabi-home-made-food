import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acceptDelivery, confirmDropoff, confirmPickup, courierEarnings, courierFromDraft, declineDelivery, markEnRoute, offerIfReady, visibleDeliveries } from './courierRun';
import type { Order } from './model';

const ready = { id: 'ord_1', mode: 'delivery' as const, status: 'ready' as const };
const me = { id: 'liv_1', validated: true, available: true };
const other = { id: 'liv_2', validated: true, available: true };

test('le tarif livreur n’est pas un montant inventé', () => {
  const earned = courierEarnings(3);
  assert.equal(earned.deliveries, 3);
  assert.equal(earned.amountChf, null);
  assert.equal(earned.label, 'à définir');
});

test('parcours : proposer, accepter, code cuisine, en route, code de preuve', () => {
  const offered = offerIfReady(ready);
  assert.equal(offered.delivery?.state, 'offered');
  assert.equal(offerIfReady({ ...ready, mode: 'pickup' }).delivery, undefined);
  const accepted = acceptDelivery(offered, me);
  assert.equal(accepted.ok, true);
  if (!accepted.ok) return;
  const bad = confirmPickup(accepted.order, me.id, '0000');
  assert.equal(bad.ok, false);
  const picked = confirmPickup(accepted.order, me.id, accepted.order.delivery!.pickupCode);
  assert.equal(picked.ok, true);
  if (!picked.ok) return;
  const route = markEnRoute(picked.order, me.id);
  assert.equal(route.ok, true);
  if (!route.ok) return;
  const done = confirmDropoff(route.order, me.id, route.order.delivery!.proofCode, '2026-11-26T12:00:00.000Z');
  assert.equal(done.ok, true);
  if (!done.ok) return;
  assert.equal(done.order.delivery?.state, 'delivered');
  assert.equal(done.order.status, 'completed');
});

test('un livreur non validé ou occupé ne prend pas la course, et un refus ne l’efface pas pour les autres', () => {
  const offered = offerIfReady(ready);
  assert.equal(acceptDelivery(offered, { ...me, validated: false }).ok, false);
  assert.equal(acceptDelivery(offered, { ...me, available: false }).ok, false);
  const declined = declineDelivery(offered, me.id);
  assert.equal(visibleDeliveries([declined], me).length, 0);
  assert.equal(visibleDeliveries([declined], other).length, 1);
  const taken = acceptDelivery(offered, me);
  if (!taken.ok) return;
  assert.equal(acceptDelivery(taken.order, other).ok, false);
});

test('le profil ne s’auto-valide pas', () => {
  const created = courierFromDraft({ displayName: 'Sam', vehicle: 'bike', zone: 'both', available: true, isMe: true }, 'liv_1', 't');
  assert.equal(created.validated, false);
  const kept = courierFromDraft({ displayName: 'Sam', vehicle: 'car', zone: 'lausanne', available: false, isMe: true }, 'liv_1', 't', { ...created, validated: true });
  assert.equal(kept.validated, true);
  assert.equal(kept.vehicle, 'car');
});

test('une commande déjà enregistrée sans livraison reste lisible', () => {
  const old = { id: 'old', mode: 'pickup' as const, status: 'completed' as const } satisfies Partial<Order>;
  assert.equal(offerIfReady(old).delivery, undefined);
});
