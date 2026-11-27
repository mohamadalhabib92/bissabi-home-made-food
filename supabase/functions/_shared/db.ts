export function restUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/rest/v1/${path}`;
}

export function serviceHeaders(serviceKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'content-type': 'application/json',
    ...extra,
  };
}

export async function restGet<T>(base: string, serviceKey: string, path: string, fetchImpl: typeof fetch): Promise<T[] | null> {
  const response = await fetchImpl(restUrl(base, path), { headers: serviceHeaders(serviceKey) });
  if (!response.ok) return null;
  const body = await response.json() as T[];
  return Array.isArray(body) ? body : null;
}

/** Insert. `duplicate` si la clé existe déjà (Prefer ignore-duplicates, corps vide). */
export async function claimRow(base: string, serviceKey: string, table: string, row: Record<string, unknown>, fetchImpl: typeof fetch): Promise<'new' | 'duplicate' | 'error'> {
  const response = await fetchImpl(restUrl(base, table), {
    method: 'POST',
    headers: serviceHeaders(serviceKey, { Prefer: 'return=representation,resolution=ignore-duplicates' }),
    body: JSON.stringify(row),
  });
  if (!response.ok) return 'error';
  const body = await response.json().catch(() => []) as unknown[];
  return Array.isArray(body) && body.length === 0 ? 'duplicate' : 'new';
}

export async function restWrite(base: string, serviceKey: string, path: string, method: 'POST' | 'PATCH', row: Record<string, unknown>, fetchImpl: typeof fetch, prefer?: string): Promise<boolean> {
  const response = await fetchImpl(restUrl(base, path), {
    method,
    headers: serviceHeaders(serviceKey, prefer ? { Prefer: prefer } : {}),
    body: JSON.stringify(row),
  });
  return response.ok;
}

export async function restDelete(base: string, serviceKey: string, path: string, fetchImpl: typeof fetch): Promise<void> {
  await fetchImpl(restUrl(base, path), { method: 'DELETE', headers: serviceHeaders(serviceKey) });
}

export async function authUserId(base: string, serviceKey: string, jwt: string, fetchImpl: typeof fetch): Promise<string | null> {
  const response = await fetchImpl(`${base.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: serviceKey },
  });
  if (!response.ok) return null;
  const body = await response.json() as { id?: string };
  return body.id ?? null;
}
