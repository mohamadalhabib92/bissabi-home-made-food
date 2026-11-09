# Bissabi Home Made Food

**La saveur du partage — cuisine de quartier authentique par Bissabi**

Place de marché de cuisine maison entre voisins : des cuisinier·ère·s du quartier proposent leurs plats,
les client·e·s **commandent à l’avance** sur un créneau de **retrait**. La livraison n’est pas proposée aux nouvelles commandes (décision de lancement du 6 novembre 2026). Les commandes, paniers et adresses déjà enregistrés restent en l’état. Ce n’est pas un service de livraison
de restaurants (délai minimum de 24 h par défaut). Pas de livraison de boissons.

Application Expo (iOS / Android) **et** PWA installable (GitHub Pages, `/bissabi-home-made-food/`).
Identité : rouge `#C8152A`, vert `#1A4D2E`, or `#C9A84C`, crème `#FAF8F2` ; logotype BISSABI (rouge) + HOME MADE (vert).

## Fonctionnalités

### Côté client
- **Découvrir** : plats et cuisiniers proches, rayon **1 à 5 km** (GPS arrondi à ~100 m, enregistré dans les préférences de cet appareil, avec repli sur le choix d’une commune), filtre **Halal** (déclaration du cuisinier, non certifiée), recherche, cuisines, favoris.
- **Fiche plat** : allergènes (14 allergènes majeurs, obligatoires), portion, prochains créneaux, signalement.
- **Panier** (un cuisinier par commande) : **plats + livraison**. La commission Bissabi est **10 % des plats**, retenue sur le versement au cuisinier, pas ajoutée au total client. Au lancement le retrait n’ajoute pas de frais de livraison.
- **Commande** : créneau de retrait seulement, note, accusé de lecture des allergènes. Un panier qui visait la livraison invite à choisir un retrait, sans réécrire l’historique.
- **Paiement** : **simulation** sur cet appareil (option démo pour simuler un refus). Aucun appel Stripe ni serveur au lancement.
- **Suivi** : statuts (paiement → en attente du cuisinier → acceptée → en préparation → prête → terminée / refusée / annulée), historique, **reçu téléchargeable** avec mentions de l’entreprise.
- **Avis** soumis à **modération** avant publication ; support / signalement.

### Côté cuisinier (onglet « Cuisiner »)
- Profil (nom affiché, commune, présentation, cuisine halal déclarée, langues). Un réglage livraison déjà enregistré n’est pas effacé et n’est pas proposé aux nouvelles commandes.
- **Checklist hygiène** déclarative (8 points) obligatoire avant publication.
- Plats : photo, prix par portion, **allergènes obligatoires** (ou confirmation explicite « aucun »), ingrédients, délai minimum, visibilité.
- Créneaux (retrait / livraison, capacité, répétition sur 2 ou 4 semaines).
- Commandes reçues : **accepter / refuser** (motif), préparation, prête, remise.
- Plan de préparation + **liste de courses agrégée exportable en CSV**.
- **Gains** : ventes, commission visible, frais de livraison, net, par mois, export CSV.

### Confiance, droit, données
- Message de responsabilité : les cuisiniers restent responsables de l’autocontrôle. Dans le canton de Vaud l’autorité est l’**OFCO** (libellé « Annonce OFCO (VD) »). Le badge n’apparaît qu’après validation admin. **Aucun faux badge.** Livraisons et commandes : canton de Vaud uniquement.
- RGPD / LPD : consentements (CGU, position, marketing), export JSON des données, suppression complète.
- Mentions légales discrètes : Bissabi Drinks - BA, Chemin de la Suettaz 17, 1008 Prilly, IDE CHE-332.255.936.
- Langues : **français et anglais complets**. DE, IT, ES, de-CH, AR (avec RTL) : affichées « à venir », non sélectionnables.

## Données de démonstration
Au premier lancement, des cuisinier·ère·s, plats, créneaux, avis et une commande **fictifs** sont créés, tous marqués « (démo) ».
Bandeaux « Données de démonstration » visibles ; suppression via **Compte → Retirer les données de démo**.
Côté cuisinier, « Ajouter des commandes de démo » crée des commandes reçues fictives.

## Démarrer

```bash
npm install
cp .env.example .env    # optionnel : valeurs YOUR_* à remplacer pour activer Stripe
npx expo start          # mobile (Expo Go / dev build)
npm run build:web       # PWA dans dist/
npx tsc --noEmit
```

## Paiements (Stripe)
- App : uniquement `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publique) et `EXPO_PUBLIC_PAYMENTS_API_URL`.
- `YOUR_STRIPE_SECRET_KEY` : **serveur uniquement, jamais dans l’app ni dans le dépôt**. Exemple de serveur et contrat d’API : `server/README.md`.
- Apple Pay / Google Pay : phase 2.

## Déploiement PWA
`.github/workflows/pages.yml` : vérification des types, export web (`experiments.baseUrl = /bissabi-home-made-food`), déploiement GitHub Pages.
Les valeurs publiques peuvent être fournies via les **variables** de dépôt `EXPO_PUBLIC_*` (sinon : paiement simulé).
Service worker et manifeste générés par `scripts/pwa-postbuild.mjs`.

## Limites connues (à traiter avant production)
- **Stockage local uniquement** (AsyncStorage / localStorage) : pas encore de serveur partagé. Cuisiniers et clients ne se voient que sur le même appareil — la place de marché réelle nécessite un backend (ex. Supabase) avec authentification.
- **Audit du 7 novembre 2026** (12 axes, état de `main` `928ac7f`) et fondation de conservation locale : `docs/AUDIT-2026-11-07-preservation.md`. Ce n’est pas un avis juridique. La copie de récupération reste sur l’appareil ; les tests ne remplacent pas un essai sur appareil réel.
- Serveur de paiement **non implémenté** (exemple fourni) ; Stripe Connect pour les versements aux cuisiniers à activer.
- **Commission** : 10 % des plats, retenue sur le cuisinier, taux du marché figé au paiement. Frais de livraison CHF 6.00 provisoires, hors assiette. Les frais du prestataire sont proposés à la charge de Bissabi (à confirmer). Les centimes sont stockés exactement ; le pas de 5 centimes n’est pas appliqué à la commission.
- Modération des avis et signalements : locale (pas d’outil d’administration serveur).
- Annonce OFCO (VD), vérification d’identité, assurance RC : à venir — rien n’est affiché comme certifié. Schéma Supabase additif dans `supabase/migrations/` (non appliqué).
- Photos de démonstration : emojis ; pas de vraies photos.
- Traductions DE / IT / ES / de-CH / AR : à faire.
