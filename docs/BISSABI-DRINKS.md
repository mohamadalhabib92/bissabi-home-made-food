# Boissons Bissabi — upsell, revente pro et cadre de marque

> Décision produit du 13.11.2026 (Europe/Zurich).  
> **Aucun tarif réel de bouteille n’est inventé.** Les prix dans l’app sont des placeholders `YOUR_PRICE_CHF`, clairement marqués « exemple ».  
> Les prix publics, s’il en existe, sont ceux de [bissabi.ch](https://bissabi.ch) — ils n’étaient **pas** présents dans ce dépôt au moment de l’implémentation.

## 1. Marque sœur, pas une fusion

- L’app se présente comme **Home Made Food by Bissabi**, marque sœur de **Bissabi**.
- Liens croisés vers [bissabi.ch](https://bissabi.ch) (pied de page / à propos). Les deux marques restent distinctes.
- Ne pas fusionner les identités, les comptes ou les responsabilités.

## 2. Interdiction des boissons maison

Voir aussi `docs/COOK-QUALIFICATION.md`. Toutes les boissons préparées par le cook (bissap, gingembre, bouye, lait caillé, jus, etc.) sont refusées pour un motif d’hygiène (conservation délicate, contrôle difficile). Ce n’est pas une règle visant uniquement le bissap.

## 3. Upsell à la commande : « Ajoute un Bissabi à ton repas »

- Carte premium sur le panier et le checkout, avec des **produits de démo**.
- **Visible et commandable uniquement** si l’adresse ou le canton de livraison est **Vaud**.
- Ailleurs (ou canton inconnu) : mention douce **« bientôt disponible »**, sans ajout.
- Livraison des boissons Bissabi : **canton de Vaud uniquement**, **offerte dès CHF 36** (règle produit déjà connue ; ce n’est pas un prix de bouteille).
- Les montants `YOUR_PRICE_CHF` **ne sont pas ajoutés** au total chiffré de la commande Home Made Food (pas d’invention de prix dans le TTC).

Code : `src/lib/bissabiDrinks.ts`, `src/components/bissabi-upsell.tsx`.

## 4. Revente par les cooks (bouteilles scellées, tarif pro)

Les cooks qualifiés peuvent activer l’option **« Proposer des boissons Bissabi »** dans le studio (maquette : **aucune commande fournisseur réelle**).

Modèle visé (placeholders, à confirmer) :

| Élément | Valeur |
| --- | --- |
| Achat cook | `YOUR_PRO_PRICE_CHF` par unité (tarif professionnel Bissabi) |
| Prix de revente proposé | `YOUR_RETAIL_PRICE_CHF` (libre dans une fourchette à convenir) |
| Marge cook indicative | `YOUR_MARGIN_CHF` ou `YOUR_MARGIN_PERCENT` |
| Commission plateforme sur cette ligne | `YOUR_BISSABI_COMMISSION` — à décider (peut différer des 15 % plats) |
| Condition | Bouteilles **scellées** d’origine Bissabi uniquement — pas de reconditionnement, pas de recette maison |

Intérêt gagnant-gagnant : le cook complète le repas, Bissabi trouve un débouché, l’acheteur reste dans le canton de Vaud pour la livraison Bissabi.

UI : bascule dans `src/app/studio/profile.tsx` (`offerBissabiDrinks`). Pastille sur le profil public si activée.

## 5. Forme juridique (recommandation, à faire valider)

**Bissabi Drinks - BA** est une **raison individuelle**. Le titulaire répond des dettes sur ses biens personnels.

Avant de lancer la marketplace, il est **recommandé de créer une Sàrl séparée** pour Home Made Food, sous réserve d’une **relecture juridique et fiduciaire**. Ce paragraphe n’est pas un conseil juridique.

## 6. Section bissabi.ch

Les profils et plats des cooks **qualifiés** pourront aussi apparaître sur bissabi.ch, dans une section distincte « Home Made Food by Bissabi ». Voir `docs/BISSABI-CH-SECTION.md`. **Ce dépôt ne modifie pas le site Wix.**
