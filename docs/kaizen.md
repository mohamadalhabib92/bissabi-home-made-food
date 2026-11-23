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
