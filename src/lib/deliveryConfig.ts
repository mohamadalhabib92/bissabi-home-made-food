import { publicEnv } from './publicEnv';

/** Centimes entiers, y compris 0. Absent ou illisible : la livraison reste cachée. */
export function parseCourierFeeCents(enabled: string | null | undefined, raw: string | null | undefined): number | null {
  if (enabled !== '1') return null;
  const text = (raw ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
}

export function deliveryChoiceAvailable(): boolean {
  return parseCourierFeeCents(publicEnv.deliveryEnabled.value, publicEnv.courierFeeCents.value) !== null;
}

export function courierFeeChf(): number | null {
  const cents = parseCourierFeeCents(publicEnv.deliveryEnabled.value, publicEnv.courierFeeCents.value);
  return cents === null ? null : cents / 100;
}

export function handoffOptions(label: (fr: string, en: string) => string): { value: 'pickup' | 'delivery'; label: string }[] {
  const pickup = { value: 'pickup' as const, label: label('Retrait', 'Pickup') };
  if (!deliveryChoiceAvailable()) return [pickup];
  return [pickup, { value: 'delivery', label: label('Livraison (Vaud)', 'Delivery (Vaud)') }];
}
