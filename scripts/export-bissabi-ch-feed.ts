#!/usr/bin/env tsx
/**
 * Export lecture seule du flux public (catalogue démo) pour la section bissabi.ch.
 * Usage : npx tsx scripts/export-bissabi-ch-feed.ts [--out chemin.json]
 * N’applique aucune migration, n’envoie rien, ne touche pas à Wix.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildBissabiChFeed } from '../src/lib/bissabiChExport';

const outFlag = process.argv.indexOf('--out');
const out = outFlag >= 0 ? process.argv[outFlag + 1] : undefined;
const json = `${JSON.stringify(buildBissabiChFeed(), null, 2)}\n`;
if (out) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, json, 'utf8');
} else {
  process.stdout.write(json);
}
