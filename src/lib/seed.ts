/** Données de DÉMONSTRATION — toutes marquées `demo: true` et « (démo) ». Aucune personne réelle. */
import { addDays, todayISO } from './dates';
import type { Cook, Dish, Order, Review, Slot } from './model';
import type { CookQualification } from './cookQualification';
import { quote } from './pricing';

const now = () => new Date().toISOString();
const DONE = { hands: true, cold: true, cooking: true, separation: true, allergens: true, packaging: true, traceability: true, health: true };

const DEMO_QUAL: CookQualification = {
  passedAt: {
    hygiene: '2026-10-01T10:00:00.000Z',
    allergens: '2026-10-01T10:20:00.000Z',
    safety: '2026-10-01T10:40:00.000Z',
  },
  attempts: [],
  badgeEarnedAt: '2026-10-01T10:40:00.000Z',
  badgeExpiresAt: '2027-10-01T10:40:00.000Z',
};


function ck(p: Omit<Cook, 'demo' | 'createdAt' | 'checklist' | 'checklistAt' | 'name'> & { name: string; ofco?: Cook['ofcoStatus'] }): Cook {
  return {
    ...p,
    name: `${p.name} (démo)`,
    demo: true,
    createdAt: now(),
    checklist: DONE,
    checklistAt: now(),
    ofcoStatus: p.ofco ?? 'ofco_verified',
    hygieneBadge: true,
    liabilityAcceptedAt: now(),
    deliveryModes: p.delivers ? ['pickup', 'delivery', 'partner'] : ['pickup'],
    preferredPartnerId: 'partner_bike_a',
    qualification: DEMO_QUAL,
    halalCertificationNote: p.halalKitchen ? 'Déclaration cook (démo) — pas de certificat audité par Bissabi.' : undefined,
  };
}

function dish(d: Omit<Dish, 'active' | 'demo' | 'allergensConfirmed' | 'leadHours'> & { leadHours?: number }): Dish {
  return {
    leadHours: 24,
    vegan: false,
    glutenFree: false,
    spiceLevel: d.spicy ? 2 : 0,
    familySize: false,
    servings: 1,
    ...d,
    active: true,
    demo: true,
    allergensConfirmed: true,
  };
}

const ing = (s: string) => s.split(';').map((p) => {
  const [name, qty, unit] = p.split('|');
  return { name, qty: Number(qty), unit };
});

export function demoMarket() {
  const cooks: Cook[] = [
    ck({ id: 'demo-c1', name: 'Aïssatou', commune: 'Renens', npa: '1020', lat: 46.5402, lng: 6.5890, canton: 'VD', originCountry: 'Sénégal', originFlag: '🇸🇳', bio: 'Cuisine sénégalaise de famille, mijotée le matin même.', story: 'Les recettes de ma grand-mère de Saint-Louis, adaptées au marché de Renens. Je cuisine le thiéboudienne le vendredi, comme à la maison.', specialties: ['Thiéboudienne', 'Mafé', 'Yassa'], halalKitchen: true, delivers: true, avatarColor: '#C8152A', languages: ['fr', 'wo'] }),
    ck({ id: 'demo-c2', name: 'Karim', commune: 'Lausanne', npa: '1003', lat: 46.5165, lng: 6.6290, canton: 'VD', originCountry: 'Maroc', originFlag: '🇲🇦', bio: 'Couscous du vendredi et tajines au citron confit, comme à Fès.', story: 'J’ai appris le couscous avec mon père à Fès. Ici je roule la semoule à la main et je confis mes citrons.', specialties: ['Couscous', 'Tajine', 'Pastilla'], halalKitchen: true, delivers: false, avatarColor: '#1A4D2E', languages: ['fr', 'ar'] }),
    ck({ id: 'demo-c3', name: 'Marie', commune: 'Le Mont-sur-Lausanne', npa: '1052', lat: 46.5560, lng: 6.6310, canton: 'VD', originCountry: 'Suisse', originFlag: '🇨🇭', bio: 'Terroir vaudois de saison, produits du marché de Lausanne.', story: 'Poireaux du jardin, crème de la laiterie du coin. La cuisine de ma grand-mère à Échallens.', specialties: ['Papet', 'Rösti', 'Fondue'], halalKitchen: false, delivers: true, avatarColor: '#C9A84C', languages: ['fr', 'de'] }),
    ck({ id: 'demo-c4', name: 'Mei', commune: 'Écublens', npa: '1024', lat: 46.5270, lng: 6.5600, canton: 'VD', originCountry: 'Chine', originFlag: '🇨🇳', bio: 'Raviolis faits main et bouillons longs, recettes du Sichuan adoucies.', story: 'Je plisse les gyozas le soir après le travail. La sauce dan dan est maison, poivre du Sichuan dosé pour les palais suisses.', specialties: ['Gyozas', 'Nouilles'], halalKitchen: false, delivers: false, avatarColor: '#6B5BA8', languages: ['fr', 'en', 'zh'] }),
    ck({ id: 'demo-c5', name: 'Lina', commune: 'Pully', npa: '1009', lat: 46.5100, lng: 6.6650, canton: 'VD', originCountry: 'Liban', originFlag: '🇱🇧', bio: 'Mezze libanais généreux et pâtisseries aux fleurs d’oranger.', story: 'Beyrouth dans une assiette à Pully : houmous, fattoush, manakish. Ma mère m’a transmis le geste du pain pita.', specialties: ['Mezze', 'Manakish', 'Maamoul'], halalKitchen: true, delivers: true, avatarColor: '#2F5F8A', languages: ['fr', 'en', 'ar'] }),
    ck({ id: 'demo-c6', name: 'Fatou', commune: 'Genève', npa: '1205', lat: 46.2010, lng: 6.1460, canton: 'GE', originCountry: 'Mauritanie', originFlag: '🇲🇷', bio: 'Saveurs mauritaniennes et sénégalaises du quartier des Grottes.', story: 'Thiéb végétarien et yassa citronné pour les voisins de Genève. Cuisine partagée le dimanche.', specialties: ['Yassa', 'Thiéb végé'], halalKitchen: true, delivers: true, avatarColor: '#B45309', languages: ['fr', 'ar'] }),
    ck({ id: 'demo-c7', name: 'Yonas', commune: 'Fribourg', npa: '1700', lat: 46.8060, lng: 7.1620, canton: 'FR', originCountry: 'Érythrée', originFlag: '🇪🇷', bio: 'Injera, doro wat et kitfo — table érythréenne-éthiopienne.', story: 'L’injera fermente 3 jours. Je sers sur un grand plateau à partager, comme à Asmara.', specialties: ['Injera', 'Doro wat', 'Kitfo'], halalKitchen: true, delivers: false, avatarColor: '#9A3412', languages: ['fr', 'ti', 'en'] }),
    ck({ id: 'demo-c8', name: 'Amara', commune: 'Neuchâtel', npa: '2000', lat: 46.9900, lng: 6.9290, canton: 'NE', originCountry: 'Syrie', originFlag: '🇸🇾', bio: 'Cuisine syrienne de Damas : kibbeh, fattoush, dolmas.', story: 'Les herbes du marché de Neuchâtel remplacent celles de Damas. Même amour, autre terre.', specialties: ['Fattoush', 'Dolma', 'Falafel'], halalKitchen: true, delivers: true, avatarColor: '#0F766E', languages: ['fr', 'ar'] }),
    ck({ id: 'demo-c9', name: 'Elena', commune: 'Lugano', npa: '6900', lat: 46.0037, lng: 8.9511, canton: 'TI', originCountry: 'Italie', originFlag: '🇮🇹', bio: 'Lasagnes et pizza al taglio, plus un clin d’œil portugais le week-end.', story: 'Nonna de Bergame + mari de Porto. Lasagne le mardi, bacalhau le vendredi.', specialties: ['Lasagne', 'Pizza', 'Bacalhau'], halalKitchen: false, delivers: true, avatarColor: '#B91C1C', languages: ['it', 'fr', 'pt'] }),
    ck({ id: 'demo-c10', name: 'Priya', commune: 'Berne', npa: '3011', lat: 46.9480, lng: 7.4474, canton: 'BE', originCountry: 'Inde', originFlag: '🇮🇳', bio: 'Curry tamil, idli et biryani — épices torréfiées le matin.', story: 'Chennai dans la vieille ville de Berne. Je torréfie les épices moi-même, portions adaptées aux familles.', specialties: ['Biryani', 'Idli', 'Samosa'], halalKitchen: true, delivers: true, avatarColor: '#CA8A04', languages: ['en', 'ta', 'de'] }),
    ck({ id: 'demo-c11', name: 'Hanh', commune: 'Winterthur', npa: '8400', lat: 47.4988, lng: 8.7237, canton: 'ZH', originCountry: 'Viêt Nam', originFlag: '🇻🇳', bio: 'Phở, bún chả et rouleaux — bouillons mijotés 12 h.', story: 'Le phở commence la veille. Broth clair, herbes fraîches, riz vapeur maison.', specialties: ['Phở', 'Bún chả', 'Rouleaux'], halalKitchen: false, delivers: false, avatarColor: '#15803D', languages: ['de', 'vi', 'en'] }),
    ck({ id: 'demo-c12', name: 'Selma', commune: 'Bâle', npa: '4051', lat: 47.5596, lng: 7.5886, canton: 'BS', originCountry: 'Turquie', originFlag: '🇹🇷', bio: 'Kebab maison, baklava et dolmas anatoliennes.', story: 'Gaziantep dans mon four bâlois. Pistaches, sirop léger, viande marinées 24 h.', specialties: ['Kebab', 'Baklava', 'Dolma'], halalKitchen: true, delivers: true, avatarColor: '#DC2626', languages: ['de', 'tr', 'fr'] }),
    ck({ id: 'demo-c13', name: 'Diego', commune: 'Sion', npa: '1950', lat: 46.2330, lng: 7.3600, canton: 'VS', originCountry: 'Mexique', originFlag: '🇲🇽', bio: 'Tacos, arepas et ceviche pour les soirées valaisannes.', story: 'Oaxaca + Caracas. Tortillas pressées à la main, ceviche du Léman quand le pêcheur livre.', specialties: ['Tacos', 'Arepa', 'Ceviche'], halalKitchen: false, delivers: true, avatarColor: '#EA580C', languages: ['fr', 'es'] }),
    ck({ id: 'demo-c14', name: 'Arben', commune: 'Saint-Gall', npa: '9000', lat: 47.4245, lng: 9.3767, canton: 'SG', originCountry: 'Kosovo', originFlag: '🇽🇰', bio: 'Börek, qofte et table balkanique généreuse.', story: 'Pristina à Saint-Gall. Börek croustillant, viande épicée juste ce qu’il faut, portions famille.', specialties: ['Börek', 'Qofte'], halalKitchen: true, delivers: false, avatarColor: '#1D4ED8', languages: ['de', 'sq', 'en'] }),
  ];

  const dishes: Dish[] = [
    dish({ id: 'demo-d1', cookId: 'demo-c1', title: 'Thiéboudienne (démo)', description: 'Riz brisé au poisson, légumes fondants, sauce tomate au nététou. Portion généreuse.', cuisine: 'sahel', price: 19.5, allergens: ['fish', 'celery'], halal: true, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🍚', photoKey: 'thieboudienne', availableToday: true, portionLabel: '1 grande assiette (~450 g)', ingredients: ing('Riz brisé|150|g;Thiof ou mérou|180|g;Chou|80|g;Manioc|60|g;Concentré de tomate|30|g'), conservation: 'Au frigo ≤ 5 °C, 48 h', reheating: 'Poêle ou micro-ondes jusqu’à 70 °C à cœur', animalOrigin: 'fish', provenance: 'Poisson CH / UE' }),
    dish({ id: 'demo-d2', cookId: 'demo-c1', title: 'Mafé de poulet (démo)', description: 'Poulet mijoté dans une sauce onctueuse à l’arachide, riz blanc.', cuisine: 'sahel', price: 17, allergens: ['peanuts'], halal: true, vegetarian: false, spicy: false, spiceLevel: 1, emoji: '🥜', photoKey: 'mafe', portionLabel: '1 portion (~400 g)', ingredients: ing('Poulet halal|200|g;Pâte d’arachide|50|g;Riz|120|g;Oignon|0.5|pc'), animalOrigin: 'meat', provenance: 'Volaille CH' }),
    dish({ id: 'demo-d3', cookId: 'demo-c1', title: 'Yassa poulet (démo)', description: 'Poulet mariné citron-oignon, riz, olive. Classique casamançais.', cuisine: 'sahel', price: 16.5, allergens: [], glutenFree: true, halal: true, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🍋', photoKey: 'yassa', ingredients: ing('Poulet halal|220|g;Oignon|2|pc;Citron|1|pc;Riz|120|g'), animalOrigin: 'meat', provenance: 'Volaille CH' }),
    dish({ id: 'demo-d4', cookId: 'demo-c2', title: 'Couscous royal (démo)', description: 'Semoule roulée main, légumes, poulet et merguez halal, bouillon à part.', cuisine: 'maghreb', price: 22, allergens: ['gluten', 'celery'], halal: true, vegetarian: false, spicy: false, spiceLevel: 1, emoji: '🥘', photoKey: 'couscous', familySize: true, servings: 2, availableToday: true, portionLabel: 'Pour 2 personnes', ingredients: ing('Semoule|120|g;Poulet halal|120|g;Merguez halal|80|g;Légumes couscous|200|g;Pois chiches|40|g'), animalOrigin: 'meat', provenance: 'Viande CH' }),
    dish({ id: 'demo-d5', cookId: 'demo-c2', title: 'Tajine poulet citron confit (démo)', description: 'Olives violettes, citron confit maison, pain khobz à part (contient gluten).', cuisine: 'maghreb', price: 18.5, allergens: ['gluten'], halal: true, vegetarian: false, spicy: false, spiceLevel: 1, emoji: '🍋', photoKey: 'tajine', ingredients: ing('Poulet halal|220|g;Citron confit|0.5|pc;Olives|30|g;Pain khobz|1|pc'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d6', cookId: 'demo-c2', title: 'Pastilla poulet amandes (démo)', description: 'Feuilles de brick croustillantes, cannelle, sucre glace. Entrée festive.', cuisine: 'maghreb', price: 14, allergens: ['gluten', 'nuts', 'eggs'], halal: true, vegetarian: false, spicy: false, spiceLevel: 0, emoji: '🥧', photoKey: 'pastilla', ingredients: ing('Feuilles de brick|4|pc;Poulet|100|g;Amandes|30|g;Œuf|1|pc'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d7', cookId: 'demo-c3', title: 'Papet vaudois (démo)', description: 'Poireaux et pommes de terre à la crème. Version végétarienne.', cuisine: 'swiss', price: 16, allergens: ['milk', 'celery'], halal: false, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🥬', photoKey: 'papet', glutenFree: true, availableToday: true, ingredients: ing('Poireaux|200|g;Pommes de terre|200|g;Crème|40|ml;Bouillon de légumes|100|ml'), animalOrigin: 'none' }),
    dish({ id: 'demo-d8', cookId: 'demo-c3', title: 'Rösti du soir (démo)', description: 'Pommes de terre râpées dorées au beurre, oignon doux. Accompagne tout.', cuisine: 'swiss', price: 12, allergens: ['milk'], halal: false, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🥔', photoKey: 'rosti', glutenFree: true, ingredients: ing('Pommes de terre|300|g;Beurre|20|g;Oignon|0.5|pc'), animalOrigin: 'none' }),
    dish({ id: 'demo-d9', cookId: 'demo-c3', title: 'Fondue moitié-moitié (démo)', description: 'Gruyère AOP & Vacherin fribourgeois, vin blanc, pain. Pour 2.', cuisine: 'swiss', price: 32, allergens: ['milk', 'gluten'], halal: false, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🧀', photoKey: 'fondue', familySize: true, servings: 2, portionLabel: 'Pour 2 personnes', ingredients: ing('Gruyère AOP|200|g;Vacherin fribourgeois|200|g;Vin blanc|100|ml;Pain|200|g'), animalOrigin: 'none', provenance: 'Fromage CH' }),
    dish({ id: 'demo-d10', cookId: 'demo-c3', title: 'Tarte au vin cuit (démo)', description: 'La tarte vaudoise traditionnelle, pâte brisée maison. La part.', cuisine: 'sweet', price: 6.5, allergens: ['gluten', 'eggs', 'milk'], halal: false, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🥧', photoKey: 'tarte', isBakery: true, productionCountry: 'Suisse', ingredients: ing('Farine|40|g;Beurre|20|g;Vin cuit|40|ml;Œuf|0.3|pc;Crème|20|ml'), animalOrigin: 'none' }),
    dish({ id: 'demo-d11', cookId: 'demo-c4', title: 'Gyozas porc & chou (démo) — 10 pièces', description: 'Plissés à la main, à poêler 6 minutes. Sauce soja-vinaigre noir.', cuisine: 'asian', price: 15, allergens: ['gluten', 'soy', 'sesame'], halal: false, vegetarian: false, spicy: false, spiceLevel: 1, emoji: '🥟', photoKey: 'gyoza', availableToday: true, ingredients: ing('Pâte à gyoza|10|pc;Porc haché|120|g;Chou chinois|60|g;Sauce soja|20|ml'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d12', cookId: 'demo-c4', title: 'Dan dan noodles végé (démo)', description: 'Nouilles de blé, sauce sésame, poivre du Sichuan doux.', cuisine: 'veggie', price: 14, allergens: ['gluten', 'soy', 'sesame', 'peanuts'], halal: false, vegetarian: true, spicy: true, spiceLevel: 3, emoji: '🍜', photoKey: 'noodles', ingredients: ing('Nouilles de blé|120|g;Pâte de sésame|30|g;Sauce soja|15|ml;Cacahuètes|15|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d13', cookId: 'demo-c5', title: 'Mezze pour deux (démo)', description: 'Houmous, moutabal, taboulé, falafels, pain pita.', cuisine: 'levant', price: 28, allergens: ['sesame', 'gluten'], halal: true, vegetarian: true, vegan: true, spicy: false, spiceLevel: 0, emoji: '🧆', photoKey: 'mezze', familySize: true, servings: 2, availableToday: true, ingredients: ing('Pois chiches|150|g;Tahini|40|g;Aubergine|150|g;Persil|1|botte;Pain pita|2|pc'), animalOrigin: 'none' }),
    dish({ id: 'demo-d14', cookId: 'demo-c5', title: 'Manakish zaatar (démo)', description: 'Pain plat libanais au thym, sésame et huile d’olive. 2 pièces.', cuisine: 'levant', price: 9, allergens: ['gluten', 'sesame'], halal: true, vegetarian: true, vegan: true, spicy: false, spiceLevel: 0, emoji: '🫓', photoKey: 'manakish', isBakery: true, productionCountry: 'Suisse', ingredients: ing('Farine|120|g;Zaatar|20|g;Huile d’olive|15|ml'), animalOrigin: 'none' }),
    dish({ id: 'demo-d15', cookId: 'demo-c5', title: 'Maamoul dattes & pistache (démo) — 6 pièces', description: 'Biscuits de semoule à la fleur d’oranger.', cuisine: 'sweet', price: 9, allergens: ['gluten', 'nuts', 'milk'], halal: true, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🍪', photoKey: 'maamoul', ingredients: ing('Semoule fine|80|g;Beurre clarifié|30|g;Dattes|40|g;Pistaches|20|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d16', cookId: 'demo-c6', title: 'Yassa citronné (démo)', description: 'Version mauritanienne du yassa, oignons longuement confits.', cuisine: 'sahel', price: 17, allergens: [], glutenFree: true, halal: true, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🧅', photoKey: 'yassa', ingredients: ing('Poulet halal|220|g;Oignon|3|pc;Citron|2|pc;Riz|120|g'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d17', cookId: 'demo-c6', title: 'Thiéb végétarien (démo)', description: 'Riz aux légumes du marché, sans poisson. Halal & vegan.', cuisine: 'sahel', price: 15, allergens: ['celery'], halal: true, vegetarian: true, vegan: true, glutenFree: true, spicy: true, spiceLevel: 2, emoji: '🥗', photoKey: 'thieb_vegetarien', ingredients: ing('Riz brisé|150|g;Carotte|80|g;Chou|80|g;Aubergine|60|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d18', cookId: 'demo-c7', title: 'Injera & légumes (démo)', description: 'Pain teff fermenté, lentilles, chou épicé. Plateau à partager.', cuisine: 'horn', price: 18, allergens: [], glutenFree: true, halal: true, vegetarian: true, vegan: true, spicy: true, spiceLevel: 2, emoji: '🫓', photoKey: 'injera', familySize: true, servings: 2, ingredients: ing('Farine de teff|100|g;Lentilles|80|g;Chou|100|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d19', cookId: 'demo-c7', title: 'Doro wat (démo)', description: 'Poulet mijoté berbere, œuf dur, injera. Fête éthiopienne.', cuisine: 'horn', price: 21, allergens: ['eggs'], glutenFree: true, halal: true, vegetarian: false, spicy: true, spiceLevel: 3, emoji: '🍗', photoKey: 'doro', ingredients: ing('Poulet halal|220|g;Berbere|15|g;Œuf|1|pc;Oignon|2|pc'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d20', cookId: 'demo-c7', title: 'Kitfo (démo)', description: 'Bœuf haché épicé traditionnel, servi cuit à point sur demande (pas cru).', cuisine: 'horn', price: 23, allergens: ['milk'], glutenFree: true, halal: false, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🥩', photoKey: 'kitfo', ingredients: ing('Bœuf|180|g;Beurre épicé|20|g;Mitmita|5|g'), animalOrigin: 'meat', provenance: 'Bœuf CH' }),
    dish({ id: 'demo-d21', cookId: 'demo-c8', title: 'Fattoush (démo)', description: 'Salade croquante, pain pita grillé, sumac, grenade.', cuisine: 'levant', price: 13, allergens: ['gluten'], halal: true, vegetarian: true, vegan: true, spicy: false, spiceLevel: 0, emoji: '🥗', photoKey: 'fattoush', availableToday: true, ingredients: ing('Laitue|100|g;Concombre|80|g;Tomate|80|g;Pain pita|1|pc;Sumac|5|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d22', cookId: 'demo-c8', title: 'Falafel assiette (démo)', description: '6 falafels, tahini, pickles, salade. Sans gluten sur demande (base pois chiches).', cuisine: 'levant', price: 14, allergens: ['sesame'], glutenFree: true, halal: true, vegetarian: true, vegan: true, spicy: false, spiceLevel: 1, emoji: '🧆', photoKey: 'falafel', ingredients: ing('Pois chiches|150|g;Tahini|30|g;Persil|20|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d23', cookId: 'demo-c8', title: 'Dolmas riz (démo)', description: 'Feuilles de vigne farcies riz-herbes. 8 pièces, vinaigrette citron.', cuisine: 'levant', price: 12, allergens: [], glutenFree: true, halal: true, vegetarian: true, vegan: true, spicy: false, spiceLevel: 0, emoji: '🍃', photoKey: 'dolma', ingredients: ing('Feuilles de vigne|8|pc;Riz|80|g;Persil|20|g;Menthe|10|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d24', cookId: 'demo-c9', title: 'Lasagne bolognaise (démo)', description: 'Bœuf, béchamel, parmesan. Portion généreuse pour 1–2.', cuisine: 'italian', price: 18, allergens: ['gluten', 'milk', 'eggs', 'celery'], halal: false, vegetarian: false, spicy: false, spiceLevel: 0, emoji: '🍝', photoKey: 'lasagna', familySize: true, servings: 2, availableToday: true, ingredients: ing('Pâtes lasagne|80|g;Bœuf haché|150|g;Béchamel|100|ml;Parmesan|30|g'), animalOrigin: 'meat', provenance: 'Bœuf CH' }),
    dish({ id: 'demo-d25', cookId: 'demo-c9', title: 'Pizza margherita al taglio (démo)', description: 'Pâte 48 h, tomate San Marzano, mozzarella fior di latte.', cuisine: 'italian', price: 11, allergens: ['gluten', 'milk'], halal: false, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🍕', photoKey: 'pizza', isBakery: true, productionCountry: 'Suisse', ingredients: ing('Farine|120|g;Mozzarella|80|g;Tomate|60|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d26', cookId: 'demo-c9', title: 'Bacalhau à brás (démo)', description: 'Morue effilochée, pommes allumettes, œufs. Clin d’œil porto.', cuisine: 'iberian', price: 19, allergens: ['fish', 'eggs'], glutenFree: true, halal: false, vegetarian: false, spicy: false, spiceLevel: 0, emoji: '🐟', photoKey: 'bacalhau', ingredients: ing('Morue|150|g;Pommes de terre|150|g;Œuf|2|pc;Oignon|1|pc'), animalOrigin: 'fish' }),
    dish({ id: 'demo-d27', cookId: 'demo-c10', title: 'Biryani poulet (démo)', description: 'Riz basmati, masala maison, yaourt. Portion famille possible.', cuisine: 'indian', price: 17.5, allergens: ['milk'], glutenFree: true, halal: true, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🍛', photoKey: 'biryani', familySize: true, servings: 2, availableToday: true, ingredients: ing('Riz basmati|150|g;Poulet halal|180|g;Yaourt|40|g;Épices biryani|15|g'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d28', cookId: 'demo-c10', title: 'Idli sambar (démo) — 4 pièces', description: 'Gâteaux de riz vapeur, sambar de lentilles, chutney coco.', cuisine: 'indian', price: 12, allergens: [], glutenFree: true, halal: true, vegetarian: true, vegan: true, spicy: true, spiceLevel: 2, emoji: '⚪', photoKey: 'idli', ingredients: ing('Riz|80|g;Urad dal|40|g;Lentilles|60|g;Noix de coco|30|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d29', cookId: 'demo-c10', title: 'Samosas légumes (démo) — 4 pièces', description: 'Triangles croustillants pomme de terre-petits pois. Chutney tamarin.', cuisine: 'indian', price: 10, allergens: ['gluten'], halal: true, vegetarian: true, vegan: true, spicy: true, spiceLevel: 2, emoji: '🔺', photoKey: 'samosa', ingredients: ing('Pâte filo|4|pc;Pomme de terre|120|g;Petits pois|40|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d30', cookId: 'demo-c11', title: 'Phở bœuf (démo)', description: 'Bouillon 12 h, nouilles de riz, herbes fraîches, sauce poisson.', cuisine: 'seasia', price: 18, allergens: ['fish', 'soy'], glutenFree: true, halal: false, vegetarian: false, spicy: false, spiceLevel: 1, emoji: '🍜', photoKey: 'pho', availableToday: true, ingredients: ing('Nouilles de riz|120|g;Bœuf|100|g;Bouillon|400|ml;Herbes|30|g'), animalOrigin: 'meat', provenance: 'Bœuf CH' }),
    dish({ id: 'demo-d31', cookId: 'demo-c11', title: 'Bún chả (démo)', description: 'Porc grillé, nouilles de riz, sauce nuoc cham, herbes.', cuisine: 'seasia', price: 17, allergens: ['fish'], glutenFree: true, halal: false, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🥩', photoKey: 'bun_cha', ingredients: ing('Porc|150|g;Nouilles de riz|100|g;Nuoc cham|40|ml'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d32', cookId: 'demo-c11', title: 'Rouleaux de printemps (démo) — 4 pièces', description: 'Crevettes, vermicelles, menthe. Sauce cacahuète à part.', cuisine: 'seasia', price: 13, allergens: ['crustaceans', 'peanuts'], glutenFree: true, halal: false, vegetarian: false, spicy: false, spiceLevel: 0, emoji: '🌯', photoKey: 'spring_rolls', ingredients: ing('Galettes de riz|4|pc;Crevettes|80|g;Vermicelles|40|g;Menthe|10|g'), animalOrigin: 'fish' }),
    dish({ id: 'demo-d33', cookId: 'demo-c12', title: 'Assiette kebab maison (démo)', description: 'Viande marinées 24 h, riz, salade, pain. Sauce yaourt.', cuisine: 'turkish', price: 16, allergens: ['gluten', 'milk'], halal: true, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🥙', photoKey: 'kebab', availableToday: true, ingredients: ing('Agneau/bœuf halal|180|g;Pain|1|pc;Yaourt|40|g;Salade|80|g'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d34', cookId: 'demo-c12', title: 'Baklava pistache (démo) — 4 pièces', description: 'Feuilles croustillantes, pistaches Gaziantep, sirop léger.', cuisine: 'sweet', price: 11, allergens: ['gluten', 'nuts'], halal: true, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🧁', photoKey: 'baklava', ingredients: ing('Pâte filo|60|g;Pistaches|40|g;Beurre|20|g;Sirop|30|ml'), animalOrigin: 'none' }),
    dish({ id: 'demo-d35', cookId: 'demo-c13', title: 'Tacos al pastor (démo) — 3 pièces', description: 'Porc mariné annas-chili, ananas grillé, coriandre, oignon.', cuisine: 'iberian', price: 15, allergens: [], glutenFree: true, halal: false, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🌮', photoKey: 'tacos', availableToday: true, ingredients: ing('Tortillas maïs|3|pc;Porc|150|g;Ananas|40|g;Coriandre|10|g'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d36', cookId: 'demo-c13', title: 'Arepa reina pepiada (démo)', description: 'Galette de maïs, poulet avocat. Deux pièces.', cuisine: 'iberian', price: 14, allergens: [], glutenFree: true, halal: false, vegetarian: false, spicy: false, spiceLevel: 0, emoji: '🫓', photoKey: 'arepa', ingredients: ing('Farine de maïs|100|g;Poulet|120|g;Avocat|0.5|pc'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d37', cookId: 'demo-c13', title: 'Ceviche Léman (démo)', description: 'Poisson d’eau douce mariné citron-coriandre (jamais cru cru : acidifié 2 h).', cuisine: 'iberian', price: 18, allergens: ['fish'], glutenFree: true, halal: false, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🍋', photoKey: 'ceviche', ingredients: ing('Poisson d’eau douce|150|g;Citron vert|2|pc;Oignon rouge|0.5|pc;Coriandre|15|g'), animalOrigin: 'fish', provenance: 'Poisson CH' }),
    dish({ id: 'demo-d38', cookId: 'demo-c14', title: 'Börek épinards feta (démo)', description: 'Rouleau croustillant, yaourt à l’ail. Part généreuse.', cuisine: 'balkan', price: 13, allergens: ['gluten', 'milk'], halal: true, vegetarian: true, spicy: false, spiceLevel: 0, emoji: '🥐', photoKey: 'burek', familySize: true, servings: 2, ingredients: ing('Pâte filo|80|g;Épinards|150|g;Feta|60|g'), animalOrigin: 'none' }),
    dish({ id: 'demo-d39', cookId: 'demo-c14', title: 'Qofte & riz (démo)', description: 'Boulettes épicées balkaniques, riz basmati, salade shopska.', cuisine: 'balkan', price: 16, allergens: ['eggs', 'gluten'], halal: true, vegetarian: false, spicy: true, spiceLevel: 2, emoji: '🧆', photoKey: 'qofte', availableToday: true, ingredients: ing('Bœuf/agneau halal|180|g;Œuf|0.5|pc;Chapelure|20|g;Riz|100|g'), animalOrigin: 'meat' }),
    dish({ id: 'demo-d40', cookId: 'demo-c12', title: 'Dolma Anatolie (démo)', description: 'Poivrons farcis riz-viande, sauce tomate. Deux pièces.', cuisine: 'turkish', price: 15, allergens: [], glutenFree: true, halal: true, vegetarian: false, spicy: true, spiceLevel: 1, emoji: '🫑', photoKey: 'dolma', ingredients: ing('Poivron|2|pc;Riz|80|g;Bœuf halal|80|g'), animalOrigin: 'meat' }),
  ];

  const t = todayISO();
  const slots: Slot[] = [];
  cooks.forEach((c, i) => {
    for (let k = 0; k <= 7; k++) {
      if ((k + i) % 3 === 0 && k !== 0) continue;
      const lunch = (k + i) % 3 === 0;
      slots.push({
        id: `demo-s-${c.id}-${k}`,
        cookId: c.id,
        date: addDays(t, k),
        from: lunch ? '11:30' : '18:30',
        to: lunch ? '13:00' : '20:00',
        modes: c.delivers ? ['pickup', 'delivery', 'partner'] : ['pickup'],
        capacity: 12,
        dishIds: [],
        demo: true,
      });
    }
  });

  const reviews: Review[] = [
    { id: 'demo-r1', orderId: 'demo', cookId: 'demo-c1', dishId: 'demo-d1', rating: 5, text: 'Le goût de Dakar à Renens. Portion très généreuse.', author: 'Samuel (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r2', orderId: 'demo', cookId: 'demo-c2', dishId: 'demo-d4', rating: 5, text: 'Semoule légère, bouillon parfait.', author: 'Nadia (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r3', orderId: 'demo', cookId: 'demo-c3', dishId: 'demo-d7', rating: 4, text: 'Comme chez ma grand-mère. Un peu salé pour moi.', author: 'Luc (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r4', orderId: 'demo', cookId: 'demo-c5', dishId: 'demo-d13', rating: 5, text: 'Mezze digne d’un restaurant de Beyrouth.', author: 'Clara (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r5', orderId: 'demo', cookId: 'demo-c7', dishId: 'demo-d18', rating: 5, text: 'Injera parfaite, épices justes.', author: 'Marta (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r6', orderId: 'demo', cookId: 'demo-c10', dishId: 'demo-d27', rating: 5, text: 'Biryani parfumé, riz parfaitement cuit.', author: 'Jonas (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r7', orderId: 'demo', cookId: 'demo-c11', dishId: 'demo-d30', rating: 4, text: 'Bouillon profond. Un peu long à attendre le créneau.', author: 'Eva (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r8', orderId: 'demo', cookId: 'demo-c9', dishId: 'demo-d24', rating: 5, text: 'Lasagne digne de nonna.', author: 'Paolo (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r9', orderId: 'demo', cookId: 'demo-c12', dishId: 'demo-d33', rating: 5, text: 'Meilleur kebab de Bâle, sans débat.', author: 'Tim (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r10', orderId: 'demo', cookId: 'demo-c5', dishId: 'demo-d13', rating: 3, text: 'Avis en attente de modération (exemple).', author: 'Anonyme (démo)', status: 'pending', at: now(), demo: true },
    { id: 'demo-r11', orderId: 'demo', cookId: 'demo-c13', dishId: 'demo-d35', rating: 5, text: 'Tacos qui cartonnent après le ski.', author: 'Chloé (démo)', status: 'published', at: now(), demo: true },
    { id: 'demo-r12', orderId: 'demo', cookId: 'demo-c14', dishId: 'demo-d38', rating: 4, text: 'Börek croustillant, feta juste salée.', author: 'Anna (démo)', status: 'published', at: now(), demo: true },
  ];

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
