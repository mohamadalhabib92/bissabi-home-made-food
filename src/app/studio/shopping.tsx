import { useState } from 'react';
import { useData, useL } from '@/lib/data';
import { addDays, dayLabel, todayISO } from '@/lib/dates';
import { downloadText, toCSV } from '@/lib/download';
import { Body, Button, Card, Empty, H2, ListItem, Muted, Row, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';

export default function Shopping() {
  const { myCook, orders, dishes } = useData();
  const { L, lang } = useL();
  const [days, setDays] = useState(7);
  const [incPending, setIncPending] = useState(false);
  if (!myCook) return <Screen><Empty title={L('Créez d’abord votre profil', 'Create your profile first')} /></Screen>;
  const start = todayISO(); const end = addDays(start, days - 1);
  const statuses = ['accepted', 'preparing', ...(incPending ? ['requested'] : [])];
  const inPeriod = orders.filter((o) => o.side === 'cook' && o.cookId === myCook.id && statuses.includes(o.status) && o.slotDate >= start && o.slotDate <= end)
    .sort((a, b) => (a.slotDate + a.slotFrom).localeCompare(b.slotDate + b.slotFrom));
  const agg = new Map<string, { name: string; unit: string; qty: number }>();
  const portions = new Map<string, number>();
  for (const o of inPeriod) for (const l of o.lines) {
    const d = dishes.find((x) => x.id === l.dishId);
    portions.set(l.title, (portions.get(l.title) ?? 0) + l.qty);
    for (const i of d?.ingredients ?? []) {
      const k = `${i.name.toLowerCase()}|${i.unit}`;
      const cur = agg.get(k) ?? { name: i.name, unit: i.unit, qty: 0 };
      cur.qty += i.qty * l.qty; agg.set(k, cur);
    }
  }
  const items = [...agg.values()].sort((a, b) => a.name.localeCompare(b.name));
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
  const csv = () => downloadText(`liste-courses-${start}-${end}.csv`, '\ufeff' + toCSV([[L('Ingrédient', 'Ingredient'), L('Quantité', 'Quantity'), L('Unité', 'Unit')], ...items.map((i) => [i.name, fmt(i.qty), i.unit])]));
  return (
    <Screen>
      <Segmented label={L('Période', 'Period')} options={[{ label: L('3 jours', '3 days'), value: 3 }, { label: L('7 jours', '7 days'), value: 7 }, { label: L('14 jours', '14 days'), value: 14 }]} value={days} onChange={setDays} />
      <Toggle label={L('Inclure les demandes pas encore acceptées', 'Include not-yet-accepted requests')} value={incPending} onChange={setIncPending} />
      <Muted style={{ marginBottom: 12 }}>{dayLabel(start, lang)} → {dayLabel(end, lang)} · {inPeriod.length} {L('commande(s)', 'order(s)')}</Muted>
      {!inPeriod.length ? <Empty icon="cart-outline" title={L('Rien à acheter pour cette période', 'Nothing to buy for this period')} text={L('La liste se remplit avec vos commandes acceptées.', 'The list fills up with your accepted orders.')} /> : (
        <>
          <H2>{L('Plan de préparation', 'Prep plan')}</H2>
          <Card>{inPeriod.map((o) => <ListItem key={o.id} icon="time-outline" title={`${dayLabel(o.slotDate, lang)} ${o.slotFrom} · ${o.buyerName}`} subtitle={o.lines.map((l) => `${l.qty}× ${l.title}`).join(', ')} />)}</Card>
          <H2>{L('Portions à cuisiner', 'Portions to cook')}</H2>
          <Card>{[...portions].map(([k, v]) => <Row key={k} style={{ justifyContent: 'space-between' }}><Body>{k}</Body><Body>{v}</Body></Row>)}</Card>
          <H2>{L('Ingrédients agrégés', 'Aggregated ingredients')}</H2>
          <Card>{items.length ? items.map((i) => <Row key={i.name + i.unit} style={{ justifyContent: 'space-between' }}><Body>{i.name}</Body><Body>{fmt(i.qty)} {i.unit}</Body></Row>) : <Muted>{L('Renseignez les ingrédients de vos plats pour générer la liste.', 'Fill in your dishes’ ingredients to build the list.')}</Muted>}</Card>
          <Spacer h={4} />
          <Button icon="download-outline" title={L('Exporter en CSV', 'Export CSV')} disabled={!items.length} onPress={csv} />
        </>
      )}
    </Screen>
  );
}
