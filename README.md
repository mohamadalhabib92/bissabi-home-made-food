# Bissabi Home Made Food

**La saveur du partage — cuisine de quartier authentique par Bissabi**

Place de marché de cuisine maison entre voisins : des cuisinier·ère·s du quartier proposent leurs plats,
les client·e·s **commandent à l’avance** sur un créneau de retrait ou de livraison. Ce n’est ni un service de livraison
de restaurants ni de la livraison express (délai minimum de 24 h par défaut). Pas de livraison de boissons.

Application Expo (iOS / Android) **et** PWA installable (GitHub Pages, `/bissabi-home-made-food/`).
Identité : rouge `#C8152A`, vert `#1A4D2E`, or `#C9A84C`, crème `#FAF8F2` ; logotype BISSABI (rouge) + HOME MADE (vert).

## Fonctionnalités

### Côté client
- **Découvrir** : plats et cuisiniers proches, rayon **1 à 5 km** (GPS arrondi à ~100 m, avec repli sur le choix d’une commune), filtre **Halal** (déclaration du cuisinier, non certifiée), recherche, cuisines, favoris.
- **Fiche plat** : allergènes (14 allergènes majeurs, obligatoires), portion, prochains créneaux, signalement.
- **Panier** (un cuisinier par commande), détail ligne par ligne : **plats + commission plateforme 15 % + frais de livraison** = total TTC.
- **Commande** : choix du créneau (capacité en portions, délai minimum), retrait ou livraison, note, accusé de lecture des allergènes.
- **Paiement** : Stripe Checkout si configuré, sinon **paiement simulé** clairement indiqué (option démo pour simuler un refus de carte). Gestion d’échec : message clair, nouvelle tentative, annulation.
- **Suivi** : statuts (paiement → en attente du cuisinier → acceptée → en préparation → prête → terminée / refusée / annulée), historique, **reçu téléchargeable** avec mentions de l’entreprise.
- **Avis** soumis à **modération** avant publication ; support / signalement.

### Côté cuisinier (onglet « Cuisiner »)
- Profil (nom affiché, commune, présentation, cuisine halal déclarée, livraison oui/non, langues).
- **Checklist hygiène** déclarative (8 points) obligatoire avant publication.
- Plats : photo, prix par portion, **allergènes obligatoires** (ou confirmation explicite « aucun »), ingrédients, délai minimum, visibilité.
- Créneaux (retrait / livraison, capacité, répétition sur 2 ou 4 semaines).
- Commandes reçues : **accepter / refuser** (motif), préparation, prête, remise.
- Plan de préparation + **liste de courses agrégée exportable en CSV**.
- **Gains** : ventes, commission visible, frais de livraison, net, par mois, export CSV.

### Confiance, droit, données
- Message de responsabilité : « Les cuisiniers sont responsables de la conformité ; Bissabi prépare les gates SCAV — pas de certification affichée tant que non réelle ». **Aucun faux badge.**
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
- Serveur de paiement **non implémenté** (exemple fourni) ; Stripe Connect pour les versements aux cuisiniers à activer.
- **À confirmer** (écran « Notes admin ») : qui paie la commission (actuellement le client, +15 %), frais de livraison (CHF 6.00 provisoire), arrondi à 5 centimes.
- Modération des avis et signalements : locale (pas d’outil d’administration serveur).
- Gates SCAV / autorité cantonale, vérification d’identité, assurance RC : à venir — rien n’est affiché comme certifié.
- Photos de démonstration : emojis ; pas de vraies photos.
- Traductions DE / IT / ES / de-CH / AR : à faire.
