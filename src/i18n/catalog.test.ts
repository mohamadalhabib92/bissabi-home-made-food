import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allergenLabel } from './allergens';
import { pilotCatalog, pilotText } from './catalog';
import { LOCALE_IDS, directionFor, isCompleteLocale, matchLocale, suggestLocale } from './locales';

const REQUIRED = ['fr', 'en', 'de', 'it', 'es', 'pt', 'ar', 'zh', 'wo', 'ff', 'tr', 'ru', 'hi'] as const;

test('le catalogue couvre les langues demandées, avec l’arabe en RTL', () => {
  assert.deepEqual([...LOCALE_IDS], [...REQUIRED]);
  assert.equal(directionFor('ar'), 'rtl');
  assert.equal(directionFor('fr'), 'ltr');
  assert.equal(directionFor('ff'), 'ltr');
  assert.equal(isCompleteLocale('fr'), true);
  assert.equal(isCompleteLocale('en'), true);
  assert.equal(isCompleteLocale('wo'), false);
});

test('la détection reconnaît les balises régionales et ne devine pas une langue absente', () => {
  assert.equal(matchLocale('fr-CH'), 'fr');
  assert.equal(matchLocale('pt-BR'), 'pt');
  assert.equal(matchLocale('zh-Hant-TW'), 'zh');
  assert.equal(matchLocale('ff-Latn-SN'), 'ff');
  assert.equal(matchLocale('ar-SA'), 'ar');
  assert.equal(matchLocale('ja-JP'), null);
  assert.equal(suggestLocale('ja'), 'en');
  assert.equal(suggestLocale(''), 'fr');
  assert.equal(suggestLocale(null), 'fr');
});

test('fr et en sont complets ; les autres langues ne stockent aucune chaîne', () => {
  for (const entry of Object.values(pilotCatalog)) {
    assert.deepEqual(Object.keys(entry).sort(), ['en', 'fr', 'sensitivity']);
    assert.equal(entry.fr.length > 0, true);
    assert.equal(entry.en.length > 0, true);
  }
  assert.equal(pilotText('de', 'homeQuestion').text, pilotCatalog.homeQuestion.en);
  assert.equal(pilotText('de', 'homeQuestion').needsReview, false);
  assert.equal(pilotText('ar', 'pilotBanner').needsReview, true);
  assert.equal(pilotText('ar', 'pilotBanner').text, pilotCatalog.pilotBanner.en);
  assert.equal(pilotText('fr', 'pilotAllergens').needsReview, false);
});

test('les noms d’allergènes ne sont pas traduits automatiquement', () => {
  assert.equal(allergenLabel('peanuts', 'fr').text, 'Arachides');
  assert.equal(allergenLabel('peanuts', 'fr').needsReview, false);
  assert.equal(allergenLabel('peanuts', 'en').text, 'Peanuts');
  assert.equal(allergenLabel('peanuts', 'en').needsReview, false);
  for (const locale of ['de', 'it', 'es', 'pt', 'ar', 'zh', 'wo', 'ff', 'tr', 'ru', 'hi'] as const) {
    const label = allergenLabel('peanuts', locale);
    assert.equal(label.text, 'Peanuts');
    assert.equal(label.needsReview, true);
    assert.equal(label.localeUsed, 'en');
  }
});
