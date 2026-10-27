import { Image, Pressable, Text, View } from 'react-native';
import { useData, useL } from '@/lib/data';
import { dayLabel } from '@/lib/dates';
import { fmtKm } from '@/lib/geo';
import { ALLERGENS, type Allergen, type Cook, type Dish, type Slot } from '@/lib/model';
import { chf } from '@/lib/pricing';
import { Ionicons, shadow } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export const SLOGAN = { fr: 'La saveur du partage — cuisine de quartier authentique par Bissabi', en: 'The taste of sharing — authentic neighbourhood cooking by Bissabi' };

/** Logotype : BISSABI rouge + HOME MADE vert. */
export function Wordmark({ size = 22, slogan = true }: { size?: number; slogan?: boolean }) {
  const { lang } = useL();
  return (
    <View accessibilityRole="header" accessibilityLabel="Bissabi Home Made">
      <Text style={{ fontSize: size, fontWeight: '800', letterSpacing: 2 }}>
        <Text style={{ color: t.primary }}>BISSABI </Text>
        <Text style={{ color: t.success }}>HOME MADE</Text>
      </Text>
      {slogan ? <Text style={{ color: t.muted, fontSize: 13, marginTop: 2, fontStyle: 'italic' }}>{SLOGAN[lang]}</Text> : null}
    </View>
  );
}

const TINTS = ['#F3E6D0', '#E9F0E6', '#F6E1E1', '#EFE8D8', '#E6ECF2'];
/** Visuel du plat : photo du cuisinier si fournie, sinon composition de marque (crème + or). */
export function DishVisual({ dish, height = 150, radius = 14 }: { dish: Dish; height?: number; radius?: number }) {
  if (dish.photo) return <Image source={{ uri: dish.photo }} style={{ width: '100%', height, borderRadius: radius }} resizeMode="cover" accessibilityLabel={dish.title} />;
  const tint = TINTS[dish.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <View style={{ height, borderRadius: radius, backgroundColor: tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} accessibilityLabel={dish.title}>
      <View style={{ position: 'absolute', width: height * 1.1, height: height * 1.1, borderRadius: height, borderWidth: 1, borderColor: t.accent, opacity: 0.45 }} />
      <View style={{ position: 'absolute', width: height * 0.8, height: height * 0.8, borderRadius: height, backgroundColor: '#FFFFFF', opacity: 0.55 }} />
      <Text style={{ fontSize: height * 0.36 }}>{dish.emoji || '🍽️'}</Text>
    </View>
  );
}

export function Avatar({ cook, size = 40 }: { cook: Cook; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: cook.avatarColor, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.accent }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{cook.name.trim().charAt(0).toUpperCase()}</Text>
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
  const map = { cream: [t.surfaceAlt, t.text], green: [t.successBg, t.success], red: ['#FBE7E9', t.primary], gold: ['#F6EED8', '#7A5F12'] } as const;
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
  const { favorites, toggleFav } = useData();
  const fav = favorites.dishes.includes(dish.id);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${dish.title}, ${chf(dish.price)}`} style={[{ backgroundColor: t.surface, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }, shadow(1)]}>
      <DishVisual dish={dish} height={160} radius={0} />
      <Pressable onPress={() => toggleFav('dishes', dish.id)} accessibilityLabel={fav ? L('Retirer des favoris', 'Remove from favourites') : L('Ajouter aux favoris', 'Add to favourites')}
        style={{ position: 'absolute', top: 10, right: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={t.primary} />
      </Pressable>
      <View style={{ padding: 14, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 17, flex: 1 }} numberOfLines={2}>{dish.title}</Text>
          <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{chf(dish.price)}</Text>
        </View>
        <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={1}>
          {cook ? `${cook.name} · ${cook.commune}` : ''}{distance != null ? ` · ${fmtKm(distance)}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {dish.halal ? <Pill label="Halal" tone="green" /> : null}
          {dish.vegetarian ? <Pill label={L('Végétarien', 'Vegetarian')} tone="green" icon="leaf-outline" /> : null}
          {dish.spicy ? <Pill label={L('Épicé', 'Spicy')} tone="red" /> : null}
          <Pill label={dish.allergens.length ? `${L('Allergènes', 'Allergens')} : ${allergenNames(dish.allergens, lang).join(', ')}` : L('Sans allergène majeur déclaré', 'No major allergen declared')} />
        </View>
        <Text style={{ color: nextSlot ? t.success : t.muted, fontSize: 13, fontWeight: '600' }}>
          {nextSlot ? `${L('Prochain créneau', 'Next slot')} : ${dayLabel(nextSlot.date, lang)} · ${nextSlot.from}–${nextSlot.to}` : L('Aucun créneau ouvert pour le moment', 'No open slot right now')}
        </Text>
      </View>
    </Pressable>
  );
}

export function TotalsTable({ subtotal, commission, deliveryFee, total, L }: { subtotal: number; commission: number; deliveryFee: number; total: number; L: (fr: string, en: string) => string }) {
  const row = (a: string, b: string, bold = false) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
      <Text style={{ color: bold ? t.text : t.muted, fontWeight: bold ? '800' : '500', fontSize: bold ? 17 : 15 }}>{a}</Text>
      <Text style={{ color: t.text, fontWeight: bold ? '800' : '600', fontSize: bold ? 17 : 15 }}>{b}</Text>
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
