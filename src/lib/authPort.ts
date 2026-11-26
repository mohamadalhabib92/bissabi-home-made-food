import type { AuthRole } from './accountLink';
import { getSupabase } from './supabase';

export type AuthResult = { ok: true; userId: string } | { ok: false; reason: 'device_only' | 'invalid' | 'remote'; message: string };

/** Inscription e-mail. Sans Supabase : l’app reste sur l’appareil. */
export async function signUpWithEmail(email: string, password: string, role: AuthRole): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: 'device_only', message: 'Mode sur cet appareil' };
  const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { data: { role } } });
  if (error || !data.user) return { ok: false, reason: 'remote', message: error?.message ?? 'inscription refusée' };
  return { ok: true, userId: data.user.id };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: 'device_only', message: 'Mode sur cet appareil' };
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) return { ok: false, reason: 'remote', message: error?.message ?? 'connexion refusée' };
  return { ok: true, userId: data.user.id };
}

export async function signOutEmail(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: 'device_only', message: 'Réinitialisation indisponible sans serveur' };
  const { error } = await sb.auth.resetPasswordForEmail(email.trim());
  if (error) return { ok: false, reason: 'remote', message: error.message };
  return { ok: true, userId: '' };
}

/** Tente la suppression serveur, puis le local doit encore être effacé par l’appelant. */
export async function deleteRemoteAccount(): Promise<'skipped' | 'ok' | 'failed'> {
  const sb = getSupabase();
  if (!sb) return 'skipped';
  const { error } = await sb.rpc('delete_own_account');
  return error ? 'failed' : 'ok';
}
