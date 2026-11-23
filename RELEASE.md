# Release next

`release/next` est la branche de la prochaine build TestFlight. **Ne pas la fusionner dans `main` sans l’accord de Mohamed.** `main` déploie le site (GitHub Pages) à chaque push. Cette branche ne le fait pas.

Les branches d’origine restent en place. Rien n’est soumis à l’App Store depuis ici, et aucun build EAS n’est lancé par la CI.

## D’où vient cette branche

Tête de départ : `cursor/fix-ios-launch-abi-784b` (PR #6).

Le dernier build TestFlight connu est le **15**, commit `a85c6a5` sur cette branche (Mohamed : l’app se lance). Les builds **13** et **14** venaient de `cursor/preserve-local-quarantine-0f78` (PR #5, commit `80c1d39` pour le 14) et plantaient au démarrage. Les commits de photos qui suivent `a85c6a5` sur la même branche sont inclus.

## Envoyer sur TestFlight

À lancer à la main, depuis `release/next`, quand Mohamed le demande. Pas depuis la CI.

```bash
git fetch origin
git checkout release/next
git pull origin release/next
bunx eas-cli build --platform ios --profile production
bunx eas-cli submit --platform ios --profile production
```

Le profil `production` d’`eas.json` incrémente le numéro de build côté EAS (`appVersionSource: remote`). Le bundle id, l’équipe Apple et `ascAppId` ne se changent pas dans cette branche.

`expo-haptics` (vibrations de la passe UX) est un module natif. Il ne sera dans l’app qu’après ce nouveau build. Une mise à jour OTA ne suffit pas.

Vérifier dans le journal EAS, phase `pod install`, le bloc `[Expo-precompiled]` :

- `ExpoFont (58.0.11)`
- `ExpoModulesCore (58.0.30)` — plus `58.0.26`

Sans cela, le binaire peut refaire le plantage des builds 13 et 14.

## CI

`.github/workflows/pr-checks.yml` tourne à chaque push et sur chaque pull request : `npm ci`, `npx expo install --check`, `tsc --noEmit`, `npm test`, `npx expo export --platform web`. Aucun secret, aucun déploiement. Le workflow Pages ne part que de `main`.

## Questions ouvertes (pas tranchées ici)

- **Commission.** Décidée : 10 % retenus sur le cuisinier. Les commandes déjà enregistrées gardent leurs montants.
- **Hygiène.** Pas de vente tant que la checklist en 8 points n’est pas attestée. Le dossier d’approbation du PR #7 n’est pas repris.
- **Paiement.** Décision : Stripe Connect. Le lancement reste au retrait, paiement simulé. Le branchement du PR #8 (TWINT, cartes, mode test) n’est pas dans cette branche.
- **Place de marché du PR #4.** Filtres façon Uber, interdiction des boissons maison, partenaires de livraison, qualification des cuisiniers : en conflit avec les photos et les textes de la branche TestFlight, et ce sont des règles métier.
- **Frais de livraison, pas de 5 centimes, qui paie les frais du prestataire, contact OFCO avant toute vente.** Déjà notés dans le README et le PR #7. Rien n’est décidé dans ce release.

## Branches laissées de côté

| Branche | PR | Pourquoi |
|---|---|---|
| `cursor/pilot-lausanne-journey-556a` | #7 (brouillon) | Change la commission et les règles d’hygiène. Techniquement un descendant, pas fusionné pour ne pas trancher. |
| `cursor/stripe-connect-twint-556a` | #8 | S’appuie sur le #7 et branche un paiement réel de test. |
| `feat/marketplace-2026-11-05` | #4 | Conflits (photos, textes, accueil, commande) et règles métier non décidées. |
