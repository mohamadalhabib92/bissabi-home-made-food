/**
 * Montants en unités mineures entières + code devise.
 * CHF 18.00 = { amountMinor: 1800, currency: 'CHF' }.
 * L'exposant et l'arrondi viennent de la table des devises, pas d'un cas suisse dans le calcul.
 */

export type Money = { readonly amountMinor: number; readonly currency: string };

export type CurrencyDef = { code: string; exponent: number; cashIncrementMinor: number };

export const CURRENCIES: readonly CurrencyDef[] = [
  { code: 'CHF', exponent: 2, cashIncrementMinor: 5 },
  { code: 'EUR', exponent: 2, cashIncrementMinor: 1 },
  { code: 'USD', exponent: 2, cashIncrementMinor: 1 },
  { code: 'GBP', exponent: 2, cashIncrementMinor: 1 },
  { code: 'XOF', exponent: 0, cashIncrementMinor: 1 },
  { code: 'JPY', exponent: 0, cashIncrementMinor: 1 },
];

const BY_CODE = new Map(CURRENCIES.map((currency) => [currency.code, currency]));

export function currencyDef(code: string): CurrencyDef {
  const found = BY_CODE.get(code);
  if (!found) throw new Error(`unknown_currency:${code}`);
  return found;
}

export function money(amountMinor: number, currency: string): Money {
  if (!Number.isInteger(amountMinor)) throw new Error('minor_not_integer');
  currencyDef(currency);
  return { amountMinor, currency };
}

export function sameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new Error('currency_mismatch');
}

export function addMoney(a: Money, b: Money): Money {
  sameCurrency(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

/** Arrondi demi-supérieur vers le pas de la devise (5 centimes pour le CHF, 1 pour l'EUR). */
export function roundMinor(amountMinor: number, increment: number): number {
  if (!Number.isInteger(amountMinor)) throw new Error('minor_not_integer');
  if (!Number.isInteger(increment) || increment < 1) throw new Error('bad_increment');
  return Math.round(amountMinor / increment) * increment;
}

export function percentMinor(amountMinor: number, rateBps: number, increment: number): number {
  if (!Number.isInteger(rateBps) || rateBps < 0) throw new Error('bad_rate');
  const raw = Math.round((amountMinor * rateBps) / 10_000);
  return roundMinor(raw, increment);
}

/**
 * Frontière avec les prix décimaux déjà enregistrés sur l'appareil (clés AsyncStorage inchangées).
 * N'écrit rien. Le résultat est en centimes de la devise du marché affiché.
 */
export function minorFromDecimal(amount: number, currency: string): number {
  const { exponent } = currencyDef(currency);
  const factor = 10 ** exponent;
  return Math.round(amount * factor);
}

export function formatMoney(value: Money, intl: string): string {
  const { exponent } = currencyDef(value.currency);
  const major = value.amountMinor / 10 ** exponent;
  return new Intl.NumberFormat(intl, { style: 'currency', currency: value.currency }).format(major);
}
