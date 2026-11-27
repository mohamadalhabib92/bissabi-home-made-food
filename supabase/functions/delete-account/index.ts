import { handleDeleteAccount } from '../_shared/accounts.ts';
import { edgeEnv } from '../_shared/env.ts';
import { withCors } from '../_shared/http.ts';

Deno.serve(withCors((req) => handleDeleteAccount(req, edgeEnv(), fetch)));
