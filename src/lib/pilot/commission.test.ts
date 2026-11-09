import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shareBps } from '../global/money';
import { chPilotMarket } from '../global/markets';
import { quote } from '../pricing';
import { PILOT_AT, readyToOrder } from './demo';
import {
  applyPaymentEvent,
  changePayoutIban,
  cookFigures,
  createPayout,
  paySimulated,
  quotePortion,
  reservePortion,
  verifyKitchenKyc,
  type Actor,
} from './engine';
import { simulatedSignature } from './payment';

const at = PILOT_AT;
const payAt = '2026-11-10T08:05:00.000Z';
const admin: Actor = { id: 'admin', role: 'admin', mfa: true, marketIds: ['ch-vd'] };
const amina: Actor = { id: 'amina', role: 'kitchen', kitchenId: 'kitchen_amina' };
const sara: Actor = { id: 'sara', role: 'buyer' };

test('la commission par défaut est 10 % du sous-total, au centime près', () => {
  assert.equal(chPilotMarket().commissionRateBps, 1000);
  const cases: [number, number][] = [
    [10_000, 1000],
    [1800, 180],
    [1999, 200],
    [333, 33],
    [5, 1],
    [1, 0],
  ];
  for (const [amount, expected] of cases) {
    assert.equal(shareBps(amount, 1000), expected, String(amount));
  }
  const quoted = quotePortion(chPilotMarket(), 1800, 1, 'delivery', '1008');
  assert.equal(quoted.commissionMinor, 180);
  assert.equal(quoted.totalMinor, 2400);
  assert.equal(quoted.cookNetMinor, 1620);
  assert.equal(quoted.deliveryFeeMinor, 600);
  const cart = quote([{ qty: 1, unitPrice: 18 }], 'delivery');
  assert.equal(cart.commission, 1.8);
  assert.equal(cart.total, 24);
  assert.equal(cart.cookNet, 16.2);
  assert.equal(cart.commissionRateBps, 1000);
});

test('un remboursement partiel réduit la commission au prorata, un doublon ne la double pas', () => {
  const reserved = reservePortion(readyToOrder(), sara, {
    dishId: 'dish_mafe', slotId: 'slot_1', qty: 1, mode: 'pickup', postal: '1008', at,
  });
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const paid = paySimulated(reserved.state, reserved.value.id, payAt);
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.equal(paid.state.orders[0].commissionRateBps, 1000);
  assert.equal(paid.state.ledger[0].commissionMinor, 180);
  assert.equal(paid.state.ledger[0].owedCookMinor, 1620);
  const again = applyPaymentEvent(paid.state, paid.value.event, simulatedSignature(paid.value.event.id), payAt);
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.equal(again.value.duplicate, true);
  assert.equal(again.state.ledger.reduce((sum, entry) => sum + entry.commissionMinor, 0), 180);
  const changed = { ...again.state, market: { ...again.state.market, commissionRateBps: 500 } };
  const refund = applyPaymentEvent(changed, {
    id: 'evt_refund_half',
    orderId: reserved.value.id,
    kind: 'refunded',
    amountMinor: 900,
    currency: 'CHF',
    dishRefundMinor: 900,
  }, simulatedSignature('evt_refund_half'), payAt);
  assert.equal(refund.ok, true);
  if (!refund.ok) return;
  const view = cookFigures(refund.state.orders[0]);
  assert.equal(view.grossMinor, 900);
  assert.equal(view.commissionMinor, 90);
  assert.equal(view.netMinor, 810);
  assert.equal(view.rateBps, 1000);
  assert.equal(refund.state.ledger.reduce((sum, entry) => sum + entry.commissionMinor, 0), 90);
  const replay = applyPaymentEvent(refund.state, {
    id: 'evt_refund_half',
    orderId: reserved.value.id,
    kind: 'refunded',
    amountMinor: 900,
    currency: 'CHF',
    dishRefundMinor: 900,
  }, simulatedSignature('evt_refund_half'), payAt);
  assert.equal(replay.ok, true);
  if (!replay.ok) return;
  assert.equal(replay.value.duplicate, true);
  assert.equal(replay.state.ledger.length, 2);
});

test('le versement exige une vérification du compte, et l’IBAN exige une confirmation renforcée', () => {
  const reserved = reservePortion(readyToOrder(), sara, {
    dishId: 'dish_mafe', slotId: 'slot_1', qty: 1, mode: 'pickup', postal: '1008', at,
  });
  assert.equal(reserved.ok, true);
  if (!reserved.ok) return;
  const paid = paySimulated(reserved.state, reserved.value.id, payAt);
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.equal(paid.state.orders[0].payoutStatus, 'blocked_kyc');
  const blocked = createPayout(paid.state, amina, 'kitchen_amina', payAt);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.error, 'kyc_required');
  const iban = changePayoutIban(paid.state, amina, 'kitchen_amina', 'CH9300762011623852957', false, payAt);
  assert.equal(iban.ok, false);
  if (!iban.ok) assert.equal(iban.error, 'step_up_required');
  const verified = verifyKitchenKyc(paid.state, admin, 'kitchen_amina', payAt);
  assert.equal(verified.ok, true);
  if (!verified.ok) return;
  const payout = createPayout(verified.state, amina, 'kitchen_amina', payAt);
  assert.equal(payout.ok, true);
  if (!payout.ok) return;
  assert.equal(payout.value.grossMinor, 1800);
  assert.equal(payout.value.commissionMinor, 180);
  assert.equal(payout.value.netMinor, 1620);
  const second = createPayout(payout.state, amina, 'kitchen_amina', payAt);
  assert.equal(second.ok, false);
  if (!second.ok) assert.equal(second.error, 'nothing_to_pay');
  assert.equal(second.state.payouts.length, 1);
});
