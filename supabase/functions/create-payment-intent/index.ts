import { edgeEnv } from '../_shared/env.ts';
import { withCors } from '../_shared/http.ts';
import { handleCreatePaymentIntent } from '../_shared/payments.ts';

Deno.serve(withCors((req) => handleCreatePaymentIntent(req, edgeEnv(), fetch)));
