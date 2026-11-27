/**
 * SOURCE SEULEMENT. Supprime l’utilisateur Auth dont le jeton est présenté.
 * SUPABASE_SERVICE_ROLE_KEY vient de l’environnement du projet bissabi-home-made-food.
 */
import { deleteAccountHandler } from '../../../src/lib/deleteAccountHandler';
import { readEnv } from '../_shared/env';

export const NOT_DEPLOYED = true;

export async function handleDeleteAccount(jwt: string | null, fetchImpl: typeof fetch = fetch): Promise<{ status: number }> {
  const url = readEnv('SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey || url.startsWith('YOUR_') || serviceKey.startsWith('YOUR_')) return { status: 503 };
  return deleteAccountHandler(jwt, {
    getUserId: async (token) => {
      const response = await fetchImpl(`${url.replace(/\/$/, '')}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: serviceKey },
      });
      if (!response.ok) return null;
      const body = await response.json() as { id?: string };
      return body.id ?? null;
    },
    deleteUser: async (userId) => {
      const response = await fetchImpl(`${url.replace(/\/$/, '')}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      });
      return response.ok ? {} : { error: 'delete' };
    },
  });
}
