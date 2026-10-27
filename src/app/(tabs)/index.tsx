import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, DishCard, Stars, Wordmark } from '@/components/brand';
import { useData, useL } from '@/lib/data';
import { fmtKm } from '@/lib/geo';
import { openSlotsFor, rating } from '@/lib/market';
import { CUISINES, type Cuisine } from '@/lib/model';
import { Button, Chip, DemoBanner, Empty, Field, H2, Ionicons, Muted, Segmented, Toggle, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Discover() {
  const { prefs, setPrefs, cooks, dishes, slots, reviews, distanceTo, favorites, hasDemo, loadDemo } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  const nearCooks = useMemo(() => cooks
    .filter((c) => !c.isMe)
    .map((c) => ({ c, d: distanceTo(c) }))
    .filter(({ d }) => d == null || d <= prefs.radiusKm)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0)), [cooks, distanceTo, prefs.radiusKm]);
  const ids = new Set(nearCooks.map((x) => x.c.id));
  const needle = q.trim().toLowerCase();
  const list = dishes
    .filter((d) => d.active && ids.has(d.cookId))
    .filter((d) => !prefs.halalOnly || d.halal)
    .filter((d) => !cuisine || d.cuisine === cuisine)
    .filter((d) => !favOnly || favorites.dishes.includes(d.id) || favorites.cooks.includes(d.cookId))
    .filter((d) => !needle || `${d.title} ${d.description} ${cooks.find((c) => c.id === d.cookId)?.name ?? ''}`.toLowerCase().includes(needle))
    .map((d) => ({ d, next: openSlotsFor(d, slots)[0], dist: distanceTo(cooks.find((c) => c.id === d.cookId)!) }))
    .sort((a, b) => (a.next ? 0 : 1) - (b.next ? 0 : 1) || (a.dist ?? 0) - (b.dist ?? 0));

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
        <View style={{ height: 14 }} />
        {hasDemo ? <DemoBanner text={L('Cuisinier·ères et plats de démonstration (fictifs).', 'Demo cooks and dishes (fictional).')} /> : null}
        <Segmented label={L('Rayon', 'Radius')} options={[1, 2, 3, 4, 5].map((k) => ({ label: `${k} km`, value: k }))} value={prefs.radiusKm} onChange={(v) => setPrefs((p) => ({ ...p, radiusKm: v }))} />
        <Toggle label={L('Halal uniquement', 'Halal only')} value={prefs.halalOnly} onChange={(v) => setPrefs((p) => ({ ...p, halalOnly: v }))} hint={L('Déclaration du cuisinier, non certifiée par Bissabi.', 'Cook’s declaration, not certified by Bissabi.')} />
        <Field label={L('Rechercher', 'Search')} value={q} onChangeText={setQ} placeholder={L('Thiéboudienne, couscous, végétarien…', 'Thieboudienne, couscous, veggie…')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          <Chip label={L('♥ Favoris', '♥ Favourites')} active={favOnly} onPress={() => setFavOnly((v) => !v)} />
          {CUISINES.map((c) => <Chip key={c.key} label={c[lang]} active={cuisine === c.key} onPress={() => setCuisine(cuisine === c.key ? null : c.key)} />)}
        </ScrollView>

        {!prefs.location ? <Muted style={{ marginBottom: 10 }}>{L('Lieu non défini : tous les cuisinier·ères sont affichés, sans distance.', 'No location set: all cooks shown, without distance.')}</Muted> : null}

        {nearCooks.length ? (
          <>
            <H2>{L('Près de chez vous', 'Near you')}</H2>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
              {nearCooks.map(({ c, d }) => {
                const r = rating(reviews, c.id);
                return (
                  <Pressable key={c.id} onPress={() => router.push(`/cook/${c.id}`)} accessibilityRole="button" accessibilityLabel={c.name}
                    style={{ width: 170, backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.border, padding: 12, gap: 6 }}>
                    <Avatar cook={c} />
                    <Text style={{ color: t.text, fontWeight: '700' }} numberOfLines={1}>{c.name}</Text>
                    <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>{c.commune}{d != null ? ` · ${fmtKm(d)}` : ''}</Text>
                    {r.count ? <Stars value={r.avg} size={12} /> : <Text style={{ color: t.muted, fontSize: 12 }}>{L('Nouveau', 'New')}</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}

        <H2>{L('Plats à commander à l’avance', 'Dishes to pre-order')}</H2>
        {list.length ? list.map(({ d, next, dist }) => (
          <DishCard key={d.id} dish={d} cook={cooks.find((c) => c.id === d.cookId)} distance={dist} nextSlot={next} onPress={() => router.push(`/dish/${d.id}`)} />
        )) : (
          <Empty icon="restaurant-outline"
            title={favOnly ? L('Pas encore de favoris', 'No favourites yet') : L('Aucun plat dans ce rayon', 'No dish within this radius')}
            text={favOnly ? L('Touchez ♥ sur un plat pour le retrouver ici.', 'Tap ♥ on a dish to find it here.') : L('Élargissez le rayon, retirez un filtre, ou invitez un·e voisin·e qui cuisine à rejoindre Bissabi Home Made.', 'Widen the radius, remove a filter, or invite a neighbour who cooks to join Bissabi Home Made.')}
            action={!cooks.some((c) => c.demo) ? <Button variant="secondary" title={L('Charger la démo', 'Load demo')} onPress={loadDemo} /> : prefs.radiusKm < 5 ? <Button variant="secondary" title={L('Passer à 5 km', 'Switch to 5 km')} onPress={() => setPrefs((p) => ({ ...p, radiusKm: 5 }))} /> : undefined} />
        )}
      </View>
    </ScrollView>
  );
}
