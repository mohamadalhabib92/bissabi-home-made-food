# Plan

Le pilote d’abord. Le reste est listé pour ne pas le réécrire plus tard, pas pour le construire maintenant.

## Fait dans cette branche

- Fondation marché, argent, temps, langues, RTL, sélecteur, détection d’appareil.
- Moteur de commande test et fonctions SQL équivalentes.
- Parcours visible, étiqueté test.
- Tests des six règles, du périmètre admin, du repli de langue et du refus de traduction automatique des allergènes.

## Ensuite, dans l’ordre

1. Mohamed choisit le prestataire et le cadre des coursiers. On branche **un** adaptateur derrière l’interface, clés hors du client, événements signés.
2. Avis sur vendeur, TVA, durée de conservation, et savoir si Bissabi détient les fonds des cuisines.
3. Annonce OFCO / chimiste cantonal. Le badge n’apparaît qu’après pièce revue. Aucun texte d’inspection inventé.
4. Appliquer les migrations (passe 1 puis `pilot`) sur un projet de test que Mohamed désigne. Pas depuis cette branche, pas sur la production.
5. Auth Supabase, MFA admin réel, step-up sur l’IBAN. Remplacer le drapeau `mfa` de test.
6. Faire entrer les écrans encore en `useL` dans le catalogue, langue par langue, avec relecture. Une langue ne passe « complète » qu’après cette relecture, allergènes et mentions compris.
7. Dashboard web d’admin (dossiers, suspensions, incidents, remboursements, rappels) sur les mêmes fonctions, pas une deuxième logique.
8. Partenaire de livraison, quand le manuel ne suffit plus. La commande immédiate seulement quand la cuisine et le coursier tiennent l’heure affichée.
9. Pentest, restauration, exercice d’incident. Ensuite seulement, ouverture.

## Hors de ce pilote, volontairement

Traduction humaine des allergènes, clés de paiement, envoi de la migration, build EAS, fusion dans `main`, géocodage externe, plusieurs cuisines dans un même panier.
