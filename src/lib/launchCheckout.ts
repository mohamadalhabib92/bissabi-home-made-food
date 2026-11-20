/**
 * Lancement : retrait seulement (décision du 6 novembre 2026, répétée le 7).
 * Les nouvelles commandes ne proposent pas la livraison et n'appellent pas Stripe.
 * Les commandes, paniers et adresses déjà enregistrés ne sont pas réécrits.
 */

export const LAUNCH_CHECKOUT_MODE = 'pickup' as const;

export type CheckoutOffer = {
  mode: typeof LAUNCH_CHECKOUT_MODE;
  selectable: readonly ['pickup'];
  deliveryOffered: false;
  /** Le panier ou l'URL demandait la livraison : inviter à choisir un retrait, sans toucher à l'historique. */
  promptPickup: boolean;
};

export function checkoutOffer(requested: string | null | undefined): CheckoutOffer {
  return {
    mode: LAUNCH_CHECKOUT_MODE,
    selectable: ['pickup'],
    deliveryOffered: false,
    promptPickup: requested === 'delivery',
  };
}

/** Paiement du lancement : simulation locale. Aucun appel Stripe ni serveur. */
export function launchPayment(): { callsStripe: false; callsBackend: false; simulated: true } {
  return { callsStripe: false, callsBackend: false, simulated: true };
}

export function newOrderFulfilment(): { mode: 'pickup'; address: undefined } {
  return { mode: 'pickup', address: undefined };
}

/** Créneaux proposés à l'acheteur. Les créneaux déjà enregistrés ne sont pas modifiés. */
export function buyerVisibleSlots<T extends { modes: readonly string[] }>(slots: readonly T[]): T[] {
  return slots.filter((slot) => slot.modes.includes('pickup'));
}

/**
 * Ouvrir le checkout ne transforme pas l'historique.
 * La même référence est renvoyée : aucune copie, aucun changement de mode ni d'adresse.
 */
export function historicalRecordsUnchanged<T>(records: readonly T[]): readonly T[] {
  return records;
}

export function prepareLaunchCheckout<T extends { mode: string; address?: string }>(
  history: readonly T[],
  cart: readonly unknown[],
  requested: string | null | undefined,
): {
  history: readonly T[];
  cart: readonly unknown[];
  next: { mode: 'pickup'; address: undefined };
  offer: CheckoutOffer;
} {
  return {
    history: historicalRecordsUnchanged(history),
    cart: historicalRecordsUnchanged(cart),
    next: newOrderFulfilment(),
    offer: checkoutOffer(requested),
  };
}
