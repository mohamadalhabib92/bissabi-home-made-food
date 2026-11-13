import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyQualification } from './cookQualification';
import { buildBissabiChFeed, cookEligibleForBissabiCh, feedContainsPersonalField } from './bissabiChExport';
import type { Cook, Dish } from './model';
import { demoMarket } from './seed';

test('le flux démo n’inclut que des cooks qualifiés avec un plat publié', () => {
  const feed = buildBissabiChFeed({ generatedAt: '2026-11-13T10:00:00.000Z' });
  assert.equal(feed.brand, 'Home Made Food by Bissabi');
  assert.equal(feed.untilLaunch, 'demo');
  assert.ok(feed.cooks.length > 0);
  assert.ok(feed.dishes.length > 0);
  const { cooks, dishes } = demoMarket();
  for (const c of feed.cooks) {
    const raw = cooks.find((x) => x.id === c.id)!;
    assert.equal(cookEligibleForBissabiCh(raw, dishes), true);
    assert.ok(c.badges.includes('cuisinier_independant'));
    assert.ok(c.badges.includes('qualification'));
    assert.equal(c.city.length > 0, true);
  }
  const cookIds = new Set(feed.cooks.map((c) => c.id));
  for (const d of feed.dishes) {
    assert.ok(cookIds.has(d.cookId));
  }
});

test('un cook sans badge ou sans plat publié est exclu', () => {
  const { cooks, dishes } = demoMarket();
  const base = cooks[0];
  const noBadge: Cook = { ...base, id: 'x-nobadge', qualification: emptyQualification() };
  const noDish: Cook = { ...base, id: 'x-nodish' };
  assert.equal(cookEligibleForBissabiCh(noBadge, dishes), false);
  assert.equal(cookEligibleForBissabiCh(noDish, dishes.filter((d) => d.cookId !== noDish.id)), false);
  const feed = buildBissabiChFeed({ cooks: [noBadge, noDish, base], dishes });
  assert.deepEqual(feed.cooks.map((c) => c.id), [base.id]);
});

test('le flux ne contient pas de données personnelles hors nom, ville, canton, photo', () => {
  const feed = buildBissabiChFeed();
  assert.equal(feedContainsPersonalField(feed), null);
  for (const c of feed.cooks) {
    assert.equal('npa' in c, false);
    assert.equal('lat' in c, false);
    assert.equal('lng' in c, false);
    assert.equal('bio' in c, false);
    assert.equal('story' in c, false);
    assert.equal('email' in c, false);
    assert.equal('address' in c, false);
    const keys = Object.keys(c).sort();
    for (const k of keys) {
      assert.ok(['id', 'displayName', 'city', 'canton', 'photo', 'badges', 'demo'].includes(k), k);
    }
  }
});

test('une boisson maison ne passe pas dans le flux public', () => {
  const { cooks, dishes } = demoMarket();
  const drink: Dish = {
    ...dishes[0],
    id: 'x-bissap',
    title: 'Bissap maison',
    description: 'Jus d’hibiscus',
    category: 'boisson_maison',
    active: true,
  };
  const feed = buildBissabiChFeed({ cooks, dishes: [...dishes, drink] });
  assert.equal(feed.dishes.some((d) => d.id === 'x-bissap'), false);
});
