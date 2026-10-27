import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TotalsTable } from '@/components/brand';
import { usePay } from '@/lib/checkout';
import { useData, useL } from '@/lib/data';
import { dayLabel, hoursUntil } from '@/lib/dates';
import { slotUsed } from '@/lib/market';
import type { FulfilMode } from '@/lib/model';
import { paymentsLive } from '@/lib/payments';
import { MIN_LEAD_HOURS, quote } from '@/lib/pricing';
import { Button, Card, DemoBanner, Empty, Field, H2, Muted, Notice, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Checkout() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const { cart, dishes, cooks, slots, orders, placeOrder, clearCart, prefs, setPrefs } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const pay = usePay();
  const cook = cooks.find((c) => c.id === cart.cookId);
  const [mode, setMode] = useState<FulfilMode>(params.mode === 'delivery' && cook?.delivers ? 'delivery' : 'pickup');
  const [slotId, setSlotId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [name, setName] = useState(prefs.buyerName);
  const [note, setNote] = useState('');
  const [ack, setAck] = useState(false);
  const [demoFail, setDemoFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lines = cart.lines.map((l) => ({ ...l, dish: dishes.find((d) => d.id === l.dishId)! })).filter((l) => l.dish);
  const portions = lines.reduce((s, l) => s + l.qty, 0);
  const lead = Math.max(MIN_LEAD_HOURS, ...lines.map((l) => l.dish.leadHours));
  const options = useMemo(() => slots
    .filter((s) => s.cookId === cart.cookId && s.modes.includes(mode) && hoursUntil(s.date, s.from) >= lead)
    .filter((s) => !s.dishIds.length || lines.every((l) => s.dishIds.includes(l.dishId)))
    .map((s) => ({ s, left: s.capacity - slotUsed(s.id, orders) }))
    .sort((a, b) => (a.s.date + a.s.from).localeCompare(b.s.date + b.s.from)), [slots, cart.cookId, mode, lead, lines, orders]);
  if (!cook || !lines.length) return <Screen><Empty icon="bag-handle-outline" title={L('Panier vide', 'Empty cart')} action={<Button title={L('Découvrir', 'Discover')} onPress={() => router.replace('/')} />} /></Screen>;
  const q = quote(lines.map((l) => ({ qty: l.qty, unitPrice: l.dish.price })), mode);
  const slot = options.find((o) => o.s.id === slotId);
  const allergens = [...new Set(lines.flatMap((l) => l.dish.allergens))];
  const problems = [
    !slot && L('Choisissez un créneau', 'Choose a slot'),
    slot && slot.left < portions && L('Capacité insuffisante sur ce créneau', 'Not enough capacity on this slot'),
    mode === 'delivery' && address.trim().length < 8 && L('Adresse de livraison complète requise', 'Full delivery address required'),
    !name.trim() && L('Votre prénom est requis', 'Your first name is required'),
    !ack && L('Confirmez avoir lu les allergènes', 'Confirm you read the allergens'),
  ].filter(Boolean) as string[];
  const submit = async () => {
    if (problems.length || !slot) return;
    setBusy(true); setError(null);
    setPrefs((p) => ({ ...p, buyerName: name.trim() }));
    const o = placeOrder({ slot: slot.s, mode, address: mode === 'delivery' ? address.trim() : undefined, note: note.trim() || undefined, buyerName: name.trim() });
    const r = await pay(o, demoFail ? 'failure' : 'success');
    setBusy(false);
    clearCart();
    router.replace(`/order/${o.id}`);
    if (!r.ok) setError(r.error ?? null);
  };
  return (
    <Screen>
      {!paymentsLive ? <DemoBanner text={L('Paiement non configuré : paiement SIMULÉ, aucun débit réel.', 'Payments not configured: SIMULATED payment, no real charge.')} /> : null}
      {cook.delivers ? <Segmented label={L('Mode', 'Mode')} options={[{ label: L('Retrait chez le cuisinier', 'Pickup at cook’s'), value: 'pickup' as const }, { label: L('Livraison', 'Delivery'), value: 'delivery' as const }]} value={mode} onChange={(v) => { setMode(v); setSlotId(null); }} /> : null}
      <H2>{L('Créneau', 'Slot')}</H2>
      <Muted style={{ marginBottom: 8 }}>{L(`Commandes au moins ${lead} h à l’avance — pas de livraison express.`, `Orders at least ${lead} h ahead — no express delivery.`)}</Muted>
      {options.length ? options.map(({ s, left }) => {
        const on = s.id === slotId; const full = left < portions;
        return (
          <Pressable key={s.id} disabled={full} onPress={() => setSlotId(s.id)} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: full }}
            style={{ borderWidth: on ? 2 : 1, borderColor: on ? t.primary : t.border, backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 8, opacity: full ? 0.5 : 1, minHeight: 56 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{dayLabel(s.date, lang)} · {s.from}–{s.to}</Text>
            <Text style={{ color: full ? t.danger : t.muted, fontSize: 13 }}>{full ? L('Complet pour votre quantité', 'Full for your quantity') : L(`${left} portion(s) disponibles`, `${left} portion(s) left`)}</Text>
          </Pressable>
        );
      }) : <Notice tone="warning" title={L('Aucun créneau compatible', 'No matching slot')} text={L('Essayez l’autre mode, ou revenez plus tard.', 'Try the other mode, or come back later.')} />}
      <Spacer />
      <Field label={L('Prénom', 'First name')} value={name} onChangeText={setName} autoComplete="given-name" />
      {mode === 'delivery' ? <Field label={L('Adresse de livraison', 'Delivery address')} value={address} onChangeText={setAddress} placeholder={L('Rue, n°, NPA, commune', 'Street, no., postcode, town')} autoComplete="street-address" hint={L('Transmise au cuisinier uniquement pour cette commande.', 'Shared with the cook for this order only.')} /> : <Muted style={{ marginBottom: 12 }}>{L('L’adresse exacte de retrait vous est communiquée après acceptation.', 'The exact pickup address is shared after acceptance.')}</Muted>}
      <Field label={L('Note au cuisinier (facultatif)', 'Note to the cook (optional)')} value={note} onChangeText={setNote} multiline placeholder={L('Allergie, interphone…', 'Allergy, buzzer…')} />
      <Card>
        <H2>{L('Récapitulatif', 'Summary')}</H2>
        {lines.map((l) => <View key={l.dishId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}><Text style={{ color: t.text }}>{l.qty} × {l.dish.title}</Text></View>)}
        <View style={{ height: 8 }} />
        <TotalsTable {...q} L={L} />
      </Card>
      <Toggle label={allergens.length ? L(`J’ai lu les allergènes : ${allergens.length} déclaré(s) dans ma commande`, `I read the allergens: ${allergens.length} declared in my order`) : L('J’ai lu les informations allergènes', 'I read the allergen information')} value={ack} onChange={setAck} />
      {!paymentsLive ? <Toggle label={L('Démo : simuler un refus de carte', 'Demo: simulate a card decline')} value={demoFail} onChange={setDemoFail} hint={L('Pour tester la gestion d’échec de paiement.', 'To test payment-failure handling.')} /> : null}
      {problems.length ? <Muted style={{ marginBottom: 8 }}>{problems.join(' · ')}</Muted> : null}
      {error ? <Notice tone="danger" title={error} /> : null}
      <Button icon="lock-closed-outline" title={`${paymentsLive ? L('Payer', 'Pay') : L('Payer (simulation)', 'Pay (simulation)')} · CHF ${q.total.toFixed(2)}`} disabled={!!problems.length} loading={busy} onPress={submit} />
      <Muted style={{ marginTop: 8, fontSize: 12 }}>{L('Paiement sécurisé par Stripe lorsqu’il est activé. Apple Pay / Google Pay : phase 2.', 'Secure payment by Stripe when enabled. Apple Pay / Google Pay: phase 2.')}</Muted>
    </Screen>
  );
}
