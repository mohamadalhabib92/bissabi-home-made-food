import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { publicEnv, supabaseConfigured } from './publicEnv';

/**
 * Point d'entrée Supabase côté app (URL publique + clé anon uniquement).
 * Tant que l'URL ou la clé anon manquent, aucun client n'est créé : getSupabase() renvoie null,
 * l'app reste en mode local / démo et l'écran admin affiche « Configuration requise ».
 * La service role key n'existe pas dans ce fichier.
 */
export function supabaseStatus(): { configured: boolean; message: string | null } {
  if (supabaseConfigured) return { configured: true, message: null };
  const missing = [publicEnv.supabaseUrl, publicEnv.supabaseAnonKey].filter((v) => !v.configured).map((v) => v.name);
  return { configured: false, message: `Configuration requise : ${missing.join(', ')}` };
}

let client: SupabaseClient | null | undefined;

/** Client Supabase unique (créé à la demande), ou null en mode démo. Ne lève jamais d'exception. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = publicEnv.supabaseUrl.value;
  const anonKey = publicEnv.supabaseAnonKey.value;
  if (!supabaseConfigured || !url || !anonKey) {
    client = null;
    return client;
  }
  // Sur le web sans `window` (rendu hors navigateur), pas de stockage persistant.
  const canPersist = Platform.OS !== 'web' || typeof window !== 'undefined';
  try {
    client = createClient(url, anonKey, {
      auth: {
        storage: canPersist ? AsyncStorage : undefined,
        persistSession: canPersist,
        autoRefreshToken: canPersist,
        detectSessionInUrl: Platform.OS === 'web' && canPersist,
      },
    });
  } catch {
    client = null;
  }
  return client;
}

/** Vrai si l'app fonctionne sans backend (variables absentes ou YOUR_*). */
export function isDemoMode(): boolean {
  return getSupabase() === null;
}
