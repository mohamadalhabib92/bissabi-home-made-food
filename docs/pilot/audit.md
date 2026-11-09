# Audit du produit existant (novembre 2026)

Lecture du code sur la branche `cursor/fix-ios-launch-abi-784b`, sans appel au projet Supabase hébergé. `EXPO_PUBLIC_SUPABASE_URL` n’est pas configurée ici : l’app ne crée pas de client.

## Ce qui fonctionne, sur l’appareil

- Expo Router, écrans client (découverte, plat, panier, commande, suivi, reçu) et cuisine (profil, checklist, plats, créneaux, commandes, courses, gains).
- Français et anglais déjà rédigés pour l’app actuelle (`useL`, `src/i18n/fr.ts`, `en.ts`). Les autres langues étaient affichées « à venir » et non sélectionnables.
- Allergènes : les 14 noms suisses/UE existent en français et en anglais. La publication exige présent / traces / absent.
- Prix : décimaux CHF. L’ancien placeholder affichait 15 % ajoutés au client. Le modèle retenu est **10 % des plats, retenus sur le cuisinier**, en centimes exacts. Frais de livraison 6 CHF hors assiette. Le retrait public n’ajoute pas ces frais.
- Données locales AsyncStorage, préfixe `@bissabi-home-made-food/`. Garde de lecture, champs inconnus conservés, copie de récupération. À ne pas réécrire.
- Démo clairement marquée, supprimable.
- Mentions : Bissabi Drinks - BA, Chemin de la Suettaz 17, 1008 Prilly, CHE-332.255.936.

## Simulé

- Paiement : `launchPayment()` n’appelle ni Stripe ni serveur. Le contrat dans `server/README.md` est un exemple, pas un serveur déployé.
- Acceptation automatique seulement pour un cuisinier de démo.
- Checklist hygiène déclarative. Badge OFCO jamais pré-coché. Aucune inspection n’est attestée.
- Avis et signalements : modération locale, pas d’admin serveur.

## Absent avant ce pilote

- Place de marché partagée (deux téléphones ne se voient pas).
- Réservation de portion avec course, grand livre, idempotence des événements.
- Coursier, code de remise, rappel de lot, dossier qui bloque la vente.
- Devise en unités mineures, marché configurable, créneau UTC + fuseau.
- Langues hors fr/en, sens droite-gauche, détection de la langue de l’appareil.

## Migration passe 1

`supabase/migrations/20261102213000_passe1_foundations.sql` est dans le dépôt et **n’a pas été appliquée**. Elle prévoit RLS, rôles hors `user_metadata`, adresse cuisinier séparée, coordonnées arrondies. La migration pilote est un schéma `pilot` à part : elle n’altère pas ces tables et peut être retirée seule.
