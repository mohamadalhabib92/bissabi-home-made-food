# Comptes client et cuisinier

Inscription par courriel et mot de passe. Le rôle choisi (`client` ou `cook`) est lu **une seule fois** à la création, puis écrit dans `public.user_roles` et `public.profiles`. L’application ne fait pas foi. `admin` et `courier` ne passent que par un admin Bissabi (`private.set_role`).

Un cuisinier commence en `dossier_en_cours`. Il ne publie pas tant que le courriel n’est pas confirmé **et** que Bissabi n’a pas approuvé le dossier. Un client ne peut pas écrire un dossier cuisine.

À la première session, les plats, commandes et préférences déjà sur l’appareil sont **reliés** (identifiants notés sous `@bissabi-home-made-food-account/`). Ils ne sont pas effacés. La demande de suppression nLPD enregistre une ligne ; elle n’efface pas non plus l’appareil.

Apple et Google sont des boutons inactifs. Le courriel passe en premier.

Preuve locale : `npm run test:accounts`. Ne pas lancer cette migration sur le projet hébergé.

## Ce que Mohamed règle dans Supabase Auth

Sans toucher au projet depuis ici. Dans le tableau de bord du projet qu’il choisit :

1. **Providers → Email** : activé. **Confirm email** : activé. Longueur minimale du mot de passe : 8, comme l’app.
2. **URL configuration**
   - Site URL : l’origine réelle de l’app (Pages ou le schéma).
   - Redirect URLs à autoriser :
     - `bissabihomemadefood://sign-in`
     - `bissabihomemadefood://reset-password`
     - l’URL web de dev, par exemple `http://localhost:8081/sign-in` et `http://localhost:8081/reset-password`
     - l’URL Pages, par exemple `https://<utilisateur>.github.io/bissabi-home-made-food/sign-in` et `.../reset-password`
3. **Email templates** (Confirm signup, Reset password) : garder le lien `{{ .ConfirmationURL }}` de Supabase. Ne pas coller une traduction automatique des mentions légales dans ces modèles.
4. Variables **publiques** de l’app : `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Jamais la clé `service_role`.
5. Appliquer lui-même, sur une base de **test**, `supabase/migrations/20261109183000_accounts.sql` après la passe 1 si elle est déjà là. Le script est additif. Rollback : `supabase/rollback/20261109183000_accounts.sql` (retire les colonnes ajoutées, garde la ligne de profil).
6. Apple et Google : les laisser **éteints** tant que les identifiants du fournisseur ne sont pas dans Auth. L’app ne les appelle pas.
