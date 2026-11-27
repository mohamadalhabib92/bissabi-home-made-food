/**
 * SOURCE SEULEMENT. Ne pas déployer depuis cet agent.
 * Reçoit un acheteur, un vendeur, ou une commande payée / remboursée,
 * et upsert dans le projet bissabi-crm. La clé service vient de l’environnement.
 */
import { pushCrmRows, rowsFromCrmRequest } from '../../../src/lib/crmSync';
import { readEnv } from '../_shared/env';

export const NOT_DEPLOYED = true;

export async function handleCrmSync(body: unknown, fetchImpl: typeof fetch = fetch): Promise<{ status: number; skipped?: boolean }> {
  const rows = rowsFromCrmRequest(body);
  if (!rows) return { status: 400 };
  const pushed = await pushCrmRows(rows, { url: readEnv('CRM_SUPABASE_URL'), serviceKey: readEnv('CRM_SERVICE_ROLE_KEY') }, fetchImpl);
  if (!pushed.ok) return { status: 502 };
  return { status: pushed.skipped ? 202 : 200, skipped: pushed.skipped };
}
