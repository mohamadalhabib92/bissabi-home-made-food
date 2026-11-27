import { edgeEnv } from '../_shared/env.ts';
import { handleStripeWebhook } from '../_shared/webhook.ts';

Deno.serve((req) => handleStripeWebhook(req, edgeEnv(), fetch));
