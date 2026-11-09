import { COMPANY, COMPANY_LINE } from '../company';
import { ALLERGENS } from '../model';
import type { LocaleId } from '@/i18n/locales';

/**
 * Un marché est une donnée : pays, zones, frais, devise, fuseau, conformité, prestataires.
 * Le pilote est le marché `ch-vd`. Aucun autre pays n'est ouvert.
 * `claim` reste `internal_only` : ce n'est pas une autorisation du chimiste cantonal.
 */

export type MarketStatus = 'pilot' | 'planned' | 'closed';
export type ProviderStatus = 'simulated' | 'planned' | 'live';

export type Zone = {
  id: string;
  countryCode: string;
  regionCode: string;
  city: string;
  postalCodes: string[];
  deliveryFeeMinor: number;
  served: boolean;
};

export type ComplianceProfile = {
  authorityName: string;
  authorityUrl: string | null;
  claim: 'internal_only';
  allergenKeys: readonly string[];
  taxLabel: string;
  taxIncluded: boolean;
  /** null : le taux n'est pas confirmé, aucun montant de taxe n'est ajouté. */
  taxRateBps: number | null;
  sellerLegalName: string | null;
  sellerAddress: string | null;
  sellerRegistration: string | null;
  dataProtection: string;
  dataResidency: string | null;
  confirmedByCounsel: boolean;
  coldMaxC: number;
  reheatMinC: number;
};

export type Market = {
  id: string;
  countryCode: string;
  regionCode: string | null;
  name: string;
  status: MarketStatus;
  defaultLocale: LocaleId;
  currency: string;
  timezone: string;
  cashIncrementMinor: number;
  commissionRateBps: number;
  holdMinutes: number;
  minLeadHours: number;
  zones: Zone[];
  compliance: ComplianceProfile;
  paymentProviders: { id: string; methods: string[]; status: ProviderStatus }[];
  deliveryPartners: { id: string; status: 'manual' | 'planned' | 'live' }[];
  address: { postalLabel: string; postalPattern: string };
};

const CH_PILOT: Market = {
  id: 'ch-vd',
  countryCode: 'CH',
  regionCode: 'VD',
  name: 'Suisse — Vaud (Lausanne et Prilly)',
  status: 'pilot',
  defaultLocale: 'fr',
  currency: 'CHF',
  timezone: 'Europe/Zurich',
  cashIncrementMinor: 5,
  commissionRateBps: 1500,
  holdMinutes: 15,
  minLeadHours: 24,
  zones: [
    { id: 'lausanne', countryCode: 'CH', regionCode: 'VD', city: 'Lausanne', postalCodes: ['1003', '1004', '1005', '1006', '1007'], deliveryFeeMinor: 600, served: true },
    { id: 'prilly', countryCode: 'CH', regionCode: 'VD', city: 'Prilly', postalCodes: ['1008'], deliveryFeeMinor: 600, served: true },
  ],
  compliance: {
    authorityName: 'Chimiste cantonal — Office de la consommation (OFCO), canton de Vaud',
    authorityUrl: 'https://www.vd.ch/prestation/annoncer-une-entreprise-du-secteur-alimentaire-art-20-odalous',
    claim: 'internal_only',
    allergenKeys: ALLERGENS.map((item) => item.key),
    taxLabel: 'TVA',
    taxIncluded: true,
    taxRateBps: null,
    sellerLegalName: COMPANY.name,
    sellerAddress: `${COMPANY.street}, ${COMPANY.city}`,
    sellerRegistration: COMPANY.uid,
    dataProtection: 'nLPD',
    dataResidency: 'CH',
    confirmedByCounsel: false,
    coldMaxC: 5,
    reheatMinC: 70,
  },
  paymentProviders: [
    { id: 'simulated', methods: ['card', 'twint'], status: 'simulated' },
    { id: 'stripe', methods: ['card', 'twint', 'apple_pay', 'google_pay'], status: 'planned' },
    { id: 'payrexx', methods: ['card', 'twint'], status: 'planned' },
    { id: 'datatrans', methods: ['card', 'twint'], status: 'planned' },
    { id: 'wallee', methods: ['card', 'twint'], status: 'planned' },
  ],
  deliveryPartners: [
    { id: 'manual', status: 'manual' },
    { id: 'future_partner', status: 'planned' },
  ],
  address: { postalLabel: 'NPA', postalPattern: '^\\d{4}$' },
};

export function chPilotMarket(): Market {
  return structuredClone(CH_PILOT);
}

export function sellerLine(market: Market): string {
  const name = market.compliance.sellerLegalName;
  const address = market.compliance.sellerAddress;
  const registration = market.compliance.sellerRegistration;
  if (!name || !address || !registration) return '';
  if (market.id === 'ch-vd') return COMPANY_LINE;
  return `${name} · ${address} · ${registration}`;
}

export function zoneForPostal(market: Market, postal: string): Zone | null {
  const code = postal.trim();
  return market.zones.find((zone) => zone.served && zone.postalCodes.includes(code)) ?? null;
}

export function postalAccepted(market: Market, postal: string): boolean {
  return new RegExp(market.address.postalPattern).test(postal.trim());
}

/** Conditions pour essayer le marché en test. Un avis juridique n'est pas exigé ici. */
export function pilotGaps(market: Market): string[] {
  const gaps: string[] = [];
  if (market.status === 'closed') gaps.push('closed');
  if (!market.currency) gaps.push('currency');
  if (!market.timezone) gaps.push('timezone');
  if (!market.compliance.authorityName) gaps.push('authority');
  if (market.compliance.claim !== 'internal_only') gaps.push('claim');
  if (market.compliance.allergenKeys.length === 0) gaps.push('allergens');
  if (!market.compliance.sellerRegistration) gaps.push('seller');
  if (!market.zones.some((zone) => zone.served)) gaps.push('zone');
  if (!market.paymentProviders.some((provider) => provider.status === 'simulated' || provider.status === 'live')) gaps.push('payment');
  return gaps;
}

/** Ouverture réelle. Le pilote suisse ne passe pas : conseil, TVA et prestataire live manquent. */
export function liveGaps(market: Market): string[] {
  const gaps = pilotGaps(market);
  if (!market.compliance.confirmedByCounsel) gaps.push('counsel');
  if (market.compliance.taxRateBps == null) gaps.push('tax');
  if (!market.compliance.dataResidency) gaps.push('residency');
  if (!market.paymentProviders.some((provider) => provider.status === 'live')) gaps.push('live_payment');
  return gaps;
}
