import { useData } from './data';
import type { Order } from './model';
import { paymentsLive, PaymentError, startStripeCheckout } from './payments';

/** Paiement d’une commande : Stripe si configuré, sinon simulation de démo explicite. */
export function usePay() {
  const { setOrderStatus, cooks } = useData();
  return async (o: Order, demoOutcome: 'success' | 'failure' = 'success'): Promise<{ ok: boolean; error?: string }> => {
    if (paymentsLive) {
      try {
        await startStripeCheckout(o); // redirection ; le retour /order/[id]?paid=… met à jour le statut
        return { ok: true };
      } catch (e) {
        const error = e instanceof PaymentError ? e.message : 'Erreur de paiement inconnue.';
        setOrderStatus(o.id, 'payment_failed', { payment: { method: 'stripe', error } }, error);
        return { ok: false, error };
      }
    }
    await new Promise((r) => setTimeout(r, 700));
    if (demoOutcome === 'failure') {
      const error = 'Carte refusée (simulation de démo).';
      setOrderStatus(o.id, 'payment_failed', { payment: { method: 'demo', error } }, error);
      return { ok: false, error };
    }
    const ref = `DEMO-${Date.now().toString(36).toUpperCase()}`;
    setOrderStatus(o.id, 'requested', { payment: { method: 'demo', ref } }, 'Paiement simulé (démo) — aucun débit');
    const cook = cooks.find((c) => c.id === o.cookId);
    if (cook?.demo) setTimeout(() => setOrderStatus(o.id, 'accepted', undefined, 'Acceptation simulée (cuisinier de démo)'), 2500);
    return { ok: true };
  };
}
