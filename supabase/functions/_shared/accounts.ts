import { authUserId } from './db.ts';
import type { EdgeEnv } from './env.ts';
import { bearer, isServiceRole } from './env.ts';
import { json, readJson } from './http.ts';
import { crmSyncTarget, loadOrderRows, loadUserRows, pushCrmRows } from './crm.ts';

export async function handleDeleteAccount(req: Request, env: EdgeEnv, fetchImpl: typeof fetch): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!env.supabaseUrl || !env.serviceKey) return json({ reason: 'unconfigured' }, 503);
  const jwt = bearer(req.headers.get('authorization'));
  const userId = await authUserId(env.supabaseUrl, env.serviceKey, jwt, fetchImpl);
  if (!userId) return json({ reason: 'auth' }, 401);
  const response = await fetchImpl(`${env.supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${env.serviceKey}`, apikey: env.serviceKey },
  });
  return json({ deleted: response.ok }, response.ok ? 200 : 500);
}

export async function handleCrmSync(req: Request, env: EdgeEnv, fetchImpl: typeof fetch): Promise<Response> {
  if (req.method !== 'POST') return json({ reason: 'method' }, 405);
  if (!isServiceRole(req.headers.get('authorization'), env.serviceKey)) return json({ reason: 'service_role' }, 401);
  const target = crmSyncTarget(await readJson(req));
  if (!target) return json({ reason: 'body' }, 400);
  const rows = target.kind === 'order'
    ? await loadOrderRows(env, target.orderId, fetchImpl)
    : await loadUserRows(env, target.userId, fetchImpl);
  if (rows === 'skip') return json({ skipped: true }, 204);
  if (!rows) return json({ reason: 'not_found' }, 404);
  const pushed = await pushCrmRows(env, rows, fetchImpl);
  if (!pushed.ok) return json({ reason: 'crm' }, 502);
  return json({ ok: true, skipped: pushed.skipped }, pushed.skipped ? 202 : 200);
}
