/**
 * Paiements — chemin production via Stripe Checkout (page hébergée par Stripe, PCI géré par Stripe).
 * - Côté app : uniquement la clé PUBLIQUE (EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) et l’URL de votre serveur.
 * - Côté serveur : YOUR_STRIPE_SECRET_KEY (jamais dans l’app). Voir server/README.md.
 * Sans configuration : paiement SIMULÉ, clairement indiqué, aucun débit.
 */
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { env } from './config';
import type { Order } from './model';

export const STRIPE_PK = env('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY', process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export const PAYMENTS_API = env('EXPO_PUBLIC_PAYMENTS_API_URL', process.env.EXPO_PUBLIC_PAYMENTS_API_URL);
export const SUPPORT_EMAIL = env('EXPO_PUBLIC_SUPPORT_EMAIL', process.env.EXPO_PUBLIC_SUPPORT_EMAIL);
export const paymentsLive = STRIPE_PK.configured && PAYMENTS_API.configured;

export class PaymentError extends Error {}

/** Crée une session Stripe Checkout côté serveur puis ouvre la page de paiement. */
export async function startStripeCheckout(o: Order): Promise<void> {
  if (!paymentsLive) throw new PaymentError('Paiement non configuré');
  const back = Linking.createURL(`/order/${o.id}`);
  let res: Response;
  try {
    res = await fetch(`${PAYMENTS_API.value}/checkout/session`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: o.id, number: o.number, currency: 'chf',
        lines: o.lines.map((l) => ({ name: l.title, unit_amount: Math.round(l.unitPrice * 100), quantity: l.qty })),
        commission: Math.round(o.commission * 100), deliveryFee: Math.round(o.deliveryFee * 100), total: Math.round(o.total * 100),
        successUrl: `${back}?paid=success`, cancelUrl: `${back}?paid=cancel`,
      }),
    });
  } catch {
    throw new PaymentError('Serveur de paiement injoignable. Vérifiez votre connexion et réessayez.');
  }
  if (!res.ok) throw new PaymentError(`Le serveur de paiement a refusé la demande (${res.status}).`);
  const { url } = (await res.json()) as { url?: string };
  if (!url) throw new PaymentError('Réponse de paiement invalide.');
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign(url);
  else await Linking.openURL(url);
}

/** Vérifie le statut côté serveur (le webhook Stripe fait foi). */
export async function fetchPaymentStatus(orderId: string): Promise<'paid' | 'failed' | 'pending' | null> {
  if (!paymentsLive) return null;
  try {
    const r = await fetch(`${PAYMENTS_API.value}/orders/${orderId}/payment`);
    if (!r.ok) return null;
    return ((await r.json()) as { status: 'paid' | 'failed' | 'pending' }).status;
  } catch { return null; }
}
