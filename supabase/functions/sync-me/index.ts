import { handleSyncMe } from '../_shared/accounts.ts';
import { edgeEnv } from '../_shared/env.ts';

Deno.serve((req) => handleSyncMe(req, edgeEnv(), fetch));
