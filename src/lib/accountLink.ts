/** Rôles proposés à l’inscription. « admin » n’en fait pas partie : il n’est pas auto-attribué. */
export type AuthRole = 'client' | 'cook' | 'traiteur' | 'courier';

export function validateCredentials(email: string, password: string): string | null {
  const mail = email.trim();
  if (!mail.includes('@') || mail.startsWith('@') || mail.endsWith('@')) return 'email';
  if (password.length < 8) return 'password';
  return null;
}

export type LinkChoice = 'skip' | 'link';

/**
 * Lier un profil déjà sur l’appareil à un compte. Le local n’est jamais effacé.
 * Un profil distant non vide n’est jamais remplacé.
 */
export function planAccountLink(choice: LinkChoice, localHasProfile: boolean, remoteHasProfile: boolean): { keepLocal: true; uploadLocal: boolean } {
  if (choice === 'skip') return { keepLocal: true, uploadLocal: false };
  if (!localHasProfile || remoteHasProfile) return { keepLocal: true, uploadLocal: false };
  return { keepLocal: true, uploadLocal: true };
}
