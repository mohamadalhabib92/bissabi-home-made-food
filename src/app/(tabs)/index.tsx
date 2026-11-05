import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, DishCard, DishVisual, Stars, Wordmark } from '@/components/brand';
import { useI18n } from '@/i18n';
import { useData, useL } from '@/lib/data';
import { curatedRails, filterDishes, type DietFilter, type SortKey } from '@/lib/filters';
import { fmtKm, zoneOf } from '@/lib/geo';
import { rating } from '@/lib/market';
import { CANTONS, CUISINES, type Cuisine } from '@/lib/model';
import { chf } from '@/lib/pricing';
import { Button, Chip, DemoBanner, Empty, Field, H2, Ionicons, Muted, Notice, Segmented, Toggle, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

const DIETS: { key: DietFilter; fr: string; en: string }[] = [
  { key: 'halal', fr: 'Halal', en: 'Halal' },
  { key: 'vegetarian', fr: 'Végétarien', en: 'Vegetarian' },
  { key: 'vegan', fr: 'Vegan', en: 'Vegan' },
  { key: 'glutenFree', fr: 'Sans gluten', en: 'Gluten-free' },
];

export default function Discover() {
  const { prefs, setPrefs, cooks, dishes, slots, reviews, distanceTo, favorites, hasDemo, loadDemo, bootFallback, storageReady } = useData();
  const { L, lang } = useL();
  const { t: tr } = useI18n();
  const zone = zoneOf(prefs.location);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [diets, setDiets] = useState<DietFilter[]>([]);
  const [favOnly, setFavOnly] = useState(false);
  const [availableToday, setAvailableToday] = useState(false);
  const [familySize, setFamilySize] = useState(false);
  const [canton, setCanton] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('available');
  const [showMore, setShowMore] = useState(false);

  const toggleDiet = (d: DietFilter) => setDiets((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const rows = useMemo(() => filterDishes(dishes, cooks, slots, reviews, distanceTo, prefs.radiusKm, {
    query: q,
    cuisine,
    diets: prefs.halalOnly && !diets.includes('halal') ? [...diets, 'halal'] : diets,
    maxPrice,
    minRating,
    canton,
    availableToday,
    familySize,
    favOnly,
    favDishIds: favorites.dishes,
    favCookIds: favorites.cooks,
    sort,
  }), [dishes, cooks, slots, reviews, distanceTo, prefs.radiusKm, prefs.halalOnly, q, cuisine, diets, maxPrice, minRating, canton, availableToday, familySize, favOnly, favorites, sort]);

  const nearCooks = useMemo(() => cooks
    .filter((c) => !c.isMe)
    .map((c) => ({ c, d: distanceTo(c) }))
    .filter(({ d }) => d == null || d <= prefs.radiusKm)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0)), [cooks, distanceTo, prefs.radiusKm]);

  const rails = useMemo(() => curatedRails(rows, cooks, reviews), [rows, cooks, reviews]);
  const topCooks = rails.topCookIds.map((id) => cooks.find((c) => c.id === id)).filter(Boolean);

  const Rail = ({ title, items }: { title: string; items: typeof rows }) => {
    if (!items.length) return null;
    return (
      <View style={{ marginBottom: 8 }}>
        <H2>{title}</H2>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 12, paddingRight: 8 }}>
          {items.map(({ dish, cook, dist, nextSlot }) => (
            <Pressable key={dish.id} onPress={() => router.push(`/dish/${dish.id}`)} accessibilityRole="button" accessibilityLabel={dish.title}
              style={{ width: 200, backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
              <DishVisual dish={dish} height={110} radius={0} />
              <View style={{ padding: 10, gap: 2 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }} numberOfLines={2}>{dish.title}</Text>
                <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{cook.originFlag ? `${cook.originFlag} ` : ''}{cook.name.replace(' (démo)', '')}{dist != null ? ` · ${fmtKm(dist)}` : ''}</Text>
                <Text style={{ color: t.text, fontWeight: '700' }}>{chf(dish.price)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={[styles.inner, { paddingHorizontal: 20 }]}>
        <Wordmark />
        <View style={{ height: 14 }} />
        <Pressable onPress={() => router.push('/location')} accessibilityRole="button" accessibilityLabel={L('Changer de lieu', 'Change location')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surface, borderRadius: 999, borderWidth: 1, borderColor: t.border, paddingHorizontal: 14, minHeight: 44, alignSelf: 'flex-start' }}>
          <Ionicons name={prefs.location?.source === 'gps' ? 'navigate' : 'location-outline'} size={16} color={t.primary} />
          <Text style={{ color: t.text, fontWeight: '600' }}>{prefs.location?.label ?? L('Choisir un lieu', 'Choose a location')}</Text>
          <Ionicons name="chevron-down" size={14} color={t.muted} />
        </Pressable>
        <View style={{ height: 10 }} />
        <Pressable onPress={() => router.push('/become-cook')} accessibilityRole="button" accessibilityLabel={L('Devenir cuisinier', 'Become a cook')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.secondary, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, marginBottom: 10 }}>
          <Ionicons name="restaurant-outline" size={18} color={t.onPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.onPrimary, fontWeight: '700' }}>{L('Devenir cuisinier·ère à domicile', 'Become a home cook')}</Text>
            <Text style={{ color: t.onPrimary, opacity: 0.85, fontSize: 12 }}>{L('Règles suisses, hygiène, allergènes — guide clair', 'Swiss rules, hygiene, allergens — clear guide')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={t.onPrimary} />
        </Pressable>
        {bootFallback && !storageReady ? <Notice tone="warning" title={tr('bootFallback')} /> : null}
        {hasDemo ? <DemoBanner text={L('Cuisinier·ères et plats de démonstration (fictifs) — photos libres de droits.', 'Demo cooks and dishes (fictional) — freely licensed photos.')} /> : null}
        <Segmented label={L('Rayon', 'Radius')} options={[5, 15, 50, 200].map((k) => ({ label: k >= 200 ? L('Suisse', 'Switzerland') : `${k} km`, value: k }))} value={prefs.radiusKm} onChange={(v) => setPrefs((p) => ({ ...p, radiusKm: v }))} />
        <Toggle label={L('Halal uniquement', 'Halal only')} value={prefs.halalOnly} onChange={(v) => setPrefs((p) => ({ ...p, halalOnly: v }))} hint={L('Déclaration du cuisinier, non certifiée par Bissabi.', 'Cook’s declaration, not certified by Bissabi.')} />
        <Field label={L('Rechercher', 'Search')} value={q} onChangeText={setQ} placeholder={L('Thiéboudienne, couscous, vegan, Fribourg…', 'Thieboudienne, couscous, vegan, Fribourg…')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
          <Chip label={L('♥ Favoris', '♥ Favourites')} active={favOnly} onPress={() => setFavOnly((v) => !v)} />
          <Chip label={L('Dispo aujourd’hui', 'Available today')} active={availableToday} onPress={() => setAvailableToday((v) => !v)} />
          <Chip label={L('Familial', 'Family-size')} active={familySize} onPress={() => setFamilySize((v) => !v)} />
          {DIETS.map((d) => <Chip key={d.key} label={d[lang]} active={diets.includes(d.key)} onPress={() => toggleDiet(d.key)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {CUISINES.map((c) => (
            <Chip key={c.key} label={`${'flag' in c ? (c as { flag?: string }).flag ?? '' : ''} ${c[lang]}`.trim()} active={cuisine === c.key} onPress={() => setCuisine(cuisine === c.key ? null : c.key)} />
          ))}
        </ScrollView>
        <Pressable onPress={() => setShowMore((v) => !v)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', marginBottom: 8 }}>
          <Text style={{ color: t.primary, fontWeight: '700' }}>{showMore ? L('Masquer les filtres', 'Hide filters') : L('Plus de filtres (canton, prix, note)', 'More filters (canton, price, rating)')}</Text>
        </Pressable>
        {showMore ? (
          <View style={{ gap: 8, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label={L('Tous cantons', 'All cantons')} active={!canton} onPress={() => setCanton(null)} />
              {CANTONS.map((c) => <Chip key={c.key} label={c.key} active={canton === c.key} onPress={() => setCanton(canton === c.key ? null : c.key)} />)}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[null, 12, 16, 20, 25].map((p) => (
                <Chip key={String(p)} label={p == null ? L('Tout prix', 'Any price') : `≤ ${p} CHF`} active={maxPrice === p} onPress={() => setMaxPrice(p)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[null, 4, 4.5].map((r) => (
                <Chip key={String(r)} label={r == null ? L('Toute note', 'Any rating') : `★ ${r}+`} active={minRating === r} onPress={() => setMinRating(r)} />
              ))}
            </ScrollView>
            <Segmented
              label={L('Trier', 'Sort')}
              options={[
                { label: L('Dispo', 'Open'), value: 'available' as SortKey },
                { label: L('Distance', 'Distance'), value: 'distance' as SortKey },
                { label: L('Prix ↑', 'Price ↑'), value: 'priceAsc' as SortKey },
                { label: L('Note', 'Rating'), value: 'rating' as SortKey },
              ]}
              value={sort}
              onChange={setSort}
            />
          </View>
        ) : null}

        {!prefs.location ? <Muted style={{ marginBottom: 10 }}>{L('Lieu non défini : tous les cuisinier·ères sont affichés, sans distance.', 'No location set: all cooks shown, without distance.')} {tr('zoneUnsetHint')}</Muted> : null}

        {zone !== 'outside' && nearCooks.length ? (
          <>
            <H2>{L('Près de chez vous', 'Near you')}</H2>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
              {nearCooks.slice(0, 12).map(({ c, d }) => {
                const r = rating(reviews, c.id);
                return (
                  <Pressable key={c.id} onPress={() => router.push(`/cook/${c.id}`)} accessibilityRole="button" accessibilityLabel={c.name}
                    style={{ width: 170, backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border, padding: 12, gap: 6 }}>
                    <Avatar cook={c} />
                    <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={1}>{c.name}</Text>
                    <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{c.originFlag ? `${c.originFlag} ` : ''}{c.commune}{d != null ? ` · ${fmtKm(d)}` : ''}{c.canton ? ` · ${c.canton}` : ''}</Text>
                    {r.count ? <Stars value={r.avg} size={12} /> : <Text style={{ color: t.muted, fontSize: 12 }}>{L('Nouveau', 'New')}</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {zone !== 'outside' ? (
          <>
            <Rail title={L('Cuisines du monde', 'World cuisines')} items={rails.worldCuisines} />
            {topCooks.length ? (
              <>
                <H2>{L('Meilleures notes', 'Top cooks')}</H2>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
                  {topCooks.map((c) => {
                    if (!c) return null;
                    const r = rating(reviews, c.id);
                    return (
                      <Pressable key={c.id} onPress={() => router.push(`/cook/${c.id}`)} accessibilityRole="button"
                        style={{ width: 160, backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border, padding: 12, gap: 6 }}>
                        <Avatar cook={c} />
                        <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={1}>{c.name}</Text>
                        <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{c.originCountry}</Text>
                        <Stars value={r.avg} size={12} />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
            <Rail title={L('Nouveautés', 'New this week')} items={rails.newThisWeek} />
            <Rail title={L('Portions familiales', 'Family-size')} items={rails.familySize} />
            <Rail title={L('Disponible aujourd’hui', 'Available today')} items={rails.availableToday} />
          </>
        ) : null}

        <H2>{L('Tous les plats', 'All dishes')}</H2>
        {zone === 'outside' ? (
          <Empty icon="location-outline" title={tr('zoneOutsideTitle')} text={tr('zoneOutsideBody')} action={<Button variant="secondary" title={L('Choisir une commune', 'Choose a town')} onPress={() => router.push('/location')} />} />
        ) : rows.length ? rows.map(({ dish, cook, dist, nextSlot }) => (
          <DishCard key={dish.id} dish={dish} cook={cook} distance={dist} nextSlot={nextSlot} onPress={() => router.push(`/dish/${dish.id}`)} />
        )) : (
          <Empty icon="restaurant-outline"
            title={favOnly ? L('Pas encore de favoris', 'No favourites yet') : L('Aucun plat dans ce rayon', 'No dish within this radius')}
            text={favOnly ? L('Touchez ♥ sur un plat pour le retrouver ici.', 'Tap ♥ on a dish to find it here.') : L('Élargissez le rayon, retirez un filtre, ou invitez un·e voisin·e qui cuisine à rejoindre Bissabi Home Made.', 'Widen the radius, remove a filter, or invite a neighbour who cooks to join Bissabi Home Made.')}
            action={!cooks.some((c) => c.demo) ? <Button variant="secondary" title={L('Charger la démo', 'Load demo')} onPress={loadDemo} /> : prefs.radiusKm < 200 ? <Button variant="secondary" title={L('Voir toute la Suisse', 'See all of Switzerland')} onPress={() => setPrefs((p) => ({ ...p, radiusKm: 200 }))} /> : undefined} />
        )}
      </View>
    </ScrollView>
  );
}
