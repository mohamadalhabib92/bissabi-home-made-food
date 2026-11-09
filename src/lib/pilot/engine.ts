import { ALLERGENS, type Allergen } from '../model';
import { addMoney, money, percentMinor, type Money } from '../global/money';
import { pilotGaps, zoneForPostal, type Market } from '../global/markets';
import { partnerById } from './delivery';
import { providerById, simulatedSignature, type ProviderEvent } from './payment';

export type Level = 'present' | 'traces' | 'absent';
export type Mode = 'pickup' | 'delivery';

export type Actor = {
  id: string;
  role: 'buyer' | 'kitchen' | 'courier' | 'admin';
  kitchenId?: string;
  mfa?: boolean;
  marketIds?: string[];
};

export type Kitchen = {
  id: string;
  marketId: string;
  name: string;
  commune: string;
  postalCode: string;
  responsibleName: string | null;
  documentsOk: boolean;
  hygieneOk: boolean;
  trainingOk: boolean;
  salesAllowed: boolean;
  suspended: boolean;
  payoutLast4: string | null;
  decisions: { at: string; actorId: string; action: string; note: string }[];
};

export type Recipe = {
  id: string;
  dishId: string;
  version: number;
  ingredients: { name: string; qty: number; unit: string }[];
  allergens: Partial<Record<Allergen, Level>>;
  crossContamination: string[];
  crossDeclared: boolean;
  createdAt: string;
};

export type PilotDish = {
  id: string;
  kitchenId: string;
  title: string;
  priceMinor: number;
  published: boolean;
  salesBlocked: boolean;
  currentRecipeId: string | null;
};

export type PilotSlot = {
  id: string;
  kitchenId: string;
  dishId: string;
  startsAt: string;
  endsAt: string;
  zone: string;
  modes: Mode[];
  capacity: number;
  held: number;
  sold: number;
};

export type Hold = {
  id: string;
  slotId: string;
  orderId: string;
  buyerId: string;
  qty: number;
  expiresAt: string;
  status: 'held' | 'converted' | 'released';
};

export type PilotOrder = {
  id: string;
  number: string;
  marketId: string;
  buyerId: string;
  kitchenId: string;
  dishId: string;
  recipeVersionId: string;
  qty: number;
  slotId: string;
  mode: Mode;
  areaLabel: string;
  currency: string;
  subtotalMinor: number;
  commissionMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  prepStatus: 'pending' | 'accepted' | 'preparing' | 'ready' | 'handed';
  deliveryStatus: 'none' | 'assigned' | 'picked_up' | 'handed_over' | 'delayed' | 'damaged' | 'unreachable';
  handoverCode: string | null;
  flags: string[];
  createdAt: string;
};

export type Mission = {
  id: string;
  marketId: string;
  orderId: string;
  courierId: string;
  status: 'assigned' | 'picked_up' | 'handed_over' | 'delayed' | 'damaged' | 'unreachable';
  preciseAddress: string;
};

export type LedgerEntry = {
  id: string;
  eventId: string;
  orderId: string;
  currency: string;
  collectedMinor: number;
  commissionMinor: number;
  feesMinor: number;
  owedKitchenMinor: number;
};

export type PilotState = {
  seq: number;
  market: Market;
  kitchens: Kitchen[];
  dishes: PilotDish[];
  recipes: Recipe[];
  slots: PilotSlot[];
  holds: Hold[];
  orders: PilotOrder[];
  events: { id: string; orderId: string; kind: string; applied: boolean }[];
  ledger: LedgerEntry[];
  missions: Mission[];
  lots: { id: string; kitchenId: string; ingredient: string; code: string }[];
  batches: { id: string; dishId: string; lotIds: string[]; blocked: boolean }[];
  batchOrders: { batchId: string; orderId: string }[];
  audit: { at: string; actorId: string; action: string; detail: string }[];
};

export type Ok<T> = { ok: true; state: PilotState; value: T };
export type Err = { ok: false; error: string; state: PilotState; nextSlots?: { id: string; startsAt: string }[] };
export type Result<T> = Ok<T> | Err;

const iso = (at: string) => new Date(at).toISOString();
const plusMinutes = (at: string, minutes: number) => new Date(Date.parse(at) + minutes * 60_000).toISOString();

function fail(state: PilotState, error: string, nextSlots?: Err['nextSlots']): Err {
  return { ok: false, error, state, nextSlots };
}

function nextId(state: PilotState, prefix: string): { state: PilotState; id: string } {
  const seq = state.seq + 1;
  return { state: { ...state, seq }, id: `${prefix}_${seq}` };
}

function audit(state: PilotState, at: string, actorId: string, action: string, detail: string): PilotState {
  return { ...state, audit: [...state.audit, { at, actorId, action, detail }] };
}

export function kitchenGaps(kitchen: Kitchen): string[] {
  const gaps: string[] = [];
  if (!kitchen.responsibleName?.trim()) gaps.push('responsible');
  if (!kitchen.documentsOk) gaps.push('documents');
  if (!kitchen.hygieneOk) gaps.push('hygiene');
  if (!kitchen.trainingOk) gaps.push('training');
  return gaps;
}

export function kitchenOrderable(kitchen: Kitchen): boolean {
  return kitchenGaps(kitchen).length === 0 && kitchen.salesAllowed && !kitchen.suspended;
}

function recipeComplete(recipe: Recipe, market: Market): boolean {
  if (!recipe.crossDeclared) return false;
  if (!recipe.ingredients.some((item) => item.name.trim() && item.qty > 0)) return false;
  return market.compliance.allergenKeys.every((key) => {
    const level = recipe.allergens[key as Allergen];
    return level === 'present' || level === 'traces' || level === 'absent';
  });
}

export function quotePortion(market: Market, priceMinor: number, qty: number, mode: Mode, postal: string): {
  subtotalMinor: number;
  commissionMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
} {
  const zone = zoneForPostal(market, postal);
  const subtotalMinor = priceMinor * qty;
  const commissionMinor = percentMinor(subtotalMinor, market.commissionRateBps, market.cashIncrementMinor);
  const deliveryFeeMinor = mode === 'delivery' ? (zone?.deliveryFeeMinor ?? 0) : 0;
  return {
    subtotalMinor,
    commissionMinor,
    deliveryFeeMinor,
    totalMinor: subtotalMinor + commissionMinor + deliveryFeeMinor,
    currency: market.currency,
  };
}

export function emptyPilot(market: Market): PilotState {
  return {
    seq: 0, market, kitchens: [], dishes: [], recipes: [], slots: [], holds: [], orders: [],
    events: [], ledger: [], missions: [], lots: [], batches: [], batchOrders: [], audit: [],
  };
}

function ownsKitchen(actor: Actor, kitchen: Kitchen): boolean {
  return (actor.role === 'kitchen' && actor.kitchenId === kitchen.id) || (actor.role === 'admin' && !!actor.mfa);
}

export function saveKitchenFile(
  state: PilotState,
  actor: Actor,
  kitchenId: string,
  patch: { responsibleName: string; documentsOk: boolean; hygieneOk: boolean; trainingOk: boolean },
  at: string,
): Result<Kitchen> {
  const kitchen = state.kitchens.find((item) => item.id === kitchenId);
  if (!kitchen || !ownsKitchen(actor, kitchen)) return fail(state, 'permission_denied');
  const next: Kitchen = { ...kitchen, ...patch, salesAllowed: false };
  const updated = { ...state, kitchens: state.kitchens.map((item) => (item.id === kitchenId ? next : item)) };
  return { ok: true, state: audit(updated, at, actor.id, 'kitchen_file', kitchenId), value: next };
}

export function activateKitchen(state: PilotState, actor: Actor, kitchenId: string, at: string): Result<Kitchen> {
  if (actor.role !== 'admin' || !actor.mfa) return fail(state, 'mfa_required');
  if (pilotGaps(state.market).length) return fail(state, 'market_not_ready');
  if (!actor.marketIds?.includes(state.market.id)) return fail(state, 'market_scope_refused');
  const kitchen = state.kitchens.find((item) => item.id === kitchenId);
  if (!kitchen) return fail(state, 'unknown_kitchen');
  if (kitchen.suspended) return fail(state, 'kitchen_suspended');
  if (kitchenGaps(kitchen).length) return fail(state, 'kitchen_file_incomplete');
  const next: Kitchen = {
    ...kitchen,
    salesAllowed: true,
    decisions: [...kitchen.decisions, { at, actorId: actor.id, action: 'activate', note: 'validation interne, pas une autorisation officielle' }],
  };
  const updated = { ...state, kitchens: state.kitchens.map((item) => (item.id === kitchenId ? next : item)) };
  return { ok: true, state: audit(updated, at, actor.id, 'activate_kitchen', kitchenId), value: next };
}

export function suspendKitchen(state: PilotState, actor: Actor, kitchenId: string, note: string, at: string): Result<Kitchen> {
  if (actor.role !== 'admin' || !actor.mfa) return fail(state, 'mfa_required');
  if (!actor.marketIds?.includes(state.market.id)) return fail(state, 'market_scope_refused');
  const kitchen = state.kitchens.find((item) => item.id === kitchenId);
  if (!kitchen) return fail(state, 'unknown_kitchen');
  const next: Kitchen = {
    ...kitchen,
    suspended: true,
    salesAllowed: false,
    decisions: [...kitchen.decisions, { at, actorId: actor.id, action: 'suspend', note }],
  };
  const updated = { ...state, kitchens: state.kitchens.map((item) => (item.id === kitchenId ? next : item)) };
  return { ok: true, state: audit(updated, at, actor.id, 'suspend_kitchen', note), value: next };
}

export function recordControl(
  state: PilotState,
  actor: Actor,
  kitchenId: string,
  kind: 'cold' | 'reheat',
  valueC: number,
  at: string,
): Result<{ blocked: boolean }> {
  const kitchen = state.kitchens.find((item) => item.id === kitchenId);
  if (!kitchen || !ownsKitchen(actor, kitchen)) return fail(state, 'permission_denied');
  const critical = kind === 'cold' ? valueC > state.market.compliance.coldMaxC : valueC < state.market.compliance.reheatMinC;
  if (!critical) return { ok: true, state: audit(state, at, actor.id, 'control_ok', kind), value: { blocked: false } };
  const suspended = suspendKitchen({ ...state, kitchens: state.kitchens }, { id: 'system', role: 'admin', mfa: true, marketIds: [state.market.id] }, kitchenId, `écart critique ${kind} ${valueC}`, at);
  if (!suspended.ok) return suspended;
  return { ok: true, state: suspended.state, value: { blocked: true } };
}

export function saveRecipe(
  state: PilotState,
  actor: Actor,
  dishId: string,
  draft: Omit<Recipe, 'id' | 'dishId' | 'version' | 'createdAt'>,
  at: string,
): Result<Recipe> {
  const dish = state.dishes.find((item) => item.id === dishId);
  if (!dish) return fail(state, 'unknown_dish');
  const kitchen = state.kitchens.find((item) => item.id === dish.kitchenId);
  if (!kitchen || !ownsKitchen(actor, kitchen)) return fail(state, 'permission_denied');
  const previous = state.recipes.find((item) => item.id === dish.currentRecipeId);
  const version = (previous?.version ?? 0) + 1;
  const minted = nextId(state, 'recipe');
  const recipe: Recipe = { ...draft, id: minted.id, dishId, version, createdAt: at };
  let orders = minted.state.orders;
  if (previous && state.orders.some((order) => order.dishId === dishId)) {
    orders = orders.map((order) => (
      order.dishId === dishId && order.recipeVersionId !== recipe.id && !order.flags.includes('recipe_changed')
        ? { ...order, flags: [...order.flags, 'recipe_changed'] }
        : order
    ));
  }
  const dishes = minted.state.dishes.map((item) => (item.id === dishId ? { ...item, currentRecipeId: recipe.id, published: false } : item));
  const updated: PilotState = { ...minted.state, recipes: [...minted.state.recipes, recipe], dishes, orders };
  return { ok: true, state: audit(updated, at, actor.id, 'recipe_version', recipe.id), value: recipe };
}

export function publishDish(state: PilotState, actor: Actor, dishId: string, at: string): Result<PilotDish> {
  const dish = state.dishes.find((item) => item.id === dishId);
  if (!dish) return fail(state, 'unknown_dish');
  const kitchen = state.kitchens.find((item) => item.id === dish.kitchenId);
  if (!kitchen || !ownsKitchen(actor, kitchen)) return fail(state, 'permission_denied');
  if (!kitchenOrderable(kitchen)) return fail(state, kitchen.suspended ? 'kitchen_suspended' : kitchenGaps(kitchen).length ? 'kitchen_file_incomplete' : 'kitchen_not_activated');
  const recipe = state.recipes.find((item) => item.id === dish.currentRecipeId);
  if (!recipe || !recipeComplete(recipe, state.market)) return fail(state, 'recipe_incomplete');
  const next = { ...dish, published: true };
  const updated = { ...state, dishes: state.dishes.map((item) => (item.id === dishId ? next : item)) };
  return { ok: true, state: audit(updated, at, actor.id, 'publish_dish', dishId), value: next };
}

function laterSlots(state: PilotState, dishId: string, at: string) {
  return state.slots
    .filter((slot) => slot.dishId === dishId && slot.startsAt > at && slot.capacity - slot.held - slot.sold > 0)
    .map((slot) => ({ id: slot.id, startsAt: slot.startsAt }));
}

export function orderableDishes(state: PilotState, postal: string, at: string): PilotDish[] {
  if (pilotGaps(state.market).length || !zoneForPostal(state.market, postal)) return [];
  return state.dishes.filter((dish) => {
    if (!dish.published || dish.salesBlocked) return false;
    const kitchen = state.kitchens.find((item) => item.id === dish.kitchenId);
    if (!kitchen || !kitchenOrderable(kitchen)) return false;
    const recipe = state.recipes.find((item) => item.id === dish.currentRecipeId);
    if (!recipe || !recipeComplete(recipe, state.market)) return false;
    const lead = state.market.minLeadHours * 3_600_000;
    return state.slots.some((slot) => slot.dishId === dish.id && Date.parse(slot.startsAt) - Date.parse(at) >= lead && slot.capacity - slot.held - slot.sold > 0);
  });
}

export function reservePortion(
  state: PilotState,
  actor: Actor,
  input: { dishId: string; slotId: string; qty: number; mode: Mode; postal: string; at: string },
): Result<PilotOrder> {
  if (actor.role !== 'buyer') return fail(state, 'permission_denied');
  if (!new RegExp(state.market.address.postalPattern).test(input.postal.trim()) || !zoneForPostal(state.market, input.postal)) {
    return fail(state, 'address_not_served');
  }
  const dish = state.dishes.find((item) => item.id === input.dishId);
  if (!dish) return fail(state, 'unknown_dish');
  const kitchen = state.kitchens.find((item) => item.id === dish.kitchenId);
  if (!kitchen) return fail(state, 'unknown_kitchen');
  if (kitchen.suspended) return fail(state, 'kitchen_suspended');
  if (kitchenGaps(kitchen).length) return fail(state, 'kitchen_file_incomplete');
  if (!kitchen.salesAllowed) return fail(state, 'kitchen_not_activated');
  if (dish.salesBlocked) return fail(state, 'sales_blocked');
  if (!dish.published) return fail(state, 'dish_not_published');
  const recipe = state.recipes.find((item) => item.id === dish.currentRecipeId);
  if (!recipe || !recipeComplete(recipe, state.market)) return fail(state, 'recipe_incomplete');
  const slot = state.slots.find((item) => item.id === input.slotId && item.dishId === dish.id);
  if (!slot || !slot.modes.includes(input.mode)) return fail(state, 'no_slot', laterSlots(state, dish.id, input.at));
  const lead = state.market.minLeadHours * 3_600_000;
  if (Date.parse(slot.startsAt) - Date.parse(input.at) < lead) return fail(state, 'slot_too_soon', laterSlots(state, dish.id, input.at));
  if (slot.capacity - slot.held - slot.sold < input.qty) return fail(state, 'portion_taken', laterSlots(state, dish.id, input.at));
  const price = quotePortion(state.market, dish.priceMinor, input.qty, input.mode, input.postal);
  const minted = nextId(state, 'ord');
  const code = String(1000 + (minted.state.seq % 9000)).padStart(4, '0');
  const zone = zoneForPostal(state.market, input.postal)!;
  const order: PilotOrder = {
    id: minted.id,
    number: `HMF-${minted.state.seq}`,
    marketId: state.market.id,
    buyerId: actor.id,
    kitchenId: kitchen.id,
    dishId: dish.id,
    recipeVersionId: recipe.id,
    qty: input.qty,
    slotId: slot.id,
    mode: input.mode,
    areaLabel: `${zone.city} ${input.postal}`,
    currency: price.currency,
    subtotalMinor: price.subtotalMinor,
    commissionMinor: price.commissionMinor,
    deliveryFeeMinor: price.deliveryFeeMinor,
    totalMinor: price.totalMinor,
    paymentStatus: 'unpaid',
    prepStatus: 'pending',
    deliveryStatus: 'none',
    handoverCode: code,
    flags: [],
    createdAt: input.at,
  };
  const holdId = nextId(minted.state, 'hold');
  const hold: Hold = {
    id: holdId.id,
    slotId: slot.id,
    orderId: order.id,
    buyerId: actor.id,
    qty: input.qty,
    expiresAt: plusMinutes(input.at, state.market.holdMinutes),
    status: 'held',
  };
  const slots = holdId.state.slots.map((item) => (item.id === slot.id ? { ...item, held: item.held + input.qty } : item));
  const updated: PilotState = { ...holdId.state, slots, holds: [...holdId.state.holds, hold], orders: [order, ...holdId.state.orders] };
  return { ok: true, state: audit(updated, input.at, actor.id, 'reserve', order.id), value: order };
}

function releaseHold(state: PilotState, orderId: string): PilotState {
  const hold = state.holds.find((item) => item.orderId === orderId && item.status === 'held');
  if (!hold) return state;
  return {
    ...state,
    holds: state.holds.map((item) => (item.id === hold.id ? { ...item, status: 'released' } : item)),
    slots: state.slots.map((slot) => (slot.id === hold.slotId ? { ...slot, held: slot.held - hold.qty } : slot)),
  };
}

export function applyPaymentEvent(state: PilotState, event: ProviderEvent, signature: string, at: string): Result<{ applied: boolean; duplicate: boolean }> {
  const allowed = state.market.paymentProviders.some((item) => item.id === 'simulated' && (item.status === 'simulated' || item.status === 'live'));
  if (!allowed) return fail(state, 'provider_not_in_market');
  const provider = providerById('simulated');
  if (!provider || !provider.verify(event, signature)) return fail(state, 'forged_payment');
  if (state.events.some((item) => item.id === event.id)) {
    return { ok: true, state, value: { applied: false, duplicate: true } };
  }
  const order = state.orders.find((item) => item.id === event.orderId);
  if (!order) return fail(state, 'unknown_order');
  if (event.currency !== order.currency || event.amountMinor !== order.totalMinor) return fail(state, 'amount_mismatch');
  const noted = { ...state, events: [...state.events, { id: event.id, orderId: event.orderId, kind: event.kind, applied: false }] };
  if (event.kind === 'refunded' && order.paymentStatus !== 'paid') {
    return fail(audit(noted, at, 'payment', 'out_of_order', event.id), 'out_of_order');
  }
  if (event.kind === 'payment_succeeded' && order.paymentStatus === 'paid') {
    return { ok: true, state: audit(noted, at, 'payment', 'reconciliation_gap', event.id), value: { applied: false, duplicate: false } };
  }
  const hold = state.holds.find((item) => item.orderId === order.id && item.status === 'held');
  if (event.kind === 'payment_succeeded') {
    if (!hold) return fail(audit(noted, at, 'payment', 'late_payment', event.id), 'hold_missing');
    if (iso(at) > hold.expiresAt) {
      const released = releaseHold(noted, order.id);
      const orders = released.orders.map((item) => (item.id === order.id ? { ...item, paymentStatus: 'failed' as const } : item));
      return fail(audit({ ...released, orders }, at, 'payment', 'hold_expired', event.id), 'hold_expired');
    }
    const ledgerId = nextId(noted, 'led');
    const entry: LedgerEntry = {
      id: ledgerId.id,
      eventId: event.id,
      orderId: order.id,
      currency: order.currency,
      collectedMinor: order.totalMinor,
      commissionMinor: order.commissionMinor,
      feesMinor: order.deliveryFeeMinor,
      owedKitchenMinor: order.subtotalMinor,
    };
    const updated: PilotState = {
      ...ledgerId.state,
      events: ledgerId.state.events.map((item) => (item.id === event.id ? { ...item, applied: true } : item)),
      orders: ledgerId.state.orders.map((item) => (item.id === order.id ? { ...item, paymentStatus: 'paid', prepStatus: 'accepted' } : item)),
      holds: ledgerId.state.holds.map((item) => (item.id === hold.id ? { ...item, status: 'converted' } : item)),
      slots: ledgerId.state.slots.map((slot) => (slot.id === hold.slotId ? { ...slot, held: slot.held - hold.qty, sold: slot.sold + hold.qty } : slot)),
      ledger: [...ledgerId.state.ledger, entry],
    };
    return { ok: true, state: audit(updated, at, 'payment', 'captured', event.id), value: { applied: true, duplicate: false } };
  }
  if (event.kind === 'payment_failed') {
    const released = releaseHold(noted, order.id);
    const orders = released.orders.map((item) => (item.id === order.id ? { ...item, paymentStatus: 'failed' as const } : item));
    const events = released.events.map((item) => (item.id === event.id ? { ...item, applied: true } : item));
    return { ok: true, state: audit({ ...released, orders, events }, at, 'payment', 'declined', event.id), value: { applied: true, duplicate: false } };
  }
  const ledgerId = nextId(noted, 'led');
  const refund: LedgerEntry = {
    id: ledgerId.id,
    eventId: event.id,
    orderId: order.id,
    currency: order.currency,
    collectedMinor: -order.totalMinor,
    commissionMinor: -order.commissionMinor,
    feesMinor: -order.deliveryFeeMinor,
    owedKitchenMinor: -order.subtotalMinor,
  };
  const updated: PilotState = {
    ...ledgerId.state,
    events: ledgerId.state.events.map((item) => (item.id === event.id ? { ...item, applied: true } : item)),
    orders: ledgerId.state.orders.map((item) => (item.id === order.id ? { ...item, paymentStatus: 'refunded', flags: [...item.flags, 'refunded'] } : item)),
    ledger: [...ledgerId.state.ledger, refund],
  };
  return { ok: true, state: audit(updated, at, 'payment', 'refund', event.id), value: { applied: true, duplicate: false } };
}

export function paySimulated(state: PilotState, orderId: string, at: string): Result<{ applied: boolean; duplicate: boolean; event: ProviderEvent }> {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return fail(state, 'unknown_order');
  const event: ProviderEvent = { id: `evt_${orderId}`, orderId, kind: 'payment_succeeded', amountMinor: order.totalMinor, currency: order.currency };
  const paid = applyPaymentEvent(state, event, simulatedSignature(event.id), at);
  if (!paid.ok) return paid;
  return { ok: true, state: paid.state, value: { ...paid.value, event } };
}

export function changePayoutIban(state: PilotState, actor: Actor, kitchenId: string, iban: string, stepUp: boolean, at: string): Result<{ last4: string }> {
  if (!stepUp) return fail(state, 'step_up_required');
  const kitchen = state.kitchens.find((item) => item.id === kitchenId);
  if (!kitchen || !ownsKitchen(actor, kitchen)) return fail(state, 'permission_denied');
  const digits = iban.replace(/\s/g, '');
  const last4 = digits.slice(-4);
  const next = { ...kitchen, payoutLast4: last4 };
  const updated = { ...state, kitchens: state.kitchens.map((item) => (item.id === kitchenId ? next : item)) };
  return { ok: true, state: audit(updated, at, actor.id, 'payout_iban_changed', last4), value: { last4 } };
}

export function assignCourier(
  state: PilotState,
  actor: Actor,
  orderId: string,
  courierId: string,
  preciseAddress: string,
  at: string,
  partnerId: 'manual' | 'future_partner' = 'manual',
): Result<Mission> {
  if (actor.role !== 'admin' || !actor.mfa || !actor.marketIds?.includes(state.market.id)) return fail(state, 'market_scope_refused');
  const partner = state.market.deliveryPartners.find((item) => item.id === partnerId);
  if (!partner) return fail(state, 'partner_not_in_market');
  const decision = partnerById(partnerId).assign({
    orderId,
    marketId: state.market.id,
    pickupArea: state.kitchens.find((item) => item.id === state.orders.find((order) => order.id === orderId)?.kitchenId)?.commune ?? '',
    dropArea: state.orders.find((order) => order.id === orderId)?.areaLabel ?? '',
  });
  if (!decision.accepted) return fail(state, decision.reason ?? 'partner_not_connected');
  const order = state.orders.find((item) => item.id === orderId && item.paymentStatus === 'paid' && item.mode === 'delivery');
  if (!order) return fail(state, 'not_assignable');
  const minted = nextId(state, 'mission');
  const mission: Mission = { id: minted.id, marketId: state.market.id, orderId, courierId, status: 'assigned', preciseAddress };
  const orders = minted.state.orders.map((item) => (item.id === orderId ? { ...item, deliveryStatus: 'assigned' as const } : item));
  const updated: PilotState = { ...minted.state, missions: [...minted.state.missions, mission], orders };
  return { ok: true, state: audit(updated, at, actor.id, 'assign_courier', mission.id), value: mission };
}

export function openMission(state: PilotState, actor: Actor, missionId: string): Result<{ missionId: string; orderId: string; preciseAddress: string }> {
  const mission = state.missions.find((item) => item.id === missionId);
  if (!mission) return fail(state, 'unknown_mission');
  const allowed = (actor.role === 'courier' && actor.id === mission.courierId)
    || (actor.role === 'admin' && !!actor.mfa && !!actor.marketIds?.includes(mission.marketId));
  if (!allowed) return fail(state, actor.role === 'courier' ? 'courier_refused' : 'permission_denied');
  return { ok: true, state, value: { missionId: mission.id, orderId: mission.orderId, preciseAddress: mission.preciseAddress } };
}

export function readOrder(state: PilotState, actor: Actor, orderId: string): Result<Omit<PilotOrder, 'handoverCode'> & { handoverCode: string | null }> {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return fail(state, 'unknown_order');
  const kitchenOk = actor.role === 'kitchen' && actor.kitchenId === order.kitchenId;
  const buyerOk = actor.role === 'buyer' && actor.id === order.buyerId;
  const adminOk = actor.role === 'admin' && !!actor.mfa && !!actor.marketIds?.includes(order.marketId);
  if (!kitchenOk && !buyerOk && !adminOk) {
    return fail(state, actor.role === 'admin' ? 'market_scope_refused' : 'permission_denied');
  }
  const hiddenCode = actor.role === 'kitchen' || actor.role === 'buyer' ? order.handoverCode : null;
  return { ok: true, state, value: { ...order, handoverCode: actor.role === 'courier' ? null : hiddenCode } };
}

export function confirmPickup(state: PilotState, actor: Actor, missionId: string, at: string): Result<Mission> {
  const opened = openMission(state, actor, missionId);
  if (!opened.ok) return opened;
  if (actor.role !== 'courier') return fail(state, 'permission_denied');
  const mission = state.missions.find((item) => item.id === missionId)!;
  if (mission.status !== 'assigned') return fail(state, 'bad_mission_state');
  const next = { ...mission, status: 'picked_up' as const };
  const updated: PilotState = {
    ...state,
    missions: state.missions.map((item) => (item.id === missionId ? next : item)),
    orders: state.orders.map((order) => (order.id === mission.orderId ? { ...order, deliveryStatus: 'picked_up', prepStatus: 'ready' } : order)),
  };
  return { ok: true, state: audit(updated, at, actor.id, 'pickup', missionId), value: next };
}

export function confirmHandover(state: PilotState, actor: Actor, orderId: string, code: string, at: string): Result<PilotOrder> {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order || order.paymentStatus !== 'paid') return fail(state, 'not_payable');
  if (order.mode === 'delivery') {
    const mission = state.missions.find((item) => item.orderId === orderId && item.status === 'picked_up');
    if (!mission || actor.role !== 'courier' || actor.id !== mission.courierId) return fail(state, 'courier_refused');
  } else if (actor.role !== 'kitchen' || actor.kitchenId !== order.kitchenId) {
    return fail(state, 'permission_denied');
  }
  if (code.trim() !== order.handoverCode) return fail(state, 'bad_code');
  const next: PilotOrder = { ...order, prepStatus: 'handed', deliveryStatus: order.mode === 'delivery' ? 'handed_over' : 'none' };
  const updated: PilotState = {
    ...state,
    orders: state.orders.map((item) => (item.id === orderId ? next : item)),
    missions: state.missions.map((mission) => (mission.orderId === orderId ? { ...mission, status: 'handed_over' } : mission)),
  };
  return { ok: true, state: audit(updated, at, actor.id, 'handover', orderId), value: next };
}

export function reportMissionIssue(
  state: PilotState,
  actor: Actor,
  missionId: string,
  kind: 'delayed' | 'damaged' | 'unreachable',
  at: string,
): Result<Mission> {
  const opened = openMission(state, actor, missionId);
  if (!opened.ok) return opened;
  const mission = state.missions.find((item) => item.id === missionId)!;
  const next = { ...mission, status: kind };
  const updated: PilotState = {
    ...state,
    missions: state.missions.map((item) => (item.id === missionId ? next : item)),
    orders: state.orders.map((order) => (order.id === mission.orderId ? { ...order, deliveryStatus: kind, flags: [...order.flags, kind] } : order)),
  };
  return { ok: true, state: audit(updated, at, actor.id, kind, missionId), value: next };
}

export function linkBatch(state: PilotState, actor: Actor, input: { dishId: string; lotCode: string; ingredient: string; orderId: string; at: string }): Result<{ batchId: string }> {
  const dish = state.dishes.find((item) => item.id === input.dishId);
  const kitchen = state.kitchens.find((item) => item.id === dish?.kitchenId);
  if (!dish || !kitchen || !ownsKitchen(actor, kitchen)) return fail(state, 'permission_denied');
  const lotMint = nextId(state, 'lot');
  const batchMint = nextId(lotMint.state, 'batch');
  const updated: PilotState = {
    ...batchMint.state,
    lots: [...batchMint.state.lots, { id: lotMint.id, kitchenId: kitchen.id, ingredient: input.ingredient, code: input.lotCode }],
    batches: [...batchMint.state.batches, { id: batchMint.id, dishId: dish.id, lotIds: [lotMint.id], blocked: false }],
    batchOrders: [...batchMint.state.batchOrders, { batchId: batchMint.id, orderId: input.orderId }],
  };
  return { ok: true, state: audit(updated, input.at, actor.id, 'batch', batchMint.id), value: { batchId: batchMint.id } };
}

export function recallLot(state: PilotState, actor: Actor, lotId: string, at: string): Result<{ affectedOrderIds: string[]; blockedDishIds: string[] }> {
  if (actor.role !== 'admin' || !actor.mfa || !actor.marketIds?.includes(state.market.id)) return fail(state, 'market_scope_refused');
  const batches = state.batches.filter((batch) => batch.lotIds.includes(lotId));
  const batchIds = new Set(batches.map((batch) => batch.id));
  const dishIds = [...new Set(batches.map((batch) => batch.dishId))];
  const affectedOrderIds = [...new Set(state.batchOrders.filter((link) => batchIds.has(link.batchId)).map((link) => link.orderId))];
  const updated: PilotState = {
    ...state,
    batches: state.batches.map((batch) => (batchIds.has(batch.id) ? { ...batch, blocked: true } : batch)),
    dishes: state.dishes.map((dish) => (dishIds.includes(dish.id) ? { ...dish, salesBlocked: true, published: false } : dish)),
    orders: state.orders.map((order) => (affectedOrderIds.includes(order.id) && !order.flags.includes('recall') ? { ...order, flags: [...order.flags, 'recall'] } : order)),
  };
  let released = updated;
  for (const order of updated.orders) {
    if (dishIds.includes(order.dishId) && order.paymentStatus === 'unpaid') released = releaseHold(released, order.id);
  }
  return {
    ok: true,
    state: audit(released, at, actor.id, 'recall', lotId),
    value: { affectedOrderIds, blockedDishIds: dishIds },
  };
}

export function moneyOf(minor: number, currency: string): Money {
  return addMoney(money(minor, currency), money(0, currency));
}

export type Receipt = {
  orderId: string;
  number: string;
  simulated: true;
  seller: string;
  dishTitle: string;
  recipeVersionId: string;
  present: string[];
  traces: string[];
  crossContamination: string[];
  subtotalMinor: number;
  commissionMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  currency: string;
  mode: Mode;
  handedOver: boolean;
  internalOnly: true;
};

export function receiptFor(state: PilotState, orderId: string): Receipt | null {
  const order = state.orders.find((item) => item.id === orderId);
  const dish = state.dishes.find((item) => item.id === order?.dishId);
  const recipe = state.recipes.find((item) => item.id === order?.recipeVersionId);
  if (!order || !dish || !recipe) return null;
  const name = (key: string) => ALLERGENS.find((item) => item.key === key)?.fr ?? key;
  return {
    orderId: order.id,
    number: order.number,
    simulated: true,
    seller: `${state.market.compliance.sellerLegalName} · ${state.market.compliance.sellerAddress} · ${state.market.compliance.sellerRegistration}`,
    dishTitle: dish.title,
    recipeVersionId: recipe.id,
    present: ALLERGENS.filter((item) => recipe.allergens[item.key] === 'present').map((item) => name(item.key)),
    traces: ALLERGENS.filter((item) => recipe.allergens[item.key] === 'traces').map((item) => name(item.key)),
    crossContamination: recipe.crossContamination,
    subtotalMinor: order.subtotalMinor,
    commissionMinor: order.commissionMinor,
    deliveryFeeMinor: order.deliveryFeeMinor,
    totalMinor: order.totalMinor,
    currency: order.currency,
    mode: order.mode,
    handedOver: order.prepStatus === 'handed',
    internalOnly: true,
  };
}
