/** Données de DÉMONSTRATION — toutes marquées `demo: true` et « (démo) ». Aucune personne réelle. */
import { addDays, todayISO } from './dates';
import type { Cook, Dish, Order, Review, Slot } from './model';
import { quote } from './pricing';

const now = () => new Date().toISOString();
const ck = (id: string, name: string, commune: string, npa: string, lat: number, lng: number, bio: string, halal: boolean, delivers: boolean, color: string, languages: string[]): Cook => ({
  id, name: `${name} (démo)`, commune, npa, lat, lng, bio, halalKitchen: halal, languages, delivers, avatarColor: color, demo: true, createdAt: now(),
  checklist: { hands: true, cold: true, cooking: true, separation: true, allergens: true, packaging: true, traceability: true, health: true }, checklistAt: now(),
});
const dish = (d: Omit<Dish, 'active' | 'demo' | 'allergensConfirmed' | 'leadHours'> & { leadHours?: number }): Dish => ({ leadHours: 24, ...d, active: true, demo: true, allergensConfirmed: true });

export function demoMarket() {
  const cooks: Cook[] = [
    ck('demo-c1', 'Aïssatou', 'Renens', '1020', 46.5402, 6.5890, 'Cuisine sénégalaise de famille, mijotée le matin même. Recettes de ma grand-mère de Saint-Louis.', true, true, '#C8152A', ['fr', 'wo']),
    ck('demo-c2', 'Karim', 'Lausanne', '1003', 46.5165, 6.6290, 'Couscous du vendredi et tajines au citron confit, comme à Fès.', true, false, '#1A4D2E', ['fr', 'ar']),
    ck('demo-c3', 'Marie', 'Le Mont-sur-Lausanne', '1052', 46.5560, 6.6310, 'Terroir vaudois de saison, produits du marché de Lausanne.', false, true, '#C9A84C', ['fr', 'de']),
    ck('demo-c4', 'Mei', 'Écublens', '1024', 46.5270, 6.5600, 'Raviolis faits main et bouillons longs, recettes du Sichuan adoucies.', false, false, '#6B5BA8', ['fr', 'en', 'zh']),
    ck('demo-c5', 'Lina', 'Pully', '1009', 46.5100, 6.6650, 'Mezze libanais généreux et pâtisseries aux fleurs d’oranger.', true, true, '#2F5F8A', ['fr', 'en', 'ar']),
  ];
  const ing = (s: string) => s.split(';').map((p) => { const [name, qty, unit] = p.split('|'); return { name, qty: Number(qty), unit }; });
  const dishes: Dish[] = [
    dish({ id: 'demo-d1', cookId: 'demo-c1', title: 'Thiéboudienne (démo)', description: 'Riz brisé au poisson, légumes fondants, sauce tomate au nététou. Portion généreuse.', cuisine: 'sahel', price: 19.5, allergens: ['fish', 'celery'], halal: true, vegetarian: false, spicy: true, emoji: '🍚', ingredients: ing('Riz brisé|150|g;Thiof ou mérou|180|g;Chou|80|g;Manioc|60|g;Concentré de tomate|30|g') }),
    dish({ id: 'demo-d2', cookId: 'demo-c1', title: 'Mafé de poulet (démo)', description: 'Poulet mijoté dans une sauce onctueuse à l’arachide, riz blanc.', cuisine: 'sahel', price: 17, allergens: ['peanuts'], halal: true, vegetarian: false, spicy: false, emoji: '🥜', ingredients: ing('Poulet halal|200|g;Pâte d’arachide|50|g;Riz|120|g;Oignon|0.5|pc') }),
    dish({ id: 'demo-d3', cookId: 'demo-c2', title: 'Couscous royal (démo)', description: 'Semoule roulée main, légumes, poulet et merguez halal, bouillon à part.', cuisine: 'maghreb', price: 22, allergens: ['gluten', 'celery'], halal: true, vegetarian: false, spicy: false, emoji: '🥘', ingredients: ing('Semoule|120|g;Poulet halal|120|g;Merguez halal|80|g;Légumes couscous|200|g;Pois chiches|40|g') }),
    dish({ id: 'demo-d4', cookId: 'demo-c2', title: 'Tajine poulet citron confit (démo)', description: 'Olives violettes, citron confit maison, pain khobz à part (contient gluten, indiqué).', cuisine: 'maghreb', price: 18.5, allergens: ['gluten'], halal: true, vegetarian: false, spicy: false, emoji: '🍋', ingredients: ing('Poulet halal|220|g;Citron confit|0.5|pc;Olives|30|g;Pain khobz|1|pc') }),
    dish({ id: 'demo-d5', cookId: 'demo-c3', title: 'Papet vaudois (démo)', description: 'Poireaux et pommes de terre à la crème. Version végétarienne, saucisse aux choux sur demande hors app.', cuisine: 'swiss', price: 16, allergens: ['milk', 'celery'], halal: false, vegetarian: true, spicy: false, emoji: '🥬', ingredients: ing('Poireaux|200|g;Pommes de terre|200|g;Crème|40|ml;Bouillon de légumes|100|ml') }),
    dish({ id: 'demo-d6', cookId: 'demo-c3', title: 'Tarte au vin cuit (démo)', description: 'La tarte vaudoise traditionnelle, pâte brisée maison. La part.', cuisine: 'sweet', price: 6.5, allergens: ['gluten', 'eggs', 'milk'], halal: false, vegetarian: true, spicy: false, emoji: '🥧', ingredients: ing('Farine|40|g;Beurre|20|g;Vin cuit|40|ml;Œuf|0.3|pc;Crème|20|ml') }),
    dish({ id: 'demo-d7', cookId: 'demo-c4', title: 'Gyozas porc & chou (démo) — 10 pièces', description: 'Plissés à la main, à poêler 6 minutes. Sauce soja-vinaigre noir.', cuisine: 'asian', price: 15, allergens: ['gluten', 'soy', 'sesame'], halal: false, vegetarian: false, spicy: false, emoji: '🥟', ingredients: ing('Pâte à gyoza|10|pc;Porc haché|120|g;Chou chinois|60|g;Sauce soja|20|ml') }),
    dish({ id: 'demo-d8', cookId: 'demo-c4', title: 'Dan dan noodles végé (démo)', description: 'Nouilles de blé, sauce sésame, poivre du Sichuan doux.', cuisine: 'veggie', price: 14, allergens: ['gluten', 'soy', 'sesame', 'peanuts'], halal: false, vegetarian: true, spicy: true, emoji: '🍜', ingredients: ing('Nouilles de blé|120|g;Pâte de sésame|30|g;Sauce soja|15|ml;Cacahuètes|15|g') }),
    dish({ id: 'demo-d9', cookId: 'demo-c5', title: 'Mezze pour deux (démo)', description: 'Houmous, moutabal, taboulé, falafels, pain pita.', cuisine: 'levant', price: 28, allergens: ['sesame', 'gluten'], halal: true, vegetarian: true, spicy: false, emoji: '🧆', ingredients: ing('Pois chiches|150|g;Tahini|40|g;Aubergine|150|g;Persil|1|botte;Pain pita|2|pc') }),
    dish({ id: 'demo-d10', cookId: 'demo-c5', title: 'Maamoul dattes & pistache (démo) — 6 pièces', description: 'Biscuits de semoule à la fleur d’oranger.', cuisine: 'sweet', price: 9, allergens: ['gluten', 'nuts', 'milk'], halal: true, vegetarian: true, spicy: false, emoji: '🍪', ingredients: ing('Semoule fine|80|g;Beurre clarifié|30|g;Dattes|40|g;Pistaches|20|g') }),
  ];
  const t = todayISO();
  const slots: Slot[] = [];
  cooks.forEach((c, i) => {
    for (let k = 1; k <= 6; k++) {
      if ((k + i) % 2 === 0) continue;
      const lunch = (k + i) % 3 === 0;
      slots.push({ id: `demo-s-${c.id}-${k}`, cookId: c.id, date: addDays(t, k), from: lunch ? '11:30' : '18:30', to: lunch ? '13:00' : '20:00', modes: c.delivers ? ['pickup', 'delivery'] : ['pickup'], capacity: 12, dishIds: [], demo: true });
    }
  });
  const reviews: Review[] = [
    { id: 'demo-r1', orderId: 'demo', cookId: 'demo-c1', dishId: 'demo-d1', rating: 5, text: 'Le goût de Dakar à Renens. Portion très généreuse, emballage impeccable.', author: 'Samuel (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r2', orderId: 'demo', cookId: 'demo-c2', dishId: 'demo-d3', rating: 5, text: 'Semoule légère, bouillon parfait. Retrait à l’heure.', author: 'Nadia (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r3', orderId: 'demo', cookId: 'demo-c3', dishId: 'demo-d5', rating: 4, text: 'Comme chez ma grand-mère. Un peu salé pour moi.', author: 'Luc (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r4', orderId: 'demo', cookId: 'demo-c5', dishId: 'demo-d9', rating: 3, text: 'Avis en attente de modération (exemple).', author: 'Anonyme (démo)', status: 'pending', at: now(), demo: true },
  ];
  // Une commande passée (acheteur) déjà acceptée, créneau d’hier — pour tester « reçue » + avis
  const yl = [{ dishId: 'demo-d2', title: 'Mafé de poulet (démo)', qty: 2, unitPrice: 17 }];
  const yq = quote(yl, 'pickup');
  const pastOrder: Order = {
    id: 'demo-o1', number: 'HMF-DEMO-001', side: 'buyer', cookId: 'demo-c1', buyerName: 'Moi', lines: yl,
    slotId: 'demo-past', slotDate: addDays(t, -1), slotFrom: '18:30', slotTo: '20:00', mode: 'pickup', ...yq, status: 'ready',
    timeline: [{ status: 'requested', at: now() }, { status: 'accepted', at: now() }, { status: 'ready', at: now() }],
    payment: { method: 'demo', ref: 'DEMO' }, createdAt: now(), demo: true,
  };
  return { cooks, dishes, slots, reviews, orders: [pastOrder] };
}

/** Commandes reçues d’exemple pour « ma cuisine ». */
export function demoKitchenOrders(cookId: string, myDishes: Dish[]): Order[] {
  if (!myDishes.length) return [];
  const t = todayISO();
  const mk = (n: number, name: string, qty: number, day: number, status: Order['status'], mode: 'pickup' | 'delivery'): Order => {
    const d = myDishes[n % myDishes.length];
    const lines = [{ dishId: d.id, title: d.title, qty, unitPrice: d.price }];
    const q = quote(lines, mode);
    return {
      id: `demo-k${n}`, number: `HMF-DEMO-K${n}`, side: 'cook', cookId, buyerName: `${name} (démo)`, lines,
      slotId: 'demo', slotDate: addDays(t, day), slotFrom: '18:30', slotTo: '20:00', mode, address: mode === 'delivery' ? 'Rue de l’Exemple 1, 1008 Prilly (démo)' : undefined,
      ...q, status, timeline: [{ status: 'requested', at: new Date().toISOString() }, ...(status !== 'requested' ? [{ status, at: new Date().toISOString() }] : [])],
      payment: { method: 'demo', ref: 'DEMO' }, createdAt: new Date().toISOString(), demo: true,
    };
  };
  return [mk(1, 'Sophie', 2, 2, 'requested', 'pickup'), mk(2, 'Omar', 4, 3, 'accepted', 'delivery'), mk(3, 'Julie', 1, -3, 'completed', 'pickup'), mk(4, 'Yves', 3, -8, 'completed', 'delivery')];
}
