# Section « Home Made Food by Bissabi » sur bissabi.ch

> Spécification pour une section **séparée** sur le site [bissabi.ch](https://bissabi.ch) (Wix).  
> **Ne pas modifier le site Wix depuis ce dépôt.** Ce document et le flux JSON sont un support pour une intégration ultérieure, à valider par Mohamed.

## Intention

Montrer, sur bissabi.ch, les **cuisinier·ères indépendant·e·s qualifié·e·s** et leurs **plats publiés**, sans fusionner les marques. Esthétique **luxe minimaliste** (beaucoup d’air, typo soignée, rouge / vert / or / crème Bissabi, photos de plats, peu de chrome).

Langues du site : **FR / DE / IT / EN** (le site Bissabi est déjà multilingue ; l’app Home Made Food reste FR / EN pour l’instant).

## Structure de la section

1. **En-tête**  
   Titre : « Home Made Food by Bissabi ». Sous-titre court (cuisine de quartier, commandes à l’avance). Lien « marque sœur », sans slogan publicitaire excessif.

2. **Cartes cuisinier**  
   - Nom affiché (public), ville et canton.  
   - Photo publique uniquement (sinon monogramme / visuel de marque).  
   - Badge **« Cuisinier indépendant »** (obligatoire).  
   - Badge **halal** s’il s’agit d’une déclaration du cook (non certifiée par Bissabi).  
   - Badge **formation hygiène / allergènes / sécurité** s’il est valide.  
   - Appel à l’action vers la fiche dans l’app / la PWA Home Made Food.

3. **Cartes plat**  
   - Photo, titre, indication halal le cas échéant, lien vers le cook.  
   - Pas de boisson maison.

4. **Mention de responsabilité** (visible, sur chaque page de la section)  
   - FR : « Chaque cuisinier·ère est un·e cuisinier indépendant, seul·e responsable de ses plats. Home Made Food by Bissabi et Bissabi sont uniquement l’intermédiaire. »  
   - EN / DE / IT : voir `BISSABI_CH_LIABILITY_NOTICE` dans `src/lib/bissabiChExport.ts`.

5. **CTA**  
   - « Commander dans l’app » / « Ouvrir Home Made Food » vers la PWA (GitHub Pages) et, plus tard, les stores **uniquement si Mohamed l’autorise**.  
   - Lien retour vers le reste de bissabi.ch (boissons), sans mélange des catalogues.

## Règle d’éligibilité

Un cook n’apparaît **que si** :

1. son **badge de formation** (hygiène, allergènes et sécurité) est **valide**, et  
2. il a **au moins un plat publié** (`active: true`) qui n’est pas une boisson maison.

Les plats non publiés, les brouillons et les boissons maison sont exclus.  
**Jusqu’au lancement : données de démonstration uniquement** (fiches marquées « démo »).

## Flux public (lecture seule)

- Fonction : `buildBissabiChFeed()` dans `src/lib/bissabiChExport.ts`.  
- Script : `npx tsx scripts/export-bissabi-ch-feed.ts [--out fichier.json]`.  
- Contenu : cooks éligibles et leurs plats publiés, issus du catalogue de démo par défaut.  
- **Pas de données personnelles** au-delà du **nom affiché**, de la **ville / du canton** et de la **photo publique**. Pas de NPA, coordonnées GPS, biographie, e-mail, adresse, téléphone ou pièce d’identité.

Ce flux n’est pas poussé automatiquement vers Wix.

## Forme juridique

Voir `docs/BISSABI-DRINKS.md` § 5 : une **Sàrl séparée** pour Home Made Food est recommandée (Bissabi Drinks - BA est une raison individuelle), **à faire valider** par un juriste / une fiduciaire.
