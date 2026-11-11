/**
 * Sur le web, Checkout hébergé remplace PaymentSheet.
 * Le fichier nativePay.native.tsx charge @stripe/stripe-react-native.
 */
export function NativePay(_props: {
  publishableKey: string;
  clientSecret: string;
  returnURL: string;
  title: string;
  onResult: (message: string) => void;
}) {
  return null;
}

export async function presentTestPaymentSheet(_input: {
  publishableKey: string;
  clientSecret: string;
  returnURL: string;
}): Promise<'presented' | 'unavailable'> {
  return 'unavailable';
}
