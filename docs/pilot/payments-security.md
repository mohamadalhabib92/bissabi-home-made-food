# Paiements et sécurité

## Menaces retenues

| Menace | Parade dans le test | Encore à faire avant l’ouverture |
| --- | --- | --- |
| Lire la commande d’un autre | Acheteur, cuisine et admin filtrés. Admin limité au marché. | RLS sur le projet réel, avec des utilisateurs Auth. |
| Faux coursier | `open_mission` compare l’identifiant. Refus testé, y compris pour un rôle sans droit de lecture des tables. | Comptes coursier vérifiés. |
| Faux vendeur | Activation admin avec MFA de test. Le cuisinier ne s’active pas seul. | KYC du prestataire. |
| Remboursement ou événement forgé | Signature de test exigée. Montant recalculé. Doublon ignoré. | Secret HMAC hors de l’app. |
| Fuite d’adresse | Adresse précise sur la mission seulement. Le refus n’ajoute pas l’adresse. | Politique d’accès et durée de conservation. |
| Course sur la dernière portion | Compteur `held` / `sold` et verrou de ligne SQL. | Deux sessions réelles au moment du branchement. |

Carte : jamais dans l’app. Le simulé ne demande pas de numéro.

## Commission (décision du 9 novembre 2026, corrigée à 10 %)

Le client paie le total au prestataire (simulé pour l’instant, découpage type Stripe Connect plus tard) : **sous-total des plats + livraison**.

Bissabi retient **10 %** de ce sous-total. Le cuisinier reçoit le brut moins cette commission. Le taux est `markets.commissionRateBps` (défaut 1000). Il est recopié sur la commande **au moment du paiement** et ne bouge plus, même si le marché change ensuite.

| Montant | Dans les 10 % ? | Qui le reçoit |
| --- | --- | --- |
| Plats | Oui, assiette | Cuisinier, net de commission |
| Livraison | Non | Plateforme, pour le coursier. Pas le cuisinier. |
| Frais du prestataire | Non | **Bissabi les supporte** (proposition). Ils sont au grand livre, pas déduits du net. Taux 0 tant que le contrat n’est pas signé. |

Les écritures sont en centimes, demi-supérieur. Le pas de 5 centimes du CHF n’est pas appliqué au stocké. Un remboursement partiel des plats réduit la commission au prorata du même taux figé. Un événement de paiement rejoué ne crée pas une deuxième commission. Le versement reste bloqué tant que le compte du cuisinier n’est pas vérifié chez le prestataire. Changer l’IBAN demande une confirmation renforcée.

## Prestataires

| | Stripe Connect | Payrexx | Datatrans | Wallee |
| --- | --- | --- | --- | --- |
| Cartes | Oui | Oui | Oui | Oui (à confirmer au contrat) |
| TWINT | Documenté, y compris pour une plateforme | Annoncé avec le split | Documenté ; le split marketplace vu publiquement vise Mastercard et Visa | À demander |
| Apple Pay / Google Pay | Via Checkout, après cartes et TWINT | À confirmer au contrat | Page de paiement | À confirmer |
| Vérification vendeur, commission, versement | Application fees, KYC Connect | Annoncé (split, KYC) | Split et frais marketplace documentés pour les cartes | Non confirmé ici |
| Remboursement partiel | Oui | À confirmer par écrit | Oui sur le montant autorisé | À confirmer |
| Événement signé | Webhook signé | À confirmer | À confirmer | À confirmer |

Sources consultées : documentation Stripe (Connect, TWINT, application fees), pages Payrexx sur le split, documentation Datatrans marketplace et TWINT. Ce n’est pas un conseil. Le contrat prime.

Pour le pilote, un seul vendeur par panier. Un encaissement au nom de Bissabi puis un versement séparé pose une question de détention de fonds : à trancher avec le conseil avant de choisir « Bissabi marchand » plutôt que « split chez le prestataire ».

## Données (nLPD)

Minimiser : l’adresse précise sert à la remise, pas à la fiche publique. Durées de conservation : non fixées (`null`), donc le marché ne peut pas passer « live ». Droit d’accès et d’effacement : l’export local existe déjà ; le compte serveur viendra avec Auth. Incident : journal d’audit du moteur, pas encore une procédure. Résidence visée du pilote : Suisse. Un autre pays se déclare dans son profil.

Séparer test et production au moment des clés. Aucune clé n’est dans ce dépôt.

## Avant d’ouvrir

Pentest indépendant, correction des findings critiques et hauts, essai de sauvegarde et de restauration, exercice d’incident. Non faits ici. Le dire dans l’app serait faux.
