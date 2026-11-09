import type { Allergen } from '@/lib/model';
import { chPilotMarket } from '@/lib/global/markets';
import { utcFromLocal } from '@/lib/global/time';
import {
  emptyPilot,
  type Kitchen,
  type Level,
  type PilotDish,
  type PilotState,
  type Recipe,
} from './engine';

export const PILOT_AT = '2026-11-10T08:00:00.000Z';

export const absentAllergens = (): Record<Allergen, Level> => ({
  gluten: 'absent', crustaceans: 'absent', eggs: 'absent', fish: 'absent', peanuts: 'absent', soy: 'absent',
  milk: 'absent', nuts: 'absent', celery: 'absent', mustard: 'absent', sesame: 'absent', sulphites: 'absent',
  lupin: 'absent', molluscs: 'absent',
});

export function pilotKitchen(patch: Partial<Kitchen> = {}): Kitchen {
  return {
    id: 'kitchen_amina',
    marketId: 'ch-vd',
    name: 'Cuisine Amina',
    commune: 'Prilly',
    postalCode: '1008',
    responsibleName: null,
    documentsOk: false,
    hygieneOk: false,
    trainingOk: false,
    salesAllowed: false,
    suspended: false,
    kyc: 'missing',
    payoutLast4: null,
    decisions: [],
    ...patch,
  };
}

export function pilotDish(): PilotDish {
  return {
    id: 'dish_mafe',
    kitchenId: 'kitchen_amina',
    title: 'Mafé de la famille Amina',
    priceMinor: 1800,
    published: false,
    salesBlocked: false,
    currentRecipeId: 'recipe_1',
  };
}

export function pilotRecipe(patch: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe_1',
    dishId: 'dish_mafe',
    version: 1,
    ingredients: [{ name: 'Pâte d’arachide', qty: 40, unit: 'g' }, { name: 'Riz', qty: 150, unit: 'g' }],
    allergens: { ...absentAllergens(), peanuts: 'present' },
    crossContamination: ['Des fruits à coque sont préparés dans la même cuisine.'],
    crossDeclared: true,
    createdAt: PILOT_AT,
    ...patch,
  };
}

export function incompleteMarket(): PilotState {
  const startsAt = utcFromLocal('2026-11-12', '18:00', 'Europe/Zurich');
  const endsAt = utcFromLocal('2026-11-12', '19:00', 'Europe/Zurich');
  return {
    ...emptyPilot(chPilotMarket()),
    seq: 10,
    kitchens: [pilotKitchen()],
    dishes: [{ ...pilotDish(), published: true }],
    recipes: [pilotRecipe()],
    slots: [{
      id: 'slot_1', kitchenId: 'kitchen_amina', dishId: 'dish_mafe', startsAt, endsAt, zone: 'Europe/Zurich',
      modes: ['pickup', 'delivery'], capacity: 4, held: 0, sold: 0,
    }],
  };
}

export function readyToOrder(capacity = 4): PilotState {
  const base = incompleteMarket();
  return {
    ...base,
    kitchens: [pilotKitchen({
      responsibleName: 'Amina Diop',
      documentsOk: true,
      hygieneOk: true,
      trainingOk: true,
      salesAllowed: true,
    })],
    slots: base.slots.map((slot) => ({ ...slot, capacity })),
  };
}
