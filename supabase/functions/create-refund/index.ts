import { edgeEnv } from '../_shared/env.ts';
import { withCors } from '../_shared/http.ts';
import { handleCreateRefund } from '../_shared/payments.ts';

Deno.serve(withCors((req) => handleCreateRefund(req, edgeEnv(), fetch)));
