/**
 * Badge formation hygiène / allergènes / sécurité — logique produit Bissabi.
 * Pas une certification officielle OSAV / ODAlOUs.
 */
import { BADGE_VALIDITY_DAYS, PASS_MARK, type QuizModuleId } from './cookQuiz';

export type QuizAttemptRecord = {
  id: string;
  module: QuizModuleId;
  score: number;
  passed: boolean;
  at: string; // ISO
  answers: Record<string, number>;
};

export type CookQualification = {
  /** Dernière date de réussite pour chaque module (ISO). */
  passedAt: Partial<Record<QuizModuleId, string>>;
  /** Historique (les N derniers). */
  attempts: QuizAttemptRecord[];
  /** Badge global valide depuis (ISO) — date de la dernière réussite du 3e module manquant. */
  badgeEarnedAt?: string;
  /** Fin de validité (ISO). */
  badgeExpiresAt?: string;
};

export const MODULES: QuizModuleId[] = ['hygiene', 'allergens', 'safety'];

export function emptyQualification(): CookQualification {
  return { passedAt: {}, attempts: [] };
}

export function isBadgeValid(q: CookQualification | undefined | null, now = new Date()): boolean {
  if (!q?.badgeExpiresAt) return false;
  return new Date(q.badgeExpiresAt).getTime() > now.getTime();
}

export function modulesMissing(q: CookQualification | undefined | null, now = new Date()): QuizModuleId[] {
  const base = q ?? emptyQualification();
  const missing: QuizModuleId[] = [];
  for (const m of MODULES) {
    const at = base.passedAt[m];
    if (!at) { missing.push(m); continue; }
    // Un module réussi compte pour le badge en cours ; si badge expiré, tout est « à refaire ».
    if (base.badgeExpiresAt && new Date(base.badgeExpiresAt).getTime() <= now.getTime()) {
      missing.push(m);
    }
  }
  // Si badge expiré, on a déjà tout poussé dans missing ; sinon vérifier couverture
  if (!base.badgeExpiresAt || new Date(base.badgeExpiresAt).getTime() > now.getTime()) {
    return MODULES.filter((m) => !base.passedAt[m]);
  }
  return missing;
}

/** Après une tentative : met à jour l’historique et éventuellement le badge. */
export function recordAttempt(
  prev: CookQualification | undefined | null,
  attempt: Omit<QuizAttemptRecord, 'id'> & { id?: string },
  now = new Date(),
): CookQualification {
  const q: CookQualification = {
    passedAt: { ...(prev?.passedAt ?? {}) },
    attempts: [...(prev?.attempts ?? [])],
    badgeEarnedAt: prev?.badgeEarnedAt,
    badgeExpiresAt: prev?.badgeExpiresAt,
  };
  const rec: QuizAttemptRecord = {
    id: attempt.id ?? `qa_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
    module: attempt.module,
    score: attempt.score,
    passed: attempt.passed,
    at: attempt.at,
    answers: attempt.answers,
  };
  q.attempts = [rec, ...q.attempts].slice(0, 50);

  if (attempt.passed && attempt.score >= PASS_MARK) {
    // Si badge expiré, on repart sur un nouveau cycle : n’accepter que les réussites « fraîches » après expiration
    if (q.badgeExpiresAt && new Date(q.badgeExpiresAt).getTime() <= now.getTime()) {
      q.passedAt = { [attempt.module]: attempt.at };
      q.badgeEarnedAt = undefined;
      q.badgeExpiresAt = undefined;
    } else {
      q.passedAt[attempt.module] = attempt.at;
    }
  }

  const allOk = MODULES.every((m) => !!q.passedAt[m]);
  if (allOk && (!q.badgeExpiresAt || new Date(q.badgeExpiresAt).getTime() <= now.getTime() || !q.badgeEarnedAt)) {
    const earned = attempt.at;
    const exp = new Date(earned);
    exp.setUTCDate(exp.getUTCDate() + BADGE_VALIDITY_DAYS);
    q.badgeEarnedAt = earned;
    q.badgeExpiresAt = exp.toISOString();
  }
  return q;
}

export function attemptsToday(q: CookQualification | undefined | null, module: QuizModuleId, dayISO: string): number {
  const day = dayISO.slice(0, 10);
  return (q?.attempts ?? []).filter((a) => a.module === module && a.at.slice(0, 10) === day).length;
}

export const BADGE_LABEL_FR = 'Formation hygiène, allergènes & sécurité réussie';
export const BADGE_LABEL_EN = 'Hygiene, allergens & safety training passed';
