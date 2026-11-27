import { handleCrmSync } from '../_shared/accounts.ts';
import { edgeEnv } from '../_shared/env.ts';

Deno.serve((req) => handleCrmSync(req, edgeEnv(), fetch));
