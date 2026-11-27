/** Lecture d’environnement au moment de l’appel. Aucune valeur par défaut secrète. */
export function readEnv(name: string): string | undefined {
  const host = globalThis as { Deno?: { env?: { get?: (key: string) => string | undefined } } };
  const value = host.Deno?.env?.get?.(name);
  return value && value.trim() ? value.trim() : undefined;
}
