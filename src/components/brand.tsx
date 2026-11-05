import { Image, Pressable, Text, View } from 'react-native';
import { useData, useL } from '@/lib/data';
import { dayLabel } from '@/lib/dates';
import { fmtKm } from '@/lib/geo';
import { dishImageSource } from '@/lib/dishImages';
import { ALLERGENS, type Allergen, type Cook, type Dish, type Slot } from '@/lib/model';
import { chf } from '@/lib/pricing';
import { splitAllergens } from '@/lib/dishPublish';
import { Ionicons, shadow } from '@/ui/kit';
import { useAppFonts } from '@/ui/fonts';
import { theme as t } from '@/ui/theme';

export const SLOGAN = { fr: 'La saveur du partage — cuisine de quartier authentique par Bissabi', en: 'The taste of sharing — authentic neighbourhood cooking by Bissabi' };

/** Logotype : BISSABI rouge + HOME MADE vert. */
export function Wordmark({ size = 22, slogan = true }: { size?: number; slogan?: boolean }) {
  const { lang } = useL();
  const fonts = useAppFonts();
  return (
    <View accessibilityRole="header" accessibilityLabel="Bissabi Home Made">
      <Text style={{ fontSize: size, fontWeight: '600', letterSpacing: 2, fontFamily: fonts.display }}>
        <Text style={{ color: t.primary }}>BISSABI </Text>
        <Text style={{ color: t.secondary }}>HOME MADE</Text>
      </Text>
      {slogan ? <Text style={{ color: t.muted, fontSize: 13, marginTop: 2, fontStyle: 'italic' }}>{SLOGAN[lang]}</Text> : null}
    </View>
  );
}

/** Visuel du plat : photo locale (photoKey) ou uri cuisinier, sinon composition de marque. */
export function DishVisual({ dish, height = 150, radius = 14 }: { dish: Dish; height?: number; radius?: number }) {
  const local = dishImageSource(dish.photoKey);
  if (local) return <Image source={local} style={{ width: '100%', height, borderRadius: radius }} resizeMode="cover" accessibilityLabel={dish.title} />;
  if (dish.photo) return <Image source={{ uri: dish.photo }} style={{ width: '100%', height, borderRadius: radius }} resizeMode="cover" accessibilityLabel={dish.title} />;
  const tint = t.dishTints[dish.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % t.dishTints.length];
  return (
    <View style={{ height, borderRadius: radius, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} accessibilityLabel={dish.title}>
      <View style={{ position: 'absolute', width: height * 1.1, height: height * 1.1, borderRadius: height, borderWidth: 1, borderColor: t.accent, opacity: 0.45 }} />
      <View style={{ position: 'absolute', width: height * 0.8, height: height * 0.8, borderRadius: height, backgroundColor: t.surface, opacity: 0.55 }} />
      <Text style={{ fontSize: height * 0.36 }}>{dish.emoji || '🍽️'}</Text>
    </View>
  );
}

export function Avatar({ cook, size = 40 }: { cook: Cook; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: cook.avatarColor, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.accent }}>
      <Text style={{ color: t.onPrimary, fontWeight: '800', fontSize: size * 0.42 }}>{cook.name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Ionicons key={i} name={value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half' : 'star-outline'} size={size} color={t.accent} />)}
    </View>
  );
}

export function Pill({ label, tone = 'cream', icon }: { label: string; tone?: 'cream' | 'green' | 'red' | 'gold'; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  const map = { cream: [t.surfaceAlt, t.text], green: [t.successBg, t.success], red: [t.dangerBg, t.primary], gold: [t.accentBg, t.accentInk] } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function allergenNames(keys: Allergen[], lang: 'fr' | 'en') {
  return keys.map((k) => ALLERGENS.find((a) => a.key === k)?.[lang] ?? k);
}

export function DishCard({ dish, cook, distance, nextSlot, onPress }: { dish: Dish; cook?: Cook; distance: number | null; nextSlot?: Slot; onPress: () => void }) {
  const { L, lang } = useL();
  const fonts = useAppFonts();
  const { favorites, toggleFav } = useData();
  const fav = favorites.dishes.includes(dish.id);
  const parts = splitAllergens(dish);
  const allergenLine = parts.traces.length
    ? `${L('Allergènes', 'Allergens')} : ${allergenNames(parts.present, lang).join(', ') || L('aucun', 'none')} · ${L('Traces', 'Traces')} : ${allergenNames(parts.traces, lang).join(', ')}`
    : (parts.present.length ? `${L('Allergènes', 'Allergens')} : ${allergenNames(parts.present, lang).join(', ')}` : L('Sans allergène majeur déclaré', 'No major allergen declared'));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${dish.title}, ${chf(dish.price)}`} style={[{ backgroundColor: t.surface, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }, shadow(1)]}>
      <DishVisual dish={dish} height={160} radius={0} />
      <Pressable onPress={() => toggleFav('dishes', dish.id)} accessibilityRole="button" accessibilityState={{ selected: fav }} accessibilityLabel={fav ? L('Retirer des favoris', 'Remove from favourites') : L('Ajouter aux favoris', 'Add to favourites')}
        style={{ position: 'absolute', top: 10, right: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: t.scrim, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={t.primary} />
      </Pressable>
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 17, flex: 1 }} numberOfLines={2}>{dish.title}</Text>
          <Text style={{ color: t.text, fontWeight: '500', fontSize: t.type.price, fontFamily: fonts.price }}>{chf(dish.price)}</Text>
        </View>
        <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={1}>
          {cook ? `${cook.name} · ${cook.commune}` : ''}{distance != null ? ` · ${fmtKm(distance)}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {dish.halal ? <Pill label="Halal" tone="green" /> : null}
          {dish.vegetarian ? <Pill label={L('Végétarien', 'Vegetarian')} tone="green" icon="leaf-outline" /> : null}
          {dish.vegan ? <Pill label="Vegan" tone="green" /> : null}
          {dish.glutenFree ? <Pill label={L('Sans gluten', 'Gluten-free')} tone="cream" /> : null}
          {dish.familySize ? <Pill label={L('Familial', 'Family')} tone="gold" /> : null}
          {dish.spicy ? <Pill label={L('Épicé', 'Spicy')} tone="red" /> : null}
          <Pill label={allergenLine} />
        </View>
        <Text style={{ color: nextSlot ? t.success : t.muted, fontSize: 13, fontWeight: '600' }}>
          {nextSlot ? `${L('Prochain créneau', 'Next slot')} : ${dayLabel(nextSlot.date, lang)} · ${nextSlot.from}–${nextSlot.to}` : L('Aucun créneau ouvert pour le moment', 'No open slot right now')}
        </Text>
      </View>
    </Pressable>
  );
}

export function TotalsTable({ subtotal, commission, deliveryFee, total, L }: { subtotal: number; commission: number; deliveryFee: number; total: number; L: (fr: string, en: string) => string }) {
  const fonts = useAppFonts();
  const row = (a: string, b: string, bold = false) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={{ color: bold ? t.text : t.muted, fontWeight: bold ? '800' : '500', fontSize: bold ? 17 : 15 }}>{a}</Text>
      <Text style={{ color: t.text, fontWeight: bold ? '500' : '500', fontSize: bold ? t.type.price : 15, fontFamily: fonts.price }}>{b}</Text>
    </View>
  );
  return (
    <View>
      {row(L('Plats', 'Dishes'), chf(subtotal))}
      {row(L('Commission plateforme (15 %)', 'Platform commission (15%)'), chf(commission))}
      {row(L('Frais de livraison', 'Delivery fee'), deliveryFee ? chf(deliveryFee) : L('Retrait — gratuit', 'Pickup — free'))}
      <View style={{ height: 1, backgroundColor: t.border, marginVertical: 6 }} />
      {row(L('Total TTC', 'Total'), chf(total), true)}
    </View>
  );
}
