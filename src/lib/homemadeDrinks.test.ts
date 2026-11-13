import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publishIssues } from './dishPublish';
import { homemadeDrinkHit, isBannedDrinkCategory, HOMEMADE_DRINK_MESSAGE } from './homemadeDrinks';
import { demoMarket } from './seed';

const okDraft = {
  allergenStatus: Object.fromEntries([
    'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'nuts',
    'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs',
  ].map((k) => [k, 'absent' as const])),
  ingredients: [{ name: 'Riz', qty: 100 }],
  photo: 'x',
  conservation: 'frigo',
  reheating: 'chaud',
  animalOrigin: 'none' as const,
  isBakery: false,
  qualificationValid: true,
};

test('la catégorie boisson maison est interdite, pas les plats', () => {
  assert.equal(isBannedDrinkCategory('boisson_maison'), true);
  assert.equal(isBannedDrinkCategory('boisson maison'), true);
  assert.equal(isBannedDrinkCategory('drink'), true);
  assert.equal(isBannedDrinkCategory('plat'), false);
  assert.equal(isBannedDrinkCategory('dessert'), false);
  assert.equal(isBannedDrinkCategory(undefined), false);
});

test('le garde-fou refuse toutes les boissons maison typiques, pas seulement le bissap', () => {
  const drinks = [
    { title: 'Bissap maison' },
    { title: 'Jus de gingembre' },
    { title: 'Bouye' },
    { title: 'Lait caillé' },
    { title: 'Jus d’orange pressé' },
    { title: 'Smoothie mangue' },
    { title: 'Thé glacé maison' },
    { title: 'Kombucha' },
    { title: 'Limonade au citron' },
    { description: 'Boisson maison au pain de singe' },
    { category: 'boisson_maison', title: 'Eau de fleurs' },
  ];
  for (const d of drinks) {
    assert.equal(homemadeDrinkHit(d), true, `devrait refuser ${JSON.stringify(d)}`);
  }
});

test('ne pas confondre un plat avec une boisson (jus de citron, bouillon, vin cuit)', () => {
  const foods = [
    { title: 'Thiéboudienne (démo)', description: 'Riz brisé au poisson, légumes fondants, sauce tomate au nététou.' },
    { title: 'Yassa poulet (démo)', description: 'Poulet mariné citron-oignon, riz, olive.' },
    { title: 'Couscous royal (démo)', description: 'Semoule roulée main, légumes, poulet et merguez halal, bouillon à part.' },
    { title: 'Tarte au vin cuit (démo)', description: 'Pâte, pommes, vin cuit.' },
    { title: 'Papet vaudois (démo)', description: 'Poireaux et pommes de terre à la crème.' },
    { title: 'Tajine poulet citron confit (démo)', description: 'Olives violettes, citron confit maison, pain khobz à part.' },
    { title: 'The best kebab of the year', description: 'Assiette kebab.' },
  ];
  for (const d of foods) {
    assert.equal(homemadeDrinkHit(d), false, `faux positif : ${d.title}`);
  }
});

test('aucun plat du catalogue démo n’est une boisson maison', () => {
  const { dishes } = demoMarket();
  assert.ok(dishes.length >= 30);
  const bad = dishes.filter((d) => homemadeDrinkHit(d));
  assert.deepEqual(bad.map((d) => d.title), []);
});

test('publishIssues bloque une boisson maison avec le message court', () => {
  const issues = publishIssues({
    ...okDraft,
    title: 'Bissap',
    description: 'Jus de fleur d’hibiscus maison',
    category: 'boisson_maison',
  });
  assert.ok(issues.includes('homemade_drink'));
  assert.equal(HOMEMADE_DRINK_MESSAGE.fr, 'Les boissons faites maison ne sont pas acceptées sur la plateforme.');
  assert.equal(HOMEMADE_DRINK_MESSAGE.en, 'Homemade drinks are not accepted on the platform.');
});

test('un plat complet sans boisson n’ajoute pas homemade_drink', () => {
  const issues = publishIssues({
    ...okDraft,
    title: 'Thiéboudienne',
    description: 'Riz au poisson',
    category: 'plat',
  });
  assert.equal(issues.includes('homemade_drink'), false);
});
