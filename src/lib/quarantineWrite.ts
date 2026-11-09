import {
  QUARANTINE_INDEX_KEY,
  captureIfAbsent,
  type PreserveReason,
  type QuarantineRecord,
} from './preserve';

export type QuarantineMap = Record<string, QuarantineRecord>;

type QuarantineIo = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/**
 * Lecture-écriture de l'index de quarantaine, une à la fois.
 * Neuf clés peuvent appeler la première capture au même lancement :
 * sans file, chacune relit l'index encore vide et la dernière écriture
 * efface les copies des autres. Les clés et le format déjà en place
 * ne sont pas réécrits.
 */
export function createQuarantineIndex(io: QuarantineIo) {
  let chain: Promise<void> = Promise.resolve();

  function exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = chain.then(task, task);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async function read(): Promise<{ ok: true; map: QuarantineMap } | { ok: false }> {
    try {
      const raw = await io.getItem(QUARANTINE_INDEX_KEY);
      if (raw == null) return { ok: true, map: {} };
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false };
      return { ok: true, map: parsed as QuarantineMap };
    } catch {
      return { ok: false };
    }
  }

  async function write(map: QuarantineMap): Promise<boolean> {
    try {
      await io.setItem(QUARANTINE_INDEX_KEY, JSON.stringify(map));
      return true;
    } catch {
      return false;
    }
  }

  async function capture(key: string, reason: PreserveReason, raw: string): Promise<void> {
    await exclusive(async () => {
      const loaded = await read();
      if (!loaded.ok) return;
      const next = captureIfAbsent(loaded.map[key] ?? null, {
        key,
        reason,
        raw,
        at: new Date().toISOString(),
      });
      if (!next) return;
      loaded.map[key] = next;
      await write(loaded.map);
    });
  }

  function purge(): Promise<boolean> {
    return exclusive(async () => {
      try {
        await io.removeItem(QUARANTINE_INDEX_KEY);
        return true;
      } catch {
        return false;
      }
    });
  }

  return { read, write, capture, purge, exclusive };
}
