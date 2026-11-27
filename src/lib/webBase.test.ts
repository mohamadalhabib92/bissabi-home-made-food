import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveWebBase } from '../../scripts/pwa-postbuild.mjs';

test('le site public est à la racine, GitHub Pages seulement si le préfixe est posé', () => {
  assert.equal(resolveWebBase(''), '');
  assert.equal(resolveWebBase('/'), '');
  assert.equal(resolveWebBase('  /  '), '');
  assert.equal(resolveWebBase('/bissabi-home-made-food'), '/bissabi-home-made-food');
  assert.equal(resolveWebBase('bissabi-home-made-food/'), '/bissabi-home-made-food');
});
