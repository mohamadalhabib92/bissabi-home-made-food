/**
 * Prestataire de paiement. Le seul branchement livré est le simulé, clairement étiqueté.
 * Les identifiants stripe, datatrans, payrexx et wallee existent pour le choix de Mohamed.
 * Aucune clé, aucun appel réseau.
 */

export type PaymentKind = 'payment_succeeded' | 'payment_failed' | 'refunded';

export type ProviderEvent = {
  id: string;
  orderId: string;
  kind: PaymentKind;
  amountMinor: number;
  currency: string;
  /** Remboursement : part du sous-total plats rendue au client. La livraison n'est pas dedans. */
  dishRefundMinor?: number;
};

export type PaymentProvider = {
  id: 'simulated' | 'stripe' | 'datatrans' | 'payrexx' | 'wallee';
  mode: 'test' | 'live';
  label: { fr: string; en: string };
  verify(event: ProviderEvent, signature: string): boolean;
};

export const SIMULATED_MARK = 'test';

export function simulatedSignature(eventId: string): string {
  return `simulated.${eventId}.${SIMULATED_MARK}`;
}

export const simulatedProvider: PaymentProvider = {
  id: 'simulated',
  mode: 'test',
  label: { fr: 'Paiement simulé — aucun débit', en: 'Simulated payment — no charge' },
  verify(event, signature) {
    return signature === simulatedSignature(event.id);
  },
};

export function providerById(id: PaymentProvider['id']): PaymentProvider | null {
  if (id === 'simulated') return simulatedProvider;
  return null;
}
