import { edgeEnv } from '../_shared/env.ts';
import { handleCreateRefund } from '../_shared/payments.ts';

Deno.serve((req) => handleCreateRefund(req, edgeEnv(), fetch));
