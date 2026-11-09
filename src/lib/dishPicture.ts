/**
 * Choix d'affichage seulement. Ne modifie jamais l'objet plat ni le stockage.
 * Une photo déjà posée par le cuisinier (URI, fichier, data URL) gagne toujours
 * sur le catalogue de démonstration.
 */
export type DishLike = { id: string; photo?: string | null };

export type DishPicture<T> =
  | { kind: 'upload'; source: { uri: string } }
  | { kind: 'catalog'; source: T }
  | { kind: 'none' };

export const DEMO_DISH_IDS = [
  'demo-d1',
  'demo-d2',
  'demo-d3',
  'demo-d4',
  'demo-d5',
  'demo-d6',
  'demo-d7',
  'demo-d8',
  'demo-d9',
  'demo-d10',
] as const;

export function chooseDishPicture<T>(dish: DishLike, catalog: Readonly<Record<string, T>>): DishPicture<T> {
  const photo = typeof dish.photo === 'string' ? dish.photo.trim() : '';
  if (photo) return { kind: 'upload', source: { uri: photo } };
  const source = catalog[dish.id];
  if (source !== undefined) return { kind: 'catalog', source };
  return { kind: 'none' };
}
