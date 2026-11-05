import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MOCK_PARTNERS, advanceMockTracking, quoteAll } from './deliveryPartners';

test('providers mock renvoient un devis marqué mock', async () => {
  assert.ok(MOCK_PARTNERS.length >= 3);
  const quotes = await quoteAll(3, new Date().toISOString());
  assert.equal(quotes.length, MOCK_PARTNERS.length);
  for (const q of quotes) {
    assert.equal(q.mock, true);
    assert.equal(q.currency, 'CHF');
    assert.ok(q.feeChf >= 0);
    assert.ok(q.etaMinutesMax >= q.etaMinutesMin);
  }
});

test('tracking mock avance jusqu’à delivered', async () => {
  const p = MOCK_PARTNERS[0];
  const quote = await p.quote({ distanceKm: 2, readyAtISO: new Date().toISOString() });
  const job = await p.requestJob('ord_test', quote);
  let state = job.state;
  for (let i = 0; i < 8; i++) {
    const next = advanceMockTracking(job.id);
    assert.ok(next);
    state = next!.state;
    if (state === 'delivered') break;
  }
  assert.equal(state, 'delivered');
});
