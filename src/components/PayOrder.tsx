import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { PaymentElement, useElements, useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useStripe as useNativeStripe } from '@stripe/stripe-react-native';
import { publicEnv } from '@/lib/publicEnv';
import { Button, Muted } from '@/ui/kit';

type Result = 'paid' | 'failed' | 'canceled';

export function PayOrder({ clientSecret, onDone }: { clientSecret: string; onDone: (result: Result) => void }) {
  if (Platform.OS === 'web') return <WebPay clientSecret={clientSecret} onDone={onDone} />;
  return <NativePay clientSecret={clientSecret} onDone={onDone} />;
}

function NativePay({ clientSecret, onDone }: { clientSecret: string; onDone: (result: Result) => void }) {
  const pk = publicEnv.stripePublishable.value;
  if (!pk) return <Button title="Clé Stripe manquante" onPress={() => onDone('failed')} />;
  return <NativeSheet clientSecret={clientSecret} onDone={onDone} />;
}

function NativeSheet({ clientSecret, onDone }: { clientSecret: string; onDone: (result: Result) => void }) {
  const { initPaymentSheet, presentPaymentSheet } = useNativeStripe();
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    const ready = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Bissabi Home Made Food',
      returnURL: 'bissabihomemadefood://stripe',
    });
    if (ready.error) {
      setBusy(false);
      onDone('failed');
      return;
    }
    const presented = await presentPaymentSheet();
    setBusy(false);
    const code = presented.error?.code;
    if (code === 'Canceled') onDone('canceled');
    else if (presented.error) onDone('failed');
    else onDone('paid');
  };
  return <Button title="Payer" loading={busy} onPress={pay} />;
}

function WebPay({ clientSecret, onDone }: { clientSecret: string; onDone: (result: Result) => void }) {
  const pk = publicEnv.stripePublishable.value;
  const [stripe, setStripe] = useState<Stripe | null>(null);
  useEffect(() => {
    if (!pk) return;
    let alive = true;
    void loadStripe(pk).then((next) => { if (alive) setStripe(next); });
    return () => { alive = false; };
  }, [pk]);
  if (!pk || !stripe) return <Muted>Clé Stripe manquante.</Muted>;
  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <WebForm onDone={onDone} />
    </Elements>
  );
}

function WebForm({ onDone }: { onDone: (result: Result) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: typeof window !== 'undefined' ? window.location.href : 'https://bissabi.invalid/order' },
      redirect: 'if_required',
    });
    setBusy(false);
    if (result.error) onDone('failed');
    else if (result.paymentIntent?.status === 'succeeded') onDone('paid');
    else onDone('failed');
  };
  return (
    <>
      <PaymentElement />
      <Button title="Payer" loading={busy} onPress={pay} />
      <Button variant="ghost" title="Annuler" onPress={() => onDone('canceled')} />
    </>
  );
}
