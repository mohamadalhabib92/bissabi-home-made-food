import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

/** Versions alignées par `expo install --check` (SDK 58). Le cœur doit exporter `_classTypes` (crash TestFlight 13–14). */
test('expo-font et expo-modules-core suivent le SDK installé', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { dependencies: Record<string, string> };
  const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8')) as {
    packages: Record<string, { version?: string }>;
  };
  assert.equal(pkg.dependencies.expo, '~58.1.0');
  assert.equal(pkg.dependencies['expo-font'], '~58.0.12');
  const core = lock.packages['node_modules/expo-modules-core']?.version ?? '';
  const [major, minor, patch] = core.split('.').map(Number);
  assert.ok(major > 58 || (major === 58 && (minor > 0 || patch >= 30)), `expo-modules-core ${core} est trop ancien pour ExpoFont`);
  const font = lock.packages['node_modules/expo-font']?.version ?? '';
  assert.equal(font, '58.0.12');
});
