# Bissabi Home Made Food — fiche App Store (brouillon)

> Brouillon à recopier dans App Store Connect. Rien n'a été soumis.

| Champ | Valeur |
|---|---|
| Nom (≤ 30) | Bissabi Home Made Food (22 car.) |
| Sous-titre (≤ 30) | Cuisine maison entre voisins (28 car.) |
| Bundle ID | `ch.bissabi.bissabihomemadefood` |
| SKU proposé | `bissabi-home-made-food-ios-001` |
| Projet EAS | `cc63133a-c4ff-4607-9d31-5a531f19b69e` (compte habib548) |
| Version / build | 1.0.0 / numéro de build géré par EAS (remote, autoIncrement) |
| Langue principale | Français |
| Catégorie principale | Cuisine et boissons (Food & Drink) |
| Catégorie secondaire | Style de vie (Lifestyle) |
| Prix | Gratuit |
| URL de confidentialité | https://mohamadalhabib92.github.io/bissabi-home-made-food/privacy/ |
| URL d'assistance | https://mohamadalhabib92.github.io/bissabi-home-made-food/support/ |
| URL marketing | https://mohamadalhabib92.github.io/bissabi-home-made-food/ |
| Copyright | 2026 Bissabi Drinks - BA (Mohamed El Habib Ba) |
| Appareils | iPhone + iPad (supportsTablet) |
| Chiffrement | Aucun chiffrement non exempté (ITSAppUsesNonExemptEncryption = false) |

## Texte promotionnel (≤ 170)
Commandez à l'avance des plats faits maison par des cuisinier·ère·s de votre quartier. Allergènes obligatoires, avis modérés.

## Mots-clés (≤ 100, séparés par des virgules)
`cuisine maison,plats,voisins,quartier,halal,repas,commande,traiteur,Lausanne,Vaud,cuisinier` (91 car.)

## Description — FR
Bissabi Home Made Food relie les amateurs de bonne cuisine maison aux cuisinier·ère·s de leur quartier.

Côté client :
• Découvrez les plats et cuisiniers proches (rayon de 1 à 5 km), filtre halal (déclaré par le cuisinier).
• Allergènes affichés pour chaque plat.
• Commandez à l'avance sur un créneau de retrait ou de livraison.
• Suivi de commande, reçu, avis modérés, signalement.

Côté cuisinier :
• Profil, checklist hygiène, publication de plats avec photo et allergènes obligatoires.
• Créneaux, commandes à accepter ou refuser, revenus.

La saveur du partage, par Bissabi.

## Description — EN
Bissabi Home Made Food connects neighbours with home cooks nearby. Customers discover dishes within 1–5 km, see mandatory allergen info, pre-order for pickup or delivery, track orders, and leave moderated reviews. Cooks set up a profile, complete a hygiene checklist, publish dishes with photos, manage slots and accept or decline orders.

## Classification par âge
4+ (contenu généré par les utilisateurs modéré : avis) — réponses au questionnaire : aucune violence, aucun contenu sexuel, pas de jeux d'argent, pas de navigation web non filtrée, pas de contenu médical, pas de messagerie entre utilisateurs, avis publics modérés (contenu généré par les utilisateurs : Oui).

## Confidentialité de l'app (étiquettes « nutrition »)
- **Collecte de données : « Nous ne collectons pas de données »** (Data Not Collected). Tout est stocké uniquement sur l'appareil et n'est transmis ni à l'éditeur ni à des tiers (au sens d'Apple, il n'y a donc pas de « collecte »).
- Suivi (tracking) : Non. Pas d'identifiant publicitaire.
- À revoir si un backend (Supabase, Stripe, API) est activé dans une version future.

Données stockées localement (pour information) :
- Votre profil (nom affiché, commune) et, si vous cuisinez, votre profil de cuisinier, vos plats et leurs photos, vos créneaux ;
- Vos commandes, reçus, avis et signalements ;
- Votre position approximative (arrondie à environ 100 m), uniquement au moment où vous demandez les plats proches ; elle n'est pas conservée.

Autorisations :
- Localisation « pendant l'utilisation » : facultative, pour trouver les plats proches. Vous pouvez choisir une commune à la place.
- Photos : uniquement quand vous ajoutez une photo à un plat (pas d'accès à l'appareil photo).

## Notes pour l'équipe de révision (App Review)
Aucun compte requis. VERSION DE DÉMONSTRATION : les paiements sont simulés et clairement indiqués comme tels (aucune carte demandée) ; les cuisiniers et plats d'exemple sont fictifs et étiquetés « démo ». Pour tester : onglet Découvrir > choisir un plat > Commander > Payer (simulé). Côté cuisinier : onglet Cuisiner.

Contact révision : à compléter (prénom, nom, téléphone, e-mail de Mohamed). Compte de démonstration : non requis.

## Captures d'écran à fournir
- iPhone 6,9 pouces (1320 × 2868 ou 1290 × 2796) : 3 à 10 captures.
- iPad 13 pouces (2064 × 2752 ou 2048 × 2732) : 3 à 10 captures (obligatoire car l'app est disponible sur iPad).

## Risques de refus (App Review) et corrections
| Niveau | Risque | À faire avant soumission |
|---|---|---|
| Élevé | 2.1 App incomplète / paiements démo uniquement : une place de marché dont les paiements, cuisiniers et commandes sont simulés sera refusée. | Brancher un vrai backend (comptes, commandes partagées entre client et cuisinier) et Stripe réel avant soumission. Les plats sont des biens physiques : Stripe est autorisé (pas d'achat intégré Apple). |
| Moyen | 1.2 Contenu généré par les utilisateurs : il faut filtrer, signaler, bloquer et publier un contact. | Déjà : avis modérés et signalement. À ajouter : blocage d'un utilisateur et e-mail de contact. |
| Moyen | 5.1.1 Si des comptes sont ajoutés, la suppression de compte dans l'app devient obligatoire. | Prévoir « Supprimer mon compte » avec le backend. |
| Moyen | Réglementation alimentaire (hygiène, allergènes, déclaration cantonale) : Apple peut demander des justificatifs. | Garder la checklist et ajouter les conditions d'utilisation des cuisiniers. |
