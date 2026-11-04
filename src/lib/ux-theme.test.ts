import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DARK, LIGHT, applyScheme, palette, theme } from '../ui/theme';

const lum = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test('mode sombre : texte courant AA (≥ 4,5:1) sur fond et surfaces', () => {
  for (const bg of [DARK.bg, DARK.surface, DARK.surfaceAlt]) {
    for (const fg of [DARK.text, DARK.muted, DARK.primary, DARK.accentInk, DARK.danger, DARK.success, DARK.warning, DARK.info]) {
      assert.ok(ratio(fg, bg) >= 4.5, `${fg} sur ${bg} = ${ratio(fg, bg).toFixed(2)}`);
    }
  }
});

test('mode sombre : boutons et pastilles lisibles', () => {
  assert.ok(ratio(DARK.onPrimary, DARK.primary) >= 4.5);
  assert.ok(ratio(DARK.danger, DARK.dangerBg) >= 4.5);
  assert.ok(ratio(DARK.success, DARK.successBg) >= 4.5);
  assert.ok(ratio(DARK.warning, DARK.warningBg) >= 4.5);
  assert.ok(ratio(DARK.info, DARK.infoBg) >= 4.5);
  assert.ok(ratio(DARK.accentInk, DARK.accentBg) >= 4.5);
});

test('le thème clair reste celui de la marque, et applyScheme est réversible', () => {
  assert.equal(LIGHT.primary, palette.primary);
  assert.equal(LIGHT.bg, palette.background);
  applyScheme('dark');
  assert.equal(theme.bg, DARK.bg);
  applyScheme('light');
  assert.equal(theme.bg, palette.background);
  assert.equal(theme.primary, '#C8152A');
});
