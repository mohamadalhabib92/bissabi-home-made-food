import { useLocalSearchParams } from 'expo-router';
import { useL } from '@/lib/data';
import { interpretPayReturn } from '@/server/stripe/connect';
import { Notice, Screen } from '@/ui/kit';

/** Retour TWINT ou Checkout. N'écrit aucun statut payé. */
export default function PayReturn() {
  const { L } = useL();
  const params = useLocalSearchParams<{ payment_intent?: string }>();
  const back = interpretPayReturn({ payment_intent: params.payment_intent });
  return (
    <Screen>
      <Notice
        tone="info"
        title={L('Retour de paiement', 'Payment return')}
        text={back.paymentIntentId
          ? L('Stripe a renvoyé vers l’app. La commande ne passe payée que lorsque le webhook signé est reçu.', 'Stripe sent you back to the app. The order becomes paid only when the signed webhook arrives.')
          : L('Retour sans paiement identifié.', 'Return without an identified payment.')}
      />
    </Screen>
  );
}
