import type { OrderStatus } from './model';
export const STATUS_LABEL: Record<OrderStatus, { fr: string; en: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  awaiting_payment: { fr: 'Paiement en attente', en: 'Awaiting payment', tone: 'warning' },
  payment_failed: { fr: 'Paiement échoué', en: 'Payment failed', tone: 'danger' },
  requested: { fr: 'En attente du cuisinier', en: 'Waiting for cook', tone: 'info' },
  accepted: { fr: 'Acceptée', en: 'Accepted', tone: 'success' },
  refused: { fr: 'Refusée — remboursée', en: 'Refused — refunded', tone: 'danger' },
  preparing: { fr: 'En préparation', en: 'Being prepared', tone: 'info' },
  ready: { fr: 'Prête', en: 'Ready', tone: 'success' },
  completed: { fr: 'Terminée', en: 'Completed', tone: 'neutral' },
  cancelled: { fr: 'Annulée', en: 'Cancelled', tone: 'neutral' },
};
