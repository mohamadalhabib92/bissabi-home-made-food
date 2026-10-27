import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, DishVisual, Pill, Stars, allergenNames } from '@/components/brand';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { dayLabel } from '@/lib/dates';
import { fmtKm } from '@/lib/geo';
import { openSlotsFor, rating } from '@/lib/market';
import { CUISINES } from '@/lib/model';
import { chf, MIN_LEAD_HOURS } from '@/lib/pricing';
import { Body, Button, Card, Empty, H1, H2, IconButton, ListItem, Muted, Notice, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function DishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dishes, cooks, slots, reviews, distanceTo, addToCart, clearCart, favorites, toggleFav, cart } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const dish = dishes.find((d) => d.id === id);
  if (!dish) return <Screen><Empty icon="help-circle-outline" title={L('Plat introuvable', 'Dish not found')} text={L('Il a peut-être été retiré par son cuisinier.', 'It may have been removed by its cook.')} /></Screen>;
  const cook = cooks.find((c) => c.id === dish.cookId);
  const open = openSlotsFor(dish, slots);
  const d = cook ? distanceTo(cook) : null;
  const r = cook ? rating(reviews, cook.id) : { avg: 0, count: 0 };
  const fav = favorites.dishes.includes(dish.id);
  const add = () => {
    const res = addToCart(dish, qty);
    if (res === 'other_cook')
      return confirmAsk(L('Votre panier contient les plats d’un·e autre cuisinier·ère. Une commande = un·e cuisinier·ère. Vider le panier et ajouter ce plat ?', 'Your cart has dishes from another cook. One order = one cook. Empty the cart and add this dish?'), () => { clearCart(); setTimeout(() => { addToCart(dish, qty); setAdded(true); }, 0); }, L('Vider et ajouter', 'Empty & add'));
    setAdded(true);
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: dish.title, headerRight: () => <IconButton icon={fav ? 'heart' : 'heart-outline'} label={L('Favori', 'Favourite')} onPress={() => toggleFav('dishes', dish.id)} /> }} />
      <DishVisual dish={dish} height={220} />
      <Spacer />
      <H1>{dish.title}</H1>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>{chf(dish.price)} <Text style={{ color: t.muted, fontSize: 14, fontWeight: '500' }}>/ {L('portion', 'portion')}</Text></Text>
      <Spacer h={8} />
      <Row wrap gap={6}>
        <Pill label={CUISINES.find((c) => c.key === dish.cuisine)?.[lang] ?? ''} tone="gold" />
        {dish.halal ? <Pill label={L('Halal (déclaré)', 'Halal (declared)')} tone="green" /> : null}
        {dish.vegetarian ? <Pill label={L('Végétarien', 'Vegetarian')} tone="green" /> : null}
        {dish.spicy ? <Pill label={L('Épicé', 'Spicy')} tone="red" /> : null}
        {dish.demo ? <Pill label="démo" /> : null}
      </Row>
      <Spacer />
      <Body>{dish.description}</Body>
      <Spacer />
      <Card>
        <H2>{L('Allergènes', 'Allergens')}</H2>
        {dish.allergens.length
          ? <Body>{allergenNames(dish.allergens, lang).join(' · ')}</Body>
          : <Body>{L('Aucun des 14 allergènes majeurs, confirmé par le cuisinier.', 'None of the 14 major allergens, confirmed by the cook.')}</Body>}
        <Muted style={{ marginTop: 6 }}>{L('Déclaration du cuisinier. En cas d’allergie sévère, contactez-le via la note de commande avant de commander.', 'Declared by the cook. If you have a severe allergy, mention it in the order note before ordering.')}</Muted>
      </Card>
      {cook ? (
        <Card onPress={() => router.push(`/cook/${cook.id}`)} accessibilityLabel={cook.name}>
          <Row>
            <Avatar cook={cook} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16 }}>{cook.name}</Text>
              <Muted>{cook.commune}{d != null ? ` · ${fmtKm(d)}` : ''} · {cook.delivers ? L('Retrait ou livraison', 'Pickup or delivery') : L('Retrait uniquement', 'Pickup only')}</Muted>
              {r.count ? <Row gap={6}><Stars value={r.avg} /><Muted>({r.count})</Muted></Row> : null}
            </View>
          </Row>
        </Card>
      ) : null}
      <H2>{L('Créneaux disponibles', 'Available slots')}</H2>
      <Muted style={{ marginBottom: 8 }}>{L(`Commande au moins ${Math.max(MIN_LEAD_HOURS, dish.leadHours)} h à l’avance. Vous choisirez le créneau au paiement.`, `Order at least ${Math.max(MIN_LEAD_HOURS, dish.leadHours)} h ahead. You’ll pick the slot at checkout.`)}</Muted>
      {open.length ? (
        <Card>{open.slice(0, 5).map((s) => <ListItem key={s.id} icon="time-outline" title={`${dayLabel(s.date, lang)} · ${s.from}–${s.to}`} subtitle={s.modes.map((m) => (m === 'pickup' ? L('Retrait', 'Pickup') : L('Livraison', 'Delivery'))).join(' / ')} />)}</Card>
      ) : <Notice tone="warning" title={L('Aucun créneau ouvert', 'No open slot')} text={L('Ajoutez-le en favori : vous le retrouverez dès que le cuisinier ouvre un créneau.', 'Save it as a favourite to find it when the cook opens a slot.')} />}
      <Spacer />
      <Row>
        <IconButton icon="remove" label={L('Moins', 'Less')} onPress={() => setQty((q) => Math.max(1, q - 1))} />
        <Text style={{ fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'center' }}>{qty}</Text>
        <IconButton icon="add" label={L('Plus', 'More')} onPress={() => setQty((q) => Math.min(20, q + 1))} />
        <Button style={{ flex: 1 }} icon="bag-add-outline" title={`${L('Ajouter', 'Add')} · ${chf(dish.price * qty)}`} disabled={!open.length} onPress={add} />
      </Row>
      {added ? (<><Spacer h={10} /><Notice tone="success" title={L('Ajouté au panier', 'Added to cart')} text={`${cart.lines.reduce((s, l) => s + l.qty, 0)} ${L('portion(s) dans le panier', 'portion(s) in cart')}`} /><Button variant="secondary" title={L('Voir le panier', 'View cart')} onPress={() => router.push('/cart')} /></>) : null}
      <Spacer />
      <Button variant="ghost" small icon="flag-outline" title={L('Signaler ce plat', 'Report this dish')} onPress={() => router.push({ pathname: '/report', params: { target: 'dish', id: dish.id } })} />
    </Screen>
  );
}
