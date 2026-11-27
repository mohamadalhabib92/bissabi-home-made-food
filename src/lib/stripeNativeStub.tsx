import type { ReactNode } from 'react';

/** Remplacement web : le Payment Element n’utilise pas le module natif. */
export function StripeProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useStripe() {
  return {
    initPaymentSheet: async () => ({ error: { code: 'Failed', message: 'web' } }),
    presentPaymentSheet: async () => ({ error: { code: 'Failed', message: 'web' } }),
  };
}
