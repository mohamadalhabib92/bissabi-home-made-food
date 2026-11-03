import { publicEnv, supabaseConfigured } from './publicEnv';

/**
 * Point d'entrée Supabase côté app. Aucun client, aucun fetch.
 * Tant que l'URL ou la clé anon manquent, l'écran admin affiche « Configuration requise ».
 * La service role key n'existe pas dans ce fichier.
 */
export function supabaseStatus(): { configured: boolean; message: string | null } {
  if (supabaseConfigured) return { configured: true, message: null };
  const missing = [publicEnv.supabaseUrl, publicEnv.supabaseAnonKey].filter((v) => !v.configured).map((v) => v.name);
  return { configured: false, message: `Configuration requise : ${missing.join(', ')}` };
}
