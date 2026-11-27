import { handleSyncMe } from '../_shared/accounts.ts';
import { edgeEnv } from '../_shared/env.ts';
import { withCors } from '../_shared/http.ts';

Deno.serve(withCors((req) => handleSyncMe(req, edgeEnv(), fetch)));
