# Préparation au lancement — 23 novembre 2026

Audit du dépôt sur `cursor/launch-readiness-07cc`, après les ajouts de cette branche. Preuves : fichiers cités. Rien n’a été soumis à l’App Store. Aucune migration Supabase n’a été appliquée. Aucune clé réelle n’est dans le dépôt.

Légende : **Ready** utilisable pour le pilote tel quel · **Partial** une partie existe, le reste bloque le lancement · **Missing** absent · **Needs owner decision** seul Mohamed peut trancher ou fournir un secret.

## Parcours

| Sujet | État | Preuve |
|---|---|---|
| Client : découvrir, plat, panier, créneau, suivi | Partial | `src/app/(tabs)/index.tsx`, `dish/[id].tsx`, `cart.tsx`, `checkout.tsx`, `order/[id].tsx`. Paiement simulé. Bandeau « Lancement bientôt ». |
| Cuisine familiale : profil, checklist, plats, créneaux, commandes, gains | Partial | `src/app/(tabs)/kitchen.tsx`, `src/app/studio/*`. Pas de compte serveur. |
| Coursier : mission, remise | Missing | Aucun écran ni rôle coursier. |
| Admin Bissabi : modération des avis | Partial | `src/app/moderation.tsx` est local à l’appareil, pas un compte admin. |
| Zone Lausanne + Prilly, CHF | Partial | `src/i18n/fr.ts` (`zoneOutside*`), prix `chf` dans `src/lib/pricing.ts`. Le filtre géographique est le canton de Vaud, pas seulement les deux communes. |

## Comptes et suppression

| Sujet | État | Preuve |
|---|---|---|
| Création de compte, connexion, mot de passe oublié | Missing | Pas d’auth. Données sur l’appareil (`src/lib/storage.ts`). |
| Suppression de compte dans l’app (Apple 5.1.1(v)) | Partial | `deleteLocalAccount` efface copie de travail et copie de récupération sur cet appareil (`src/lib/storage.ts`, bouton dans `src/app/privacy.tsx`). Sans compte serveur, il n’y a rien à effacer chez un hébergeur. |

## Paiement

| Sujet | État | Preuve |
|---|---|---|
| Stripe Connect Express : onboarding, encaissement, frais 10 %, remboursement, webhook | Partial | Logique testée dans `src/lib/stripeConnect.ts`. Migration locale non appliquée `supabase/migrations/20261123160000_stripe_connect_ledger.sql`. Entrée non déployée `supabase/functions/stripe-connect/index.ts`. |
| Versements réels aux cuisiniers | Missing | Aucun appel Stripe. L’écran gains le dit (`src/app/studio/earnings.tsx`). |
| TWINT, carte, Apple Pay, Google Pay en mode test | Partial | La session prévue demande `card` et `twint` (`CHECKOUT_PAYMENT_METHOD_TYPES`). Apple Pay et Google Pay sont des portefeuilles de la carte : ils n’apparaissent qu’après réglage Stripe et identifiant marchand. |
| Pas de vente réelle avant hygiène et validations | Ready | `serverMayCollect` et `clientMayStartCheckout` exigent le drapeau `1` et, côté serveur, hygiène + OFCO. `EXPO_PUBLIC_LAUNCH_PAYMENTS` est vide. La porte de vente (`src/lib/saleGate.ts`) reste en place. |

## Commandes, coursier, admin

| Sujet | État | Preuve |
|---|---|---|
| États de commande et annulation | Partial | `src/lib/status.ts` et bouton d’annulation `src/app/order/[id].tsx`. L’annulation est locale. Le remboursement Stripe est décrit dans `buildRefund`, pas appelé. |
| Attribution coursier | Missing | Pas de modèle coursier. |
| Vérification des cuisines (hygiène, OFCO) | Partial | Checklist locale `src/app/studio/checklist.tsx`. Badge OFCO seulement si `ofco_verified` (`src/lib/saleGate.ts`). Personne ne peut poser ce statut dans l’app. |
| Allergènes affichés | Ready | 14 allergènes obligatoires avant liste et achat (`src/lib/saleGate.ts`, fiche plat). |
| Notifications | Missing | Pas d’enregistrement push. |

## États vides, erreurs, hors ligne

| Sujet | État | Preuve |
|---|---|---|
| États vides | Partial | Panier, commandes, découverte, cuisine, gains, modération ont un `Empty`. |
| Erreur d’écran | Ready | `src/ui/error-boundary.tsx`. |
| Hors ligne | Partial | Bandeau `src/ui/offline.tsx`. Pas de file d’attente réseau : l’app est locale. |

## Droit, Apple, langues, démarrage

| Sujet | État | Preuve |
|---|---|---|
| CGU / CGV | Partial | `src/app/terms.tsx`, liens depuis Compte, Bienvenue et Mentions. Brouillon marqué, pas un texte validé. |
| Confidentialité nLPD / RGPD | Partial | `src/app/privacy.tsx` décrit le stockage local, l’export et l’effacement. Ce n’est pas une politique relue par un juriste. |
| Mentions légales | Ready | `src/lib/company.ts` et `src/app/legal.tsx` : Bissabi Drinks - BA, Chemin de la Suettaz 17, 1008 Prilly, UID CHE-332.255.936. |
| Manifeste de confidentialité iOS et textes d’autorisation | Partial | `app.json` (`privacyManifests`, chaînes localisation et photos). Les étiquettes App Store sont un brouillon dans `store/ios-metadata.md` (« nous ne collectons pas »), à revoir si un compte ou Stripe est activé. |
| Langues FR / DE / IT / EN | Partial | FR et EN sont sélectionnables (`src/app/languages.tsx`). DE et IT : paragraphes sur l’écran Conditions seulement. Le reste de l’interface n’est pas traduit. |
| Accessibilité | Partial | Cibles 44 pt, libellés, Dynamic Type et contraste dans le kit (`src/ui/kit.tsx`, `src/lib/ux-theme.test.ts`). Pas d’audit VoiceOver sur appareil. |
| Démarrage sans plantage ExpoFont | Partial | Builds 13–14 : symbole `_classTypes` manquant. Correctif puis alignement : `expo` 58.0.26, `expo-font` 58.0.12, `expo-modules-core` 58.1.0 (`src/lib/expoSdk.test.ts`). Aucun plantage signalé sur 15–17. Le binaire du prochain TestFlight doit encore être construit pour embarquer ces versions. |
| RLS Supabase | Partial | Policies de la passe 1 dans `supabase/migrations/20261102213000_passe1_foundations.sql`. Le grand livre Connect n’ouvre aucune policy à `anon` ni `authenticated`. Rien n’est appliqué à un projet hébergé. |
| Icône, splash, fiche | Partial | `app.json` (icône, plugin splash). Fiche brouillon `store/ios-metadata.md`. Pas de captures App Store finales. |

## Ce que seul Mohamed peut faire

1. Créer le compte Stripe live et les clés de test, et les poser dans un champ secret (jamais dans le dépôt) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, clé publique `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Activer TWINT, Apple Pay et Google Pay dans le tableau de bord Stripe, et donner l’identifiant marchand Apple.
3. Approuver l’application des migrations Supabase sur un projet hébergé, et fournir l’URL et la clé anon.
4. Faire passer les cuisines (checklist + contrôle) et poser `ofco_verified` seulement après l’autorité.
5. Faire relire CGU, CGV et la politique de confidentialité.
6. Dire quand `EXPO_PUBLIC_LAUNCH_PAYMENTS` peut valoir `1`.
7. Donner l’accord pour un build TestFlight, puis pour la revue App Store. Cette branche ne le fait pas.
