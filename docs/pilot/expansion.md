# Ouvrir un pays, ou une langue

Le pilote est `ch-vd`. On n’ajoute pas un pays en dur dans le calcul. On ajoute un enregistrement de marché, puis on ne le passe « live » que lorsque `liveGaps` est vide.

## Nouveau pays

- [ ] Identité du vendeur dans ce pays (nom, adresse, numéro). Tant que ce n’est pas relu, on ne l’invente pas.
- [ ] Autorité compétente : nom et URL officiels. `claim` reste `internal_only` tant que cette autorité n’a pas été contactée. Ne pas copier l’OFCO.
- [ ] Liste d’allergènes de ce droit. Ne pas recopier les 14 suisses si le pays en a d’autres. Noms traduits seulement après relecture humaine.
- [ ] Taxe : libellé et taux confirmés. `null` bloque l’ouverture. On n’ajoute pas un taux deviné.
- [ ] Protection des données et pays où les données résident (nLPD, RGPD, ou le régime local).
- [ ] Devise déjà dans la table des devises, ou une ligne d’exposant et de pas d’arrondi ajoutée. Pas de repli silencieux vers le CHF.
- [ ] Fuseau IANA. Les créneaux se stockent en UTC plus ce fuseau.
- [ ] Zones : villes, codes postaux, frais de livraison en unités mineures, ouvertes ou non.
- [ ] Format d’adresse (motif du code postal). Géocodage : manuel tant qu’aucun prestataire n’est branché.
- [ ] Prestataire de paiement du pays, derrière l’interface. Statut `live` seulement avec un contrat. Méthodes : cartes d’abord, moyen local (TWINT en Suisse), portefeuilles ensuite.
- [ ] Partenaire de livraison du marché, ou retrait seul. Le manuel reste possible.
- [ ] Admins du marché dans `admin_scopes`. Un admin Suisse ne lit pas l’autre pays.
- [ ] Pentest, restauration, exercice, déjà exigés pour la Suisse, à revoir si le pays change le threat model.

Un marché « planned » sans autorité, sans vendeur ou sans zone ouverte ne se commande pas (`pilotGaps`).

## Nouvelle langue

- [ ] Le code est dans `LOCALES` (fr, en, de, it, es, pt, ar, zh, wo, ff, tr, ru, hi, et la suivante sur le même modèle).
- [ ] Textes d’interface rédigés par un humain, français ou anglais comme source. Pas de traduction automatique collée dans le catalogue.
- [ ] Allergènes et mentions légales : fichier séparé, drapeau de relecture, publication seulement quand `needsReview` est faux pour cette langue.
- [ ] Vérifier le sens (`ltr` ou `rtl`) et un écran réel, pas seulement la balise.
- [ ] Format des prix et des heures via `Intl` avec la balise de la langue. Ne pas concaténer « CHF » à la main.
- [ ] Marquer `complete: true` seulement après la relecture. Avant ça, le sélecteur dit « repli anglais » et le bandeau le répète.
- [ ] Wolof (`wo`) et pulaar (`ff`) : les ajouter à `supportedLocales` natif seulement après avoir vérifié que le build iOS et Android accepte ces codes.

Langues déjà prévues et encore en repli : allemand, italien, espagnol, portugais, arabe, chinois, wolof, pulaar, turc, russe, hindi. Le chinois n’est pas scindé en simplifié et traditionnel : à décider au moment de la relecture.
