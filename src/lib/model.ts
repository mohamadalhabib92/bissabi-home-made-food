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

export const CUISINES = [
  { key: 'sahel', fr: 'Sahel & Afrique de l’Ouest', en: 'Sahel & West Africa' },
  { key: 'maghreb', fr: 'Maghreb', en: 'North Africa' },
  { key: 'levant', fr: 'Levant', en: 'Levant' },
  { key: 'swiss', fr: 'Suisse & terroir', en: 'Swiss & local' },
  { key: 'asian', fr: 'Asie', en: 'Asia' },
  { key: 'veggie', fr: 'Végétarien', en: 'Vegetarian' },
  { key: 'sweet', fr: 'Desserts', en: 'Desserts' },
] as const;
export type Cuisine = (typeof CUISINES)[number]['key'];

export type Ingredient = { name: string; qty: number; unit: string }; // par portion
export type FulfilMode = 'pickup' | 'delivery';

export type Cook = {
  id: string; name: string; commune: string; npa: string; lat: number; lng: number;
  bio: string; halalKitchen: boolean; languages: string[];
  checklist: Record<string, boolean>; checklistAt?: string;
  delivers: boolean; // le cuisinier livre-t-il lui-même (sinon retrait uniquement)
  avatarColor: string; isMe?: boolean; demo?: boolean; createdAt: string;
};

export type Dish = {
  id: string; cookId: string; title: string; description: string; cuisine: Cuisine;
  price: number; // CHF par portion
  allergens: Allergen[]; allergensConfirmed: boolean; // « aucun des 14 » doit être confirmé explicitement
  halal: boolean; vegetarian: boolean; spicy: boolean;
  ingredients: Ingredient[]; leadHours: number; // délai minimum de commande
  photo?: string; // uri / dataURL ; sinon visuel de marque
  emoji: string; active: boolean; demo?: boolean;
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
