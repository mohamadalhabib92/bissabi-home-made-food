import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, DishCard, Stars, Wordmark } from '@/components/brand';
import { useI18n } from '@/i18n';
import { useData, useL } from '@/lib/data';
import { fmtKm, zoneOf } from '@/lib/geo';
import { buyerVisibleSlots } from '@/lib/launchCheckout';
import { openSlotsFor, rating } from '@/lib/market';
import { authoredText } from '@/i18n/authored';
import { pilotText } from '@/i18n/catalog';
import { describeHomeOffer } from '@/lib/pilot/homeOffer';
import { CUISINES, type Cuisine } from '@/lib/model';
import { Button, Card, Chip, DemoBanner, Empty, Field, H2, Ionicons, Muted, Notice, Segmented, Toggle, styles } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Discover() {
  const { prefs, setPrefs, cooks, dishes, slots, reviews, distanceTo, favorites, hasDemo, loadDemo, bootFallback, storageReady, preservation } = useData();
  const { L, lang } = useL();
  const { t: tr } = useI18n();
  const zone = zoneOf(prefs.location);
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
  const offer = useMemo(() => describeHomeOffer({
    dishes, slots, cooks, locale: lang, now: new Date(),
  }).slice(0, 3), [dishes, slots, cooks, lang]);

  const list = dishes
    .filter((d) => d.active && ids.has(d.cookId))
    .filter((d) => !prefs.halalOnly || d.halal)
    .filter((d) => !cuisine || d.cuisine === cuisine)
    .filter((d) => !favOnly || favorites.dishes.includes(d.id) || favorites.cooks.includes(d.cookId))
    .filter((d) => !needle || `${d.title} ${d.description} ${cooks.find((c) => c.id === d.cookId)?.name ?? ''}`.toLowerCase().includes(needle))
    .map((d) => ({ d, next: openSlotsFor(d, buyerVisibleSlots(slots))[0], dist: distanceTo(cooks.find((c) => c.id === d.cookId)!) }))
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
        <Card>
          <H2>{pilotText(lang, 'homeQuestion').text}</H2>
          {offer.length ? offer.map((line) => (
            <Muted key={line.dishId}>{line.title} · {line.cookName} · {line.when} · {line.price}</Muted>
          )) : <Muted>{pilotText(lang, 'homeEmpty').text}</Muted>}
          <Muted>{pilotText(lang, 'homeNote').text}</Muted>
          <Button variant="secondary" title={pilotText(lang, 'homeCta').text} onPress={() => router.push('/pilot')} />
        </Card>
        {bootFallback && !storageReady ? <Notice tone="warning" title={tr('bootFallback')} /> : null}
        {preservation.some((entry) => entry.heldOriginal) ? <Notice tone="warning" title={tr('preserveHeldTitle')} text={tr('preserveHeldBody')} /> : null}
        {preservation.some((entry) => entry.unknownCount > 0) ? <Notice tone="info" title={tr('preserveUnknownTitle')} text={tr('preserveUnknownBody')} /> : null}
        {hasDemo ? <DemoBanner text={L('Cuisinier·ères et plats de démonstration (fictifs).', 'Demo cooks and dishes (fictional).')} /> : null}
        <Segmented label={L('Rayon', 'Radius')} options={[1, 2, 3, 4, 5].map((k) => ({ label: `${k} km`, value: k }))} value={prefs.radiusKm} onChange={(v) => setPrefs((p) => ({ ...p, radiusKm: v }))} />
        <Toggle label={L('Halal uniquement', 'Halal only')} value={prefs.halalOnly} onChange={(v) => setPrefs((p) => ({ ...p, halalOnly: v }))} hint={L('Déclaration du cuisinier, non certifiée par Bissabi.', 'Cook’s declaration, not certified by Bissabi.')} />
        <Field label={L('Rechercher', 'Search')} value={q} onChangeText={setQ} placeholder={L('Thiéboudienne, couscous, végétarien…', 'Thieboudienne, couscous, veggie…')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          <Chip label={L('♥ Favoris', '♥ Favourites')} active={favOnly} onPress={() => setFavOnly((v) => !v)} />
          {CUISINES.map((c) => <Chip key={c.key} label={authoredText(c, lang)} active={cuisine === c.key} onPress={() => setCuisine(cuisine === c.key ? null : c.key)} />)}
        </ScrollView>

        {!prefs.location ? <Muted style={{ marginBottom: 10 }}>{L('Lieu non défini : tous les cuisinier·ères sont affichés, sans distance.', 'No location set: all cooks shown, without distance.')} {tr('zoneUnsetHint')}</Muted> : null}
        {zone !== 'outside' && nearCooks.length ? (
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
        {zone === 'outside' ? (
          <Empty icon="location-outline" title={tr('zoneOutsideTitle')} text={tr('zoneOutsideBody')} action={<Button variant="secondary" title={L('Choisir une commune', 'Choose a town')} onPress={() => router.push('/location')} />} />
        ) : list.length ? list.map(({ d, next, dist }) => (
          <DishCard key={d.id} dish={d} cook={cooks.find((c) => c.id === d.cookId)} distance={dist} nextSlot={next} onPress={() => router.push(`/dish/${d.id}`)} />
        )) : (
          <Empty icon="restaurant-outline"
            title={favOnly ? L('Pas encore de favoris', 'No favourites yet') : L('Aucun plat dans ce rayon', 'No dish within this radius')}
            text={favOnly ? L('Touchez ♥ sur un plat pour le retrouver ici.', 'Tap ♥ on a dish to find it here.') : L('Élargissez le rayon, retirez un filtre, ou invitez un·e voisin·e qui cuisine à rejoindre Bissabi Home Made.', 'Widen the radius, remove a filter, or invite a neighbour who cooks to join Bissabi Home Made.')}
            action={!cooks.some((c) => c.demo) && !preservation.some((entry) => ['cooks', 'dishes', 'slots', 'orders', 'reviews'].includes(entry.key) && !entry.hydrated) ? <Button variant="secondary" title={L('Charger la démo', 'Load demo')} onPress={loadDemo} /> : prefs.radiusKm < 5 ? <Button variant="secondary" title={L('Passer à 5 km', 'Switch to 5 km')} onPress={() => setPrefs((p) => ({ ...p, radiusKm: 5 }))} /> : undefined} />
        )}
      </View>
    </ScrollView>
  );
}
