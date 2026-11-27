import { getSupabase } from './supabase';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isServerId(id: string | undefined): id is string {
  return !!id && UUID.test(id);
}

/** null : pas un appel serveur. true / false : réponse de la fonction SQL. */
export async function serverCourierStep(orderId: string, action: 'accept' | 'pickup' | 'en_route' | 'deliver', code?: string): Promise<boolean | null> {
  const sb = getSupabase();
  if (!sb || !isServerId(orderId)) return null;
  const { data: userData } = await sb.auth.getUser();
  if (!userData.user) return null;
  const call = action === 'accept'
    ? sb.rpc('accept_courier_job', { job_id: orderId })
    : action === 'pickup'
      ? sb.rpc('mark_picked_up', { job_id: orderId, submitted_code: code ?? '' })
      : action === 'en_route'
        ? sb.rpc('mark_en_route', { job_id: orderId })
        : sb.rpc('confirm_delivery_proof', { job_id: orderId, submitted_code: code ?? '' });
  const { data, error } = await call;
  if (error) return false;
  return data === true;
}
