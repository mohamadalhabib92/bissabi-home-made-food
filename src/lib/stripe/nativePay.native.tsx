import { useState } from 'react';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { Button } from '@/ui/kit';

/** PaymentSheet. TWINT quitte l'app puis revient sur returnURL. Pas un achat intégré. */
export function NativePay({
  publishableKey,
  clientSecret,
  returnURL,
  title,
  onResult,
}: {
  publishableKey: string;
  clientSecret: string;
  returnURL: string;
  title: string;
  onResult: (message: string) => void;
}) {
  return (
    <StripeProvider publishableKey={publishableKey} urlScheme="bissabihomemadefood">
      <Sheet clientSecret={clientSecret} returnURL={returnURL} title={title} onResult={onResult} />
    </StripeProvider>
  );
}

function Sheet({ clientSecret, returnURL, title, onResult }: { clientSecret: string; returnURL: string; title: string; onResult: (message: string) => void }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [busy, setBusy] = useState(false);
  const open = async () => {
    setBusy(true);
    const init = await initPaymentSheet({
      merchantDisplayName: 'Bissabi Home Made Food',
      paymentIntentClientSecret: clientSecret,
      returnURL,
      allowsDelayedPaymentMethods: true,
      googlePay: { merchantCountryCode: 'CH', currencyCode: 'CHF', testEnv: true },
    });
    if (init.error) {
      setBusy(false);
      onResult(init.error.message);
      return;
    }
    const presented = await presentPaymentSheet();
    setBusy(false);
    onResult(presented.error ? presented.error.message : 'sheet_closed');
  };
  return <Button title={title} loading={busy} onPress={open} />;
}

export async function presentTestPaymentSheet(): Promise<'presented' | 'unavailable'> {
  return 'presented';
}
