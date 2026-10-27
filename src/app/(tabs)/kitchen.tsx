import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Avatar, DishVisual } from '@/components/brand';
import { checklistDone } from '@/lib/cookutil';
import { useData, useL } from '@/lib/data';
import { dayLabel, todayISO } from '@/lib/dates';
import { chf } from '@/lib/pricing';
import { STATUS_LABEL } from '@/lib/status';
import { Badge, Body, Button, Card, DemoBanner, Empty, H1, H2, ListItem, Muted, Notice, Row, Screen, Spacer, Stat } from '@/ui/kit';

export default function Kitchen() {
  const { myCook, dishes, slots, orders, addKitchenDemo } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  if (!myCook)
    return (
      <Screen>
        <Empty icon="flame-outline" title={L('Partagez votre cuisine', 'Share your cooking')}
          text={L('Proposez vos plats faits maison à vos voisins, sur vos créneaux, à vos prix. Vous restez responsable de la conformité de votre cuisine.', 'Offer your home-made dishes to neighbours, on your slots, at your prices. You remain responsible for your kitchen’s compliance.')}
          action={<Button title={L('Créer mon profil cuisinier', 'Create my cook profile')} icon="arrow-forward" onPress={() => router.push('/studio/profile')} />} />
        <Notice tone="info" title={L('Comment ça marche', 'How it works')} text={L('1. Profil + checklist hygiène · 2. Plats avec allergènes · 3. Créneaux de retrait/livraison · 4. Vous acceptez ou refusez chaque commande.', '1. Profile + hygiene checklist · 2. Dishes with allergens · 3. Pickup/delivery slots · 4. You accept or refuse each order.')} />
      </Screen>
    );
  const mine = dishes.filter((d) => d.cookId === myCook.id);
  const inc = orders.filter((o) => o.side === 'cook' && o.cookId === myCook.id);
  const pending = inc.filter((o) => o.status === 'requested');
  const upcoming = inc.filter((o) => ['accepted', 'preparing', 'ready'].includes(o.status)).sort((a, b) => (a.slotDate + a.slotFrom).localeCompare(b.slotDate + b.slotFrom));
  const mySlots = slots.filter((s) => s.cookId === myCook.id && s.date >= todayISO());
  const done = inc.filter((o) => o.status === 'completed');
  const net = done.reduce((s, o) => s + o.subtotal + o.deliveryFee, 0);
  const ready = checklistDone(myCook);
  const row = (o: (typeof inc)[number]) => (
    <ListItem key={o.id} icon="receipt-outline" title={`${o.buyerName} · ${o.lines.reduce((s, l) => s + l.qty, 0)} ${L('portion(s)', 'portion(s)')}`} subtitle={`${dayLabel(o.slotDate, lang)} ${o.slotFrom}–${o.slotTo} · ${o.mode === 'pickup' ? L('Retrait', 'Pickup') : L('Livraison', 'Delivery')}${o.demo ? ' · démo' : ''}`} right={<Badge label={STATUS_LABEL[o.status][lang]} tone={STATUS_LABEL[o.status].tone} />} onPress={() => router.push(`/studio/order/${o.id}`)} />
  );
  return (
    <Screen>
      <Row>
        <Avatar cook={myCook} size={52} />
        <View style={{ flex: 1 }}><H1>{myCook.name}</H1><Muted>{myCook.commune}</Muted></View>
        <Button small variant="secondary" title={L('Profil', 'Profile')} onPress={() => router.push('/studio/profile')} />
      </Row>
      <Spacer />
      {inc.some((o) => o.demo) ? <DemoBanner text={L('Commandes reçues de démonstration (fictives).', 'Demo incoming orders (fictional).')} /> : null}
      {!ready ? <Notice tone="warning" title={L('Checklist hygiène incomplète', 'Hygiene checklist incomplete')} text={L('Vos plats ne sont pas visibles tant que la checklist n’est pas complétée.', 'Your dishes are hidden until the checklist is complete.')} /> : null}
      {!ready ? <Button variant="secondary" title={L('Compléter la checklist', 'Complete checklist')} onPress={() => router.push('/studio/checklist')} /> : null}
      <Spacer />
      <Row wrap>
        <Stat label={L('À valider', 'To confirm')} value={String(pending.length)} />
        <Stat label={L('À venir', 'Upcoming')} value={String(upcoming.length)} />
        <Stat label={L('Gains nets', 'Net earnings')} value={chf(net)} sub={L('commandes terminées', 'completed orders')} />
      </Row>
      <Spacer />
      <H2>{L('Commandes à valider', 'Orders to confirm')}</H2>
      {pending.length ? <Card>{pending.map(row)}</Card> : <Muted style={{ marginBottom: 12 }}>{L('Aucune demande en attente.', 'No pending request.')}</Muted>}
      <H2>{L('Préparations à venir', 'Upcoming preparations')}</H2>
      {upcoming.length ? <Card>{upcoming.map(row)}</Card> : <Muted style={{ marginBottom: 12 }}>{L('Rien de planifié.', 'Nothing planned.')}</Muted>}
      {!inc.length ? <Button small variant="ghost" icon="flask-outline" title={L('Ajouter des commandes de démo', 'Add demo orders')} disabled={!mine.length} onPress={addKitchenDemo} /> : null}
      <Spacer />
      <Row style={{ justifyContent: 'space-between' }}><H2>{L('Mes plats', 'My dishes')}</H2><Button small icon="add" title={L('Nouveau', 'New')} onPress={() => router.push('/studio/dish/new')} /></Row>
      {mine.length ? mine.map((d) => (
        <Card key={d.id} onPress={() => router.push(`/studio/dish/${d.id}`)} accessibilityLabel={d.title}>
          <Row>
            <View style={{ width: 56 }}><DishVisual dish={d} height={56} radius={10} /></View>
            <View style={{ flex: 1 }}><Body>{d.title}</Body><Muted>{chf(d.price)} · {d.allergens.length ? `${d.allergens.length} ${L('allergène(s)', 'allergen(s)')}` : L('aucun allergène (confirmé)', 'no allergen (confirmed)')}</Muted></View>
            <Badge label={d.active ? L('Actif', 'Active') : L('Masqué', 'Hidden')} tone={d.active ? 'success' : 'neutral'} />
          </Row>
        </Card>
      )) : <Muted style={{ marginBottom: 12 }}>{L('Ajoutez votre premier plat : titre, prix par portion, allergènes, ingrédients.', 'Add your first dish: title, price per portion, allergens, ingredients.')}</Muted>}
      <Card>
        <ListItem icon="calendar-outline" title={L('Créneaux de retrait / livraison', 'Pickup / delivery slots')} subtitle={`${mySlots.length} ${L('à venir', 'upcoming')}`} onPress={() => router.push('/studio/slots')} />
        <ListItem icon="cart-outline" title={L('Liste de courses (CSV)', 'Shopping list (CSV)')} subtitle={L('Ingrédients agrégés par période', 'Ingredients aggregated by period')} onPress={() => router.push('/studio/shopping')} />
        <ListItem icon="wallet-outline" title={L('Gains & historique', 'Earnings & history')} subtitle={L('Commission visible, export CSV', 'Visible commission, CSV export')} onPress={() => router.push('/studio/earnings')} />
        <ListItem icon="shield-checkmark-outline" title={L('Checklist hygiène', 'Hygiene checklist')} subtitle={ready ? L('Complétée (auto-déclaration)', 'Completed (self-declared)') : L('À compléter', 'To complete')} onPress={() => router.push('/studio/checklist')} />
        <ListItem icon="document-text-outline" title={L('Conformité & prochaines étapes', 'Compliance & next steps')} onPress={() => router.push('/compliance')} />
      </Card>
    </Screen>
  );
}
