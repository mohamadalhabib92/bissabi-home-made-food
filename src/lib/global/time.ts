/**
 * Créneau : instant UTC + fuseau IANA. L'heure affichée est calculée, pas stockée comme texte local ambigu.
 */

export type ZonedInstant = { at: string; zone: string };

function zoneOffsetMs(utcMs: number, zone: string): number {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(format.formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return asUtc - utcMs;
}

/** Heure murale dans un fuseau IANA → ISO UTC. Deux passes pour l'heure d'été. */
export function utcFromLocal(date: string, time: string, zone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('bad_local_time');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const first = zoneOffsetMs(wallAsUtc, zone);
  let instant = wallAsUtc - first;
  const second = zoneOffsetMs(instant, zone);
  if (second !== first) instant = wallAsUtc - second;
  if (Number.isNaN(instant)) throw new Error('bad_zone');
  return new Date(instant).toISOString();
}

export function formatZoned(value: ZonedInstant, intl: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intl, {
    timeZone: value.zone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(new Date(value.at));
}

export function formatSlotRange(start: ZonedInstant, endIso: string, intl: string): string {
  const endLabel = new Intl.DateTimeFormat(intl, { timeZone: start.zone, hour: '2-digit', minute: '2-digit' }).format(new Date(endIso));
  return `${formatZoned(start, intl)} – ${endLabel}`;
}
