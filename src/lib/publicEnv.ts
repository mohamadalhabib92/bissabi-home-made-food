import { env } from './config';

/**
 * Variables publiques uniquement. Une valeur vide ou YOUR_* est « non configurée » :
 * la fonction concernée se désactive, sans crash et sans valeur inventée.
 * Les secrets (service role, clé Stripe secrète, webhook, .p8) ne sont jamais lus ici.
 */
const SECRET_MARKERS = ['SERVICE_ROLE', 'SECRET', 'WEBHOOK', 'PRIVATE_KEY', 'ASC_API'];

export type PublicVar = { name: string; value: string | null; configured: boolean; blocked?: boolean };

function publicVar(name: string): PublicVar {
  if (SECRET_MARKERS.some((m) => name.toUpperCase().includes(m))) {
    return { name, value: null, configured: false, blocked: true };
  }
  const read = env(name, process.env[name]);
  return { name: read.name, value: read.value, configured: read.configured };
}

export const publicEnv = {
  supabaseUrl: publicVar('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: publicVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  stripePublishable: publicVar('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  mapsKey: publicVar('EXPO_PUBLIC_MAPS_KEY'),
  sentryDsn: publicVar('EXPO_PUBLIC_SENTRY_DSN'),
  appleMerchantId: publicVar('EXPO_PUBLIC_APPLE_MERCHANT_ID'),
  paymentsApi: publicVar('EXPO_PUBLIC_PAYMENTS_API_URL'),
  supportEmail: publicVar('EXPO_PUBLIC_SUPPORT_EMAIL'),
} as const;

export const publicEnvList: PublicVar[] = Object.values(publicEnv);

export function missingPublicConfig(): string[] {
  return publicEnvList.filter((v) => !v.configured).map((v) => v.name);
}

/** Vrai seulement si l'URL et la clé anon sont réellement renseignées. Aucun client n'est créé ici. */
export const supabaseConfigured = publicEnv.supabaseUrl.configured && publicEnv.supabaseAnonKey.configured;
