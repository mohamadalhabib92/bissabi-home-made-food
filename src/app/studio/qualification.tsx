import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Pill } from '@/components/brand';
import {
  BADGE_LABEL_EN, BADGE_LABEL_FR, MODULES, attemptsToday, emptyQualification, isBadgeValid, modulesMissing, recordAttempt,
} from '@/lib/cookQualification';
import {
  MODULE_META, PASS_MARK, QUIZ_QUESTIONS, canRetryToday, questionsFor, scoreAttempt, type QuizModuleId,
} from '@/lib/cookQuiz';
import { todayISO } from '@/lib/dates';
import { useData, useL } from '@/lib/data';
import { Body, Button, Card, H1, H2, Muted, Notice, Screen, Spacer, haptic, useFeedback } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function QualificationScreen() {
  const { myCook, setCooks } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const fb = useFeedback();
  const [module, setModule] = useState<QuizModuleId | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ReturnType<typeof scoreAttempt> | null>(null);

  const q = myCook?.qualification ?? emptyQualification();
  const valid = isBadgeValid(q);
  const missing = modulesMissing(q);
  const qs = module ? questionsFor(module) : [];
  const history = useMemo(() => (q.attempts ?? []).slice(0, 12), [q.attempts]);

  if (!myCook) {
    return (
      <Screen>
        <Stack.Screen options={{ title: L('Formation', 'Training') }} />
        <Notice tone="warning" title={L('Profil cook requis', 'Cook profile required')} text={L('Créez d’abord votre profil cuisinier.', 'Create your cook profile first.')} />
        <Button title={L('Créer mon profil', 'Create my profile')} onPress={() => router.push('/studio/profile')} />
      </Screen>
    );
  }

  const submit = () => {
    if (!module) return;
    const day = todayISO();
    const n = attemptsToday(q, module, day);
    if (!canRetryToday(n)) {
      fb.toast({ text: L('Limite de tentatives atteinte pour aujourd’hui.', 'Daily attempt limit reached.'), icon: 'alert-circle-outline' });
      return;
    }
    const scored = scoreAttempt(module, answers);
    setResult(scored);
    const next = recordAttempt(q, {
      module,
      score: scored.score,
      passed: scored.passed,
      at: new Date().toISOString(),
      answers,
    });
    setCooks((list) => list.map((c) => (c.id === myCook.id ? { ...c, qualification: next, hygieneBadge: isBadgeValid(next) || !!c.hygieneBadge } : c)));
    haptic(scored.passed ? 'success' : 'warning');
    if (scored.passed) fb.toast({ text: L('Module réussi', 'Module passed'), icon: 'checkmark-circle-outline' });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: L('Formation hygiène', 'Hygiene training') }} />
      <H1>{L('Formation hygiène, allergènes & sécurité', 'Hygiene, allergens & safety training')}</H1>
      <Muted>
        {L(
          'Module interne Bissabi — bonne pratique, pas une certification officielle OSAV / ODAlOUs. Contenu à faire valider par un expert. Sources : docs/COOK-QUALIFICATION.md.',
          'Internal Bissabi module — good practice, not an official FSVO / FOpO certificate. Content to be validated by an expert. Sources: docs/COOK-QUALIFICATION.md.',
        )}
      </Muted>
      <Spacer />
      {valid ? (
        <Card>
          <Pill label={L(BADGE_LABEL_FR, BADGE_LABEL_EN)} tone="green" />
          <Muted style={{ marginTop: 8 }}>
            {L(`Valide jusqu’au ${new Date(q.badgeExpiresAt!).toLocaleDateString(lang === 'en' ? 'en-CH' : 'fr-CH')}`, `Valid until ${new Date(q.badgeExpiresAt!).toLocaleDateString('en-CH')}`)}
          </Muted>
        </Card>
      ) : (
        <Notice
          tone="warning"
          title={L('Badge requis pour publier', 'Badge required to publish')}
          text={L(`Réussissez les 3 modules (≥ ${PASS_MARK} %). Renouvellement annuel.`, `Pass all 3 modules (≥ ${PASS_MARK} %). Yearly renewal.`)}
        />
      )}

      {!module ? (
        <>
          <H2>{L('Modules', 'Modules')}</H2>
          {MODULES.map((m) => {
            const meta = MODULE_META[m];
            const done = !!q.passedAt[m] && !missing.includes(m);
            const n = attemptsToday(q, m, todayISO());
            return (
              <Card key={m} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '700', color: t.text }}>{lang === 'en' ? meta.en : meta.fr}</Text>
                <Muted style={{ marginTop: 4 }}>
                  {done
                    ? L('Réussi pour le cycle en cours', 'Passed for the current cycle')
                    : L(`À passer · ${questionsFor(m).length} questions · tentatives aujourd’hui ${n}`, `To take · ${questionsFor(m).length} questions · attempts today ${n}`)}
                </Muted>
                <Button
                  style={{ marginTop: 8 }}
                  variant={done ? 'secondary' : 'primary'}
                  title={done ? L('Repasser', 'Retake') : L('Commencer', 'Start')}
                  onPress={() => { setModule(m); setAnswers({}); setResult(null); }}
                  disabled={!canRetryToday(n)}
                />
              </Card>
            );
          })}
          <H2>{L('Historique', 'History')}</H2>
          {history.length ? history.map((a) => (
            <Muted key={a.id}>
              {a.at.slice(0, 16).replace('T', ' ')} · {MODULE_META[a.module][lang]} · {a.score}% {a.passed ? '✓' : '✗'}
            </Muted>
          )) : <Muted>{L('Aucune tentative encore.', 'No attempts yet.')}</Muted>}
        </>
      ) : (
        <>
          <Button variant="ghost" title={L('← Modules', '← Modules')} onPress={() => { setModule(null); setResult(null); }} />
          <H2>{lang === 'en' ? MODULE_META[module].en : MODULE_META[module].fr}</H2>
          {qs.map((question, idx) => (
            <Card key={question.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: '700', color: t.text }}>{idx + 1}. {lang === 'en' ? question.en : question.fr}</Text>
              <Spacer h={8} />
              {question.choices.map((c, i) => {
                const on = answers[question.id] === i;
                return (
                  <Button
                    key={i}
                    small
                    variant={on ? 'primary' : 'secondary'}
                    title={lang === 'en' ? c.en : c.fr}
                    style={{ marginBottom: 6 }}
                    onPress={() => setAnswers((a) => ({ ...a, [question.id]: i }))}
                  />
                );
              })}
              {result ? (
                <Muted style={{ marginTop: 6 }}>
                  {(lang === 'en' ? question.explainEn : question.explainFr)}
                  {answers[question.id] === question.answer ? ' ✓' : ` → ${lang === 'en' ? question.choices[question.answer].en : question.choices[question.answer].fr}`}
                </Muted>
              ) : null}
            </Card>
          ))}
          {!result ? (
            <Button
              title={L('Valider mes réponses', 'Submit answers')}
              disabled={qs.some((qst) => answers[qst.id] == null)}
              onPress={submit}
            />
          ) : (
            <Card>
              <H2>{result.passed ? L('Réussi', 'Passed') : L('À retenter', 'Try again')}</H2>
              <Body>{result.correct}/{result.total} · {result.score}% (seuil {PASS_MARK} %)</Body>
              <Button style={{ marginTop: 8 }} title={L('Retour aux modules', 'Back to modules')} onPress={() => { setModule(null); setResult(null); }} />
            </Card>
          )}
        </>
      )}
      <Spacer h={24} />
      <Muted>
        {L(
          `${QUIZ_QUESTIONS.length} questions au total · seuil ${PASS_MARK} % · validité 365 jours.`,
          `${QUIZ_QUESTIONS.length} questions total · ${PASS_MARK}% pass mark · 365-day validity.`,
        )}
      </Muted>
    </Screen>
  );
}
