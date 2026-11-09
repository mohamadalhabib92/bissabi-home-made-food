import type { SignupRole } from './rules';

export type SocialProviderId = 'apple' | 'google';

export type AuthFailure =
  | 'auth_not_configured'
  | 'invalid_email'
  | 'weak_password'
  | 'missing_name'
  | 'provider_not_connected'
  | 'rejected';

export type GatewayResult<T> = { ok: true; value: T } | { ok: false; error: AuthFailure | string };

export type AuthUser = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  displayName: string;
  requestedRole: SignupRole;
};

type SignUpResult = { user: AuthUser | null; session: boolean };

export type AuthApi = {
  signUp: (input: { email: string; password: string; displayName: string; role: SignupRole; redirectTo: string }) => Promise<GatewayResult<SignUpResult>>;
  signIn: (email: string, password: string) => Promise<GatewayResult<AuthUser>>;
  resetPassword: (email: string, redirectTo: string) => Promise<GatewayResult<true>>;
  signOut: () => Promise<GatewayResult<true>>;
  requestDeletion: () => Promise<GatewayResult<true>>;
  saveProfile: (patch: { displayName?: string; phone?: string | null; locale?: string }) => Promise<GatewayResult<true>>;
  saveAddress: (address: { label: string; line: string; postalCode: string }) => Promise<GatewayResult<true>>;
  updatePassword: (password: string) => Promise<GatewayResult<true>>;
};

/** Apple et Google sont prévus. Le courriel passe en premier : ces boutons ne lancent rien. */
export const socialProviders: Record<SocialProviderId, { id: SocialProviderId; enabled: false }> = {
  apple: { id: 'apple', enabled: false },
  google: { id: 'google', enabled: false },
};

const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function validateSignUp(input: { email: string; password: string; displayName: string; role: string }): AuthFailure | null {
  if (!emailOk(input.email)) return 'invalid_email';
  if (input.password.length < 8) return 'weak_password';
  if (!input.displayName.trim()) return 'missing_name';
  if (input.role !== 'client' && input.role !== 'cook') return 'rejected';
  return null;
}

export function signInWithSocial(provider: SocialProviderId, call?: (provider: SocialProviderId) => void): GatewayResult<never> {
  if (!socialProviders[provider].enabled) return { ok: false, error: 'provider_not_connected' };
  call?.(provider);
  return { ok: false, error: 'provider_not_connected' };
}

export function createGateway(api: AuthApi | null) {
  return {
    async signUp(input: { email: string; password: string; displayName: string; role: SignupRole; redirectTo: string }) {
      const problem = validateSignUp(input);
      if (problem) return { ok: false as const, error: problem };
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.signUp(input);
    },
    async signIn(email: string, password: string) {
      if (!emailOk(email) || password.length < 8) return { ok: false as const, error: 'rejected' as const };
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.signIn(email, password);
    },
    async resetPassword(email: string, redirectTo: string) {
      if (!emailOk(email)) return { ok: false as const, error: 'invalid_email' as const };
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.resetPassword(email, redirectTo);
    },
    signInWithSocial,
    async signOut() {
      if (!api) return { ok: true as const, value: true as const };
      return api.signOut();
    },
    async requestDeletion() {
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.requestDeletion();
    },
    async saveProfile(patch: { displayName?: string; phone?: string | null; locale?: string }) {
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.saveProfile(patch);
    },
    async saveAddress(address: { label: string; line: string; postalCode: string }) {
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.saveAddress(address);
    },
    async updatePassword(password: string) {
      if (password.length < 8) return { ok: false as const, error: 'weak_password' as const };
      if (!api) return { ok: false as const, error: 'auth_not_configured' as const };
      return api.updatePassword(password);
    },
  };
}
