/** Modèle de données — Bissabi Home Made Food (marketplace cuisine maison, commandes à l’avance). */
export type Lang = 'fr' | 'en';

/** 14 allergènes à déclaration obligatoire (OIDAl, annexe 6 — alignés UE 1169/2011). */
export const ALLERGENS = [
  { key: 'gluten', fr: 'Gluten', en: 'Gluten' },
  { key: 'crustaceans', fr: 'Crustacés', en: 'Crustaceans' },
  { key: 'eggs', fr: 'Œufs', en: 'Eggs' },
  { key: 'fish', fr: 'Poisson', en: 'Fish' },
  { key: 'peanuts', fr: 'Arachides', en: 'Peanuts' },
  { key: 'soy', fr: 'Soja', en: 'Soy' },
  { key: 'milk', fr: 'Lait (lactose)', en: 'Milk (lactose)' },
  { key: 'nuts', fr: 'Fruits à coque', en: 'Tree nuts' },
  { key: 'celery', fr: 'Céleri', en: 'Celery' },
  { key: 'mustard', fr: 'Moutarde', en: 'Mustard' },
  { key: 'sesame', fr: 'Sésame', en: 'Sesame' },
  { key: 'sulphites', fr: 'Sulfites', en: 'Sulphites' },
  { key: 'lupin', fr: 'Lupin', en: 'Lupin' },
  { key: 'molluscs', fr: 'Mollusques', en: 'Molluscs' },
] as const;
export type Allergen = (typeof ALLERGENS)[number]['key'];
/** Présent, traces possibles, ou absent — les trois doivent être renseignés pour publier. */
export type AllergenLevel = 'present' | 'traces' | 'absent';
export type AnimalOrigin = 'none' | 'meat' | 'fish' | 'both';
/** Badge OFCO uniquement si un admin a posé `ofco_verified`. Jamais pré-coché. */
export type OfcoStatus = 'none' | 'pending' | 'identity_verified' | 'ofco_verified';

export const CUISINES = [
  { key: 'sahel', fr: 'Sahel & Afrique de l’Ouest', en: 'Sahel & West Africa', flag: '🇸🇳' },
  { key: 'maghreb', fr: 'Maghreb', en: 'North Africa', flag: '🇲🇦' },
  { key: 'levant', fr: 'Levant', en: 'Levant', flag: '🇱🇧' },
  { key: 'horn', fr: 'Corne de l’Afrique', en: 'Horn of Africa', flag: '🇪🇹' },
  { key: 'swiss', fr: 'Suisse & terroir', en: 'Swiss & local', flag: '🇨🇭' },
  { key: 'italian', fr: 'Italie & Méditerranée', en: 'Italy & Mediterranean', flag: '🇮🇹' },
  { key: 'iberian', fr: 'Portugal & Amérique latine', en: 'Portugal & Latin America', flag: '🇵🇹' },
  { key: 'balkan', fr: 'Balkans', en: 'Balkans', flag: '🇽🇰' },
  { key: 'turkish', fr: 'Turquie & Anatolie', en: 'Turkey & Anatolia', flag: '🇹🇷' },
  { key: 'indian', fr: 'Inde & Tamil', en: 'India & Tamil', flag: '🇮🇳' },
  { key: 'seasia', fr: 'Asie du Sud-Est', en: 'Southeast Asia', flag: '🇹🇭' },
  { key: 'asian', fr: 'Asie de l’Est', en: 'East Asia', flag: '🇨🇳' },
  { key: 'veggie', fr: 'Végétarien', en: 'Vegetarian', flag: '🌿' },
  { key: 'sweet', fr: 'Desserts', en: 'Desserts', flag: '🍯' },
] as const;
export type Cuisine = (typeof CUISINES)[number]['key'];

export const DISH_CATEGORIES = [
  { key: 'plat', fr: 'Plat', en: 'Main' },
  { key: 'entree', fr: 'Entrée', en: 'Starter' },
  { key: 'accompagnement', fr: 'Accompagnement', en: 'Side' },
  { key: 'dessert', fr: 'Dessert', en: 'Dessert' },
  { key: 'boisson_maison', fr: 'Boisson maison', en: 'Homemade drink' },
] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number]['key'];


export type SpiceLevel = 0 | 1 | 2 | 3;
export type Ingredient = { name: string; qty: number; unit: string }; // par portion
export type FulfilMode = 'pickup' | 'delivery' | 'partner';

export type Cook = {
  id: string; name: string; commune: string; npa: string; lat: number; lng: number;
  bio: string; halalKitchen: boolean; languages: string[];
  checklist: Record<string, boolean>; checklistAt?: string;
  delivers: boolean; // le cuisinier livre-t-il lui-même (sinon retrait uniquement)
  avatarColor: string; isMe?: boolean; demo?: boolean; createdAt: string;
  /** Canton du cuisinier. Les inscriptions nouvelles sont limitées à VD. */
  canton?: string;
  /** Absent sur les fiches existantes : aucun badge n'est affiché. */
  ofcoStatus?: OfcoStatus;
  /** Origine culturelle affichée (fictive en démo). */
  originCountry?: string;
  originFlag?: string;
  story?: string;
  specialties?: string[];
  hygieneBadge?: boolean;
  /** Note optionnelle de certification halal tierce (déclaration cook, non auditée par Bissabi). */
  halalCertificationNote?: string;
  /** Acceptation responsabilité / intermédiaire — horodatée. */
  liabilityAcceptedAt?: string;
  /** Modes de remise proposés par le cook (défaut: pickup + delivery si delivers). */
  deliveryModes?: FulfilMode[];
  /** Partenaire placeholder préféré (id générique). */
  preferredPartnerId?: string;
  /** Badge formation hygiène / allergènes / sécurité (interne Bissabi). */
  qualification?: import('./cookQualification').CookQualification;
  /** Revente de bouteilles Bissabi scellées (mock, tarif pro — pas de commande réelle). */
  offerBissabiDrinks?: boolean;
};

export type Dish = {
  id: string; cookId: string; title: string; description: string; cuisine: Cuisine;
  price: number; // CHF par portion
  allergens: Allergen[]; allergensConfirmed: boolean; // « aucun des 14 » doit être confirmé explicitement
  halal: boolean; vegetarian: boolean; spicy: boolean;
  ingredients: Ingredient[]; leadHours: number; // délai minimum de commande
  photo?: string; // uri / dataURL ; sinon photoKey ou visuel de marque
  emoji: string; active: boolean; demo?: boolean;
  /** Champs additifs (Passe 1). Les plats déjà enregistrés restent lisibles sans eux. */
  allergenStatus?: Partial<Record<Allergen, AllergenLevel>>;
  animalOrigin?: AnimalOrigin;
  provenance?: string;
  isBakery?: boolean;
  productionCountry?: string;
  conservation?: string;
  reheating?: string;
  portionLabel?: string;
  /** Clé d’asset locale (assets/dishes/*.webp). */
  photoKey?: string;
  vegan?: boolean;
  glutenFree?: boolean;
  spiceLevel?: SpiceLevel;
  familySize?: boolean;
  servings?: number;
  galleryKeys?: string[];
  availableToday?: boolean;
  tags?: string[];
  /** Modes de remise pour ce plat (sinon hérite du cook). */
  deliveryModes?: FulfilMode[];
  /** Catégorie de fiche. « boisson_maison » est refusée (hygiène). */
  category?: DishCategory;
};

export type Slot = {
  id: string; cookId: string; date: string; from: string; to: string;
  modes: FulfilMode[]; capacity: number; // portions max sur le créneau
  dishIds: string[]; // vide = tous les plats actifs
  demo?: boolean;
};

export type OrderStatus = 'awaiting_payment' | 'payment_failed' | 'requested' | 'accepted' | 'refused' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderLine = { dishId: string; title: string; qty: number; unitPrice: number };
export type Order = {
  id: string; number: string; side: 'buyer' | 'cook'; // commande passée (acheteur) ou reçue (ma cuisine)
  cookId: string; buyerName: string; lines: OrderLine[];
  slotId: string; slotDate: string; slotFrom: string; slotTo: string;
  mode: FulfilMode; address?: string; note?: string;
  subtotal: number; commission: number; deliveryFee: number; total: number;
  status: OrderStatus; timeline: { status: OrderStatus; at: string; note?: string }[];
  payment: { method: 'stripe' | 'demo'; ref?: string; error?: string };
  refuseReason?: string; createdAt: string; demo?: boolean;
  /** Ajouts Bissabi (démo, prix YOUR_* — non inclus dans le total chiffré). */
  bissabiLines?: { productId: string; title: string; qty: number; priceLabel: string }[];
  /** Job livraison partenaire (mock). */
  deliveryJobId?: string;
  deliveryPartnerId?: string;
  deliveryTracking?: import('./deliveryPartners').DeliveryTrackingState;
};

export type Review = { id: string; orderId: string; cookId: string; dishId?: string; rating: number; text: string; author: string; status: 'pending' | 'published' | 'rejected'; at: string; demo?: boolean };
export type Report = { id: string; target: 'dish' | 'cook' | 'order' | 'other'; targetId?: string; reason: string; text: string; at: string };

export const HYGIENE_CHECKLIST = [
  { key: 'hands', fr: 'Lavage des mains systématique, tenue propre, cheveux attachés', en: 'Hand washing, clean clothing, hair tied back' },
  { key: 'cold', fr: 'Chaîne du froid respectée (frigo ≤ 5 °C, vérifié)', en: 'Cold chain respected (fridge ≤ 5 °C, checked)' },
  { key: 'cooking', fr: 'Cuisson et réchauffage à cœur (≥ 70 °C)', en: 'Thorough cooking and reheating (≥ 70 °C core)' },
  { key: 'separation', fr: 'Séparation cru / cuit, planches et ustensiles dédiés', en: 'Raw / cooked separation, dedicated boards and tools' },
  { key: 'allergens', fr: 'Allergènes déclarés pour chaque plat, contaminations croisées signalées', en: 'Allergens declared for every dish, cross-contamination flagged' },
  { key: 'packaging', fr: 'Emballages propres, fermés et étiquetés (plat, date, allergènes)', en: 'Clean, sealed, labelled packaging (dish, date, allergens)' },
  { key: 'traceability', fr: 'Tickets d’achat des ingrédients conservés 30 jours', en: 'Ingredient receipts kept for 30 days' },
  { key: 'health', fr: 'Je ne cuisine pas en cas de maladie contagieuse', en: 'I do not cook when contagiously ill' },
] as const;

export const ORDER_STEPS: OrderStatus[] = ['requested', 'accepted', 'preparing', 'ready', 'completed'];

export const CANTONS = [
  { key: 'VD', fr: 'Vaud', en: 'Vaud' },
  { key: 'GE', fr: 'Genève', en: 'Geneva' },
  { key: 'FR', fr: 'Fribourg', en: 'Fribourg' },
  { key: 'NE', fr: 'Neuchâtel', en: 'Neuchâtel' },
  { key: 'VS', fr: 'Valais', en: 'Valais' },
  { key: 'BE', fr: 'Berne', en: 'Bern' },
  { key: 'ZH', fr: 'Zurich', en: 'Zurich' },
  { key: 'BS', fr: 'Bâle-Ville', en: 'Basel-Stadt' },
  { key: 'TI', fr: 'Tessin', en: 'Ticino' },
  { key: 'SG', fr: 'Saint-Gall', en: 'St. Gallen' },
] as const;
