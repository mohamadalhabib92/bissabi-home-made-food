# Formation cuisinier — hygiène, allergènes & sécurité

> **À faire valider par un expert** (hygiéniste / juriste alimentaire / autorité cantonale).  
> Ce document et le quiz in-app sont une **bonne pratique produit Bissabi**, **pas** une certification officielle OSAV/BLV, ODAlOUs, OIDAl ou OHyg.

## Objectif produit

- Avant de publier un plat (`active: true`), le cook doit détenir un **badge valide** :  
  **« Formation hygiène, allergènes & sécurité réussie »**.
- 3 modules (≥ 10 questions chacun), seuil **80 %**, retry limité, **historique** des tentatives, **renouvellement annuel** (365 jours).

## Sources officielles (à croiser — liens Fedlex / autorités)

| Texte | Réf. | Lien |
| --- | --- | --- |
| Loi sur les denrées alimentaires (LDAl) | RS 817.0 | https://www.fedlex.admin.ch/eli/cc/2017/62/fr |
| Ordonnance sur les denrées alimentaires et les objets usuels (ODAlOUs) | RS 817.02 art. 20 (annonce), art. 39 / 44 (info à distance) | https://www.fedlex.admin.ch/eli/cc/2017/63/fr |
| Ordonnance concernant l’information sur les denrées alimentaires (OIDAl) | RS 817.022.16 annexe 6 (14 allergènes) | https://www.fedlex.admin.ch/eli/cc/2017/158/fr |
| Ordonnance sur l’hygiène (OHyg) | RS 817.024.1 (instructions adaptées, art. 22 cité dans le produit) | https://www.fedlex.admin.ch/eli/cc/2017/183/fr |
| OSAV / BLV — infos denrées | pages publiques | https://www.blv.admin.ch/fr/informations-aliments-vendus-en-vrac |
| Canton de Vaud — OFCO (annonce activité) | prestation VD | https://www.vd.ch/prestation/annoncer-une-entreprise-du-secteur-alimentaire-art-20-odalous |

Les températures citées dans l’app (frigo **≤ 5 °C**, cuisson / réchauffage **≥ 70 °C** à cœur) sont des **références de bonne pratique** déjà présentes dans la checklist produit ; confirmer avec l’autorité cantonale pour chaque activité.

## Modules

1. **Hygiène alimentaire** — autocontrôle, contamination croisée, froid / chaud, santé du manipulateur, packaging.  
2. **Allergènes (OIDAl)** — 14 allergènes, vente à distance, traces, déclaration Halal (= déclaration cook).  
3. **Sécurité & transport** — chaîne pendant la livraison, rappel, responsabilité cook vs plateforme vs coursier, délai de commande à l’avance.

## Implémentation

- Questions / scoring : `src/lib/cookQuiz.ts`  
- Badge / historique : `src/lib/cookQualification.ts`  
- Gate publication : `publishIssues(..., qualificationValid)` dans `src/lib/dishPublish.ts`  
- UI : `src/app/studio/qualification.tsx`  
- Migration SQL (non appliquée) : `supabase/migrations/20261105140000_cook_qualification_delivery.sql`



## Boissons maison — interdiction (hygiène)

Décision produit du 13.11.2026 (Europe/Zurich). Motif : **hygiène**, pas une règle visant une recette.

- **Toutes** les boissons maison sont interdites à la publication (bissap, jus de gingembre, bouye, lait caillé, jus, infusions maison, etc.).
- Justification : ces préparations **se conservent mal** et sont **difficiles à contrôler** (chaîne du froid, acidité, conservation).
- La catégorie de fiche `boisson_maison` n’est pas autorisée.
- Un garde-fou sur le titre / la description / la catégorie affiche un message clair et bloquant (`homemade_drink` dans `publishIssues`).
- Les bouteilles **Bissabi scellées**, achetées au tarif professionnel, restent possibles (voir `docs/BISSABI-DRINKS.md`) — ce n’est pas une boisson maison.
- Code : `src/lib/homemadeDrinks.ts`, formulaire `src/app/studio/dish/[id].tsx`.
