# Modèle de données

Deux mondes, volontairement séparés.

## Déjà sur l’appareil (inchangé)

Clés `@bissabi-home-made-food/` : `prefs`, `cooks`, `dishes`, `slots`, `orders`, `reviews`, `reports`, `favorites`, `cart`. Les prix de plats sont des décimaux CHF. Les créneaux ont `date`, `from`, `to`. On ne migre pas ces documents. L’accueil les lit tels quels.

`prefs.lang` accepte désormais un code du catalogue (`de`, `ar`, …). Les valeurs `fr` et `en` déjà enregistrées restent valides. Aucune clé n’est renommée.

## Schéma `pilot` (nouveau, non appliqué au projet hébergé)

Montants : `integer` minor + `currency`. Créneaux : `starts_at timestamptz`, `ends_at timestamptz`, `zone` (IANA). Chaque cuisine, commande et mission porte `market_id`.

| Table | Rôle |
| --- | --- |
| `markets`, `zones` | Pays, devise, fuseau, statut, NPA, frais, ouvert ou non. |
| `admin_scopes` | Admin limité à un marché. |
| `kitchens` | Dossier et droit de vendre. `sales_allowed` seul ne suffit pas si le dossier est incomplet. |
| `dishes`, `recipe_versions` | Prix en unités mineures. La commande pointe une version, pas « la recette courante ». |
| `slots`, `orders` | Capacité, retenu, vendu. `held + sold <= capacity`. |
| `payment_events`, `ledger` | Identifiant d’événement unique. Une ligne de grand livre par événement appliqué. |
| `missions` | Coursier et adresse précise. |
| `lots`, `batches`, `batch_lots`, `batch_orders` | Lot → préparation → commandes. |

Le moteur TypeScript tient les mêmes liens en mémoire pour le parcours de test, avec en plus la retenue datée, le code de remise et le journal d’audit.

## Profil de conformité (dans le marché, pas dans une table à part pour le pilote)

Autorité, URL, `claim = internal_only`, liste d’allergènes, libellé de taxe, taux (`null` si non confirmé), vendeur, régime de protection des données, résidence des données, seuils de température, `confirmedByCounsel`.

Ouvrir un marché en réel exige un profil sans trou (`liveGaps`). Le marché suisse échoue tant que l’avis, le taux de TVA et un prestataire live manquent. C’est voulu.
