import { edgeEnv } from '../_shared/env.ts';
import { handleCreatePaymentIntent } from '../_shared/payments.ts';

Deno.serve((req) => handleCreatePaymentIntent(req, edgeEnv(), fetch));
