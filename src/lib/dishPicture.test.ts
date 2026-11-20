import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { DEMO_DISH_IDS, chooseDishPicture } from './dishPicture';
import { demoMarket } from './seed';

const catalog = Object.fromEntries(DEMO_DISH_IDS.map((id) => [id, `asset:${id}`]));

test('une photo de cuisinier gagne sur le catalogue et n’est pas réécrite', () => {
  const dish = { id: 'demo-d1', photo: 'file:///chef/thieb.jpg', title: 'Thiéboudienne maison' };
  const before = JSON.stringify(dish);
  const chosen = chooseDishPicture(dish, catalog);
  assert.equal(chosen.kind, 'upload');
  if (chosen.kind === 'upload') assert.equal(chosen.source.uri, 'file:///chef/thieb.jpg');
  assert.equal(JSON.stringify(dish), before);
});

test('un plat de démo sans photo reçoit le visuel du catalogue, l’objet reste intact', () => {
  for (const dish of demoMarket().dishes) {
    assert.equal(dish.photo, undefined);
    const before = JSON.stringify(dish);
    const chosen = chooseDishPicture(dish, catalog);
    assert.equal(chosen.kind, 'catalog');
    if (chosen.kind === 'catalog') assert.equal(chosen.source, `asset:${dish.id}`);
    assert.equal(JSON.stringify(dish), before);
  }
});

test('une photo vide ou un plat hors catalogue n’invente pas d’image', () => {
  assert.equal(chooseDishPicture({ id: 'demo-d2', photo: '   ' }, catalog).kind, 'catalog');
  assert.equal(chooseDishPicture({ id: 'ord_user_dish' }, catalog).kind, 'none');
  assert.equal(chooseDishPicture({ id: 'ord_user_dish', photo: 'data:image/jpeg;base64,abc' }, catalog).kind, 'upload');
});

test('chaque plat de démo a un fichier et une fiche de crédit', () => {
  const credits = readFileSync('assets/dishes/CREDITS.md', 'utf8');
  for (const id of DEMO_DISH_IDS) {
    assert.equal(credits.includes(id), true, id);
  }
  for (const file of [
    'thieboudienne.webp',
    'mafe-poulet.webp',
    'couscous-royal.webp',
    'tajine-citron.webp',
    'papet-vaudois.webp',
    'tarte-vin-cuit.webp',
    'gyoza-porc.webp',
    'dan-dan.webp',
    'mezze.webp',
    'maamoul.webp',
  ]) {
    assert.equal(existsSync(`assets/dishes/${file}`), true, file);
    assert.equal(credits.includes(file), true, file);
  }
});
