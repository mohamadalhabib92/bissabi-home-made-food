import { publicEnv } from './publicEnv';

/**
 * Journalisation crash. Désactivée tant que EXPO_PUBLIC_SENTRY_DSN est absent ou YOUR_*.
 * Le SDK natif n'est pas inclus : pas de nouveau binaire, pas d'envoi réseau au démarrage.
 * Quand un DSN réel sera posé, brancher l'envoi côté serveur ou un SDK — pas dans ce module.
 */
export function sentryEnabled(): boolean {
  return publicEnv.sentryDsn.configured;
}

export function reportCrash(error: unknown, context?: string): void {
  if (!sentryEnabled()) return;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn('[sentry disabled transport]', context ?? 'crash', error);
  }
}
