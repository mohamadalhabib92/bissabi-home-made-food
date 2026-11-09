# Architecture

## Décisions

1. **Le checkout public ne change pas.** Retrait seul, paiement simulé, commandes déjà enregistrées intactes. La livraison et le coursier sont dans le parcours de test, jusqu’à ce que Mohamed ouvre le marché.
2. **Le pilote ne réécrit pas AsyncStorage.** Les neuf clés et leurs formes restent. Les prix décimaux déjà stockés ne sont pas convertis. L’affichage d’accueil les lit et les montre en unités mineures, sans les sauver autrement.
3. **Un marché est une donnée, pas une branche du code.** Pays, zones, frais, devise, fuseau, conformité, prestataires. Le premier enregistrement est `ch-vd` (Lausanne, Prilly, CHF, `Europe/Zurich`).
4. **L’argent est un entier d’unités mineures plus un code devise.** L’arrondi (5 centimes pour le CHF, 1 centime pour l’EUR) est une propriété de la devise.
5. **Un créneau est un instant UTC plus un fuseau IANA.** L’heure affichée est calculée.
6. **La conformité bloque l’ouverture réelle.** `claim` vaut `internal_only`. Sans avis, sans taux de taxe confirmé et sans prestataire live, `liveGaps` n’est pas vide. Le test suisse peut tourner ; une vente réelle, non.
7. **Les prestataires sont des interfaces.** Seul `simulated` est branché. Stripe, Datatrans, Payrexx et Wallee sont des identifiants, pas des SDK.
8. **La livraison future est une interface.** `manual` accepte. `future_partner` refuse sans réseau.
9. **Le serveur de test est le moteur `src/lib/pilot` plus les fonctions SQL `pilot.*`.** Les deux appliquent les mêmes refus (dossier, portion, paiement, coursier, rappel, périmètre d’admin). Le SQL n’est pas appliqué au projet hébergé.
10. **Les langues.** Français et anglais sont rédigés. Les autres langues du catalogue retombent sur l’anglais, puis le français pour l’app historique. Aucune chaîne d’allergène ou de mention légale n’est ajoutée dans une troisième langue.

## Langues

Catalogue : `fr`, `en`, `de`, `it`, `es`, `pt`, `ar`, `zh`, `wo` (wolof), `ff` (pulaar), `tr`, `ru`, `hi`.

- Sélection dans Langues. L’arabe met `direction: rtl` sur la racine et `dir` sur le document web. Le plugin `expo-localization` autorise le RTL natif sans le forcer (`forcesRTL: false`).
- Au premier accueil, si la langue enregistrée est encore le français par défaut et que l’appareil en a une autre connue, on propose cette langue une fois. Une langue d’appareil inconnue (japonais, par exemple) propose l’anglais, pas une traduction inventée. Si rien n’est lu, on reste en français.
- `needsReview` est vrai dès qu’un allergène ou un texte juridique est montré hors de sa langue rédigée. Le texte affiché reste le français ou l’anglais relu.
- Wolof et pulaar sont dans le catalogue JS. Ils ne sont pas dans `supportedLocales` natif : ce sont des ressources système à confirmer avant un build.

Les écrans historiques passent encore par `useL(fr, en)`. Hors français, ils affichent l’anglais. Les faire entrer dans le catalogue est une ligne du plan, pas un prérequis du pilote.

## Tenue des accès

Un admin porte une liste de marchés. Lire une commande d’un autre marché est refusé (`market_scope_refused`), dans le moteur et dans `pilot.read_order`. Un coursier n’ouvre que sa mission (`pilot.open_mission`). Les tables `pilot` ont le RLS activé et aucun droit pour `public`. Le rôle de test `pilot_client` ne lit pas les tables ; la fonction security definer refuse le mauvais coursier. Le schéma `pilot` ne doit pas être ajouté aux schémas exposés de l’API Supabase.

## Paiement

L’événement est accepté seulement si la signature de test correspond à l’identifiant. Un second envoi du même identifiant ne crée pas une seconde ligne. Un montant différent de la commande est refusé. Un succès après expiration de la retenue ne capture pas. La retenue dure `holdMinutes` du marché (15 pour le pilote).

Le grand livre enregistre, en unités mineures : encaissé, commission, frais, dû à la cuisine. Pour le pilote, la commission est payée par le client et le dû cuisine est le sous-total des plats. Qui garde les frais de livraison reste une décision de Mohamed : aujourd’hui ils sont dans `fees`, pas dans le dû cuisine.

## Hygiène

Le dossier (responsable, documents, hygiène, formation) et l’activation admin sont exigés avant de publier et de commander. Une suspension est immédiate et tracée. Un écart de température au-delà du seuil du marché (`coldMaxC`, `reheatMinC`) suspend. La recette publiée couvre la liste d’allergènes **du marché** (14 pour `ch-vd`). Une nouvelle version ne réécrit pas la version épinglée sur une commande ; la commande reçoit `recipe_changed`. Un rappel de lot bloque le plat et liste les commandes liées au lot.

La validation affichée est interne. Elle ne remplace pas l’annonce ni le contrôle officiel.
