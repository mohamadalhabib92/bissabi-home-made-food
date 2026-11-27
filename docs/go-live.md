# Mise en ligne — à lancer par Mohamed, après relecture

Rien dans cette liste n’a été exécuté par l’agent. Pas de fusion dans `main`. Pas de soumission App Store. Pas d’appel Stripe live.

Deux projets Supabase existent déjà. On ne les recrée pas.

| Projet | Ref | Région | Rôle |
|---|---|---|---|
| bissabi-home-made-food | `qizhprlzeiqrngwpxjnd` | eu-central-2 (Zurich) | Comptes, cuisines, commandes, Stripe |
| bissabi-crm | `ppeovmfuhtidavdnrwxu` | (projet CRM) | Schéma `bissabi_food`, écrit par `crm-sync` |

La commission est une seule valeur : `COMMISSION_RATE = 0.1` dans `src/lib/pricing.ts`. Stripe en dérive `PLATFORM_FEE_BPS` (1000). Devise : CHF. La commission est retenue sur le vendeur, pas ajoutée à l’acheteur. Elle est la même pour une cuisine maison et un traiteur.

## 1. Secrets, hors du dépôt

Copier `.env.example` vers `.env` et vers les secrets EAS / Supabase. Remplacer seulement les `YOUR_*`.

Client (publiques) :

- `EXPO_PUBLIC_SUPABASE_URL` = `https://qizhprlzeiqrngwpxjnd.supabase.co` (déjà dans l’exemple)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = clé anon du projet food
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` = clé publiable Stripe, mode test d’abord
- `EXPO_PUBLIC_LAUNCH_PAYMENTS` reste vide jusqu’à l’étape 6

Serveur, fonctions food (jamais `EXPO_PUBLIC_`) :

- `SUPABASE_URL` = `https://qizhprlzeiqrngwpxjnd.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (endpoint plateforme : paiements et remboursements)
- `STRIPE_CONNECT_WEBHOOK_SECRET` (endpoint Connect : `account.updated`, `payout.paid`, `payout.failed`)
- `CRM_SUPABASE_URL` = `https://ppeovmfuhtidavdnrwxu.supabase.co`
- `CRM_SERVICE_ROLE_KEY` = clé service du projet CRM, pas celle du projet food
- `LAUNCH_PAYMENTS` = `1` seulement à l’étape 6, sur les fonctions

`SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés par Supabase dans les fonctions du projet food. Les poser aussi si l’injection n’est pas là. Pour le déclencheur d’inscription, enregistrer la clé service food dans le Vault sous le nom `food_service_role_key` (tableau de bord → Vault, ou `select vault.create_secret('<clé>', 'food_service_role_key');`).

Site public à la racine du domaine : `EXPO_PUBLIC_WEB_BASE=/`. Sans elle, l’export web garde le préfixe GitHub Pages.

## 2. Schéma food (projet qizhprlzeiqrngwpxjnd)

Déjà appliqués : `stripe_connect_ledger`, `accounts_couriers_rls`, `live_marketplace`. Il reste le correctif :

```bash
npx supabase link --project-ref qizhprlzeiqrngwpxjnd
npx supabase db push
```

Ça applique `supabase/migrations/20261127170000_rls_and_order_payments.sql` : vue `courier_jobs_open` sans codes, mises à jour cuisine et course, table `order_payments`, déclencheur d’inscription vers `crm-sync`. Ça n’applique pas `supabase/crm-migrations/`.

L’admin n’est pas un rôle d’inscription. Pour un compte déjà créé :

```sql
insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');
```

## 3. Schéma CRM (projet ppeovmfuhtidavdnrwxu)

Déjà appliqué : `supabase/crm-migrations/20261127120000_bissabi_food_sync.sql` (schéma `bissabi_food`, RLS, aucun droit pour `anon`).

Il reste l’exposition Data API, sinon PostgREST ne voit pas le schéma et `crm-sync` ne peut pas écrire :

```bash
npx supabase link --project-ref ppeovmfuhtidavdnrwxu
npx supabase db query --linked -f supabase/crm-migrations/20261127170000_expose_bissabi_food.sql
```

Le SQL donne l’usage à `service_role` et ajoute `bissabi_food` aux schémas exposés (`pgrst.db_schemas`). Si l’`alter role` est refusé, l’ajouter à la main : projet CRM → Data API → Exposed schemas → `bissabi_food`. Ne pas donner de droit de table à `anon`.

`crm-sync` envoie `Accept-Profile` et `Content-Profile: bissabi_food`, le même choix que `createClient(url, key, { db: { schema: 'bissabi_food' } })`.

Revenir ensuite au projet food (`supabase link --project-ref qizhprlzeiqrngwpxjnd`) avant de déployer les fonctions.

## 4. Fonctions (projet food seulement)

```bash
npx supabase functions deploy stripe-webhook --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy create-payment-intent --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy connect-onboarding --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy create-refund --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy delete-account --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy crm-sync --project-ref qizhprlzeiqrngwpxjnd
npx supabase secrets set --project-ref qizhprlzeiqrngwpxjnd \
  STRIPE_SECRET_KEY=… \
  STRIPE_WEBHOOK_SECRET=… \
  STRIPE_CONNECT_WEBHOOK_SECRET=… \
  CRM_SUPABASE_URL=https://ppeovmfuhtidavdnrwxu.supabase.co \
  CRM_SERVICE_ROLE_KEY=…
```

`supabase/config.toml` pose `verify_jwt = false` pour `stripe-webhook` seulement. Le déploiement de cette fonction doit lire ce fichier. Les autres fonctions gardent la vérification JWT.

Deux endpoints Stripe, mode test, même URL :

`https://qizhprlzeiqrngwpxjnd.supabase.co/functions/v1/stripe-webhook`

- Endpoint plateforme, secret `STRIPE_WEBHOOK_SECRET` : `payment_intent.succeeded`, `checkout.session.completed`, `charge.refunded`, `refund.created`.
- Endpoint Connect, secret `STRIPE_CONNECT_WEBHOOK_SECRET` : `account.updated`, `payout.paid`, `payout.failed`.

Chaque `event.id` est inséré dans `payment_events`. Un doublon répond 200 sans réécrire.

`crm-sync` n’accepte que la clé service, et seulement `{ "orderId" }` ou `{ "userId" }`. Il reconstruit les lignes depuis `order_payments`, `profiles`, `account_profiles`, `cooks` et `kitchens`. Le webhook l’appelle après un paiement ou un remboursement. Le déclencheur SQL l’appelle après une nouvelle fiche, si `food_service_role_key` est dans le Vault. Un corps fourni par l’app (nom, montant, rôle) est refusé.

## 5. Site et App Store, ensemble

Web, à la racine du domaine choisi :

```bash
EXPO_PUBLIC_WEB_BASE=/ npx expo export --platform web
```

Le dossier `dist/` est le site. Le workflow GitHub Pages de `main` n’est pas le lancement : ne pas fusionner cette branche dans `main` pour publier.

iOS, quand les clés client sont dans EAS :

```bash
bunx eas-cli build --platform ios --profile production
bunx eas-cli submit --platform ios --profile production
```

Avant la revue :

- Compte : e-mail, mot de passe, lien magique. Pas de bouton Google ou Facebook, donc pas de Sign in with Apple.
- « Supprimer mon compte » est dans l’app et appelle `delete-account`.
- Le manifeste déclare e-mail, nom et historique d’achats, sans suivi.
- Les plats d’exemple sont étiquetés démo. Le texte d’erreur ne contient plus `YOUR_SUPPORT_EMAIL`.
- Ne pas soumettre tant que l’étape 6 n’est pas faite : une place de marché qui ne peut pas encaisser est refusée.

## 6. Ouvrir les ventes

Seulement après hygiène des cuisines, contrôle des autorités, paiement et sécurité :

```bash
EXPO_PUBLIC_LAUNCH_PAYMENTS=1
```

Puis un nouveau build iOS et un nouvel export web. Sans ce drapeau, `serverMayCollect` refuse l’encaissement. Une cuisine doit en plus avoir `hygiene_passed` et le statut OFCO posé par un admin, pas par le vendeur.

## 7. Comment Bissabi CRM Pro lira ces données

Hors de ce dépôt. Le repo `mohamadalhabib92/bissabi-crm-pro` stocke aujourd’hui ses données sur l’appareil et importe du JSON. Ce dépôt-ci ne le modifie pas.

Quand CRM Pro sera branché, il lira le projet `ppeovmfuhtidavdnrwxu`, schéma `bissabi_food` :

| Table | Clé | Contenu |
|---|---|---|
| `bissabi_food.contacts` | `external_id` | Acheteur ou vendeur (`kind` = `buyer` ou `seller`), nom, e-mail |
| `bissabi_food.sellers` | `external_id` | Vendeur, `kind` = `home` ou `caterer` |
| `bissabi_food.orders` | `external_id` | `paid` ou `refunded`, CHF, centimes, `commission_cents` |

Les identifiants externes sont la clé d’idempotence. Un contact food `cook_1` est toujours `bissabi-food:seller:cook_1`.

La RLS ferme ces tables à `anon` et `authenticated`. CRM Pro aura besoin d’une clé qui peut lire ce schéma (clé service du projet CRM, ou une policy de lecture ajoutée plus tard dans CRM Pro). Cette clé ne va pas dans l’app food et n’est pas dans ce dépôt.

Import JSON actuel : une ligne CRM Pro peut être reconstruite depuis ces trois tables (contact + vendeur + commandes du même `external_id`) le jour où CRM Pro ajoutera ce lecteur. Jusque-là, l’app food pousse, CRM Pro ne tire pas encore.
