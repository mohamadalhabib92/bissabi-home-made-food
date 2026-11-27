import { edgeEnv } from '../_shared/env.ts';
import { withCors } from '../_shared/http.ts';
import { handleConnectOnboarding } from '../_shared/payments.ts';

Deno.serve(withCors((req) => handleConnectOnboarding(req, edgeEnv(), fetch)));
