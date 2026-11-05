import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAddToCart,
  canAddToCart,
  cartSubtotal,
  dishAvoidsAllergens,
  dishMatchesDiets,
  filterDishes,
  curatedRails,
} from './filters';
import type { Cook, Dish, Review, Slot } from './model';

const cook = (id: string, canton = 'VD', lat = 46.52, lng = 6.63): Cook => ({
  id, name: `${id} (démo)`, commune: 'Lausanne', npa: '1003', lat, lng, bio: '',
  halalKitchen: true, languages: ['fr'], checklist: {}, delivers: true, avatarColor: '#000',
  demo: true, createdAt: '', canton,
});

const dish = (p: Partial<Dish> & { id: string; cookId: string; title: string }): Dish => ({
  description: '', cuisine: 'sahel', price: 15, allergens: [], allergensConfirmed: true,
  halal: false, vegetarian: false, spicy: false, ingredients: [], leadHours: 24, emoji: '🍽',
  active: true, demo: true, ...p,
});

describe('dishMatchesDiets', () => {
  it('filters vegan and halal', () => {
    const d = dish({ id: '1', cookId: 'c', title: 'x', vegan: true, vegetarian: true, halal: true });
    assert.equal(dishMatchesDiets(d, ['vegan', 'halal']), true);
    assert.equal(dishMatchesDiets(d, ['glutenFree']), true); // no gluten allergen
    assert.equal(dishMatchesDiets({ ...d, allergens: ['gluten'], glutenFree: false }, ['glutenFree']), false);
  });
});

describe('dishAvoidsAllergens', () => {
  it('excludes present allergens', () => {
    const d = dish({ id: '1', cookId: 'c', title: 'x', allergens: ['peanuts', 'milk'] });
    assert.equal(dishAvoidsAllergens(d, ['peanuts']), false);
    assert.equal(dishAvoidsAllergens(d, ['fish']), true);
  });
});

describe('filterDishes', () => {
  const cooks = [cook('c1'), cook('c2', 'GE', 46.2, 6.14)];
  const dishes = [
    dish({ id: 'd1', cookId: 'c1', title: 'Thiéboudienne', price: 19, cuisine: 'sahel', halal: true, availableToday: true }),
    dish({ id: 'd2', cookId: 'c1', title: 'Fondue', price: 32, cuisine: 'swiss', vegetarian: true, familySize: true }),
    dish({ id: 'd3', cookId: 'c2', title: 'Yassa', price: 17, cuisine: 'sahel', vegan: true, vegetarian: true, allergens: ['celery'] }),
  ];
  const slots: Slot[] = [];
  const reviews: Review[] = [
    { id: 'r1', orderId: 'o', cookId: 'c1', rating: 5, text: '', author: 'a', status: 'published', at: '', demo: true },
  ];
  const dist = (c: Cook) => (c.id === 'c1' ? 1.2 : 60);

  it('respects radius and cuisine', () => {
    const rows = filterDishes(dishes, cooks, slots, reviews, dist, 5, { cuisine: 'sahel' });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].dish.id, 'd1');
  });

  it('filters by max price and family', () => {
    const rows = filterDishes(dishes, cooks, slots, reviews, dist, 5, { maxPrice: 20, familySize: true });
    assert.equal(rows.length, 0);
    const fam = filterDishes(dishes, cooks, slots, reviews, dist, 5, { familySize: true });
    assert.equal(fam.length, 1);
    assert.equal(fam[0].dish.id, 'd2');
  });

  it('builds curated rails', () => {
    const rows = filterDishes(dishes, cooks, slots, reviews, dist, 100, {});
    const rails = curatedRails(rows, cooks, reviews);
    assert.ok(rails.worldCuisines.length >= 2);
    assert.ok(rails.topCookIds.includes('c1'));
    assert.ok(rails.familySize.some((r) => r.dish.id === 'd2'));
  });
});

describe('cart', () => {
  it('blocks other cook', () => {
    const cart = { cookId: 'c1', lines: [{ dishId: 'd1', qty: 1 }] };
    assert.equal(canAddToCart(cart, 'c2'), 'other_cook');
    assert.equal(applyAddToCart(cart, 'd9', 'c2', 1), 'other_cook');
  });
  it('adds and merges qty', () => {
    const a = applyAddToCart({ cookId: null, lines: [] }, 'd1', 'c1', 2);
    assert.notEqual(a, 'other_cook');
    if (a === 'other_cook') return;
    const b = applyAddToCart(a, 'd1', 'c1', 1);
    assert.notEqual(b, 'other_cook');
    if (b === 'other_cook') return;
    assert.equal(b.lines[0].qty, 3);
    assert.equal(cartSubtotal([{ qty: 2, unitPrice: 17 }]), 34);
  });
});
