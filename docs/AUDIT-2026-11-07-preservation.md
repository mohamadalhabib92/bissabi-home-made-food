# Audit Bissabi Home Made Food — 7 novembre 2026

Périmètre : le dépôt `bissabi-home-made-food` tel qu’il est sur `main`, plus les pull requests ouvertes, sans les modifier. Ceci n’est pas un avis juridique, pas une certification alimentaire, pas une promesse d’entiercement, et pas une garantie allergène.

**SHA audité (main)** : `928ac7fed40397fed9d59ef079edf60725e7f638`  
**Commit** : `928ac7f` — Merge pull request #2 (`fix/supabase-env-client`).  
Les lignes citées ci-dessous sont celles de ce SHA, sauf mention de la présente branche.

## Cinq lignes

L’application sur `main` est une Expo SDK 58 / React Native 0.88, PWA et projets iOS/Android, dont le cœur (cuisiniers, plats, créneaux, commandes, panier, favoris, préférences, signalements) vit dans AsyncStorage / localStorage, préfixe `@bissabi-home-made-food/`. La Passe 1, déjà fusionnée (PR #1), empêche d’écrire avant une lecture réussie et refuse un JSON illisible comme s’il était vide. Elle ne suffit pas : l’état affiché avant et pendant un échec de lecture est le jeu de démonstration, une forme future ou un objet à la place d’un tableau ouvre ensuite l’écriture, et « Supprimer mes données » effaçait sans copie de récupération. Il n’y a pas de Supabase vivant ni de Stripe Connect branché : les variables sont des `YOUR_*`, la migration SQL n’est pas appliquée. Le retrait seul au lancement est une décision déjà prise le 6 novembre 2026 et répétée le 7 : cette branche masque la livraison pour les nouvelles commandes et laisse l’historique intact. Seules le français et l’anglais sont sélectionnables. La validation juridique de la tolérance cuisine privée reste en attente : voir l’axe 8.

## Déjà fusionné — ne pas le refaire

| PR | Branche | État | Ce qu’elle a posé |
| --- | --- | --- | --- |
| [#1](https://github.com/mohamadalhabib92/bissabi-home-made-food/pull/1) | `cursor/passe-1-foundations-5634` | fusionnée | Garde d’écriture, libellé Annonce OFCO (VD), blocage de publication, schéma SQL additif **non appliqué**, client Supabase absent si `YOUR_*` |
| [#2](https://github.com/mohamadalhabib92/bissabi-home-made-food/pull/2) | `fix/supabase-env-client` | fusionnée | Références `EXPO_PUBLIC_*` statiques et client créé seulement si URL + clé anon sont réelles |

La garde reste dans `src/lib/persistGuard.ts`. La présente branche ne la réécrit pas. Elle s’ajoute devant : classer le document, ne pas adopter la démo à la place d’un original illisible, réattacher les champs inconnus, archiver hors du préfixe effaçable.

## Pull requests ouvertes — non modifiées

| PR | Base | Tête | Rapport avec cet audit |
| --- | --- | --- | --- |
| [#3](https://github.com/mohamadalhabib92/bissabi-home-made-food/pull/3) | `main` | `ux/passe-plaisir-2026-11-04` | Passe visuelle (thème sombre, haptique). Ne touche pas la persistance. Non fusionnée, non écrasée. |
| [#4](https://github.com/mohamadalhabib92/bissabi-home-made-food/pull/4) | la branche de #3 | `feat/marketplace-2026-11-05` | Catalogue démo élargi, photos, guide cuisinier, migrations SQL **non appliquées**. Empilée sur #3. Elle modifie aussi `src/lib/data.tsx` : un futur rebase conflictuera avec la présente branche. Non fusionnée. Son contenu n’est pas sur `main` et n’est pas traité comme livré. |

## Ce que le dépôt n’est pas

- Pas une place de marché en ligne : deux personnes sur deux appareils ne se voient pas.
- Pas 24 tables en service. Le fichier `supabase/migrations/20261102213000_passe1_foundations.sql` contient **14** `create table` (lignes 12 à 143). `supabase/README.md` dit que la migration n’a pas été appliquée. Aucun projet Supabase n’a été lu ni créé pour cet audit.
- Pas Stripe Connect. `STRIPE_CONNECT_CLIENT_ID` est un placeholder dans `.env.example`. Aucun appel Stripe, aucun secret lu, aucun paiement lancé.
- Pas un badge OFCO, pas une certification halal, pas des avis réels : les avis de `src/lib/seed.ts` sont marqués `(démo)`.

## Les douze axes

### 1. Concurrents nommés (Suisse / Europe) et sourcing

Cuisine maison entre particuliers, sources ouvertes pendant cet audit, sans conclure qu’ils sont encore actifs le 7 novembre 2026 : **Cooka** ([cooka.ch](https://cooka.ch/), mise en relation locale, la page annonce 0 % de commission — affirmation du site, non vérifiée) ; **Kitchup** ([Gastrojournal, 8 juin 2021](https://gastrojournal.ch/home/gastronomie/kitchup-liefert-menues-von-hobby-und-berufskoechen-nach-hause), privé·e·s et professionnel·le·s, retrait ou livraison, alors Zurich, Lucerne, Zoug, Nidwald) ; **eatshomemade** ([fiche LinkedIn](https://linkedin.com/company/eatshomemade), siège indiqué Zürich, domaine cité eatshomemade.ch) ; **Neia** ([fiche LinkedIn](https://linkedin.com/company/neia-sa), Genève, neia.app, repas « home chefs »). Adjacent, pas le même geste de retrait : **BiteSpace** ([fiche LinkedIn](https://linkedin.com/company/bitespace), chef·fe à domicile, y compris amateur·ice). Le même article Gastrojournal cite **Uber Eats** et **eat.ch** comme livraison de restaurants, pas comme cuisine de particulier. Trop Good To Go, Smood, Eatwith et Menu Next Door n’ont pas été re-lus ici : ne pas les traiter comme cartographiés. Le sourcing photos de la PR #4 (Unsplash / Pexels / Wikimedia, `docs/ATTRIBUTION.md` sur cette branche seulement) n’est pas sur `main`. Sur `main`, les plats de démo sont des emojis.

### 2. Parcours acheteur, cuisinier, admin — retrait

Parcours sur `main` avant ce suivi : accueil, lieu, Découvrir, fiche plat, panier, puis checkout qui proposait encore le segment livraison (`checkout.tsx` au SHA, vers la ligne 72) et un pied de page Stripe « lorsqu’il est activé ». Décision de lancement, déjà explicite les 6 et 7 novembre 2026 : **retrait seulement**. Le suivi sur cette branche retire le choix livraison du panier et du checkout, filtre les créneaux visibles à ceux qui incluent le retrait, et n’écrit les nouvelles commandes qu’en `mode: 'pickup'` sans adresse. Un panier qui arrivait avec `mode=delivery` affiche l’invitation à choisir un retrait. `prepareLaunchCheckout` renvoie les tableaux commandes et panier tels quels. Les fiches cuisinier qui ont déjà `delivers: true`, les créneaux `delivery` et les commandes `mode: 'delivery'` avec adresse restent en stockage ; le bouton pour activer une nouvelle livraison est masqué, pas migré vers `false`. Le paiement du lancement reste une simulation : `launchPayment().callsStripe` est faux, donc `usePay` n’appelle pas Stripe. Côté admin : modération locale, sans compte séparé.

### 3. Exactitude vie privée, accessibilité, RTL, performance, hors-ligne

`prefs.location` (latitude, longitude, libellé, source, canton) est un champ des préférences persistées. `location.tsx` l’écrit après un GPS arrondi à ~100 m (`location.ts` lignes 7–10 au SHA) ou après le choix d’une commune. Au SHA audité, `app.json` (lignes 26 et 95) et `store/ios-metadata.md` disaient que cette position n’était pas conservée : c’était inexact, et ce n’était pas une suppression. Le suivi aligne ces textes et l’écran Mes données : la position est enregistrée dans les préférences de l’appareil, elle n’est pas envoyée à un serveur, et la désactivation dans Compte efface cette préférence. Elle n’est pas décrite comme déjà absente. Des rôles d’accessibilité existent sur les boutons, interrupteurs et alertes (`src/ui/kit.tsx`), pas un audit lecteur d’écran ni de taille de texte. Aucun `I18nManager`, aucun RTL : l’arabe est annoncé « phase 3 » (`languages.tsx` lignes 8–10). L’accueil est un `ScrollView` qui monte toutes les cartes, sans mesure de performance. Le hors-ligne est le mode normal (tout est local), pas une file de synchronisation : `@react-native-community/netinfo` est dépendant mais ne porte pas de rapprochement de conflits. Conflit de deux appareils : hors sujet tant qu’il n’y a pas de serveur.

### 4. Commandes, stock, argent — idempotence et conflits

`placeOrder` (`data.tsx` vers 60–70) préfixe une commande et ne déduplique pas un double envoi. Le bouton passe en `loading`, ce qui bloque un second appui dans le même écran, sans clé d’idempotence. `slotUsed` (`market.ts` lignes 16–18) compte les portions déjà prises sur le créneau ; il n’y a pas de stock d’ingrédients ni de verrou. Le paiement démo (`checkout.ts`) peut marquer « demandé » sans débit, puis vider le panier même si l’appel échoue (`checkout.tsx` vers 57–66). Les montants sont calculés dans le client (`pricing.ts` : 15 % et CHF 6.00, les deux marqués à confirmer). L’exemple serveur (`server/README.md`) prévient qu’il ne faut pas faire confiance au client, et l’exemple lui-même relit le corps de la requête. Aucun grand livre, aucun remboursement, aucun conflit de caisse : il n’y a pas de caisse réelle.

### 5. Sécurité, nLPD / RGPD, adresse exacte

Menaces du code actuel : tout le JSON local est lisible par qui a l’appareil ou le stockage du navigateur ; l’export passe par un téléchargement web ou la feuille de partage native (`download.ts`), qui peut quitter l’appareil si la personne choisit une cible ; la suppression était irréversible (`privacy.tsx` lignes 24–26 au SHA audité). L’adresse de livraison est un champ libre sur la commande (`model.ts` ligne 86) montré au cuisinier (`studio/order/[id].tsx`). Il n’y a pas de règle « adresse exacte seulement après acceptation » appliquée au stockage : le texte de retrait le dit pour l’adresse du cuisinier, pas un contrôle d’accès. Pas d’authentification, pas de RLS en service (les policies du SQL ne tournent nulle part). nLPD : loi fédérale RS 235.1, [Fedlex](https://www.fedlex.admin.ch/eli/cc/2022/491/fr) (page non relue mot à mot, le site exige JavaScript). RGPD (règlement UE 2016/679) : à qualifier si l’offre vise des personnes dans l’UE. Ce paragraphe ne dit pas quelle base légale choisir.

### 6. Mineurs

Aucun écran ne demande un âge. `welcome.tsx` envoie vers commander ou cuisiner après la case conditions, sans seuil. La checklist hygiène ne parle pas de la capacité juridique. Apple guideline 1.4 (dommage physique) et les règles alimentaires s’appliquent au contenu, pas à un contrôle d’âge déjà codé. Il manque une décision de Mohamed : âge minimum pour commander, pour cuisiner, et que faire des données d’un mineur. Aucun article de la nLPD n’est cité ici faute de relecture du texte.

### 7. Sept langues — couverture réelle

`Lang` vaut `'fr' | 'en'` (`model.ts` ligne 2). Les catalogues `src/i18n/fr.ts` et `en.ts` ne couvrent que les chaînes de fondation ; le reste passe par `useL(fr, en)`. `languages.tsx` affiche Deutsch, Italiano, Español, Schwiizerdütsch et العربية comme non sélectionnables. Il n’y a pas de fichiers `de`, `it`, `es`, `de-CH`, `ar`. Couverture réelle : **2 langues sur 7**, et encore incomplètes dès qu’une chaîne n’existe que d’un côté du couple `L()`.

### 8. Allergènes, hygiène, responsabilité — sources officielles, pas un conseil

Les 14 clés de `ALLERGENS` (`model.ts` lignes 5–20) suivent la liste de l’annexe 6 de l’OIDAl (RS 817.022.16) : gluten, crustacés, œufs, poisson, arachides, soja, lait, fruits à coque, céleri, moutarde, sésame, sulfites, lupin, mollusques. Texte consolidé consulté via [justement.ch, annexe 6](https://justement.ch/fr/doc/act/ch/817_022_16/annex_6) et [JuriUp, art. 10–11](https://juriup.ch/lois/oidal/chapitre-2-section-4/) (vérifié sur Fedlex au 30 octobre 2026 selon cette page, relue le 7 novembre 2026). La publication exige présent / traces / absent (`dishPublish.ts`) ; une fiche ancienne ne pré-coche pas « absent ». Ce n’est pas l’étiquetage complet de l’art. 11 (seuils de contamination involontaire, mise en évidence typographique). L’autocontrôle est l’art. 26 LDAI (RS 817.0), rappelé par l’[OFCO Vaud](https://www.vd.ch/economie/protection-consommateur/denrees-et-objets/autocontrole-et-hygiene). L’annonce d’activité est présentée par le canton comme l’art. 20 ODAlOUs : [prestation officielle](https://www.vd.ch/prestation/annoncer-une-entreprise-du-secteur-alimentaire-art-20-odalous), OFCO, chemin de Boveresses 155, Epalinges. La même page hygiène signale une directive du **24 juin 2021** sur l’aménagement des locaux ; le PDF n’a pas été ouvert dans cet audit. Une FAQ cantonale COVID (fichier `Q_A_Entreprises.pdf` sur vd.ch) répond **non** à la distribution de plats préparés dans une cuisine privée, même gratuite, parce que les locaux privés ne remplissent en général pas les exigences. Les recherches d’architecture antérieures indiquent que le PDF de la directive OFCO du 24 juin 2021 confirme une tolérance conditionnelle de trois mois pour la cuisine à domicile, cantonale et non fédérale. Cet audit n’a pas rouvert ce PDF. Les pages web ouvertes ici, qui ne redisent pas la règle des trois mois, sont une preuve incomplète : elles ne réfutent pas cette directive. La validation de la source juridique reste en attente. Aucune citation du PDF n’est reproduite ici, parce que ce passage ne l’a pas lu. Ne pas inventer le texte, et ne pas l’afficher dans l’app tant que la source n’est pas jointe au dossier. Le badge dans l’app reste « Annonce OFCO (VD) » seulement après un admin, et le texte dit que ce n’est pas une certification (`fr.ts` lignes 3–8). Halal : déclaration du cuisinier, non certifiée.

### 9. Pédagogie

Sans objet. Aucun parcours de formation, aucun quiz noté, aucun diplôme dans le code de `main`. La checklist est une attestation sur l’honneur (`fr.ts`, `hygieneNotCert`). Ne pas inventer un module pédagogique pour combler cet axe.

### 10. IA optionnelle — pas de garantie allergène

Aucune fonction d’IA dans le dépôt (pas d’appel modèle, pas de classement automatique des allergènes). Si une aide est ajoutée plus tard, elle ne peut pas déclarer un plat sûr pour une allergie : la source reste la déclaration du cuisinier, avec ses trous (traces non saisies sur les fiches anciennes, `splitAllergens`). Une IA ne doit pas remplir « absent » à la place du cuisinier. `dishPublish.ts` refuse déjà la publication tant que les 14 statuts ne sont pas choisis ; ce garde-fou doit rester humain.

### 11. Stripe Connect, plateforme de paiement, stores, biens physiques

Rôle visé, non construit : une plateforme qui encaise et reverse les cuisiniers est, dans la documentation Stripe, en général le commerçant enregistré, responsable des soldes négatifs, et ce n’est pas un contrat d’entiercement réglementé. Pages lues : [Connect, plateformes et places de marché](https://docs.stripe.com/connect/saas-platforms-and-marketplaces), [charges et transferts séparés](https://docs.stripe.com/connect/separate-charges-and-transfers) (le transfert n’est pas un séquestre ; les frais, remboursements et contestations restent sur le compte plateforme). Apple [guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/) : biens ou services consommés hors de l’app, le paiement ne passe pas par l’achat intégré ; Apple Pay ou carte sont les exemples donnés. Google Play : le [règlement sur les paiements](https://support.google.com/googleplay/android-developer/answer/10281818?hl=fr) exclut les biens physiques et la livraison de repas du système de facturation Play. Dans le code : `paymentsLive` est faux tant que la clé publique et l’URL d’API sont des `YOUR_*` (`payments.ts` lignes 12–15). Aucun Apple Pay / Google Pay (phase 2 dans l’UI). Ne pas promettre l’entiercement, Twint, ni un reversement Connect.

### 12. Monétisation, croissance, KPI, composants partagés

Monétisation affichée : commission 15 % payée par l’acheteur, frais de livraison CHF 6.00, net cuisinier = sous-total (`pricing.ts` lignes 6–20). TVA, qui paie vraiment la commission, et le prix de la livraison sont ouverts dans le README et les notes admin. Aucun KPI n’est collecté (pas d’analytics). Un KPI éthique minimal, plus tard, se limiterait à des comptes locaux déjà consentis (commandes terminées, pas de revente de position). Le même stockage et les mêmes écrans servent l’acheteur, le cuisinier et la modération. Ce n’est pas une fuite réseau ; c’est un seul profil d’appareil. Une adresse, un signalement et un avis en attente sont dans le même JSON. Ne pas réutiliser ce JSON tel quel comme « composant partagé » le jour où plusieurs comptes existeront.

## Impact, effort, priorité

Échelle 1 (faible) à 5 (décisif / lourd). Priorité : P0 cette semaine, P1 avant tout paiement réel ou toute donnée partagée, P2 avant élargissement.

| Sujet | Impact | Effort | Priorité | Pourquoi maintenant |
| --- | --- | --- | --- | --- |
| Original local illisible, forme future, ou effacement sans copie | 5 | 2 | P0 | Seule copie des commandes et de l’adresse. Corrigé dans cette branche, tests unitaires seulement. |
| Démo affichée à la place d’un document présent | 5 | 2 | P0 | Même correctif : repli neutre, pas `demoMarket()`, tant que l’original est tenu. |
| Double commande / capacité non réservée / montants client | 4 | 3 | P1 | Pas de débit réel aujourd’hui. Bloquant dès que `paymentsLive` devient vrai. |
| Livraison proposée aux nouvelles commandes | 4 | 2 | fait | Décision des 6 et 7 novembre. Checkout et panier : retrait seul. Historique, adresses et réglage `delivers` conservés. |
| Texte de position inexact au SHA | 3 | 1 | fait | `prefs.location` est bien stocké. Les phrases disent maintenant « enregistrée dans les préférences », et la désactivation dans Compte est le geste qui efface. |
| Âge minimum absent | 4 | 2 | P1 | Décision manquante. Ne pas inventer un âge. |
| Annonce OFCO, locaux, tolérance 3 mois | 5 | 4 | P1 | Source signalée par les recherches antérieures (PDF du 24 juin 2021). Validation juridique encore en attente. Pas une réfutation, pas une citation inventée. |
| Sept langues, RTL | 3 | 4 | P2 | 2/7 aujourd’hui. Ne pas marquer « complet » les langues vides. |
| Stripe Connect, TVA, commission, Twint | 5 | 5 | P2 | Rien n’est branché. Ne pas coder un encaissement dans l’app. |
| Backend, 14 tables, auth, adresse après acceptation | 5 | 5 | P2 | Le SQL est une proposition. Ne pas l’appliquer dans cet audit. |
| Accessibilité et performance mesurées | 3 | 3 | P2 | Base de rôles présente, pas de campagne lecteur d’écran. |
| IA allergènes | 4 | 1 | P2 | Ne pas l’ajouter. Interdit de garantir l’absence d’allergène. |

## Cinq chantiers pour la semaine

1. Relire sur un appareil de test la copie de récupération (cette PR) : JSON cassé, version `schemaVersion: 2`, effacement, restauration seulement si la copie de travail est vide, remplacement seulement après confirmation.
2. Joindre au dossier le PDF OFCO du 24 juin 2021 déjà signalé par les recherches d’architecture, et faire valider par un juriste la tolérance conditionnelle de trois mois (cantonale, non fédérale). Ne pas l’écrire dans l’app avant cette validation, et ne pas traiter l’absence du PDF dans les pages web de cet audit comme une preuve qu’elle n’existe pas.
3. Tenir l’âge minimum (commander, cuisiner) comme décision encore inconnue.
4. Tenir la TVA, qui paie les 15 % et le futur prix de la livraison comme décisions encore inconnues. Le retrait seul, lui, est déjà décidé.
5. Ne pas activer Stripe ni Supabase.

## Cinq prompts pour la suite

1. « Sur la branche de conservation locale déjà ouverte, ajoute un test d’intégration AsyncStorage en mémoire (pas un appareil) qui écrit un JSON d’ordre illisible, recharge, vérifie que la démo n’est pas affichée, que la clé de travail n’est pas réécrite, et que la copie de récupération contient les mêmes octets. »
2. « Ajoute un écran d’âge minimum seulement après la décision de Mohamed. N’invente pas un seuil. Ne réécris pas les commandes existantes. »
3. « Prépare le texte TVA et le payeur des 15 % comme questions ouvertes dans les notes admin, sans changer `pricing.ts` ni appeler un serveur. »
4. « Cartographie les statuts de commande et les doubles appuis de `placeOrder` / `usePay`. Propose une clé d’idempotence locale. N’ajoute pas de serveur ni de secret. »
5. « Prépare une note d’une page pour l’OFCO et le conseil : annonce art. 20 ODAlOUs, art. 26 LDAI, annexe 6 OIDAl, ce que l’app affirme déjà, ce qu’elle ne doit pas afficher (badge, halal certifié). La tolérance de trois mois est signalée par les recherches antérieures sur le PDF du 24 juin 2021 ; la validation de cette source reste en attente. Ne pas inventer de citation. Pas de nouveau texte légal dans l’interface. »

## Cibles, sources, SHA, fichier, ligne

SHA de toutes les lignes de code : `928ac7fed40397fed9d59ef079edf60725e7f638`.

| Cible | Source | Fichier:ligne au SHA |
| --- | --- | --- |
| Ne pas écraser avant lecture | Code Passe 1 | `src/lib/persistGuard.ts:32-71` |
| JSON illisible = pas vide, mais l’UI partait de la démo | Code | `src/lib/storage.ts:14-25` et `59-76` ; repli démo `src/lib/data.tsx:35-42` |
| Effacement sans archive | Code | `src/lib/storage.ts:37-41` ; bouton `src/app/privacy.tsx:24-26` |
| Export local via partage natif | Code | `src/lib/download.ts:4-18` |
| Démo fictive marquée | Code | `src/lib/seed.ts:1-8` et avis `44-47` |
| 14 tables, non appliquées | Code + README | `supabase/migrations/20261102213000_passe1_foundations.sql:12-143` ; `supabase/README.md:1-7` |
| Pas de client si `YOUR_*` | Code | `src/lib/supabase.ts:7-16` ; `src/lib/publicEnv.ts:1-7` |
| Paiement simulé, pas Connect | Code | `src/lib/payments.ts:12-21` ; `.env.example:23` ; `server/README.md:1-4` et `62` |
| Commission et frais non confirmés | Code | `src/lib/pricing.ts:6-9` |
| Livraison dans le tunnel au SHA, masquée ensuite sur cette branche | Code au SHA, puis `src/lib/launchCheckout.ts` | `src/app/checkout.tsx:26-27` et `72-87` au SHA |
| Capacité de créneau, sans verrou | Code | `src/lib/market.ts:16-18` |
| Position conservée malgré le texte iOS | Code | `app.json:26` et `95` ; `src/lib/location.ts:7-10` |
| Adresse sur la commande | Code | `src/lib/model.ts:86` |
| Langues 2/7 | Code | `src/lib/model.ts:2` ; `src/app/languages.tsx:7-10` |
| Allergènes 14, publication | Code | `src/lib/model.ts:5-20` ; `src/lib/dishPublish.ts:59-71` |
| OFCO affiché comme non-certification | Code | `src/i18n/fr.ts:3-8` |
| Annonce alimentaire VD | [vd.ch, art. 20 ODAlOUs](https://www.vd.ch/prestation/annoncer-une-entreprise-du-secteur-alimentaire-art-20-odalous) | — |
| Autocontrôle, directive 24 juin 2021 citée, PDF non lu | [vd.ch, hygiène](https://www.vd.ch/economie/protection-consommateur/denrees-et-objets/autocontrole-et-hygiene) | — |
| Cuisine privée : la FAQ COVID consultée dit non | [Q_A_Entreprises.pdf sur vd.ch](https://www.vd.ch/fileadmin/user_upload/organisation/dfj/serac/fichiers_pdf/Q_A_Entreprises.pdf) | — |
| Annexe 6 OIDAl | [justement.ch](https://justement.ch/fr/doc/act/ch/817_022_16/annex_6), [JuriUp](https://juriup.ch/lois/oidal/chapitre-2-section-4/) | — |
| nLPD, texte non relu | [Fedlex RS 235.1](https://www.fedlex.admin.ch/eli/cc/2022/491/fr) | — |
| Apple, biens hors app | [Guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/) | — |
| Google Play, repas exclus de la facturation Play | [Règlement paiements](https://support.google.com/googleplay/android-developer/answer/10281818?hl=fr) | — |
| Stripe Connect, rôle plateforme, pas un séquestre | [docs Stripe marketplaces](https://docs.stripe.com/connect/saas-platforms-and-marketplaces), [separate charges](https://docs.stripe.com/connect/separate-charges-and-transfers) | — |
| Cooka, Kitchup, eatshomemade, Neia, BiteSpace | Liens de l’axe 1 | — |
| Entité affichée | Code | `src/lib/company.ts:1` — Bissabi Drinks - BA, Chemin de la Suettaz 17, 1008 Prilly, CHE-332.255.936. Non revérifié au registre dans cet audit. |

## Correctif retenu (une seule fondation)

Le plus fort risque borné, sans réécrire l’app et sans fonction marché : **ne jamais substituer la démo ni une forme vide à un original présent, et garder les octets hors du préfixe que l’effacement supprime.**

Comportement ajouté dans `src/lib/preserve.ts` et branché par `src/lib/storage.ts` :

- Document absent : le premier lancement peut encore semer la démo. C’est le seul cas.
- JSON illisible, `schemaVersion` numérique supérieure à 1, ou forme incompatible (objet là où un tableau est attendu) : mémoire neutre (`[]` ou préférences vides), écriture refusée par la garde existante, octets copiés une fois sous `@bissabi-home-made-food-quarantine/` (ce préfixe ne commence pas par `@bissabi-home-made-food/`).
- Champs inconnus sur un document compatible : ils restent sur l’objet et sont réattachés si un enregistrement les oublie. Une seconde réattache est identique à la première. Une valeur déjà modifiée n’est pas écrasée.
- Effacement de la copie de travail : archive d’abord. Si l’archive ne s’écrit pas, rien n’est effacé. La copie de récupération survit. L’effacer est un second bouton.
- Restauration : si la copie de travail est absente ou neutre, on relit la dernière chaîne archivée qui n’est pas le document neutre. Si la copie de travail diffère, on ne touche pas, sauf confirmation « remplacer ».
- Repartir à vide : seulement si les octets actuels sont déjà dans la copie.
- Écran : bandeau accueil et compte ; actions sur « Mes données ». Les bandeaux ne contiennent pas l’adresse ni le JSON. L’export brut est un geste explicite (téléchargement ou feuille de partage), pas un `console.log`.
- Reboot d’erreur : `reboot.tsx` ne vide pas le stockage. Il n’y a pas de déconnexion. Rien n’a été ajouté qui effacerait au logout, parce qu’il n’y a pas de session.

Suivi sur la même branche, après décision explicite : les nouvelles commandes sont au retrait seulement, sans choix de livraison et sans appel Stripe. L’historique des commandes livraison, des paniers et des adresses n’est pas migré. Hors de ces deux corrections : pas de migration Supabase, pas de paiement réel, pas de nouvelle langue, pas de réécriture Swift.

## Garanties, et ce qu’elles ne couvrent pas

`npx tsc --noEmit` : succès. `npm test` : 30 tests, 0 échec. Les 24 tests précédents restent verts (garde Passe 1, publication, 18 tests de `preserve.test.ts`). Six tests ajoutés : checkout retrait seul, historique et panier inchangés, créneaux livraison masqués sans réécriture, paiement sans Stripe, écrans sans sélecteur livraison, texte de position aligné sur `prefs.location`.

Ces tests n’ouvrent pas AsyncStorage sur un téléphone, ni la PWA, ni un vrai fichier d’un utilisateur. Ils ne prouvent pas qu’un appareil déjà en circulation a une copie saine. Avant de s’y fier pour des données réelles : exporter depuis l’écran Mes données, conserver ce fichier hors de l’app, puis seulement essayer une restauration sur une copie d’appareil. Les champs inconnus **imbriqués** (par exemple une clé dans `payment` ou `consents`) ne sont pas mis de côté un par un. Un `schemaVersion` écrit en texte plutôt qu’en nombre n’est pas traité comme une version future. `saveJSON` avale encore un stockage plein : l’écriture peut échouer sans message.

## Entrées manquantes

- Validation juridique encore en attente : joindre le PDF OFCO du 24 juin 2021 (recherches d’architecture : tolérance conditionnelle de trois mois, cantonale, non fédérale). L’absence de cette phrase dans les pages web lues ici ne la réfute pas. Ne pas citer le PDF de mémoire.
- Âge minimum commande et cuisine.
- Retrait seul au lancement : décidé les 6 et 7 novembre 2026, appliqué pour les nouvelles commandes. La date d’ouverture de la livraison reste inconnue.
- Prestataire (Stripe Checkout, Connect, Twint), qui paie les 15 %, TVA, frais de livraison.
- Projet Supabase : ne pas en créer tant que le schéma n’est pas revu. Les 14 tables ne sont pas 24 tables, et elles ne tournent pas.
- Registre IDE de Bissabi Drinks - BA : la ligne est dans le code, pas revérifiée ici.
- Essai sur iPhone, Android et navigateur de la copie de récupération.
- Traductions DE, IT, ES, de-CH, AR.
- Décision sur la PR #3 et la PR #4 avant rebase : #4 touche `data.tsx`.
