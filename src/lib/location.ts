import * as Location from 'expo-location';
export type GpsResult = { ok: true; lat: number; lng: number } | { ok: false; reason: 'denied' | 'unavailable' };
/** Position ponctuelle (jamais en arrière-plan, jamais stockée côté serveur). */
export async function getGps(): Promise<GpsResult> {
  try {
    const p = await Location.requestForegroundPermissionsAsync();
    if (p.status !== 'granted') return { ok: false, reason: 'denied' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    // Arrondi ~100 m : minimisation des données
    return { ok: true, lat: Math.round(pos.coords.latitude * 1000) / 1000, lng: Math.round(pos.coords.longitude * 1000) / 1000 };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
