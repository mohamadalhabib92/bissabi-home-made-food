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
- `STRIPE_WEBHOOK_SECRET`
- `CRM_SUPABASE_URL` = `https://ppeovmfuhtidavdnrwxu.supabase.co`
- `CRM_SERVICE_ROLE_KEY` = clé service du projet CRM, pas celle du projet food

Site public à la racine du domaine : `EXPO_PUBLIC_WEB_BASE=/`. Sans elle, l’export web garde le préfixe GitHub Pages.

## 2. Schéma food (projet qizhprlzeiqrngwpxjnd)

À lancer depuis ce dépôt, une fois le CLI Supabase connecté au compte qui possède le projet.

```bash
npx supabase link --project-ref qizhprlzeiqrngwpxjnd
npx supabase db push
```

`db push` applique `supabase/migrations/`, dont `20261127120000_live_marketplace.sql` (kitchens, order_items, payouts, courier_jobs, rôle traiteur). Il n’applique pas `supabase/crm-migrations/`.

L’admin n’est pas un rôle d’inscription. Pour un compte déjà créé :

```sql
insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');
```

## 3. Schéma CRM (projet ppeovmfuhtidavdnrwxu)

Fichier unique : `supabase/crm-migrations/20261127120000_bissabi_food_sync.sql`.

Il crée le schéma `bissabi_food` et les tables `contacts`, `sellers`, `orders`. La RLS est activée. `anon` et `authenticated` n’ont aucun droit. La clé service contourne la RLS : c’est elle que `crm-sync` utilise.

À coller dans le SQL editor du projet CRM, ou :

```bash
npx supabase link --project-ref ppeovmfuhtidavdnrwxu
npx supabase db query --linked -f supabase/crm-migrations/20261127120000_bissabi_food_sync.sql
```

Revenir ensuite au projet food (`supabase link --project-ref qizhprlzeiqrngwpxjnd`) avant de déployer les fonctions.

## 4. Fonctions (projet food seulement)

```bash
npx supabase functions deploy stripe-webhook --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy create-payment-intent --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy delete-account --project-ref qizhprlzeiqrngwpxjnd
npx supabase functions deploy crm-sync --project-ref qizhprlzeiqrngwpxjnd
npx supabase secrets set --project-ref qizhprlzeiqrngwpxjnd \
  STRIPE_SECRET_KEY=… STRIPE_WEBHOOK_SECRET=… \
  SUPABASE_SERVICE_ROLE_KEY=… \
  CRM_SUPABASE_URL=https://ppeovmfuhtidavdnrwxu.supabase.co \
  CRM_SERVICE_ROLE_KEY=…
```

Dans Stripe (mode test), l’endpoint webhook est :

`https://qizhprlzeiqrngwpxjnd.supabase.co/functions/v1/stripe-webhook`

Événements : `payment_intent.succeeded`, `checkout.session.completed`, `charge.refunded`, `account.updated`, `payout.paid`, `payout.failed`.

`crm-sync` upsert `contacts`, `sellers` et `orders` avec un `external_id` stable (`bissabi-food:buyer:…`, `bissabi-food:seller:…`, `bissabi-food:order:…`). Un second envoi du même id met à jour la ligne. Déclencheurs : inscription acheteur ou vendeur, commande payée, commande remboursée. La commission est la colonne `commission_cents`.

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
