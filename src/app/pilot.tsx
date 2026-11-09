import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { allergenLabels } from '@/i18n/allergens';
import { pilotText, type PilotKey } from '@/i18n/catalog';
import { intlTag } from '@/i18n/locales';
import { useL } from '@/lib/data';
import { formatMoney } from '@/lib/global/money';
import { sellerLine, zoneForPostal } from '@/lib/global/markets';
import { ALLERGENS } from '@/lib/model';
import { incompleteMarket, PILOT_AT } from '@/lib/pilot/demo';
import {
  activateKitchen,
  applyPaymentEvent,
  assignCourier,
  confirmHandover,
  confirmPickup,
  openMission,
  paySimulated,
  publishDish,
  quotePortion,
  reservePortion,
  saveKitchenFile,
  type Actor,
  type Mode,
  type PilotState,
} from '@/lib/pilot/engine';
import { simulatedProvider, type ProviderEvent } from '@/lib/pilot/payment';
import { Badge, Button, Card, Field, Muted, Notice, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as ui } from '@/ui/theme';

const admin: Actor = { id: 'admin', role: 'admin', mfa: true, marketIds: ['ch-vd'] };
const amina: Actor = { id: 'amina', role: 'kitchen', kitchenId: 'kitchen_amina' };
const sara: Actor = { id: 'sara', role: 'buyer' };
const luc: Actor = { id: 'luc', role: 'courier' };
const other: Actor = { id: 'other', role: 'courier' };
const when = PILOT_AT;

const errors: Partial<Record<string, PilotKey>> = {
  kitchen_file_incomplete: 'errKitchen',
  kitchen_not_activated: 'errKitchen',
  portion_taken: 'errPortion',
  courier_refused: 'errCourier',
  sales_blocked: 'errRecall',
  address_not_served: 'errZone',
  forged_payment: 'errPayment',
};

export default function PilotScreen() {
  const { lang } = useL();
  const say = (key: PilotKey) => pilotText(lang, key).text;
  const [state, setState] = useState<PilotState>(() => incompleteMarket());
  const [postal, setPostal] = useState('1008');
  const [mode, setMode] = useState<Mode>('delivery');
  const [ack, setAck] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [event, setEvent] = useState<ProviderEvent | null>(null);
  const zone = zoneForPostal(state.market, postal);
  const dish = state.dishes[0];
  const recipe = state.recipes.find((item) => item.id === dish?.currentRecipeId);
  const order = state.orders[0];
  const mission = state.missions[0];
  const present = useMemo(() => (recipe ? ALLERGENS.filter((item) => recipe.allergens[item.key] === 'present').map((item) => item.key) : []), [recipe]);
  const traces = useMemo(() => (recipe ? ALLERGENS.filter((item) => recipe.allergens[item.key] === 'traces').map((item) => item.key) : []), [recipe]);
  const allergenLine = allergenLabels(present, lang);
  const traceLine = allergenLabels(traces, lang);
  const price = dish ? quotePortion(state.market, dish.priceMinor, 1, mode, postal || '1008') : null;
  const money = (minor: number) => formatMoney({ amountMinor: minor, currency: state.market.currency }, intlTag(lang));
  const take = (result: { ok: boolean; state: PilotState; error?: string }) => {
    setState(result.state);
    if (result.ok) setNote('');
    else {
      const key = result.error ? errors[result.error] : undefined;
      setNote(key ? say(key) : (result.error ?? ''));
    }
  };

  return (
    <Screen>
      <Notice tone="warning" title={say('pilotTitle')} text={say('pilotBanner')} />
      <Muted>{say('pilotInternal')}</Muted>
      <Spacer />
      <Field label={say('pilotPostal')} value={postal} onChangeText={setPostal} keyboardType="number-pad" />
      <Muted>{zone ? `${say('pilotServed')} ${zone.city}` : say('pilotNotServed')}</Muted>
      {price ? (
        <Card>
          <Text style={{ color: ui.text }}>{dish?.title}</Text>
          <Muted>{say('pilotPickup')} / {say('pilotDelivery')}</Muted>
          <Text style={{ color: ui.text }}>{money(price.subtotalMinor)} + {money(price.deliveryFeeMinor)}</Text>
          <Text style={{ color: ui.text, fontWeight: '700' }}>{money(price.totalMinor)}</Text>
          <Muted>Commission 10 % retenue sur le cuisinier : {money(price.commissionMinor)}. Net cuisinier {money(price.cookNetMinor)}. Les frais de livraison ne sont pas dans cette commission.</Muted>
        </Card>
      ) : null}
      <Segmented
        label={say('pilotDelivery')}
        options={[{ label: say('pilotPickup'), value: 'pickup' as const }, { label: say('pilotDelivery'), value: 'delivery' as const }]}
        value={mode}
        onChange={setMode}
      />
      {recipe ? (
        <Card>
          <Muted>{say('pilotAllergens')}</Muted>
          <Text style={{ color: ui.text }}>{allergenLine.text || '—'}</Text>
          {traceLine.text ? <Muted>{traceLine.text}</Muted> : null}
          {recipe.crossContamination.map((line) => <Muted key={line}>{say('pilotCross')} : {line}</Muted>)}
          {(allergenLine.needsReview || traceLine.needsReview) ? <Badge label={say('localeReview')} tone="warning" /> : null}
        </Card>
      ) : null}
      <Toggle label={say('pilotAck')} value={ack} onChange={setAck} />
      {note ? <Notice tone="danger" title={note} /> : null}
      <Button title={say('pilotTry')} onPress={() => take(reservePortion(state, sara, { dishId: 'dish_mafe', slotId: 'slot_1', qty: 1, mode, postal, at: when }))} />
      <Button variant="secondary" title={say('pilotComplete')} onPress={() => take(saveKitchenFile(state, amina, 'kitchen_amina', { responsibleName: 'Amina Diop', documentsOk: true, hygieneOk: true, trainingOk: true }, when))} />
      <Button variant="secondary" title={say('pilotActivate')} onPress={() => take(activateKitchen(state, admin, 'kitchen_amina', when))} />
      <Button variant="secondary" title={say('pilotPublish')} onPress={() => take(publishDish(state, amina, 'dish_mafe', when))} />
      <Button
        title={say('pilotPay')}
        disabled={!ack || !order || order.paymentStatus === 'paid'}
        onPress={() => {
          if (!order) return;
          const paid = paySimulated(state, order.id, '2026-11-10T08:05:00.000Z');
          take(paid);
          if (paid.ok) setEvent(paid.value.event);
        }}
      />
      <Button
        variant="secondary"
        title={say('pilotReplay')}
        disabled={!event}
        onPress={() => {
          if (!event) return;
          const replay = applyPaymentEvent(state, event, `simulated.${event.id}.test`, '2026-11-10T08:05:00.000Z');
          take(replay);
          if (replay.ok && replay.value.duplicate) setNote(`${state.ledger.length}`);
        }}
      />
      <Muted>{simulatedProvider.label[lang === 'fr' ? 'fr' : 'en']} · {state.ledger.length}</Muted>
      {mode === 'delivery' ? (
        <>
          <Button variant="secondary" title={say('pilotAssign')} onPress={() => take(assignCourier(state, admin, order?.id ?? '', luc.id, 'Rue de test 1, 1008 Prilly', when))} />
          <Button variant="ghost" title={say('pilotOtherCourier')} onPress={() => mission && take(openMission(state, other, mission.id))} />
          <Button variant="secondary" title={say('pilotPickupBtn')} onPress={() => mission && take(confirmPickup(state, luc, mission.id, when))} />
        </>
      ) : null}
      {order?.handoverCode ? <Muted>{say('pilotCode')} : {order.handoverCode}</Muted> : null}
      <Field label={say('pilotCode')} value={code} onChangeText={setCode} keyboardType="number-pad" />
      <Button
        title={say('pilotHandover')}
        onPress={() => order && take(confirmHandover(state, mode === 'delivery' ? luc : amina, order.id, code, when))}
      />
      {order?.prepStatus === 'handed' ? (
        <Card>
          <Text style={{ color: ui.text, fontWeight: '700' }}>{say('pilotReceipt')}</Text>
          <Muted>{order.number}</Muted>
          <Muted>{say('pilotSeller')} : {sellerLine(state.market)}</Muted>
          <Text style={{ color: ui.text }}>{money(order.totalMinor)}</Text>
          <Muted>{simulatedProvider.label.fr}</Muted>
          <Muted>{say('pilotInternal')}</Muted>
        </Card>
      ) : null}
      <Spacer />
      <Button variant="ghost" title={say('pilotReset')} onPress={() => { setState(incompleteMarket()); setEvent(null); setNote(''); setAck(false); setCode(''); }} />
    </Screen>
  );
}
