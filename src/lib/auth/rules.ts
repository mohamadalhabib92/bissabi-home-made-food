/**
 * Règles de compte. Le client ne décide pas : ces fonctions reflètent les contrôles SQL.
 * admin et courier ne s'obtiennent pas à l'inscription.
 */

export type SignupRole = 'client' | 'cook';
export type ServerRole = SignupRole | 'buyer' | 'admin' | 'courier';
export type KitchenStatus = 'none' | 'dossier_en_cours' | 'approved' | 'suspended';

export type Account = {
  id: string;
  signupRole: SignupRole;
  roles: ServerRole[];
  kitchenStatus: KitchenStatus;
  emailConfirmed: boolean;
};

export function roleFromSignup(requested: string | null | undefined): SignupRole {
  return requested === 'cook' ? 'cook' : 'client';
}

export function accountFromSignup(id: string, requested: string | null | undefined): Account {
  const signupRole = roleFromSignup(requested);
  return {
    id,
    signupRole,
    roles: [signupRole],
    kitchenStatus: signupRole === 'cook' ? 'dossier_en_cours' : 'none',
    emailConfirmed: false,
  };
}

export function canUseCookEndpoint(account: Account): boolean {
  return account.roles.includes('cook') || account.signupRole === 'cook';
}

export function publishAllowed(account: Account): { ok: true } | { ok: false; error: 'not_cook' | 'email_unverified' | 'dossier_en_cours' } {
  if (!account.roles.includes('cook')) return { ok: false, error: 'not_cook' };
  if (!account.emailConfirmed) return { ok: false, error: 'email_unverified' };
  if (account.kitchenStatus !== 'approved') return { ok: false, error: 'dossier_en_cours' };
  return { ok: true };
}

/** Un titulaire de compte ne s'attribue pas admin ni courier. Seul un admin le fait. */
export function grantRole(actor: Account, role: ServerRole): { ok: true } | { ok: false; error: 'role_reserved' } {
  if (!actor.roles.includes('admin')) return { ok: false, error: 'role_reserved' };
  return { ok: true };
}

/** Sans session, le téléphone continue comme avant. Une session non approuvée ne publie pas. */
export function localPublishAllowed(account: Account | null): boolean {
  if (!account) return true;
  return publishAllowed(account).ok;
}
