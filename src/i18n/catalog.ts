import type { ResolvedText } from './authored';
import type { LocaleId } from './locales';

/**
 * Textes du parcours pilote, écrits en français et en anglais.
 * sensitivity `legal` ou `allergen` : hors fr/en, le texte anglais est montré avec needsReview.
 * Aucune autre langue n'est stockée.
 */
export type Sensitivity = 'product' | 'allergen' | 'legal';

type Entry = { fr: string; en: string; sensitivity: Sensitivity };

export const pilotCatalog = {
  homeQuestion: { fr: 'Quels plats puis-je commander, pour quand et à quel prix ?', en: 'Which dishes can I order, for when, and at what price?', sensitivity: 'product' },
  homeEmpty: { fr: 'Aucun plat avec un créneau de retrait ouvert pour le moment.', en: 'No dish with an open pickup slot right now.', sensitivity: 'product' },
  homeNote: { fr: 'Prix de la portion. La commission et les frais s’affichent avant le paiement.', en: 'Price per portion. Commission and fees are shown before payment.', sensitivity: 'product' },
  homeCta: { fr: 'Parcours pilote (test)', en: 'Pilot journey (test)', sensitivity: 'product' },
  localeFallbackBanner: {
    fr: 'Cette langue n’est pas encore traduite : l’interface s’affiche en anglais. Les allergènes et les mentions légales restent dans une langue déjà relue (français ou anglais).',
    en: 'This language is not translated yet: the interface is shown in English. Allergen names and legal text stay in a language that has already been reviewed (French or English).',
    sensitivity: 'legal',
  },
  localeUseDevice: { fr: 'Utiliser la langue de l’appareil', en: 'Use the device language', sensitivity: 'product' },
  localeDevice: { fr: 'Langue de l’appareil', en: 'Device language', sensitivity: 'product' },
  localeComplete: { fr: 'Complet', en: 'Complete', sensitivity: 'product' },
  localeFallback: { fr: 'Repli anglais', en: 'English fallback', sensitivity: 'product' },
  localeRtl: { fr: 'Lecture de droite à gauche', en: 'Right-to-left layout', sensitivity: 'product' },
  localeReview: { fr: 'Relecture humaine requise', en: 'Human review required', sensitivity: 'legal' },
  pilotTitle: { fr: 'Parcours pilote — test', en: 'Pilot journey — test', sensitivity: 'product' },
  pilotBanner: {
    fr: 'Environnement de test. Paiement simulé, aucun débit. Ce n’est pas une vente et ce n’est pas une autorisation officielle.',
    en: 'Test environment. Simulated payment, no charge. This is not a sale and not an official authorisation.',
    sensitivity: 'legal',
  },
  pilotInternal: {
    fr: 'Validation interne Bissabi uniquement. À confirmer avec le chimiste cantonal (OFCO, Vaud) avant toute vente réelle.',
    en: 'Bissabi internal check only. Confirm with the cantonal chemist (OFCO, Vaud) before any real sale.',
    sensitivity: 'legal',
  },
  pilotPostal: { fr: 'Code postal', en: 'Postal code', sensitivity: 'product' },
  pilotServed: { fr: 'Adresse dans une zone ouverte.', en: 'Address is inside an open zone.', sensitivity: 'product' },
  pilotNotServed: { fr: 'Cette adresse n’est pas desservie. Voici les zones ouvertes du marché.', en: 'This address is not served. These are the open zones for this market.', sensitivity: 'product' },
  pilotTry: { fr: 'Essayer de commander', en: 'Try to order', sensitivity: 'product' },
  pilotComplete: { fr: 'Compléter le dossier cuisine', en: 'Complete the kitchen file', sensitivity: 'product' },
  pilotActivate: { fr: 'Activer la cuisine (admin, MFA de test)', en: 'Activate the kitchen (admin, test MFA)', sensitivity: 'product' },
  pilotPublish: { fr: 'Publier le plat', en: 'Publish the dish', sensitivity: 'product' },
  pilotAllergens: { fr: 'Allergènes de la recette figée', en: 'Allergens on the frozen recipe', sensitivity: 'allergen' },
  pilotCross: { fr: 'Contamination croisée identifiée', en: 'Identified cross-contamination', sensitivity: 'allergen' },
  pilotAck: { fr: 'J’ai lu les allergènes et la contamination croisée', en: 'I have read the allergens and the cross-contamination note', sensitivity: 'allergen' },
  pilotPickup: { fr: 'Retrait', en: 'Pickup', sensitivity: 'product' },
  pilotDelivery: { fr: 'Livraison', en: 'Delivery', sensitivity: 'product' },
  pilotPay: { fr: 'Payer en mode test', en: 'Pay in test mode', sensitivity: 'product' },
  pilotReplay: { fr: 'Renvoyer le même événement de paiement', en: 'Send the same payment event again', sensitivity: 'product' },
  pilotAssign: { fr: 'Assigner le coursier', en: 'Assign the courier', sensitivity: 'product' },
  pilotOtherCourier: { fr: 'Un autre coursier ouvre cette mission', en: 'Another courier opens this mission', sensitivity: 'product' },
  pilotPickupBtn: { fr: 'Confirmer l’enlèvement', en: 'Confirm pickup', sensitivity: 'product' },
  pilotCode: { fr: 'Code de remise', en: 'Handover code', sensitivity: 'product' },
  pilotHandover: { fr: 'Confirmer la remise', en: 'Confirm handover', sensitivity: 'product' },
  pilotReceipt: { fr: 'Reçu', en: 'Receipt', sensitivity: 'product' },
  pilotSeller: { fr: 'Vendeur', en: 'Seller', sensitivity: 'legal' },
  pilotReset: { fr: 'Recommencer le test', en: 'Restart the test', sensitivity: 'product' },
  pilotProofs: { fr: 'Contrôles automatiques', en: 'Automatic checks', sensitivity: 'product' },
  errKitchen: { fr: 'Dossier cuisine incomplet : le plat ne peut pas être commandé.', en: 'Kitchen file incomplete: the dish cannot be ordered.', sensitivity: 'product' },
  errPortion: { fr: 'Dernière portion déjà retenue.', en: 'The last portion is already held.', sensitivity: 'product' },
  errCourier: { fr: 'Mission refusée : elle n’est pas attribuée à ce coursier.', en: 'Mission refused: it is not assigned to this courier.', sensitivity: 'product' },
  errRecall: { fr: 'Lot rappelé : la vente est bloquée.', en: 'Lot recalled: the sale is blocked.', sensitivity: 'product' },
  errPayment: { fr: 'Paiement refusé.', en: 'Payment refused.', sensitivity: 'product' },
  errZone: { fr: 'Zone non desservie.', en: 'Zone not served.', sensitivity: 'product' },
} as const satisfies Record<string, Entry>;

export type PilotKey = keyof typeof pilotCatalog;

export function pilotText(locale: LocaleId, key: PilotKey): ResolvedText {
  const entry = pilotCatalog[key];
  if (locale === 'fr') return { text: entry.fr, needsReview: false, localeUsed: 'fr' };
  if (locale === 'en') return { text: entry.en, needsReview: false, localeUsed: 'en' };
  const sensitive = entry.sensitivity === 'legal' || entry.sensitivity === 'allergen';
  return { text: entry.en, needsReview: sensitive, localeUsed: 'en' };
}
