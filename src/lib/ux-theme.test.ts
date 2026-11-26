import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { APP_PREFIX, KEY_SHAPE, QUARANTINE_PREFIX } from './preserve';
import {
  DARK,
  LIGHT,
  applyScheme,
  contrastRatio,
  glassBackdrop,
  palette,
  spacing,
  theme,
  hit,
  type Scheme,
  type VerreColors,
} from '../ui/theme';

const INK: (keyof VerreColors)[] = ['text', 'muted', 'primary', 'accentInk', 'danger', 'success', 'warning', 'info'];
const SURFACES: (keyof VerreColors)[] = ['bg', 'surface', 'surfaceAlt'];

function assertInk(colors: VerreColors, scheme: Scheme) {
  for (const bg of SURFACES) {
    for (const fg of INK) {
      const ratio = contrastRatio(String(colors[fg]), String(colors[bg]));
      assert.ok(ratio >= 4.5, `${scheme} ${fg} sur ${bg} = ${ratio.toFixed(2)}`);
    }
  }
  const glass = glassBackdrop(scheme);
  for (const fg of INK) {
    const ratio = contrastRatio(String(colors[fg]), glass);
    assert.ok(ratio >= 4.5, `${scheme} ${fg} sur verre ${glass} = ${ratio.toFixed(2)}`);
  }
  for (const [fg, bg] of [
    ['onPrimary', 'primary'],
    ['danger', 'dangerBg'],
    ['success', 'successBg'],
    ['warning', 'warningBg'],
    ['info', 'infoBg'],
    ['accentInk', 'accentBg'],
  ] as const) {
    const ratio = contrastRatio(colors[fg], colors[bg]);
    assert.ok(ratio >= 4.5, `${scheme} ${fg} sur ${bg} = ${ratio.toFixed(2)}`);
  }
}

test('verre clair et sombre : texte AA sur fond, surfaces, verre composé et pastilles', () => {
  assertInk(LIGHT, 'light');
  assertInk(DARK, 'dark');
});

test('le thème clair reste celui de la marque, et applyScheme est réversible', () => {
  assert.equal(LIGHT.primary, palette.primary);
  assert.equal(LIGHT.bg, palette.background);
  assert.equal(LIGHT.primary, '#C8152A');
  applyScheme('dark');
  assert.equal(theme.bg, DARK.bg);
  assert.equal(theme.surfaceGlass, DARK.surfaceGlass);
  applyScheme('light');
  assert.equal(theme.bg, palette.background);
  assert.equal(theme.primary, '#C8152A');
  assert.equal(theme.surfaceGlass, LIGHT.surfaceGlass);
});

test('espacement, typo et cible tactile sont des jetons stables', () => {
  assert.equal(hit, 44);
  assert.equal(theme.hit, 44);
  assert.equal(spacing.xs, 8);
  for (const value of Object.values(spacing)) assert.equal(value % 4, 0);
  assert.ok(theme.type.body >= 16);
  assert.ok(theme.leading.body >= theme.type.body);
  assert.ok(theme.radius >= 12);
});

test('les clés de stockage existantes ne changent pas', () => {
  assert.equal(APP_PREFIX, '@bissabi-home-made-food/');
  assert.equal(QUARANTINE_PREFIX, '@bissabi-home-made-food-quarantine/');
  assert.deepEqual(Object.keys(KEY_SHAPE).sort(), ['cart', 'cooks', 'couriers', 'dishes', 'favorites', 'orders', 'prefs', 'reports', 'reviews', 'slots']);
  const access = readFileSync(new URL('../ui/access.ts', import.meta.url), 'utf8');
  assert.match(access, /export const VIBRATIONS_KEY = '@bissabi-home-made-food\/pref\.vibrations'/);
});
