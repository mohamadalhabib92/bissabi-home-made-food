# Stripe Connect (test)

Le client paie dans l’app. L’argent va sur le compte Express du cuisinier. Bissabi garde 10 % des plats, plus la livraison, via `application_fee_amount`. Le taux est lu dans `payments.settings` (1000), pas envoyé par le téléphone.

TWINT est une redirection (application sur mobile, QR sur ordinateur). Stripe renvoie vers `return_url` avec `payment_intent` dans l’adresse. Cet écran n’est pas une preuve : seul le webhook signé change le statut.

`PAYMENTS_LIVE` doit rester `false`. Une clé `sk_live` est refusée. Aucune vente réelle.

## Ce que Mohamed fait lui-même

1. Créer le compte Stripe de **Bissabi Drinks - BA** (Suisse, CHF), en mode test d’abord.
2. Dans le tableau de bord Stripe : activer **Connect** (comptes Express) et **TWINT** (`twint_payments`) sur la plateforme. Le site public doit montrer le nom légal, l’adresse, les conditions et les prix en CHF avant que TWINT ne passe « active ».
3. Donner à l’app seulement `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (elle commence par `pk_test_`).
4. Donner au serveur, jamais à l’app : `STRIPE_SECRET_KEY` (`sk_test_…`) et `STRIPE_WEBHOOK_SECRET` (`whsec_…`).
5. Créer le webhook vers `https://<projet>.supabase.co/functions/v1/stripe-webhook` pour les événements `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`.
6. Laisser `PAYMENTS_LIVE` à `false` et `SUPABASE_SERVICE_ROLE_KEY` uniquement sur les fonctions Edge.
7. Apple Pay : enregistrer un merchant id chez Apple, puis le mettre dans le plugin. Google Pay : l’activer dans Stripe. Les deux passent par Stripe, pas par un achat intégré du magasin d’applications.

La migration `supabase/migrations/20261111170000_stripe_connect.sql` se teste en local (`npm run test:stripe`). Ne pas l’appliquer sur un projet hébergé.
