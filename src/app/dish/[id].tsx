import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Avatar, DishVisual, Pill, Stars, allergenNames } from '@/components/brand';
import { useI18n } from '@/i18n';
import { confirmAsk } from '@/lib/confirm';
import { splitAllergens } from '@/lib/dishPublish';
import { useData, useL } from '@/lib/data';
import { dayLabel } from '@/lib/dates';
import { fmtKm, zoneOf } from '@/lib/geo';
import { openSlotsFor, rating } from '@/lib/market';
import { isBadgeValid } from '@/lib/cookQualification';
import { CUISINES } from '@/lib/model';
import { chf, MIN_LEAD_HOURS } from '@/lib/pricing';
import { Body, Button, Card, Empty, H1, H2, IconButton, ListItem, Muted, Notice, Row, Screen, Spacer, haptic, useFeedback } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function DishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dishes, cooks, slots, reviews, distanceTo, addToCart, clearCart, favorites, toggleFav, cart, prefs } = useData();
  const { L, lang } = useL();
  const { t: tr } = useI18n();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const fb = useFeedback();
  const dish = dishes.find((d) => d.id === id);
  if (!dish) return <Screen><Empty icon="help-circle-outline" title={L('Plat introuvable', 'Dish not found')} text={L('Il a peut-être été retiré par son cuisinier.', 'It may have been removed by its cook.')} /></Screen>;
  const cook = cooks.find((c) => c.id === dish.cookId);
  const open = openSlotsFor(dish, slots);
  const d = cook ? distanceTo(cook) : null;
  const r = cook ? rating(reviews, cook.id) : { avg: 0, count: 0 };
  const fav = favorites.dishes.includes(dish.id);
  const outside = zoneOf(prefs.location) === 'outside';
  const declared = splitAllergens(dish);
  const added_ = () => {
    setAdded(true);
    fb.toast({ text: L('Ajouté au panier', 'Added to cart'), icon: 'bag-check-outline' });
  };
  const add = () => {
    const res = addToCart(dish, qty);
    if (res === 'other_cook')
      return confirmAsk(L('Votre panier contient les plats d’un·e autre cuisinier·ère. Une commande = un·e cuisinier·ère. Vider le panier et ajouter ce plat ?', 'Your cart has dishes from another cook. One order = one cook. Empty the cart and add this dish?'), () => { clearCart(); setTimeout(() => { addToCart(dish, qty); added_(); }, 0); }, L('Vider et ajouter', 'Empty & add'));
    added_();
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: dish.title, headerRight: () => <IconButton icon={fav ? 'heart' : 'heart-outline'} label={L('Favori', 'Favourite')} onPress={() => { haptic(fav ? 'tap' : 'success'); toggleFav('dishes', dish.id); }} /> }} />
      <DishVisual dish={dish} height={240} />
      {dish.demo ? <Muted style={{ marginTop: 6 }}>{L('Photo d’illustration libre de droits (démo). Voir docs/ATTRIBUTION.md.', 'Royalty-free illustration photo (demo). See docs/ATTRIBUTION.md.')}</Muted> : null}
      <Spacer />
      <H1>{dish.title}</H1>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '800' }}>{chf(dish.price)} <Text style={{ color: t.muted, fontSize: 14, fontWeight: '500' }}>/ {L('portion', 'portion')}</Text></Text>
      <Spacer h={8} />
      <Row wrap gap={6}>
        <Pill label={CUISINES.find((c) => c.key === dish.cuisine)?.[lang] ?? ''} tone="gold" />
        {dish.halal ? <Pill label={L('Halal (déclaré)', 'Halal (declared)')} tone="green" icon="checkmark-circle" /> : <Pill label={L('Non halal (déclaré)', 'Not halal (declared)')} tone="cream" />}
        {(dish.deliveryModes ?? cook?.deliveryModes ?? (cook?.delivers ? ['pickup', 'delivery'] : ['pickup'])).includes('partner') ? <Pill label={L('Coursier partenaire', 'Partner courier')} tone="gold" /> : null}
        {cook && isBadgeValid(cook.qualification) ? <Pill label={L('Cook formé (badge Bissabi)', 'Trained cook (Bissabi badge)')} tone="green" /> : null}
        {dish.vegetarian ? <Pill label={L('Végétarien', 'Vegetarian')} tone="green" /> : null}
        {dish.vegan ? <Pill label="Vegan" tone="green" /> : null}
        {dish.glutenFree ? <Pill label={L('Sans gluten', 'Gluten-free')} /> : null}
        {dish.familySize ? <Pill label={L('Familial', 'Family-size')} tone="gold" /> : null}
        {(dish.spiceLevel ?? (dish.spicy ? 2 : 0)) > 0 ? <Pill label={`${L('Épicé', 'Spicy')} ${'🌶'.repeat(dish.spiceLevel ?? 1)}`} tone="red" /> : null}
        {dish.demo ? <Pill label="démo" /> : null}
      </Row>
      <Spacer />
      <Body>{dish.description}</Body>
      <Spacer />
      <Card>
        <H2>{tr('composition')}</H2>
        {dish.portionLabel ? <Body>{dish.portionLabel}</Body> : null}
        {dish.ingredients.length ? (
          <Body>{dish.ingredients.map((i) => `${i.name} ${i.qty} ${i.unit}`).join(' · ')}</Body>
        ) : <Muted>{tr('notProvided')}</Muted>}
        <Spacer h={8} />
        <H2>{L('Allergènes', 'Allergens')}</H2>
        {declared.present.length
          ? <Body>{allergenNames(declared.present, lang).join(' · ')}</Body>
          : <Body>{L('Aucun des 14 allergènes majeurs déclaré présent.', 'None of the 14 major allergens declared present.')}</Body>}
        {declared.traces.length ? <Body style={{ marginTop: 6 }}>{tr('allergenTracesLabel')} : {allergenNames(declared.traces, lang).join(' · ')}</Body> : null}
        {declared.complete ? <Muted style={{ marginTop: 6 }}>{tr('allergenAbsentSummary')}</Muted> : <Muted style={{ marginTop: 6 }}>{tr('legacyAllergens')}</Muted>}
        <Muted style={{ marginTop: 6 }}>{L('Déclaration du cuisinier. En cas d’allergie sévère, contactez-le via la note de commande avant de commander.', 'Declared by the cook. If you have a severe allergy, mention it in the order note before ordering.')}</Muted>
        {dish.animalOrigin && dish.animalOrigin !== 'none' ? <Body style={{ marginTop: 8 }}>{tr('provenance')} : {dish.provenance || tr('notProvided')}</Body> : null}
        {dish.isBakery ? <Body style={{ marginTop: 8 }}>{tr('productionCountry')} : {dish.productionCountry || tr('notProvided')}</Body> : null}
        <Body style={{ marginTop: 8 }}>{tr('conservation')} : {dish.conservation || tr('notProvided')}</Body>
        <Body style={{ marginTop: 8 }}>{tr('reheating')} : {dish.reheating || tr('notProvided')}</Body>
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
        <Card>{open.slice(0, 5).map((s) => <ListItem key={s.id} icon="time-outline" title={`${dayLabel(s.date, lang)} · ${s.from}–${s.to}`} subtitle={s.modes.map((m) => (m === 'pickup' ? L('Retrait', 'Pickup') : m === 'partner' ? L('Partenaire', 'Partner') : L('Livraison cook', 'Cook delivery'))).join(' / ')} />)}</Card>
      ) : <Notice tone="warning" title={L('Aucun créneau ouvert', 'No open slot')} text={L('Ajoutez-le en favori : vous le retrouverez dès que le cuisinier ouvre un créneau.', 'Save it as a favourite to find it when the cook opens a slot.')} />}
      <Notice
        tone="warning"
        title={L('Responsabilité', 'Liability')}
        text={L(
          'Bissabi met en relation. Le cook est responsable du plat (préparation, allergènes, hygiène). Un coursier partenaire, le cas échéant, est responsable du transport et de la chaîne pendant la course. Projet CGU sur Mentions légales — à faire valider par un avocat CH.',
          'Bissabi matches parties. The cook is responsible for the dish (prep, allergens, hygiene). A partner courier, if any, is responsible for transport and the chain during the run. Draft terms on Legal — CH lawyer review required.',
        )}
      />
      {dish.halal && cook?.halalCertificationNote ? <Muted style={{ marginBottom: 8 }}>{L('Note halal cook : ', 'Cook halal note: ')}{cook.halalCertificationNote}</Muted> : null}
      <Spacer />
      <Row>
        <IconButton icon="remove" label={L('Moins', 'Less')} onPress={() => { haptic('select'); setQty((q) => Math.max(1, q - 1)); }} />
        <Text style={{ fontSize: 18, fontWeight: '700', minWidth: 30, textAlign: 'center' }}>{qty}</Text>
        <IconButton icon="add" label={L('Plus', 'More')} onPress={() => { haptic('select'); setQty((q) => Math.min(20, q + 1)); }} />
        <Button style={{ flex: 1 }} icon="bag-add-outline" title={`${L('Ajouter', 'Add')} · ${chf(dish.price * qty)}`} disabled={!open.length || outside} onPress={add} />
      </Row>
      {outside ? <Notice tone="warning" title={tr('zoneOutsideTitle')} text={tr('zoneOutsideBody')} /> : null}
      {added ? (<><Spacer h={10} /><Notice tone="success" title={L('Ajouté au panier', 'Added to cart')} text={`${cart.lines.reduce((s, l) => s + l.qty, 0)} ${L('portion(s) dans le panier', 'portion(s) in cart')}`} /><Button variant="secondary" title={L('Voir le panier', 'View cart')} onPress={() => router.push('/cart')} /></>) : null}
      <Spacer />
      <Button variant="ghost" small icon="flag-outline" title={L('Signaler ce plat', 'Report this dish')} onPress={() => router.push({ pathname: '/report', params: { target: 'dish', id: dish.id } })} />
    </Screen>
  );
}
