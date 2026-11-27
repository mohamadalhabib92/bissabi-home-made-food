import { edgeEnv } from '../_shared/env.ts';
import { handleCreateOrder } from '../_shared/orders.ts';

Deno.serve((req) => handleCreateOrder(req, edgeEnv(), fetch));
