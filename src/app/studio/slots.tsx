import { useState } from 'react';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { addDays, dayCH, dayLabel, isTime, parseDay, todayISO } from '@/lib/dates';
import { slotUsed } from '@/lib/market';
import type { FulfilMode } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Empty, Field, H2, IconButton, ListItem, Muted, Row, Screen, Spacer } from '@/ui/kit';
import { View } from 'react-native';

export default function Slots() {
  const { myCook, slots, setSlots, orders, dishes } = useData();
  const { L, lang } = useL();
  const [day, setDay] = useState(dayCH(addDays(todayISO(), 2)));
  const [from, setFrom] = useState('18:30');
  const [to, setTo] = useState('20:00');
  const [cap, setCap] = useState('10');
  const [modes, setModes] = useState<FulfilMode[]>(['pickup']);
  const [weeks, setWeeks] = useState(1);
  if (!myCook) return <Screen><Empty title={L('Créez d’abord votre profil', 'Create your profile first')} /></Screen>;
  const mine = slots.filter((s) => s.cookId === myCook.id && s.date >= todayISO()).sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
  const date = parseDay(day);
  const c = Number(cap);
  const err = !date ? L('Date au format JJ.MM.AAAA', 'Date as DD.MM.YYYY') : date < todayISO() ? L('Date passée', 'Past date') : !isTime(from) || !isTime(to) ? L('Heures au format HH:MM', 'Times as HH:MM') : from >= to ? L('La fin doit suivre le début', 'End must be after start') : !(c >= 1 && c <= 100) ? L('Capacité 1–100 portions', 'Capacity 1–100 portions') : !modes.length ? L('Choisissez au moins un mode', 'Pick at least one mode') : null;
  const add = () => {
    if (err || !date) return;
    const n = Array.from({ length: weeks }, (_, i) => ({ id: uid('slot_'), cookId: myCook.id, date: addDays(date, i * 7), from, to, modes, capacity: c, dishIds: [] }));
    setSlots((l) => [...l, ...n]);
  };
  const toggleMode = (m: FulfilMode) => setModes((l) => (l.includes(m) ? l.filter((x) => x !== m) : [...l, m]));
  return (
    <Screen>
      <Card>
        <H2>{L('Nouveau créneau', 'New slot')}</H2>
        <Field label={L('Date', 'Date')} value={day} onChangeText={setDay} placeholder="JJ.MM.AAAA" />
        <Row>
          <View style={{ flex: 1 }}><Field label={L('De', 'From')} value={from} onChangeText={setFrom} placeholder="18:30" /></View>
          <View style={{ flex: 1 }}><Field label={L('À', 'To')} value={to} onChangeText={setTo} placeholder="20:00" /></View>
          <View style={{ flex: 1 }}><Field label={L('Portions max', 'Max portions')} value={cap} onChangeText={setCap} keyboardType="number-pad" /></View>
        </Row>
        <Row wrap>
          <Chip label={L('Retrait', 'Pickup')} active={modes.includes('pickup')} onPress={() => toggleMode('pickup')} />
          {myCook.delivers ? <Chip label={L('Livraison', 'Delivery')} active={modes.includes('delivery')} onPress={() => toggleMode('delivery')} /> : null}
          {[1, 2, 4].map((w) => <Chip key={w} label={w === 1 ? L('Une fois', 'Once') : L(`${w} semaines`, `${w} weeks`)} active={weeks === w} onPress={() => setWeeks(w)} />)}
        </Row>
        {err ? <Muted>{err}</Muted> : null}
        <Spacer h={8} />
        <Button title={L('Ajouter', 'Add')} icon="add" disabled={!!err} onPress={add} />
      </Card>
      <Muted style={{ marginBottom: 8 }}>{L('Les clients ne peuvent commander qu’au moins 24 h avant le début du créneau.', 'Customers can only order at least 24 h before the slot starts.')}</Muted>
      <H2>{L('Créneaux à venir', 'Upcoming slots')}</H2>
      {mine.length ? <Card>{mine.map((s) => {
        const used = slotUsed(s.id, orders);
        return <ListItem key={s.id} icon="time-outline" title={`${dayLabel(s.date, lang)} · ${s.from}–${s.to}`} subtitle={`${used}/${s.capacity} ${L('portions', 'portions')} · ${s.modes.map((m) => (m === 'pickup' ? L('retrait', 'pickup') : L('livraison', 'delivery'))).join(' + ')}`}
          right={<IconButton icon="trash-outline" label={L('Supprimer', 'Delete')} onPress={() => (used ? confirmAsk(L('Des commandes existent sur ce créneau. Le supprimer quand même ? Pensez à prévenir vos clients.', 'Orders exist on this slot. Delete anyway? Remember to tell your customers.'), () => setSlots((l) => l.filter((x) => x.id !== s.id))) : setSlots((l) => l.filter((x) => x.id !== s.id)))} />} />;
      })}</Card> : <Empty icon="calendar-outline" title={L('Aucun créneau', 'No slot')} text={dishes.some((d) => d.cookId === myCook.id) ? L('Ouvrez un créneau pour recevoir des commandes.', 'Open a slot to receive orders.') : L('Ajoutez d’abord un plat, puis ouvrez un créneau.', 'Add a dish first, then open a slot.')} />}
    </Screen>
  );
}
