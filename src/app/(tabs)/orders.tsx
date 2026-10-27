import { useRouter } from 'expo-router';
import { useData, useL } from '@/lib/data';
import { dayLabel } from '@/lib/dates';
import { chf } from '@/lib/pricing';
import { STATUS_LABEL } from '@/lib/status';
import { Badge, Button, Empty, H2, ListItem, Card, Screen } from '@/ui/kit';

export default function Orders() {
  const { orders, cooks } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const mine = orders.filter((o) => o.side === 'buyer').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = mine.filter((o) => !['completed', 'cancelled', 'refused'].includes(o.status));
  const past = mine.filter((o) => ['completed', 'cancelled', 'refused'].includes(o.status));
  if (!mine.length) return <Screen><Empty icon="receipt-outline" title={L('Pas encore de commande', 'No order yet')} text={L('Vos commandes à venir, reçus et avis apparaîtront ici.', 'Your upcoming orders, receipts and reviews will appear here.')} action={<Button title={L('Découvrir', 'Discover')} onPress={() => router.push('/')} />} /></Screen>;
  const row = (o: (typeof mine)[number]) => (
    <ListItem key={o.id} icon="receipt-outline" title={`${cooks.find((c) => c.id === o.cookId)?.name ?? '—'} · ${chf(o.total)}`} subtitle={`${dayLabel(o.slotDate, lang)} ${o.slotFrom}–${o.slotTo} · ${o.number}${o.demo ? ' · démo' : ''}`} right={<Badge label={STATUS_LABEL[o.status][lang]} tone={STATUS_LABEL[o.status].tone} />} onPress={() => router.push(`/order/${o.id}`)} />
  );
  return (
    <Screen>
      {active.length ? <><H2>{L('En cours', 'Active')}</H2><Card>{active.map(row)}</Card></> : null}
      {past.length ? <><H2>{L('Historique', 'History')}</H2><Card>{past.map(row)}</Card></> : null}
    </Screen>
  );
}
