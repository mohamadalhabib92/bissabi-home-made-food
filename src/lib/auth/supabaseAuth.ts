import * as Linking from 'expo-linking';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { createGateway, type AuthUser } from './gateway';
export type { AuthUser };
import { roleFromSignup, type Account, type KitchenStatus, type ServerRole, type SignupRole } from './rules';

export function redirectTo(path: string): string {
  return Linking.createURL(path);
}

export function userFromSession(user: User | null | undefined): AuthUser | null {
  if (!user?.email) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    emailConfirmed: Boolean(user.email_confirmed_at),
    displayName: typeof meta.display_name === 'string' ? meta.display_name : '',
    requestedRole: roleFromSignup(typeof meta.requested_role === 'string' ? meta.requested_role : null),
  };
}

function message(error: { message?: string } | null): string {
  return error?.message ?? 'rejected';
}

const kitchenStatusOf = (value: unknown): KitchenStatus => (
  value === 'dossier_en_cours' || value === 'approved' || value === 'suspended' || value === 'none' ? value : 'none'
);

export async function loadAccount(client: SupabaseClient, user: AuthUser): Promise<Account | null> {
  const { data: profile, error } = await client.from('profiles').select('signup_role, kitchen_status').eq('id', user.id).maybeSingle();
  if (error || !profile) return null;
  const { data: roleRows } = await client.from('user_roles').select('role').eq('user_id', user.id);
  const roles = (roleRows ?? []).map((row) => row.role).filter((role): role is ServerRole => (
    role === 'client' || role === 'cook' || role === 'buyer' || role === 'admin' || role === 'courier'
  ));
  const signupRole = roleFromSignup(profile.signup_role);
  return {
    id: user.id,
    signupRole,
    roles: roles.length ? roles : [signupRole],
    kitchenStatus: kitchenStatusOf(profile.kitchen_status),
    emailConfirmed: user.emailConfirmed,
  };
}

export function gatewayFor(client: SupabaseClient | null) {
  if (!client) return createGateway(null);
  return createGateway({
    async signUp(input) {
      const { data, error } = await client.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          emailRedirectTo: input.redirectTo,
          data: {
            display_name: input.displayName.trim(),
            requested_role: input.role,
            locale: 'fr',
          },
        },
      });
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: { user: userFromSession(data.user), session: Boolean(data.session) } };
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { ok: false, error: message(error) };
      const user = userFromSession(data.user);
      if (!user) return { ok: false, error: 'rejected' };
      return { ok: true, value: user };
    },
    async resetPassword(email, redirectToUrl) {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectToUrl });
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: true };
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: true };
    },
    async requestDeletion() {
      const { error } = await client.rpc('request_account_deletion');
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: true };
    },
    async saveProfile(patch) {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) return { ok: false, error: 'rejected' };
      const { error } = await client.from('profiles').update({
        display_name: patch.displayName,
        phone: patch.phone ?? null,
        locale: patch.locale,
      }).eq('id', userData.user.id);
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: true };
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: true };
    },
    async saveAddress(address) {
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) return { ok: false, error: 'rejected' };
      const { error } = await client.from('delivery_addresses').insert({
        user_id: userData.user.id,
        label: address.label,
        line: address.line,
        postal_code: address.postalCode,
      });
      if (error) return { ok: false, error: message(error) };
      return { ok: true, value: true };
    },
  });
}

export function appGateway() {
  return gatewayFor(getSupabase());
}

export type { Session, SignupRole };
