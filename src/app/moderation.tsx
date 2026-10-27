import { useData, useL } from '@/lib/data';
import { stamp } from '@/lib/dates';
import { Stars } from '@/components/brand';
import { Body, Button, Card, Empty, H2, Muted, Notice, Row, Screen } from '@/ui/kit';

export default function Moderation() {
  const { reviews, setReviews, reports, cooks } = useData();
  const { L, lang } = useL();
  const pending = reviews.filter((r) => r.status === 'pending');
  const set = (id: string, status: 'published' | 'rejected') => setReviews((l) => l.map((r) => (r.id === id ? { ...r, status } : r)));
  return (
    <Screen>
      <Notice tone="info" title={L('Écran administrateur (local)', 'Admin screen (local)')} text={L('En production, la modération se fera côté serveur avec un rôle admin.', 'In production, moderation will run server-side with an admin role.')} />
      <H2>{L('Avis en attente', 'Pending reviews')}</H2>
      {pending.length ? pending.map((r) => (
        <Card key={r.id}>
          <Row gap={8}><Stars value={r.rating} /><Muted>{r.author} → {cooks.find((c) => c.id === r.cookId)?.name ?? '—'} · {stamp(r.at, lang)}</Muted></Row>
          <Body>{r.text}</Body>
          <Row>
            <Button small title={L('Publier', 'Publish')} onPress={() => set(r.id, 'published')} />
            <Button small variant="secondary" title={L('Rejeter', 'Reject')} onPress={() => set(r.id, 'rejected')} />
          </Row>
        </Card>
      )) : <Empty icon="checkmark-done-outline" title={L('Rien à modérer', 'Nothing to moderate')} />}
      <H2>{L('Signalements', 'Reports')}</H2>
      {reports.length ? reports.map((r) => <Card key={r.id}><Muted>{stamp(r.at, lang)} · {r.target}{r.targetId ? ` · ${r.targetId}` : ''}</Muted><Body>{r.reason} — {r.text}</Body></Card>) : <Muted>{L('Aucun signalement.', 'No report.')}</Muted>}
    </Screen>
  );
}
