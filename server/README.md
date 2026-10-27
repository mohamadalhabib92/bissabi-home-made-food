# Serveur de paiement (à implémenter — non inclus)

L’app n’embarque **que** la clé publique Stripe. La clé secrète vit uniquement sur un petit serveur que vous hébergez
(Cloudflare Worker, Vercel, Supabase Edge Function…). Tant que ce serveur n’existe pas, l’app reste en **paiement simulé**.

## Contrat attendu par l’app (`src/lib/payments.ts`)

### `POST {EXPO_PUBLIC_PAYMENTS_API_URL}/checkout/session`

Corps (montants en centimes CHF) :

```json
{ "orderId": "ord_…", "number": "HMF-261027-AB12", "currency": "chf",
  "lines": [{ "name": "Mafé", "unit_amount": 1700, "quantity": 2 }],
  "commission": 510, "deliveryFee": 0, "total": 3910,
  "successUrl": "…/order/ord_…?paid=success", "cancelUrl": "…/order/ord_…?paid=cancel" }
```

Réponse : `{ "url": "https://checkout.stripe.com/…" }`.

⚠️ Le serveur doit **recalculer** les montants à partir de sa propre base (prix des plats, 15 %, frais) et ne jamais faire
confiance aux montants envoyés par le client.

### `GET {EXPO_PUBLIC_PAYMENTS_API_URL}/orders/:id/payment`

Réponse : `{ "status": "paid" | "failed" | "pending" }` — alimenté par le webhook Stripe, qui fait foi.

## Exemple minimal (Node / Express, à adapter)

```js
import express from 'express';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // YOUR_STRIPE_SECRET_KEY — serveur uniquement
const app = express();
const status = new Map(); // à remplacer par une vraie base

app.post('/checkout/session', express.json(), async (req, res) => {
  const o = req.body; // ⚠️ revalider les prix côté serveur
  const line_items = [
    ...o.lines.map((l) => ({ quantity: l.quantity, price_data: { currency: 'chf', unit_amount: l.unit_amount, product_data: { name: l.name } } })),
    { quantity: 1, price_data: { currency: 'chf', unit_amount: o.commission, product_data: { name: 'Commission plateforme (15 %)' } } },
    ...(o.deliveryFee ? [{ quantity: 1, price_data: { currency: 'chf', unit_amount: o.deliveryFee, product_data: { name: 'Frais de livraison' } } }] : []),
  ];
  const s = await stripe.checkout.sessions.create({ mode: 'payment', line_items, metadata: { orderId: o.orderId },
    success_url: o.successUrl, cancel_url: o.cancelUrl });
  status.set(o.orderId, 'pending');
  res.json({ url: s.url });
});

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const ev = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  const id = ev.data.object.metadata?.orderId;
  if (ev.type === 'checkout.session.completed') status.set(id, 'paid');
  if (ev.type === 'checkout.session.expired' || ev.type === 'checkout.session.async_payment_failed') status.set(id, 'failed');
  res.sendStatus(200);
});

app.get('/orders/:id/payment', (req, res) => res.json({ status: status.get(req.params.id) ?? 'pending' }));
app.listen(8787);
```

Phase 2 : Apple Pay / Google Pay (activables dans Stripe Checkout), Stripe Connect pour reverser automatiquement les cuisiniers.
