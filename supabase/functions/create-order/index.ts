import { edgeEnv } from '../_shared/env.ts';
import { withCors } from '../_shared/http.ts';
import { handleCreateOrder } from '../_shared/orders.ts';

Deno.serve(withCors((req) => handleCreateOrder(req, edgeEnv(), fetch)));
