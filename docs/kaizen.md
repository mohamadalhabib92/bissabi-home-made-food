# Kaizen

Petites améliorations sûres. `main` n’est pas fusionné depuis ici.

## 2026-11-23

Contexte TestFlight : 9 plantages au lancement sur les builds 13 et 14 (iPhone et iPad), `DYLD Symbol missing`, ExpoFont vers ExpoModulesCore `_classTypes`. Aucun signalement sur les builds 15 à 17. Règles décidées : Stripe Connect, commission 10 %, pas de vente avant la checklist hygiène.

### 1. Versions Expo alignées sur le SDK

Avant : `expo` 58.0.23, `expo-font` 58.0.11, `expo-modules-core` résolu par cet Expo. `expo install --check` signalait le SDK en retard, dont la police native. Pas de contrôle en CI.

Après : `expo` 58.0.26, `expo-font` 58.0.12, `expo-modules-core` 58.1.0 (au-dessus de 58.0.30, qui exporte `_classTypes`). La CI échoue si `npx expo install --check` n’est pas vert. Aucun identifiant de signature modifié.

Fichiers : `package.json`, `package-lock.json`, `.github/workflows/pr-checks.yml`, `src/lib/expoSdk.test.ts`.

Tests : `src/lib/expoSdk.test.ts` ; `npx expo install --check`.

### 2. Les 14 allergènes et la checklist avant toute vente

Avant : le studio demandait les 14 statuts pour publier, mais un plat actif sans déclaration complète restait listé et achetable. La checklist incomplète n’empêchait pas l’achat. Aucun badge OFCO n’était affiché ; rien ne l’interdisait dans le code.

Après : un plat n’est listé ni ajouté au panier ni commandé tant que chaque allergène n’est pas Présent, Traces ou Absent, et tant que les 8 points d’hygiène ne sont pas attestés. Les fiches déjà enregistrées ne sont pas réécrites. Le badge « Annonce OFCO (VD) » n’apparaît que si `ofcoStatus` vaut `ofco_verified`. La démo neuve déclare les 14 allergènes ; une démo déjà stockée sans cette déclaration disparaît de la vitrine jusqu’au rechargement des données de démo.

Fichiers : `src/lib/saleGate.ts`, `src/lib/saleGate.test.ts`, `src/lib/data.tsx`, `src/lib/seed.ts`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/cart.tsx`, `src/app/checkout.tsx`, `src/app/dish/[id].tsx`, `src/app/cook/[id].tsx`.

Tests : `src/lib/saleGate.test.ts`.

### 3. Commission 10 % et libellé des avis

Avant : 15 % ajoutés au total client. L’écran cuisinier titrait « Avis vérifiés ».

Après : les nouvelles commandes retiennent 10 % sur le cuisinier. Le total à payer est le sous-total des plats (plus la livraison hors lancement). Une commande déjà stockée dont le total incluait la commission n’est pas recalculée. Le titre devient « Avis publiés ». Stripe Connect est la décision de versement ; aucun encaissement n’est branché.

Fichiers : `src/lib/pricing.ts`, `src/lib/pricing.test.ts`, `src/components/brand.tsx`, `src/app/legal.tsx`, `src/app/order/[id].tsx`, `src/app/studio/order/[id].tsx`, `src/app/studio/earnings.tsx`, `src/app/cook/[id].tsx`.

Tests : `src/lib/pricing.test.ts`.

### Bloquant

Le paiement Stripe Connect (PR #8, TWINT et cartes) n’est pas intégré. Le branchement demande le module natif et un serveur. Rien n’est encaissé.

## 2026-11-23 — préparation au lancement

Branche `cursor/launch-readiness-07cc`, à partir de `a7fd0eb`. Pas de fusion dans `main`. Pas de soumission. Pas de migration hébergée.

### Avant / Après

Avant : pas d’audit de lancement, pas de code Connect testable, la suppression « compte » gardait la copie de récupération, pas de page CGU/CGV, pas de bandeau hors ligne ni de pré-inscription.

Après : `docs/launch-readiness.md`. Connect Express (onboarding, frais 10 %, remboursement, webhook) dans `src/lib/stripeConnect.ts`, migration locale et fonction non déployée. Suppression définitive sur l’appareil. Conditions liées depuis Compte. Bandeau « Lancement bientôt » et hors ligne. La porte de vente reste fermée.

Fichiers : `docs/launch-readiness.md`, `src/lib/stripeConnect.ts`, `src/lib/stripeConnect.test.ts`, `src/lib/storage.ts`, `src/lib/payments.ts`, `src/app/terms.tsx`, `src/app/privacy.tsx`, `src/ui/offline.tsx`, `supabase/migrations/20261123160000_stripe_connect_ledger.sql`.

Tests : `src/lib/stripeConnect.test.ts` et la suite existante.

### Vendeurs : cuisine maison et traiteur

Avant : un seul profil, souvent nommé au masculin, sans type.

Après : à l’inscription on choisit cuisine maison ou traiteur. Les deux ont la même checklist, les mêmes 14 allergènes et les 10 %. Un traiteur peut poser un minimum de portions et un délai ou une capacité plus grands. Une fiche déjà enregistrée sans type n’est pas réécrite. Commission ou contrôle différents pour les traiteurs : non décidés, listés dans `docs/launch-readiness.md`.

Fichiers : `src/lib/seller.ts`, `src/app/studio/profile.tsx`, `src/lib/model.ts`.

Tests : `src/lib/seller.test.ts`.

## 2026-11-26 — livreur et comptes

Avant : pas de coursier. Pas de connexion. La suppression de compte était seulement locale.

Après : profil livreur (identité déclarée, véhicule, zone Lausanne/Prilly, disponibilité), courses prêtes, acceptation, code à la cuisine, en route, code de preuve, gains marqués « à définir ». L’admin local valide avant le travail. Comptes e-mail via le client Supabase si les variables sont là, sinon mode appareil avec un avis clair. Liaison opt-in qui n’écrase rien. RLS dans une migration non appliquée.

Fichiers : `src/lib/courierRun.ts`, `src/app/(tabs)/courier.tsx`, `src/app/auth.tsx`, `src/lib/authPort.ts`, `src/lib/accountLink.ts`, `supabase/migrations/20261126180000_accounts_couriers_rls.sql`.

Tests : `src/lib/courierRun.test.ts`, `src/lib/accountLink.test.ts`.
