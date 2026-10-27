import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { useData, useL } from '@/lib/data';
import { dayLabel, stamp } from '@/lib/dates';
import { chf } from '@/lib/pricing';
import { STATUS_LABEL } from '@/lib/status';
import { Badge, Body, Button, Card, Chip, Empty, Field, H1, H2, Muted, Notice, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

const REASONS = [
  { fr: 'Capacité atteinte', en: 'Capacity reached' },
  { fr: 'Ingrédient indisponible', en: 'Ingredient unavailable' },
  { fr: 'Empêchement personnel', en: 'Personal reason' },
  { fr: 'Hors de ma zone de livraison', en: 'Outside my delivery area' },
];

export default function IncomingOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, setOrderStatus, dishes } = useData();
  const { L, lang } = useL();
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState('');
  const o = orders.find((x) => x.id === id);
  if (!o) return <Screen><Empty title={L('Commande introuvable', 'Order not found')} /></Screen>;
  const st = STATUS_LABEL[o.status];
  const allergens = [...new Set(o.lines.flatMap((l) => dishes.find((d) => d.id === l.dishId)?.allergens ?? []))];
  const net = o.subtotal + o.deliveryFee;
  return (
    <Screen>
      {o.demo ? <Notice tone="warning" title={L('Commande de démonstration', 'Demo order')} /> : null}
      <Row style={{ justifyContent: 'space-between' }}><H1>{o.buyerName}</H1><Badge label={st[lang]} tone={st.tone} /></Row>
      <Muted>{o.number} · {dayLabel(o.slotDate, lang)} {o.slotFrom}–{o.slotTo} · {o.mode === 'pickup' ? L('Retrait', 'Pickup') : L('Livraison', 'Delivery')}</Muted>
      {o.address ? <Body>{o.address}</Body> : null}
      <Spacer />
      <Card>
        {o.lines.map((l) => <Row key={l.dishId} style={{ justifyContent: 'space-between' }}><Body>{l.qty} × {l.title}</Body><Body>{chf(l.qty * l.unitPrice)}</Body></Row>)}
        {o.note ? <Notice tone="info" title={L('Note du client', 'Customer note')} text={o.note} /> : null}
        {allergens.length ? <Muted>{L('Allergènes déclarés', 'Declared allergens')} : {allergens.length}</Muted> : null}
      </Card>
      <Card>
        <H2>{L('Ce que vous recevez', 'What you receive')}</H2>
        <Row style={{ justifyContent: 'space-between' }}><Muted>{L('Plats', 'Dishes')}</Muted><Body>{chf(o.subtotal)}</Body></Row>
        {o.deliveryFee ? <Row style={{ justifyContent: 'space-between' }}><Muted>{L('Frais de livraison', 'Delivery fee')}</Muted><Body>{chf(o.deliveryFee)}</Body></Row> : null}
        <Row style={{ justifyContent: 'space-between' }}><Muted>{L('Commission Bissabi 15 % (payée par le client)', 'Bissabi 15% commission (paid by customer)')}</Muted><Body>{chf(o.commission)}</Body></Row>
        <Row style={{ justifyContent: 'space-between' }}><Text style={{ fontWeight: '800', color: t.text }}>{L('Net pour vous', 'Net for you')}</Text><Text style={{ fontWeight: '800', color: t.success }}>{chf(net)}</Text></Row>
      </Card>
      {o.status === 'requested' && !refusing ? (
        <Row>
          <Button style={{ flex: 1 }} icon="checkmark" title={L('Accepter', 'Accept')} onPress={() => setOrderStatus(o.id, 'accepted')} />
          <Button style={{ flex: 1 }} variant="secondary" title={L('Refuser', 'Refuse')} onPress={() => setRefusing(true)} />
        </Row>
      ) : null}
      {refusing ? (
        <Card>
          <H2>{L('Motif du refus', 'Reason')}</H2>
          <Row wrap>{REASONS.map((r) => <Chip key={r.fr} label={r[lang]} active={reason === r[lang]} onPress={() => setReason(r[lang])} />)}</Row>
          <Field label={L('Ou précisez', 'Or specify')} value={reason} onChangeText={setReason} />
          <Muted>{L('Le client est remboursé intégralement.', 'The customer is fully refunded.')}</Muted>
          <Spacer h={8} />
          <Row>
            <Button style={{ flex: 1 }} variant="danger" title={L('Confirmer le refus', 'Confirm refusal')} disabled={reason.trim().length < 3} onPress={() => { setOrderStatus(o.id, 'refused', { refuseReason: reason.trim() }, reason.trim()); setRefusing(false); }} />
            <Button style={{ flex: 1 }} variant="ghost" title={L('Annuler', 'Cancel')} onPress={() => setRefusing(false)} />
          </Row>
        </Card>
      ) : null}
      {o.status === 'accepted' ? <Button icon="flame-outline" title={L('Commencer la préparation', 'Start preparing')} onPress={() => setOrderStatus(o.id, 'preparing')} /> : null}
      {o.status === 'preparing' ? <Button icon="bag-check-outline" title={L('Marquer comme prête', 'Mark as ready')} onPress={() => setOrderStatus(o.id, 'ready')} /> : null}
      {o.status === 'ready' ? <Button icon="checkmark-done" title={L('Remise effectuée', 'Handed over')} onPress={() => setOrderStatus(o.id, 'completed')} /> : null}
      <Spacer />
      <Card>
        <H2>{L('Chronologie', 'Timeline')}</H2>
        {o.timeline.map((e, i) => <Muted key={i}>{stamp(e.at, lang)} — {STATUS_LABEL[e.status][lang]}{e.note ? ` · ${e.note}` : ''}</Muted>)}
      </Card>
    </Screen>
  );
}
