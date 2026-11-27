import { edgeEnv } from '../_shared/env.ts';
import { handleConnectOnboarding } from '../_shared/payments.ts';

Deno.serve((req) => handleConnectOnboarding(req, edgeEnv(), fetch));
