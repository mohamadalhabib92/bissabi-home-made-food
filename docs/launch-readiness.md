# Préparation au lancement — 23 novembre 2026

Audit du dépôt sur `cursor/launch-readiness-07cc`, après les ajouts de cette branche. Preuves : fichiers cités. Rien n’a été soumis à l’App Store. Aucune migration Supabase n’a été appliquée. Aucune clé réelle n’est dans le dépôt.

Légende : **Ready** utilisable pour le pilote tel quel · **Partial** une partie existe, le reste bloque le lancement · **Missing** absent · **Needs owner decision** seul Mohamed peut trancher ou fournir un secret.

## Parcours

| Sujet | État | Preuve |
|---|---|---|
| Client : découvrir, plat, panier, créneau, suivi | Partial | `src/app/(tabs)/index.tsx`, `dish/[id].tsx`, `cart.tsx`, `checkout.tsx`, `order/[id].tsx`. Paiement simulé. Bandeau « Lancement bientôt ». |
| Cuisine familiale : profil, checklist, plats, créneaux, commandes, gains | Partial | `src/app/(tabs)/kitchen.tsx`, `src/app/studio/*`. Pas de compte serveur. |
| Coursier : mission, remise | Partial | Profil, zone Lausanne/Prilly, véhicule, disponibilité, validation admin, acceptation, code de retrait, en route, code de preuve (`src/app/(tabs)/courier.tsx`, `src/lib/courierRun.ts`). Tarif par course : « à définir ». Pas de paiement réel tant que le drapeau est fermé. |
| Admin Bissabi : modération des avis | Partial | `src/app/moderation.tsx` est local à l’appareil, pas un compte admin. |
| Zone Lausanne + Prilly, CHF | Partial | `src/i18n/fr.ts` (`zoneOutside*`), prix `chf` dans `src/lib/pricing.ts`. Le filtre géographique est le canton de Vaud, pas seulement les deux communes. |
| Découverte façon commande de quartier | Partial | Accueil : cuisines près de vous, menus, panier, retrait ou livraison, suivi (`src/app/(tabs)/index.tsx`, `cart.tsx`, `orders.tsx`). Pas la marque d’un tiers. |
| Vendeur : cuisine maison ou traiteur | Partial | Choix à l’inscription `src/app/studio/profile.tsx`. Champ `sellerKind` ajouté seulement à l’enregistrement. Une fiche ancienne sans ce champ s’affiche « cuisine maison » et n’est pas réécrite. |
| Traiteur : plus de portions, minimum, délai | Partial | Minimum de portions s’il est saisi (`src/lib/seller.ts`). Plafond de créneau 500 et délai jusqu’à 14 jours pour un traiteur, 100 portions et 7 jours pour une cuisine maison. Ces plafonds sont des garde-fous, pas une règle métier validée. |
| Commission et hygiène identiques | Ready | 10 % et la porte de vente ne dépendent pas du type (`src/lib/pricing.ts`, `src/lib/saleGate.ts`). |

## Règles par type — à trancher par Mohamed

Ces points ne sont pas codés, pour ne pas inventer une règle.

| Sujet | État |
|---|---|
| Commission différente pour un traiteur | Needs owner decision |
| Vérification d’identité ou OFCO différente pour un traiteur | Needs owner decision |
| Minimum en francs plutôt qu’en portions | Needs owner decision |
| Plafonds exacts (portions par créneau, délai maximum) | Needs owner decision |
| Un traiteur peut-il vendre hors Lausanne / Prilly | Needs owner decision |
| TVA, statut d’entreprise, assurance propre aux traiteurs | Needs owner decision |

## Comptes et suppression

| Sujet | État | Preuve |
|---|---|---|
| Création de compte, connexion, mot de passe oublié | Partial | Écran `src/app/auth.tsx` : e-mail, mot de passe, rôle client / cuisine / livreur. Sans variables Supabase, l’app reste sur l’appareil et le dit. Le client Auth est `src/lib/authPort.ts`. Rien n’est déployé. |
| Liaison des données déjà sur l’appareil | Partial | Opt-in `planAccountLink` : le local n’est jamais effacé, un distant déjà rempli n’est jamais remplacé. L’envoi réel attend un projet approuvé. |
| Suppression de compte dans l’app (Apple 5.1.1(v)) | Partial | Effacement local complet, plus un appel `delete_own_account` si Supabase est configuré (`supabase/migrations/20261126180000_accounts_couriers_rls.sql`, non appliqué). |

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
| Attribution coursier | Partial | Le livreur validé et disponible accepte une commande de livraison prête. L’admin local bascule `validated` depuis Compte. Ce n’est pas encore un rôle serveur. |
| Vérification des cuisines (hygiène, OFCO) | Partial | Checklist locale `src/app/studio/checklist.tsx`. Badge OFCO seulement si `ofco_verified` (`src/lib/saleGate.ts`). Personne ne peut poser ce statut dans l’app. |
| Allergènes affichés | Ready | 14 allergènes obligatoires avant liste et achat (`src/lib/saleGate.ts`, fiche plat). |
| Notifications | Missing | Pas d’enregistrement push. Le suivi de course est visible dans l’app quand on l’ouvre. |

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
| Démarrage sans plantage ExpoFont | Partial | Builds 13–14 : symbole `_classTypes` manquant. Alignement actuel : `expo` 58.1.0, `expo-font` 58.0.12, `expo-modules-core` 58.2.0 (`src/lib/expoSdk.test.ts`). Aucun plantage signalé sur 15–17. Le binaire du prochain TestFlight doit encore être construit pour embarquer ces versions. |
| RLS Supabase | Partial | Passe 1, grand livre Connect, et comptes/livreurs (`20261126180000_accounts_couriers_rls.sql`) : anon sans droit, un livreur ne se valide pas. Fichiers locaux seulement. Tests de lecture du SQL dans `src/lib/accountLink.test.ts`. |
| Icône, splash, fiche | Partial | `app.json` (icône, plugin splash). Fiche brouillon `store/ios-metadata.md`. Pas de captures App Store finales. |

## Ce que seul Mohamed peut faire

1. Créer le compte Stripe live et les clés de test, et les poser dans un champ secret (jamais dans le dépôt) : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, clé publique `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Activer TWINT, Apple Pay et Google Pay dans le tableau de bord Stripe, et donner l’identifiant marchand Apple.
3. Approuver l’application des migrations Supabase sur un projet hébergé, et fournir l’URL et la clé anon.
4. Faire passer les cuisines (checklist + contrôle) et poser `ofco_verified` seulement après l’autorité.
5. Faire relire CGU, CGV et la politique de confidentialité.
6. Dire quand `EXPO_PUBLIC_LAUNCH_PAYMENTS` peut valoir `1`.
7. Donner l’accord pour un build TestFlight, puis pour la revue App Store. Cette branche ne le fait pas.
