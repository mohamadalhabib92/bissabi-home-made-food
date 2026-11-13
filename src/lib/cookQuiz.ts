/**
 * Quiz formation cuisinier — hygiène / allergènes / sécurité.
 * Contenu pédagogique interne Bissabi, à faire valider par un expert.
 * Sources citées dans docs/COOK-QUALIFICATION.md (OSAV/BLV, ODAlOUs, OIDAl, OHyg).
 * Ce module n’est PAS une certification officielle.
 */
export type QuizModuleId = 'hygiene' | 'allergens' | 'safety';

export type QuizQuestion = {
  id: string;
  module: QuizModuleId;
  fr: string;
  en: string;
  choices: { fr: string; en: string }[];
  /** Index 0-based de la bonne réponse. */
  answer: number;
  explainFr: string;
  explainEn: string;
};

export const PASS_MARK = 80; // %
export const BADGE_VALIDITY_DAYS = 365;
export const MAX_RETRIES_PER_DAY = 5;

export const MODULE_META: Record<QuizModuleId, { fr: string; en: string; icon: string }> = {
  hygiene: { fr: 'Hygiène alimentaire', en: 'Food hygiene', icon: 'water-outline' },
  allergens: { fr: 'Allergènes (OIDAl)', en: 'Allergens (OIDAl)', icon: 'alert-circle-outline' },
  safety: { fr: 'Sécurité & transport', en: 'Safety & transport', icon: 'shield-checkmark-outline' },
};

/** ~12 questions / module. Textes prudents, sans inventer d’obligations non sourcées. */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // —— HYGIENE (12) ——
  { id: 'h1', module: 'hygiene', fr: 'À quelle température le frigo doit-il en principe rester pour la chaîne du froid des denrées périssables ?', en: 'At what temperature should the fridge generally stay for the cold chain of perishable foods?',
    choices: [{ fr: '≤ 5 °C', en: '≤ 5 °C' }, { fr: '≤ 12 °C', en: '≤ 12 °C' }, { fr: 'Température ambiante suffit', en: 'Room temperature is fine' }], answer: 0,
    explainFr: 'La pratique courante citée dans les guides d’hygiène et dans l’app est ≤ 5 °C. Confirmez les exigences locales avec votre autorité cantonale.',
    explainEn: 'Common practice cited in hygiene guidance and in the app is ≤ 5 °C. Confirm local requirements with your cantonal authority.' },
  { id: 'h2', module: 'hygiene', fr: 'Avant de manipuler des denrées, vous devez…', en: 'Before handling food, you must…',
    choices: [{ fr: 'Seulement mettre des gants (sans laver les mains)', en: 'Only put on gloves (no hand washing)' }, { fr: 'Se laver les mains correctement, avec une tenue propre', en: 'Wash hands properly, with clean clothing' }, { fr: 'Rien de particulier si la cuisine est propre', en: 'Nothing special if the kitchen looks clean' }], answer: 1,
    explainFr: 'Lavage des mains et tenue propre font partie des bases d’hygiène (OHyg — instructions adaptées à l’activité).',
    explainEn: 'Hand washing and clean clothing are basic hygiene (HygO — training suited to the activity).' },
  { id: 'h3', module: 'hygiene', fr: 'Pour éviter la contamination croisée, que faire avec le cru et le cuit ?', en: 'To avoid cross-contamination, what about raw and cooked food?',
    choices: [{ fr: 'Les mélanger pour gagner du temps', en: 'Mix them to save time' }, { fr: 'Les séparer (planches, ustensiles, zones)', en: 'Keep them separate (boards, utensils, areas)' }, { fr: 'Uniquement séparer le poisson', en: 'Only separate fish' }], answer: 1,
    explainFr: 'Séparer cru / cuit (et allergènes) limite les contaminations croisées.',
    explainEn: 'Separating raw / cooked (and allergens) limits cross-contamination.' },
  { id: 'h4', module: 'hygiene', fr: 'La température cible souvent citée pour une cuisson / un réchauffage « à cœur » est…', en: 'The core temperature often cited for cooking / reheating is…',
    choices: [{ fr: '≥ 50 °C', en: '≥ 50 °C' }, { fr: '≥ 70 °C', en: '≥ 70 °C' }, { fr: '≥ 100 °C obligatoire pour tout', en: '≥ 100 °C mandatory for everything' }], answer: 1,
    explainFr: '≥ 70 °C à cœur est une référence pratique fréquente. Adaptez selon le type de denrée et les consignes cantonales.',
    explainEn: '≥ 70 °C core is a common practical reference. Adapt to the food type and cantonal guidance.' },
  { id: 'h5', module: 'hygiene', fr: 'Qui est responsable de la sécurité des plats que vous vendez ?', en: 'Who is responsible for the safety of the dishes you sell?',
    choices: [{ fr: 'Bissabi uniquement', en: 'Bissabi only' }, { fr: 'Vous (autocontrôle, LDAl art. 26)', en: 'You (self-checks, FDA art. 26)' }, { fr: 'L’acheteur', en: 'The buyer' }], answer: 1,
    explainFr: 'LDAl art. 26 : la personne qui met des denrées sur le marché est soumise à l’autocontrôle.',
    explainEn: 'FDA art. 26: anyone placing food on the market is subject to self-checks.' },
  { id: 'h6', module: 'hygiene', fr: 'Un module de formation dans l’app Bissabi est…', en: 'An in-app Bissabi training module is…',
    choices: [{ fr: 'Une certification officielle OSAV', en: 'An official FSVO certificate' }, { fr: 'Une bonne pratique interne, pas une certification officielle', en: 'Internal good practice, not an official certificate' }, { fr: 'Un remplacement de l’annonce cantonale', en: 'A substitute for cantonal registration' }], answer: 1,
    explainFr: 'OHyg art. 22 exige des instructions adaptées ; Bissabi ne délivre pas de certificat officiel.',
    explainEn: 'HygO art. 22 requires suitable training; Bissabi does not issue an official certificate.' },
  { id: 'h7', module: 'hygiene', fr: 'Si vous êtes malade (gastro, plaie infectée aux mains), que faire ?', en: 'If you are ill (gastro, infected hand wound), what should you do?',
    choices: [{ fr: 'Cuisiner quand même avec un masque', en: 'Cook anyway with a mask' }, { fr: 'Ne pas manipuler de denrées jusqu’à rétablissement / avis adapté', en: 'Do not handle food until recovered / appropriate advice' }, { fr: 'Seulement éviter les desserts', en: 'Only avoid desserts' }], answer: 1,
    explainFr: 'Une personne malade peut contaminer les denrées. La checklist hygiène de l’app rappelle ce point.',
    explainEn: 'An ill person can contaminate food. The app hygiene checklist covers this.' },
  { id: 'h8', module: 'hygiene', fr: 'Le nettoyage des surfaces de travail doit être…', en: 'Cleaning of work surfaces should be…',
    choices: [{ fr: 'Occasionnel si ça « a l’air propre »', en: 'Occasional if it “looks clean”' }, { fr: 'Régulier, avec produit adapté, avant/après les préparations à risque', en: 'Regular, with suitable product, before/after risky prep' }, { fr: 'Réservé aux inspections', en: 'Only for inspections' }], answer: 1,
    explainFr: 'Nettoyage et désinfection adaptés font partie de l’hygiène de base.',
    explainEn: 'Suitable cleaning and disinfection are basic hygiene.' },
  { id: 'h9', module: 'hygiene', fr: 'Dès que vous vendez des plats via une app (même entre voisin·es), en principe…', en: 'As soon as you sell dishes via an app (even to neighbours), in principle…',
    choices: [{ fr: 'Vous restez en « usage domestique privé » hors LDAl', en: 'You stay in “private domestic use” outside the FDA' }, { fr: 'Vous sortez de l’usage privé : la LDAl s’applique et une annonce cantonale est en principe requise (ODAlOUs art. 20)', en: 'You leave private use: the FDA applies and cantonal notification is generally required (FOpO art. 20)' }, { fr: 'Seul Bissabi doit s’annoncer', en: 'Only Bissabi must register' }], answer: 1,
    explainFr: 'LDAl art. 2 et ODAlOUs art. 20 — sauf remise vraiment occasionnelle (bazar, fête scolaire).',
    explainEn: 'FDA art. 2 and FOpO art. 20 — except truly occasional charity sales.' },
  { id: 'h10', module: 'hygiene', fr: 'L’annonce d’activité alimentaire se fait auprès de…', en: 'Food-business notification is made to…',
    choices: [{ fr: 'Bissabi uniquement', en: 'Bissabi only' }, { fr: 'L’autorité cantonale compétente (ex. OFCO dans le canton de Vaud)', en: 'The competent cantonal authority (e.g. OFCO in Vaud)' }, { fr: 'La Confédération uniquement en ligne', en: 'The Confederation only online' }], answer: 1,
    explainFr: 'Dans le canton de Vaud : OFCO. Le nom de l’autorité varie (ex. SCAV à Genève / Jura).',
    explainEn: 'In Vaud: OFCO. The authority name varies (e.g. SCAV in Geneva / Jura).' },
  { id: 'h11', module: 'hygiene', fr: 'Les gants jetables…', en: 'Disposable gloves…',
    choices: [{ fr: 'Remplacent toujours le lavage des mains', en: 'Always replace hand washing' }, { fr: 'Ne remplacent pas le lavage des mains ; changez-les si contaminés', en: 'Do not replace hand washing; change them if contaminated' }, { fr: 'Sont interdits en cuisine maison', en: 'Are banned in home kitchens' }], answer: 1,
    explainFr: 'Les gants sont un complément, pas un substitut au lavage des mains.',
    explainEn: 'Gloves complement, they do not replace, hand washing.' },
  { id: 'h12', module: 'hygiene', fr: 'Le packaging doit…', en: 'Packaging must…',
    choices: [{ fr: 'Être joli avant tout', en: 'Look nice first' }, { fr: 'Être propre, adapté aux denrées, et permettre l’étiquetage requis', en: 'Be clean, food-suitable, and allow required labelling' }, { fr: 'Être réutilisé sans nettoyage', en: 'Be reused without cleaning' }], answer: 1,
    explainFr: 'Emballages propres et adaptés ; étiquette à la remise (allergènes, conservation…).',
    explainEn: 'Clean, suitable packaging; label at handover (allergens, storage…).' },

  // —— ALLERGENS (12) ——
  { id: 'a1', module: 'allergens', fr: 'Combien d’allergènes majeurs la liste OIDAl (annexe 6) aligne-t-elle avec le cadre UE ?', en: 'How many major allergens does the OIDAl annex 6 list align with the EU framework?',
    choices: [{ fr: '8', en: '8' }, { fr: '14', en: '14' }, { fr: '20', en: '20' }], answer: 1,
    explainFr: 'OIDAl RS 817.022.16, annexe 6 — 14 allergènes (alignés UE 1169/2011).',
    explainEn: 'OIDAl 817.022.16 annex 6 — 14 allergens (aligned with EU 1169/2011).' },
  { id: 'a2', module: 'allergens', fr: 'En vente à distance, les informations allergènes doivent être…', en: 'For distance selling, allergen information must be…',
    choices: [{ fr: 'Données seulement oralement au livreur', en: 'Given only orally to the courier' }, { fr: 'Disponibles au moment de l’offre (dans l’app) et à la remise', en: 'Available at offer time (in the app) and at handover' }, { fr: 'Facultatives si le plat est « fait maison »', en: 'Optional if the dish is “homemade”' }], answer: 1,
    explainFr: 'ODAlOUs art. 44 — informations obligatoires au moment de l’offre et à la livraison / remise.',
    explainEn: 'FOpO art. 44 — mandatory info at offer time and at delivery / handover.' },
  { id: 'a3', module: 'allergens', fr: 'Pour publier un plat sur Bissabi, chaque allergène des 14 doit être classé…', en: 'To publish a dish on Bissabi, each of the 14 allergens must be marked…',
    choices: [{ fr: 'Présent seulement si évident', en: 'Present only if obvious' }, { fr: 'Présent, traces, ou absent', en: 'Present, traces, or absent' }, { fr: 'Uniquement « absent » par défaut', en: '“Absent” by default' }], answer: 1,
    explainFr: 'Règle produit Bissabi : les trois statuts bloquent la publication tant qu’ils ne sont pas tous renseignés.',
    explainEn: 'Bissabi product rule: all three statuses are required before publish.' },
  { id: 'a4', module: 'allergens', fr: 'Le gluten concerne notamment…', en: 'Gluten especially concerns…',
    choices: [{ fr: 'Uniquement le pain blanc', en: 'Only white bread' }, { fr: 'Blé, seigle, orge, avoine (et produits dérivés)', en: 'Wheat, rye, barley, oats (and derived products)' }, { fr: 'Uniquement les desserts', en: 'Only desserts' }], answer: 1,
    explainFr: 'Parmi les 14 : céréales contenant du gluten.',
    explainEn: 'Among the 14: cereals containing gluten.' },
  { id: 'a5', module: 'allergens', fr: 'Pour éviter le contact croisé allergène, vous devez…', en: 'To avoid allergen cross-contact, you should…',
    choices: [{ fr: 'Utiliser les mêmes ustensiles pour tout', en: 'Use the same utensils for everything' }, { fr: 'Séparer zones / ustensiles / huiles, et nettoyer entre les préparations', en: 'Separate areas / utensils / oils, and clean between preparations' }, { fr: 'Se fier au goût du client', en: 'Rely on the customer’s taste' }], answer: 1,
    explainFr: 'La contamination croisée peut rendre un plat dangereux même sans ingrédient allergène volontaire.',
    explainEn: 'Cross-contact can make a dish dangerous even without an intentional allergen ingredient.' },
  { id: 'a6', module: 'allergens', fr: 'La mention « Halal » sur un plat Bissabi signifie…', en: 'A “Halal” label on a Bissabi dish means…',
    choices: [{ fr: 'Certification officielle délivrée par Bissabi', en: 'An official certificate issued by Bissabi' }, { fr: 'Déclaration du cuisinier (optionnellement avec note de certification tierce)', en: 'The cook’s declaration (optionally with a third-party certification note)' }, { fr: 'Absence totale d’allergènes', en: 'Total absence of allergens' }], answer: 1,
    explainFr: 'Bissabi n’audite pas le statut halal. C’est une déclaration du cook.',
    explainEn: 'Bissabi does not audit halal status. It is the cook’s declaration.' },
  { id: 'a7', module: 'allergens', fr: 'Les fruits à coque (nuts) et les arachides…', en: 'Tree nuts and peanuts…',
    choices: [{ fr: 'Sont le même allergène', en: 'Are the same allergen' }, { fr: 'Sont deux catégories distinctes de la liste des 14', en: 'Are two distinct categories in the list of 14' }, { fr: 'N’ont pas à être déclarés en Suisse', en: 'Need not be declared in Switzerland' }], answer: 1,
    explainFr: 'Arachides et fruits à coque sont listés séparément.',
    explainEn: 'Peanuts and tree nuts are listed separately.' },
  { id: 'a8', module: 'allergens', fr: 'Si un client signale une allergie sévère dans la note de commande…', en: 'If a customer reports a severe allergy in the order note…',
    choices: [{ fr: 'Ignorer : l’app suffit', en: 'Ignore it: the app is enough' }, { fr: 'Relire la fiche, confirmer les allergènes / traces, refuser si doute', en: 'Re-check the dish, confirm allergens / traces, refuse if unsure' }, { fr: 'Ajouter un emoji sur l’emballage', en: 'Add an emoji on the packaging' }], answer: 1,
    explainFr: 'En cas de doute, ne pas servir. La sécurité prime.',
    explainEn: 'If unsure, do not serve. Safety first.' },
  { id: 'a9', module: 'allergens', fr: 'Pour le pain et la boulangerie fine vendus en ligne, il faut notamment indiquer…', en: 'For bread and fine bakery sold online, you must in particular state…',
    choices: [{ fr: 'Uniquement le prix', en: 'Only the price' }, { fr: 'Le pays de production (exigence citée ODAlOUs / OIDAl)', en: 'Country of production (cited FOpO / OIDAl requirement)' }, { fr: 'Rien de plus que le nom du plat', en: 'Nothing more than the dish name' }], answer: 1,
    explainFr: 'ODAlOUs art. 39 al. 2 let. d ; OIDAl art. 15 — pays de production visible avant l’achat.',
    explainEn: 'FOpO art. 39 para. 2 lit. d; OIDAl art. 15 — country of production visible before purchase.' },
  { id: 'a10', module: 'allergens', fr: 'Les sulfites doivent être déclarés…', en: 'Sulphites must be declared…',
    choices: [{ fr: 'Jamais', en: 'Never' }, { fr: 'Lorsqu’ils sont présents au-delà du seuil réglementaire (liste des 14)', en: 'When present above the regulatory threshold (list of 14)' }, { fr: 'Uniquement pour le vin bu sur place', en: 'Only for wine drunk on site' }], answer: 1,
    explainFr: 'Les sulfites font partie des 14 allergènes / substances à déclarer.',
    explainEn: 'Sulphites are among the 14 allergens / substances to declare.' },
  { id: 'a11', module: 'allergens', fr: 'L’étiquette à la remise du plat devrait au minimum permettre d’identifier…', en: 'The handover label should at least identify…',
    choices: [{ fr: 'Seulement le logo Bissabi', en: 'Only the Bissabi logo' }, { fr: 'Plat, cook, allergènes, conservation / à consommer jusqu’au…', en: 'Dish, cook, allergens, storage / use-by…' }, { fr: 'Uniquement le prix payé', en: 'Only the price paid' }], answer: 1,
    explainFr: 'Bonne pratique produit Bissabi alignée sur les exigences d’information.',
    explainEn: 'Bissabi product good practice aligned with information duties.' },
  { id: 'a12', module: 'allergens', fr: 'Cocher « Absent » pour un allergène sans vérifier…', en: 'Ticking “Absent” for an allergen without checking…',
    choices: [{ fr: 'Est acceptable pour aller plus vite', en: 'Is fine to go faster' }, { fr: 'Est dangereux et engage votre responsabilité', en: 'Is dangerous and engages your liability' }, { fr: 'Est corrigé automatiquement par Bissabi', en: 'Is auto-corrected by Bissabi' }], answer: 1,
    explainFr: 'Vous êtes responsable des déclarations. Bissabi ne vérifie pas chaque cuisine.',
    explainEn: 'You are responsible for declarations. Bissabi does not inspect every kitchen.' },

  // —— SAFETY (12) ——
  { id: 's1', module: 'safety', fr: 'Pendant le transport, la chaîne du froid / chaud…', en: 'During transport, the cold / hot chain…',
    choices: [{ fr: 'N’a aucune importance sur de courtes distances', en: 'Does not matter for short distances' }, { fr: 'Doit être maintenue (sacs isothermes, délais courts)', en: 'Must be maintained (insulated bags, short delays)' }, { fr: 'Est uniquement le problème du client', en: 'Is only the customer’s problem' }], answer: 1,
    explainFr: 'Le transporteur (vous ou un partenaire) est responsable du maintien pendant la livraison.',
    explainEn: 'The carrier (you or a partner) is responsible for maintaining it during delivery.' },
  { id: 's2', module: 'safety', fr: 'En cas de doute sur un plat (casse chaîne du froid, contamination)…', en: 'If in doubt about a dish (cold-chain break, contamination)…',
    choices: [{ fr: 'Livrer quand même avec une réduction', en: 'Deliver anyway with a discount' }, { fr: 'Ne pas remettre le plat ; documenter et rappeler si déjà parti', en: 'Do not hand over the dish; document and recall if already out' }, { fr: 'Demander à Bissabi de « certifier » le plat', en: 'Ask Bissabi to “certify” the dish' }], answer: 1,
    explainFr: 'Procédure de rappel / non-remise : responsabilité du cook (autocontrôle).',
    explainEn: 'Recall / non-handover procedure: cook’s responsibility (self-checks).' },
  { id: 's3', module: 'safety', fr: 'La durée de conservation indiquée sur la fiche…', en: 'The shelf life shown on the dish page…',
    choices: [{ fr: 'Est décorative', en: 'Is decorative' }, { fr: 'Doit être réaliste et respectée (frigo, délais)', en: 'Must be realistic and respected (fridge, timings)' }, { fr: 'Peut être inventée pour vendre plus', en: 'Can be invented to sell more' }], answer: 1,
    explainFr: 'Conservation et réchauffage sont des champs obligatoires avant publication.',
    explainEn: 'Storage and reheating are mandatory fields before publish.' },
  { id: 's4', module: 'safety', fr: 'Si un partenaire livreur transporte le plat…', en: 'If a partner courier transports the dish…',
    choices: [{ fr: 'Le cook n’a plus aucune responsabilité alimentaire', en: 'The cook has no remaining food responsibility' }, { fr: 'Le cook reste responsable de la préparation ; le livreur, du transport et de la chaîne pendant la course', en: 'The cook stays responsible for preparation; the courier for transport and the chain during the run' }, { fr: 'Bissabi devient fabricant du plat', en: 'Bissabi becomes the food manufacturer' }], answer: 1,
    explainFr: 'Plateforme = mise en relation. Répartition cook / livreur à clarifier contractuellement.',
    explainEn: 'Platform = matching. Cook / courier split must be clear in contracts.' },
  { id: 's5', module: 'safety', fr: 'Les commandes Bissabi sont conçues…', en: 'Bissabi orders are designed…',
    choices: [{ fr: 'En express 15 minutes comme un fast-food', en: 'As 15-minute express like fast food' }, { fr: 'À l’avance (délai minimum, créneaux planifiés)', en: 'In advance (minimum lead time, planned slots)' }, { fr: 'Sans créneau', en: 'Without any slot' }], answer: 1,
    explainFr: 'Modèle « commandé à l’avance » pour laisser le temps de préparer dans de bonnes conditions.',
    explainEn: '“Order ahead” model so cooks can prepare under good conditions.' },
  { id: 's6', module: 'safety', fr: 'La traçabilité des ingrédients (fournisseurs, lots sensibles)…', en: 'Ingredient traceability (suppliers, sensitive lots)…',
    choices: [{ fr: 'Est inutile en cuisine maison', en: 'Is useless in a home kitchen' }, { fr: 'Aide l’autocontrôle et un éventuel rappel', en: 'Helps self-checks and a possible recall' }, { fr: 'Est gérée uniquement par Bissabi', en: 'Is handled only by Bissabi' }], answer: 1,
    explainFr: 'Point checklist hygiène : traçabilité.',
    explainEn: 'Hygiene checklist item: traceability.' },
  { id: 's7', module: 'safety', fr: 'Rénover un plat déjà réchauffé plusieurs fois…', en: 'Reheating the same dish many times…',
    choices: [{ fr: 'Est recommandé', en: 'Is recommended' }, { fr: 'Est à éviter ; réchauffer une fois jusqu’à température cible puis servir', en: 'Should be avoided; reheat once to target temperature then serve' }, { fr: 'N’a aucun effet microbiologique', en: 'Has no microbiological effect' }], answer: 1,
    explainFr: 'Multiples cycles chaud/froid augmentent le risque.',
    explainEn: 'Multiple heat/cold cycles increase risk.' },
  { id: 's8', module: 'safety', fr: 'Un changement important d’activité (déménagement cuisine, arrêt)…', en: 'A major activity change (kitchen move, stopping)…',
    choices: [{ fr: 'N’a pas à être annoncé', en: 'Need not be notified' }, { fr: 'Doit en principe être annoncé à l’autorité cantonale (délais cantonaux, ex. 14 jours VD)', en: 'Should generally be notified to the cantonal authority (cantonal deadlines, e.g. 14 days in VD)' }, { fr: 'Suffit d’un message Instagram', en: 'An Instagram post is enough' }], answer: 1,
    explainFr: 'ODAlOUs art. 20 — changements importants ; pratique VD : 14 jours.',
    explainEn: 'FOpO art. 20 — major changes; Vaud practice: 14 days.' },
  { id: 's9', module: 'safety', fr: 'Bissabi, en tant que plateforme…', en: 'Bissabi, as a platform…',
    choices: [{ fr: 'Est le fabricant de tous les plats', en: 'Is the manufacturer of every dish' }, { fr: 'Met en relation ; le cook reste responsable de ses repas', en: 'Matches parties; the cook remains responsible for their meals' }, { fr: 'Garantit l’absence de tout risque alimentaire', en: 'Guarantees zero food risk' }], answer: 1,
    explainFr: 'Clauses CGU projet : intermédiaire. Une clause ne supprime pas toute obligation légale possible — à faire valider par un avocat CH.',
    explainEn: 'Draft terms: intermediary. A clause cannot remove every possible legal duty — have a CH lawyer review.' },
  { id: 's10', module: 'safety', fr: 'Avant de mettre un plat « actif » en ligne, Bissabi exige notamment…', en: 'Before setting a dish “active” online, Bissabi notably requires…',
    choices: [{ fr: 'Uniquement une belle photo', en: 'Only a nice photo' }, { fr: 'Allergènes complets, composition, conservation, et badge formation valide', en: 'Complete allergens, composition, storage, and a valid training badge' }, { fr: 'Un paiement publicitaire', en: 'An advertising fee' }], answer: 1,
    explainFr: 'Gating produit : publishIssues + qualification.',
    explainEn: 'Product gating: publishIssues + qualification.' },
  { id: 's11', module: 'safety', fr: 'Les denrées à risque (viande hachée, poisson cru, etc.)…', en: 'Higher-risk foods (minced meat, raw fish, etc.)…',
    choices: [{ fr: 'Peuvent être improvisées sans contrôle de température', en: 'Can be improvised without temperature control' }, { fr: 'Demandent une vigilance accrue (froid, délais, hygiène)', en: 'Need heightened care (cold, timings, hygiene)' }, { fr: 'Sont interdites partout en Suisse sans exception', en: 'Are banned everywhere in Switzerland with no exception' }], answer: 1,
    explainFr: 'Vigilance accrue ; validez les pratiques avec l’autorité cantonale si besoin.',
    explainEn: 'Heightened care; confirm practices with the cantonal authority if needed.' },
  { id: 's12', module: 'safety', fr: 'Le renouvellement du badge formation Bissabi est prévu…', en: 'Renewal of the Bissabi training badge is planned…',
    choices: [{ fr: 'Tous les 10 ans', en: 'Every 10 years' }, { fr: 'Chaque année (365 jours)', en: 'Every year (365 days)' }, { fr: 'Jamais', en: 'Never' }], answer: 1,
    explainFr: 'Bonne pratique produit : validité 365 jours, puis repasser les modules.',
    explainEn: 'Product good practice: 365-day validity, then retake the modules.' },
];

export function questionsFor(module: QuizModuleId): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => q.module === module);
}

/** Score 0–100 arrondi. */
export function scoreAttempt(module: QuizModuleId, answers: Record<string, number>): { score: number; correct: number; total: number; passed: boolean } {
  const qs = questionsFor(module);
  let correct = 0;
  for (const q of qs) {
    if (answers[q.id] === q.answer) correct += 1;
  }
  const total = qs.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { score, correct, total, passed: score >= PASS_MARK };
}

export function canRetryToday(attemptsToday: number): boolean {
  return attemptsToday < MAX_RETRIES_PER_DAY;
}
