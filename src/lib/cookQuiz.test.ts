import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MODULES, emptyQualification, isBadgeValid, modulesMissing, recordAttempt } from './cookQualification';
import { PASS_MARK, QUIZ_QUESTIONS, questionsFor, scoreAttempt } from './cookQuiz';
import { publishIssues } from './dishPublish';
import { ALLERGENS } from './model';

test('chaque module a au moins 10 questions', () => {
  for (const m of MODULES) {
    assert.ok(questionsFor(m).length >= 10, m);
  }
  assert.ok(QUIZ_QUESTIONS.length >= 30);
});

test('scoreAttempt : 100 % si toutes bonnes, fail sous le seuil', () => {
  const qs = questionsFor('hygiene');
  const good: Record<string, number> = {};
  for (const q of qs) good[q.id] = q.answer;
  const ok = scoreAttempt('hygiene', good);
  assert.equal(ok.score, 100);
  assert.equal(ok.passed, true);

  const bad: Record<string, number> = {};
  for (const q of qs) bad[q.id] = (q.answer + 1) % q.choices.length;
  const fail = scoreAttempt('hygiene', bad);
  assert.ok(fail.score < PASS_MARK);
  assert.equal(fail.passed, false);
});

test('badge valide seulement après 3 modules réussis', () => {
  let q = emptyQualification();
  assert.equal(isBadgeValid(q), false);
  assert.deepEqual(modulesMissing(q), MODULES);
  const at = '2026-11-05T10:00:00.000Z';
  for (const m of MODULES) {
    q = recordAttempt(q, { module: m, score: 90, passed: true, at, answers: {} }, new Date(at));
  }
  assert.equal(isBadgeValid(q, new Date('2026-11-06T00:00:00.000Z')), true);
  assert.equal(modulesMissing(q, new Date('2026-11-06T00:00:00.000Z')).length, 0);
  assert.ok(q.badgeExpiresAt);
});

test('publishIssues bloque sans qualificationValid', () => {
  const status: Record<string, 'absent'> = {};
  for (const a of ALLERGENS) status[a.key] = 'absent';
  const base = {
    allergenStatus: status,
    ingredients: [{ name: 'riz', qty: 100 }],
    photo: 'x',
    conservation: 'frigo',
    reheating: 'four',
    animalOrigin: 'none' as const,
    isBakery: false,
  };
  assert.ok(publishIssues(base).includes('qualification'));
  assert.ok(!publishIssues({ ...base, qualificationValid: true }).includes('qualification'));
});
