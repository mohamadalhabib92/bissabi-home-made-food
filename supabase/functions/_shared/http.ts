const ALLOWED_ORIGINS = new Set([
  'https://food.bissabi.ch',
  'http://localhost:8081',
  'http://localhost:19006',
]);

const CORS_ALLOW_HEADERS = 'authorization, apikey, content-type, x-client-info';
const CORS_ALLOW_METHODS = 'POST, OPTIONS';

/** En-têtes CORS. L’origine n’est renvoyée que si elle est sur la liste. */
export function corsHeaders(req: Request): Headers {
  const headers = new Headers();
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  headers.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
  const origin = req.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function applyCors(req: Request, response: Response): Response {
  const headers = corsHeaders(req);
  for (const [key, value] of headers) response.headers.set(key, value);
  return response;
}

/** OPTIONS 204 avant toute vérif. Les autres réponses, y compris les erreurs, portent le CORS. */
export function withCors(handler: (req: Request) => Promise<Response> | Response): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) });
    try {
      return applyCors(req, await handler(req));
    } catch {
      const headers = corsHeaders(req);
      headers.set('content-type', 'application/json');
      return new Response(JSON.stringify({ reason: 'error' }), { status: 500, headers });
    }
  };
}

export function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}
