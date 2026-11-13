/**
 * Abstraction partenaires livraison — interface mockée jusqu’à de vrais accords.
 * Les noms ci-dessous sont des PLACEHOLDERS génériques (pas d’accords signés).
 * Ne jamais afficher de prix inventés comme « tarif officiel » d’un opérateur nommé.
 */
import type { FulfilMode } from './model';

export type DeliveryTrackingState =
  | 'quoted'
  | 'requested'
  | 'accepted'
  | 'at_kitchen'
  | 'picked_up'
  | 'en_route'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type DeliveryQuote = {
  partnerId: string;
  partnerLabel: string;
  /** Montant indicatif mock — placeholder, pas un tarif réel d’opérateur. */
  feeChf: number;
  etaMinutesMin: number;
  etaMinutesMax: number;
  currency: 'CHF';
  mock: true;
  noteFr: string;
  noteEn: string;
};

export type DeliveryJob = {
  id: string;
  partnerId: string;
  orderId: string;
  state: DeliveryTrackingState;
  quote: DeliveryQuote;
  updatedAt: string;
};

export type DeliveryPartnerProvider = {
  id: string;
  /** Libellé générique affiché dans l’UI (pas un vrai partenaire nommé). */
  labelFr: string;
  labelEn: string;
  kind: 'bike_coop' | 'platform' | 'postal' | 'taxi' | 'other';
  zonesHintFr: string;
  zonesHintEn: string;
  quote(input: { distanceKm: number; readyAtISO: string }): Promise<DeliveryQuote>;
  requestJob(orderId: string, quote: DeliveryQuote): Promise<DeliveryJob>;
  getTracking(jobId: string): Promise<DeliveryJob | null>;
};

const MOCK_TRACK: Record<string, DeliveryJob> = {};

function mockFee(distanceKm: number, base: number): number {
  // Heuristique interne de démo uniquement — ne pas présenter comme tarif opérateur.
  const d = Math.max(0, distanceKm);
  return Math.round((base + d * 1.2) * 20) / 20;
}

function makeProvider(
  id: string,
  labelFr: string,
  labelEn: string,
  kind: DeliveryPartnerProvider['kind'],
  zonesHintFr: string,
  zonesHintEn: string,
  baseFee: number,
  etaBase: number,
): DeliveryPartnerProvider {
  return {
    id, labelFr, labelEn, kind, zonesHintFr, zonesHintEn,
    async quote({ distanceKm }) {
      const feeChf = mockFee(distanceKm, baseFee);
      return {
        partnerId: id,
        partnerLabel: labelFr,
        feeChf,
        etaMinutesMin: etaBase,
        etaMinutesMax: etaBase + 15 + Math.round(distanceKm * 3),
        currency: 'CHF',
        mock: true,
        noteFr: 'Devis indicatif (mock) — aucun tarif opérateur réel.',
        noteEn: 'Indicative mock quote — not a real operator tariff.',
      };
    },
    async requestJob(orderId, quote) {
      const job: DeliveryJob = {
        id: `job_${id}_${Date.now()}`,
        partnerId: id,
        orderId,
        state: 'requested',
        quote,
        updatedAt: new Date().toISOString(),
      };
      MOCK_TRACK[job.id] = job;
      return job;
    },
    async getTracking(jobId) {
      return MOCK_TRACK[jobId] ?? null;
    },
  };
}

/** Placeholders génériques — remplacer après accords réels. */
export const MOCK_PARTNERS: DeliveryPartnerProvider[] = [
  makeProvider('partner_bike_a', 'Partenaire vélo A (démo)', 'Bike partner A (demo)', 'bike_coop',
    'Agglomérations (placeholder)', 'Urban areas (placeholder)', 5.5, 25),
  makeProvider('partner_bike_b', 'Collectif coursier B (démo)', 'Courier collective B (demo)', 'bike_coop',
    'Lausanne / Genève (placeholder)', 'Lausanne / Geneva (placeholder)', 5.0, 30),
  makeProvider('partner_platform_c', 'Plateforme livraison C (démo)', 'Delivery platform C (demo)', 'platform',
    'Grandes villes CH (placeholder)', 'Major CH cities (placeholder)', 7.0, 20),
  makeProvider('partner_postal_d', 'Réseau postal / same-day D (démo)', 'Postal / same-day network D (demo)', 'postal',
    'Selon offre same-day locale (placeholder)', 'Per local same-day offer (placeholder)', 8.5, 40),
  makeProvider('partner_taxi_e', 'Taxi / course locale E (démo)', 'Local taxi / ride E (demo)', 'taxi',
    'Ville + périphérie (placeholder)', 'City + outskirts (placeholder)', 12.0, 15),
];

export function getPartner(id: string): DeliveryPartnerProvider | undefined {
  return MOCK_PARTNERS.find((p) => p.id === id);
}

export async function quoteAll(distanceKm: number, readyAtISO: string): Promise<DeliveryQuote[]> {
  return Promise.all(MOCK_PARTNERS.map((p) => p.quote({ distanceKm, readyAtISO })));
}

/** Avance mock du tracking pour la démo UI. */
export function advanceMockTracking(jobId: string): DeliveryJob | null {
  const job = MOCK_TRACK[jobId];
  if (!job) return null;
  const order: DeliveryTrackingState[] = ['requested', 'accepted', 'at_kitchen', 'picked_up', 'en_route', 'delivered'];
  const i = order.indexOf(job.state);
  if (i >= 0 && i < order.length - 1) {
    job.state = order[i + 1];
    job.updatedAt = new Date().toISOString();
  }
  return job;
}

export const TRACKING_LABEL: Record<DeliveryTrackingState, { fr: string; en: string }> = {
  quoted: { fr: 'Devisé', en: 'Quoted' },
  requested: { fr: 'Course demandée', en: 'Job requested' },
  accepted: { fr: 'Acceptée par le coursier', en: 'Accepted by courier' },
  at_kitchen: { fr: 'Arrivé chez le cook', en: 'At the cook' },
  picked_up: { fr: 'Récupéré', en: 'Picked up' },
  en_route: { fr: 'En route', en: 'En route' },
  delivered: { fr: 'Livré', en: 'Delivered' },
  failed: { fr: 'Échec', en: 'Failed' },
  cancelled: { fr: 'Annulé', en: 'Cancelled' },
};

export function modesForDish(opts?: FulfilMode[] | null): FulfilMode[] {
  if (opts && opts.length) return opts;
  return ['pickup', 'delivery'];
}
