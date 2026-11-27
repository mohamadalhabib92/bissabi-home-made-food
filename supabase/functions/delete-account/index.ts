import { handleDeleteAccount } from '../_shared/accounts.ts';
import { edgeEnv } from '../_shared/env.ts';

Deno.serve((req) => handleDeleteAccount(req, edgeEnv(), fetch));
