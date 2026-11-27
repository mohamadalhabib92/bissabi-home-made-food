# Bissabi Home Made Food — fiche App Store (brouillon)

> Brouillon à recopier dans App Store Connect. Rien n'a été soumis.

| Champ | Valeur |
|---|---|
| Nom (≤ 30) | Bissabi Home Made Food (22 car.) |
| Sous-titre (≤ 30) | Cuisine maison entre voisins (28 car.) |
| Bundle ID | `com.vibecode.bissabihomemadefood.gjtply` |
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
- E-mail, nom et historique d'achats : collectés, liés à l'identité, but « fonctionnalité de l'app », pas de suivi. Le manifeste est dans `app.json`.
- Suivi (tracking) : Non. Pas d'identifiant publicitaire.
- La position approximative reste dans les préférences de l'appareil et n'est pas envoyée.
- Connexion : e-mail, mot de passe et lien magique. Aucun bouton Google, Facebook ou Apple. Sign in with Apple n'est donc pas requis (guideline 4.8).
- Suppression de compte : dans l'app, écran Compte. Le serveur efface l'utilisateur Auth quand la fonction `delete-account` est déployée.

Données stockées localement (pour information) :
- Votre profil (nom affiché, commune) et, si vous cuisinez, votre profil de cuisinier, vos plats et leurs photos, vos créneaux ;
- Vos commandes, reçus, avis et signalements ;
- Votre position approximative (arrondie à environ 100 m), enregistrée dans les préférences de cet appareil lorsque vous la demandez. Elle n'est pas envoyée à un serveur. La désactiver dans Compte efface cette préférence. Elle n'est pas effacée toute seule.

Autorisations :
- Localisation « pendant l'utilisation » : facultative, pour trouver les plats proches. Vous pouvez choisir une commune à la place.
- Photos : uniquement quand vous ajoutez une photo à un plat (pas d'accès à l'appareil photo).

## Notes pour l'équipe de révision (App Review)
Compte par e-mail (mot de passe ou lien magique). Pas de connexion sociale. Les plats d'exemple sont étiquetés « démo » et ne sont pas une vente. L'encaissement Stripe reste fermé tant que `EXPO_PUBLIC_LAUNCH_PAYMENTS` n'est pas `1` et que la cuisine n'a pas passé l'hygiène. Ne pas soumettre tant que les clés et ce drapeau ne sont pas en place (`docs/go-live.md`). Pour parcourir : onglet Découvrir. Côté cuisine : onglet Cuisiner. Suppression de compte : Compte.

Contact révision : à compléter (prénom, nom, téléphone, e-mail de Mohamed). Compte de démonstration : non requis.

## Captures d'écran à fournir
- iPhone 6,9 pouces (1320 × 2868 ou 1290 × 2796) : 3 à 10 captures.
- iPad 13 pouces (2064 × 2752 ou 2048 × 2732) : 3 à 10 captures (obligatoire car l'app est disponible sur iPad).

## Risques de refus (App Review) et corrections
| Niveau | Risque | À faire avant soumission |
|---|---|---|
| Élevé | 2.1 App incomplète si l'encaissement est encore fermé au moment de la revue. | Suivre `docs/go-live.md` : clés Stripe test puis live, drapeau de lancement, migrations. Les plats sont des biens physiques : Stripe est autorisé (pas d'achat intégré Apple). |
| Moyen | 1.2 Contenu généré par les utilisateurs : il faut filtrer, signaler, bloquer et publier un contact. | Déjà : avis modérés et signalement. À ajouter : blocage d'un utilisateur et e-mail de contact. |
| Moyen | 5.1.1 La suppression doit vraiment effacer le compte serveur. | Le bouton est dans l'app. Déployer `delete-account` avant la soumission, sinon un compte créé en ligne resterait. |
| Moyen | Réglementation alimentaire (hygiène, allergènes, déclaration cantonale) : Apple peut demander des justificatifs. | Garder la checklist et ajouter les conditions d'utilisation des cuisiniers. |
