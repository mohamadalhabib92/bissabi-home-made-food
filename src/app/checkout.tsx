import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TotalsTable } from '@/components/brand';
import { usePay } from '@/lib/checkout';
import { useI18n } from '@/i18n';
import { splitAllergens } from '@/lib/dishPublish';
import { useData, useL } from '@/lib/data';
import { cookIsOutsideVaud, zoneOf } from '@/lib/geo';
import { dayLabel, hoursUntil } from '@/lib/dates';
import { buyerVisibleSlots, launchPayment, prepareLaunchCheckout } from '@/lib/launchCheckout';
import { slotUsed } from '@/lib/market';
import { MIN_LEAD_HOURS, quote } from '@/lib/pricing';
import { Button, Card, DemoBanner, Empty, Field, H2, Muted, Notice, Screen, Spacer, Toggle } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Checkout() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { cart, dishes, cooks, slots, orders, placeOrder, clearCart, prefs, setPrefs } = useData();
  const { L, lang } = useL();
  const { t: tr } = useI18n();
  const router = useRouter();
  const pay = usePay();
  const cook = cooks.find((c) => c.id === cart.cookId);
  const requested = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const launch = prepareLaunchCheckout(orders, cart.lines, requested);
  const mode = launch.next.mode;
  const [slotId, setSlotId] = useState<string | null>(null);
  const [name, setName] = useState(prefs.buyerName);
  const [note, setNote] = useState('');
  const [ack, setAck] = useState(false);
  const [demoFail, setDemoFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = cart.lines.map((l) => ({ ...l, dish: dishes.find((d) => d.id === l.dishId)! })).filter((l) => l.dish);
  const portions = lines.reduce((s, l) => s + l.qty, 0);
  const lead = Math.max(MIN_LEAD_HOURS, ...lines.map((l) => l.dish.leadHours));
  const options = useMemo(() => buyerVisibleSlots(slots)
    .filter((s) => s.cookId === cart.cookId && hoursUntil(s.date, s.from) >= lead)
    .filter((s) => !s.dishIds.length || lines.every((l) => s.dishIds.includes(l.dishId)))
    .map((s) => ({ s, left: s.capacity - slotUsed(s.id, orders) }))
    .sort((a, b) => (a.s.date + a.s.from).localeCompare(b.s.date + b.s.from)), [slots, cart.cookId, lead, lines, orders]);
  if (!cook || !lines.length) return <Screen><Empty icon="bag-handle-outline" title={L('Panier vide', 'Empty cart')} action={<Button title={L('Découvrir', 'Discover')} onPress={() => router.replace('/')} />} /></Screen>;
  const q = quote(lines.map((l) => ({ qty: l.qty, unitPrice: l.dish.price })), mode);
  const slot = options.find((o) => o.s.id === slotId);
  const allergenKeys = [...new Set(lines.flatMap((l) => { const s = splitAllergens(l.dish); return [...s.present, ...s.traces]; }))];
  const cookOutside = cookIsOutsideVaud(cook);
  const problems = [
    zoneOf(prefs.location) === 'outside' && tr('zoneOutsideTitle'),
    cookOutside && tr('cookOutsideOrder'),
    !slot && L('Choisissez un créneau', 'Choose a slot'),
    slot && slot.left < portions && L('Capacité insuffisante sur ce créneau', 'Not enough capacity on this slot'),
    !name.trim() && L('Votre prénom est requis', 'Your first name is required'),
    !ack && L('Confirmez avoir lu les allergènes', 'Confirm you read the allergens'),
  ].filter(Boolean) as string[];
  const submit = async () => {
    if (problems.length || !slot) return;
    setBusy(true); setError(null);
    setPrefs((p) => ({ ...p, buyerName: name.trim() }));
    const o = placeOrder({ slot: slot.s, mode: launch.next.mode, address: launch.next.address, note: note.trim() || undefined, buyerName: name.trim() });
    const r = await pay(o, demoFail ? 'failure' : 'success');
    setBusy(false);
    clearCart();
    router.replace(`/order/${o.id}`);
    if (!r.ok) setError(r.error ?? null);
  };
  return (
    <Screen>
      {launchPayment().simulated ? <DemoBanner text={tr('paymentLaunch')} /> : null}
      {launch.offer.promptPickup ? <Notice tone="warning" title={tr('pickupOnlyTitle')} text={tr('pickupOnlyBody')} /> : null}
      {cookOutside ? <Notice tone="warning" title={tr('cookOutside')} text={tr('cookOutsideOrder')} /> : null}
      <H2>{L('Créneau de retrait', 'Pickup slot')}</H2>
      <Muted style={{ marginBottom: 8 }}>{L(`Retrait uniquement. Commandes au moins ${lead} h à l’avance.`, `Pickup only. Orders at least ${lead} h ahead.`)}</Muted>
      {options.length ? options.map(({ s, left }) => {
        const on = s.id === slotId; const full = left < portions;
        return (
          <Pressable key={s.id} disabled={full} onPress={() => setSlotId(s.id)} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: full }}
            style={{ borderWidth: on ? 2 : 1, borderColor: on ? t.primary : t.border, backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 8, opacity: full ? 0.5 : 1, minHeight: 56 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{dayLabel(s.date, lang)} · {s.from}–{s.to}</Text>
            <Text style={{ color: full ? t.danger : t.muted, fontSize: 13 }}>{full ? L('Complet pour votre quantité', 'Full for your quantity') : L(`${left} portion(s) disponibles`, `${left} portion(s) left`)}</Text>
          </Pressable>
        );
      }      ) : <Notice tone="warning" title={L('Aucun créneau de retrait', 'No pickup slot')} text={L('Revenez plus tard, ou choisissez un autre plat. Les commandes déjà enregistrées restent en l’état.', 'Come back later, or pick another dish. Orders already saved stay as they are.')} />}
      <Spacer />
      <Field label={L('Prénom', 'First name')} value={name} onChangeText={setName} autoComplete="given-name" />
      <Muted style={{ marginBottom: 12 }}>{L('L’adresse exacte de retrait vous est communiquée après acceptation.', 'The exact pickup address is shared after acceptance.')}</Muted>
      <Field label={L('Note au cuisinier (facultatif)', 'Note to the cook (optional)')} value={note} onChangeText={setNote} multiline placeholder={L('Allergie, interphone…', 'Allergy, buzzer…')} />
      <Card>
        <H2>{L('Récapitulatif', 'Summary')}</H2>
        {lines.map((l) => <View key={l.dishId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}><Text style={{ color: t.text }}>{l.qty} × {l.dish.title}</Text></View>)}
        <View style={{ height: 8 }} />
        <TotalsTable {...q} L={L} />
      </Card>
      <Toggle label={allergenKeys.length ? L(`J’ai lu les allergènes : ${allergenKeys.length} déclaré(s) dans ma commande`, `I read the allergens: ${allergenKeys.length} declared in my order`) : L('J’ai lu les informations allergènes', 'I read the allergen information')} value={ack} onChange={setAck} />
      {launchPayment().simulated ? <Toggle label={L('Démo : simuler un refus de carte', 'Demo: simulate a card decline')} value={demoFail} onChange={setDemoFail} hint={L('Pour tester la gestion d’échec de paiement. Aucun débit.', 'To test payment-failure handling. No charge.')} /> : null}
      {problems.length ? <Muted style={{ marginBottom: 8 }}>{problems.join(' · ')}</Muted> : null}
      {error ? <Notice tone="danger" title={error} /> : null}
      <Button icon="lock-closed-outline" title={`${L('Payer (simulation)', 'Pay (simulation)')} · CHF ${q.total.toFixed(2)}`} disabled={!!problems.length} loading={busy} onPress={submit} />
      <Muted style={{ marginTop: 8, fontSize: 12 }}>{tr('paymentLaunch')}</Muted>
    </Screen>
  );
}
