import { useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useL } from '@/lib/data';
import { publicEnv } from '@/lib/publicEnv';
import { interpretPayReturn } from '@/server/stripe/connect';
import { NativePay } from '@/lib/stripe/nativePay';
import { Button, Field, Muted, Notice, Screen } from '@/ui/kit';

/**
 * Paiement Stripe Connect en mode test.
 * Natif : PaymentSheet (@stripe/stripe-react-native), returnURL pour TWINT.
 * PWA : Checkout hébergé (TWINT redirige ou affiche un QR), puis retour ici.
 * Cet écran ne marque jamais la commande payée. Le webhook le fait.
 */
export default function StripePay() {
  const { L } = useL();
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const api = publicEnv.paymentsApi.value;
  const publishable = publicEnv.stripePublishable.value;
  const pay = async () => {
    if (!api || !publishable) {
      setMessage(L('Clé publique ou URL du serveur manquante. Aucun débit.', 'Publishable key or server URL missing. No charge.'));
      return;
    }
    const returnUrl = Linking.createURL('/pay-return');
    const response = await fetch(`${api}/create-payment`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId,
        surface: Platform.OS === 'web' ? 'web' : 'native',
        returnUrl,
        successUrl: returnUrl,
        cancelUrl: Linking.createURL('/stripe-pay'),
      }),
    });
    const body = await response.json() as { checkoutUrl?: string; clientSecret?: string; error?: string };
    if (!response.ok) {
      setMessage(body.error ?? L('Le serveur a refusé le paiement test.', 'The server refused the test payment.'));
      return;
    }
    if (Platform.OS === 'web' && body.checkoutUrl && typeof window !== 'undefined') {
      window.location.assign(body.checkoutUrl);
      return;
    }
    if (body.clientSecret) {
      setClientSecret(body.clientSecret);
      setMessage(L('Ouvrez la feuille de paiement. TWINT peut quitter l’app puis revenir. Le webhook confirme.', 'Open the payment sheet. TWINT may leave the app and come back. The webhook confirms.'));
      return;
    }
    setMessage(L('Réponse de paiement incomplète.', 'Incomplete payment response.'));
  };
  return (
    <Screen>
      <Notice tone="warning" title={L('Stripe test', 'Stripe test')} text={L('TWINT et cartes, francs suisses. Aucune vente réelle : le serveur refuse une clé live tant que payments_live est faux. Ce n’est pas un achat intégré Apple ou Google.', 'TWINT and cards, Swiss francs. No real sale: the server rejects a live key while payments_live is false. This is not an Apple or Google in-app purchase.')} />
      <Muted>{L('Après TWINT, vous revenez ici. Le paiement n’est pas confirmé par ce retour.', 'After TWINT, you come back here. This return does not confirm the payment.')}</Muted>
      <Field label={L('Numéro de commande', 'Order number')} value={orderId} onChangeText={setOrderId} autoCapitalize="none" />
      <Button title={L('Préparer le paiement test', 'Prepare the test payment')} onPress={pay} />
      {clientSecret && publishable ? (
        <NativePay
          publishableKey={publishable}
          clientSecret={clientSecret}
          returnURL={Linking.createURL('/pay-return')}
          title={L('Payer par carte ou TWINT', 'Pay by card or TWINT')}
          onResult={setMessage}
        />
      ) : null}
      {message ? <Notice tone="info" title={message} /> : null}
    </Screen>
  );
}

export function returnDoesNotMarkPaid(query: Record<string, string | undefined>) {
  return interpretPayReturn(query);
}
