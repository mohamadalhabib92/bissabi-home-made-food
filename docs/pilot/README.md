# Pilote Lausanne / Prilly

Premier marché : familles qui cuisinent, clients qui commandent à l’avance, retrait **et** livraison par coursier, en francs, en français. L’app reste utilisable en anglais. Le checkout public déjà en ligne ne propose toujours que le retrait : la livraison se teste dans **Parcours pilote**, étiqueté comme test, sans débit.

Ce n’est pas une autorisation de vente. L’autorité à confirmer est le chimiste cantonal, via l’Office de la consommation (OFCO) du canton de Vaud. L’app ne l’affiche pas comme une inspection faite.

## Où essayer

Accueil → « Parcours pilote (test) », ou Compte → Parcours pilote. Le parcours ne réécrit pas les clés AsyncStorage existantes : il vit en mémoire.

```bash
npm test
npm run test:sql   # Postgres local, aucun projet hébergé
npx tsc --noEmit
```

## Statut

| Sujet | Statut |
| --- | --- |
| Accueil : plat, créneau, prix | Implémenté et testé. Le catalogue déjà enregistré n’est pas réécrit. |
| Checkout public | Inchangé : retrait seul, paiement simulé, historique intact. |
| Parcours test (dossier → plat → précommande → paiement simulé → retrait et livraison → reçu) | Implémenté et testé. |
| Dossier cuisine incomplet : plat non commandable | Implémenté et testé (moteur et SQL). |
| Deux clients, dernière portion | Implémenté et testé. Une seule réservation. |
| Allergène ajouté après commande | Version figée, commande signalée. Testé. Les noms d’allergènes ne sont pas traduits automatiquement. |
| Événement de paiement en double | Une commande payée, une ligne de grand livre. Testé. Prestataire simulé, aucun débit. |
| Coursier sur la mission d’un autre | Refus côté fonction SQL et côté moteur. L’adresse précise n’est pas dans le refus. |
| Rappel de lot | Vente bloquée, commandes liées identifiées. Testé. |
| Français et anglais du pilote | Complets pour les textes du parcours. |
| de, it, es, pt, ar, zh, wo, ff, tr, ru, hi | Au catalogue. Repli anglais. Arabe : sens droite-gauche. Pas de traduction automatique. |
| Devise, zones, fuseau, conformité par marché | Fondation. Seul `ch-vd` est ouvert, en test. |
| TWINT, cartes, Apple Pay, Google Pay réels | En attente du prestataire et de clés. Aucune clé dans le dépôt. |
| Partenaire de livraison | Interface. Non branché. Assignation manuelle dans le test. |
| MFA admin, step-up IBAN | Porte de test. Le MFA Supabase n’est pas branché. |
| RLS sur le projet hébergé | SQL écrit, **non appliqué**. |
| Comptes client et cuisinier (courriel, rôle serveur, dossier en cours) | Implémenté et testé en local. Le projet hébergé n’est pas modifié. Apple et Google ne sont pas branchés. Voir [comptes](accounts.md). |
| Pentest, essai de restauration, exercice d’incident | Requis avant ouverture. Non faits. |
| Commande immédiate, dashboard web séparé | Plus tard. Voir le plan. |

## Décisions pour Mohamed

1. **Prestataire.** Recommandation pour le modèle marketplace (vérification du vendeur, commission, versement, remboursement partiel, événement signé) : **Stripe Connect**, cartes et TWINT d’abord, Apple Pay et Google Pay ensuite dans le même checkout. À faire confirmer par Stripe : TWINT sur le type de charge Connect retenu. **Payrexx** annonce un split marketplace avec TWINT. **Datatrans** documente un split marketplace pour Mastercard et Visa ; le TWINT dans ce split est à confirmer. **Wallee** : le split marketplace n’a pas été confirmé ici. Tant que le contrat n’est pas signé, seul le prestataire simulé tourne.
2. **Autorité.** Avant toute vente réelle : annonce d’activité auprès du chimiste cantonal (OFCO, Vaud) et validation des textes. L’écran ne doit jamais dire qu’une inspection a eu lieu.
3. **Coursiers.** Le pilote assigne à la main. Il faut le cadre (qui conduit, assurance, que faire en cas de retard, colis abîmé, client injoignable). Le retrait reste proposé.
4. **Argent.** Commission par défaut **10 %** du sous-total des plats, retenue sur le cuisinier, figée sur la commande au paiement. Le taux est une donnée du marché (`commissionRateBps`, 1000). Le client paie plats + livraison. La livraison n’est pas dans l’assiette et n’est pas versée au cuisinier. Les frais du prestataire sont supportés par Bissabi (taux 0 tant qu’il n’y a pas de contrat) : à confirmer. Le taux de TVA n’est pas inventé.
5. **Langues.** Ne marquer une langue « complète » qu’après relecture humaine. Les allergènes et les mentions légales restent en français ou en anglais jusque-là.
6. **Avant l’ouverture.** Pentest indépendant, correction des findings critiques et hauts, essai de restauration, exercice d’incident, avis sur le fait de détenir ou non les fonds des cuisines (nLPD, LBA le cas échéant).

Détail : [audit](audit.md), [architecture](architecture.md), [données](data-model.md), [plan](plan.md), [paiements et sécurité](payments-security.md), [rollback](rollback.md), [ouvrir un pays ou une langue](expansion.md).
