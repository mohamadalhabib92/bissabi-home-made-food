/** Lecture d’environnement au moment de l’appel. Aucune valeur par défaut secrète. */

export type EdgeEnv = {
  supabaseUrl?: string;
  serviceKey?: string;
  stripeKey?: string;
  webhookSecret?: string;
  connectWebhookSecret?: string;
  crmUrl?: string;
  crmKey?: string;
  launch?: string;
  deliveryEnabled?: string;
  courierFeeRaw?: string;
};

export function readEnv(name: string): string | undefined {
  const host = globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } };
  const value = host.Deno?.env?.get?.(name);
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function edgeEnv(get: (name: string) => string | undefined = readEnv): EdgeEnv {
  return {
    supabaseUrl: clean(get('SUPABASE_URL')),
    serviceKey: clean(get('SUPABASE_SERVICE_ROLE_KEY')),
    stripeKey: clean(get('STRIPE_SECRET_KEY')),
    webhookSecret: clean(get('STRIPE_WEBHOOK_SECRET')),
    connectWebhookSecret: clean(get('STRIPE_CONNECT_WEBHOOK_SECRET')),
    crmUrl: clean(get('CRM_SUPABASE_URL')),
    crmKey: clean(get('CRM_SERVICE_ROLE_KEY')),
    launch: get('LAUNCH_PAYMENTS')?.trim() ?? '',
    deliveryEnabled: get('DELIVERY_ENABLED')?.trim() ?? '',
    courierFeeRaw: get('COURIER_FEE_CENTS')?.trim() ?? '',
  };
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed.startsWith('YOUR_')) return undefined;
  return trimmed;
}

export function bearer(header: string | null): string {
  if (!header) return '';
  const match = header.match(/^Bearer\s+(\S+)\s*$/i);
  return match?.[1] ?? '';
}

export function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length === right.length ? 0 : 1;
  for (let i = 0; i < length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

export function isServiceRole(authorization: string | null, serviceKey: string | undefined): boolean {
  if (!serviceKey) return false;
  return safeEqual(bearer(authorization), serviceKey);
}
