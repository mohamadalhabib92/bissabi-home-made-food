import { useRouter } from 'expo-router';
import { useData, useL } from '@/lib/data';
import { dayCH } from '@/lib/dates';
import { downloadText, toCSV } from '@/lib/download';
import { chf, COMMISSION_PAID_BY, COMMISSION_RATE } from '@/lib/pricing';
import { STATUS_LABEL, statusText } from '@/lib/status';
import { Badge, Button, Card, Empty, H2, ListItem, Muted, Notice, Row, Screen, Spacer, Stat } from '@/ui/kit';

export default function Earnings() {
  const { myCook, orders } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  if (!myCook) return <Screen><Empty title={L('Créez d’abord votre profil', 'Create your profile first')} /></Screen>;
  const all = orders.filter((o) => o.side === 'cook' && o.cookId === myCook.id).sort((a, b) => b.slotDate.localeCompare(a.slotDate));
  const done = all.filter((o) => o.status === 'completed');
  const sum = (f: (o: (typeof all)[number]) => number) => done.reduce((s, o) => s + f(o), 0);
  const gross = sum((o) => o.subtotal); const comm = sum((o) => o.commission); const deliv = sum((o) => o.deliveryFee);
  const netOf = (order: (typeof all)[number]) => (
    Math.abs(order.total - (order.subtotal + order.deliveryFee + order.commission)) < 0.02
      ? order.subtotal
      : (order.cookNet ?? order.subtotal - order.commission)
  );
  const net = done.reduce((sum, order) => sum + netOf(order), 0);
  const months = new Map<string, number>();
  for (const o of done) months.set(o.slotDate.slice(0, 7), (months.get(o.slotDate.slice(0, 7)) ?? 0) + o.subtotal + o.deliveryFee);
  const csv = () => downloadText(`gains-${myCook.name.replace(/\W+/g, '-')}.csv`, '\ufeff' + toCSV([
    ['N°', 'Date', L('Client', 'Customer'), 'Statut', L('Plats', 'Dishes'), L('Commission', 'Commission'), L('Livraison', 'Delivery'), L('Total client', 'Customer total'), L('Net cuisinier', 'Cook net')],
    ...all.map((o) => [o.number, dayCH(o.slotDate), o.buyerName, statusText(o.status, lang), o.subtotal.toFixed(2), o.commission.toFixed(2), o.deliveryFee.toFixed(2), o.total.toFixed(2), o.status === 'completed' ? (o.subtotal + o.deliveryFee).toFixed(2) : '0.00']),
  ]));
  return (
    <Screen>
      <Row wrap>
        <Stat label={L('Net perçu', 'Net received')} value={chf(net)} sub={`${done.length} ${L('commande(s) terminée(s)', 'completed order(s)')}`} />
        <Stat label={L('Ventes de plats', 'Dish sales')} value={chf(gross)} />
      </Row>
      <Spacer h={10} />
      <Row wrap>
        <Stat label={L(`Commission ${Math.round(COMMISSION_RATE * 100)} %`, `Commission ${Math.round(COMMISSION_RATE * 100)}%`)} value={chf(comm)} sub={COMMISSION_PAID_BY === 'buyer' ? L('payée par les clients, en plus du prix', 'paid by customers, on top of price') : L('déduite de vos ventes', 'deducted from your sales')} />
        <Stat label={L('Frais de livraison', 'Delivery fees')} value={chf(deliv)} sub={L('hors commission, non inclus dans le net plats', 'outside the commission, not in the dish net')} />
      </Row>
      <Spacer />
      <Notice tone="info" title={L('Versements', 'Payouts')} text={L('Le versement du net exige un compte vérifié chez le prestataire. Changer l’IBAN demande une confirmation renforcée. Ici, le paiement est simulé : aucun virement.', 'Paying out the net requires a provider-verified account. Changing the IBAN needs a step-up confirmation. Payment here is simulated: no transfer is sent.')} />
      {months.size ? <><H2>{L('Par mois', 'By month')}</H2><Card>{[...months].sort((a, b) => b[0].localeCompare(a[0])).map(([m, v]) => <ListItem key={m} icon="calendar-outline" title={m} right={<Muted>{chf(v)}</Muted>} />)}</Card></> : null}
      <H2>{L('Historique', 'History')}</H2>
      {all.length ? <Card>{all.map((o) => <ListItem key={o.id} title={`${o.buyerName} · ${L('brut', 'gross')} ${chf(o.subtotal)} · ${L('net', 'net')} ${chf(netOf(o))}`} subtitle={`${dayCH(o.slotDate)} · ${L('commission', 'commission')} ${chf(o.commission)} · ${o.number}${o.demo ? ' · démo' : ''}`} right={<Badge label={statusText(o.status, lang)} tone={STATUS_LABEL[o.status].tone} />} onPress={() => router.push(`/studio/order/${o.id}`)} />)}</Card>
        : <Empty icon="wallet-outline" title={L('Pas encore de ventes', 'No sales yet')} text={L('Vos gains apparaîtront ici après vos premières commandes.', 'Your earnings will appear here after your first orders.')} />}
      <Spacer h={4} />
      <Button icon="download-outline" variant="secondary" title={L('Exporter en CSV', 'Export CSV')} disabled={!all.length} onPress={csv} />
    </Screen>
  );
}
