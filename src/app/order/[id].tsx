import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stars, TotalsTable } from '@/components/brand';
import { usePay } from '@/lib/checkout';
import { COMPANY_LINE } from '@/lib/company';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { dayLabel, stamp } from '@/lib/dates';
import { downloadText } from '@/lib/download';
import { ORDER_STEPS } from '@/lib/model';
import { paymentsLive } from '@/lib/payments';
import { chf } from '@/lib/pricing';
import { STATUS_LABEL } from '@/lib/status';
import { uid } from '@/lib/storage';
import { Badge, Body, Button, Card, Empty, Field, H1, H2, Ionicons, Muted, Notice, Row, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function OrderScreen() {
  const { id, paid } = useLocalSearchParams<{ id: string; paid?: string }>();
  const { orders, cooks, setOrderStatus, reviews, setReviews, prefs } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const pay = usePay();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const o = orders.find((x) => x.id === id);
  // Retour de Stripe Checkout (la confirmation définitive vient du webhook serveur)
  useEffect(() => {
    if (!o || !paid || o.status !== 'awaiting_payment') return;
    if (paid === 'success') setOrderStatus(o.id, 'requested', { payment: { method: 'stripe' } }, 'Paiement Stripe confirmé');
    if (paid === 'cancel') setOrderStatus(o.id, 'payment_failed', { payment: { method: 'stripe', error: 'Paiement annulé' } }, 'Paiement annulé');
  }, [paid, o?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!o) return <Screen><Empty icon="receipt-outline" title={L('Commande introuvable', 'Order not found')} /></Screen>;
  const cook = cooks.find((c) => c.id === o.cookId);
  const st = STATUS_LABEL[o.status];
  const stepIdx = ORDER_STEPS.indexOf(o.status);
  const myReview = reviews.find((r) => r.orderId === o.id);
  const retry = async (fail = false) => { setBusy(true); setErr(null); setOrderStatus(o.id, 'awaiting_payment', undefined, L('Nouvelle tentative', 'Retry')); const r = await pay(o, fail ? 'failure' : 'success'); setBusy(false); if (!r.ok) setErr(r.error ?? null); };
  const receipt = () => [
    `BISSABI HOME MADE — ${L('Reçu', 'Receipt')} ${o.number}`, `${L('Date', 'Date')}: ${stamp(o.createdAt, lang)}`,
    `${L('Cuisinier·ère', 'Cook')}: ${cook?.name ?? ''} (${cook?.commune ?? ''})`, `${L('Créneau', 'Slot')}: ${dayLabel(o.slotDate, lang)} ${o.slotFrom}–${o.slotTo} · ${o.mode === 'pickup' ? L('Retrait', 'Pickup') : L('Livraison', 'Delivery')}`, '',
    ...o.lines.map((l) => `${l.qty} × ${l.title} @ ${chf(l.unitPrice)} = ${chf(l.qty * l.unitPrice)}`), '',
    `${L('Plats', 'Dishes')}: ${chf(o.subtotal)}`, `${L('Commission plateforme 15 %', 'Platform commission 15%')}: ${chf(o.commission)}`, `${L('Livraison', 'Delivery')}: ${chf(o.deliveryFee)}`, `TOTAL: ${chf(o.total)}`, '',
    `${L('Paiement', 'Payment')}: ${o.payment.method === 'demo' ? L('SIMULATION DE DÉMO — aucun débit', 'DEMO SIMULATION — no charge') : 'Stripe'}${o.payment.ref ? ` · ${o.payment.ref}` : ''}`,
    `${L('Plateforme exploitée par', 'Platform operated by')} ${COMPANY_LINE}`,
  ].join('\n');
  return (
    <Screen>
      {o.demo || o.payment.method === 'demo' ? <Notice tone="warning" title={L('Commande de démonstration', 'Demo order')} text={L('Paiement simulé : aucun montant n’a été débité.', 'Simulated payment: nothing was charged.')} /> : null}
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>{o.number}</H1>
        <Badge label={st[lang]} tone={st.tone} />
      </Row>
      <Muted>{cook?.name} · {dayLabel(o.slotDate, lang)} {o.slotFrom}–{o.slotTo} · {o.mode === 'pickup' ? L('Retrait', 'Pickup') : L('Livraison', 'Delivery')}</Muted>
      <Spacer />
      {o.status === 'payment_failed' ? (
        <Card>
          <Notice tone="danger" title={L('Le paiement n’a pas abouti', 'Payment did not go through')} text={`${o.payment.error ?? ''} ${L('Aucun montant n’a été prélevé. Vous pouvez réessayer ou annuler la commande.', 'Nothing was charged. You can retry or cancel the order.')}`} />
          {err ? <Muted>{err}</Muted> : null}
          <Button icon="refresh" title={L('Réessayer le paiement', 'Retry payment')} loading={busy} onPress={() => retry(false)} />
          {!paymentsLive ? <Button variant="ghost" small title={L('Démo : échouer à nouveau', 'Demo: fail again')} onPress={() => retry(true)} /> : null}
        </Card>
      ) : null}
      {o.status === 'refused' ? <Notice tone="danger" title={L('Le cuisinier n’a pas pu accepter', 'The cook could not accept')} text={`${o.refuseReason ?? ''} — ${L('remboursement intégral.', 'full refund.')}`} /> : null}
      {stepIdx >= 0 ? (
        <Card>
          <H2>{L('Suivi', 'Progress')}</H2>
          {ORDER_STEPS.map((s, i) => (
            <Row key={s} gap={10} style={{ paddingVertical: 6 }}>
              <Ionicons name={i <= stepIdx ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={i <= stepIdx ? t.success : t.border} />
              <Text style={{ color: i <= stepIdx ? t.text : t.muted, fontWeight: i === stepIdx ? '700' : '500' }}>{STATUS_LABEL[s][lang]}</Text>
            </Row>
          ))}
        </Card>
      ) : null}
      <Card>
        <H2>{L('Reçu', 'Receipt')}</H2>
        {o.lines.map((l) => <Row key={l.dishId} style={{ justifyContent: 'space-between' }}><Body>{l.qty} × {l.title}</Body><Body>{chf(l.qty * l.unitPrice)}</Body></Row>)}
        <View style={{ height: 8 }} />
        <TotalsTable subtotal={o.subtotal} commission={o.commission} deliveryFee={o.deliveryFee} total={o.total} L={L} />
        <Muted style={{ fontSize: 12, marginTop: 6 }}>{L('Paiement', 'Payment')} : {o.payment.method === 'demo' ? L('simulation de démo', 'demo simulation') : 'Stripe'}{o.payment.ref ? ` · ${o.payment.ref}` : ''}</Muted>
        <Muted style={{ fontSize: 12 }}>{COMPANY_LINE}</Muted>
        <Spacer h={8} />
        <Button small variant="secondary" icon="download-outline" title={L('Télécharger le reçu', 'Download receipt')} onPress={() => downloadText(`recu-${o.number}.txt`, receipt(), 'text/plain;charset=utf-8')} />
      </Card>
      <Card>
        <H2>{L('Historique', 'History')}</H2>
        {o.timeline.map((e, i) => <Muted key={i}>{stamp(e.at, lang)} — {STATUS_LABEL[e.status][lang]}{e.note ? ` · ${e.note}` : ''}</Muted>)}
      </Card>
      {o.status === 'ready' ? <Button icon="checkmark-done" title={L('J’ai bien reçu ma commande', 'I received my order')} onPress={() => setOrderStatus(o.id, 'completed')} /> : null}
      {['requested', 'awaiting_payment', 'payment_failed'].includes(o.status) ? (
        <Button variant="danger" title={L('Annuler la commande', 'Cancel order')} onPress={() => confirmAsk(L('Annuler cette commande ? Vous serez remboursé intégralement si elle était payée.', 'Cancel this order? You will be fully refunded if paid.'), () => setOrderStatus(o.id, 'cancelled', undefined, L('Annulée par l’acheteur', 'Cancelled by buyer')))} />
      ) : null}
      {o.status === 'completed' ? (
        myReview ? (
          <Notice tone={myReview.status === 'published' ? 'success' : 'info'} title={myReview.status === 'pending' ? L('Avis envoyé — en modération', 'Review sent — in moderation') : myReview.status === 'published' ? L('Avis publié', 'Review published') : L('Avis non retenu', 'Review not accepted')} />
        ) : (
          <Card>
            <H2>{L('Laisser un avis', 'Leave a review')}</H2>
            <Row gap={4}>{[1, 2, 3, 4, 5].map((i) => <Button key={i} small variant={i <= stars ? 'primary' : 'secondary'} title={`${i}★`} onPress={() => setStars(i)} />)}</Row>
            <Spacer h={8} />
            <Field label={L('Votre avis', 'Your review')} value={text} onChangeText={setText} multiline maxLength={500} hint={L('Modéré avant publication. Pas de données personnelles.', 'Moderated before publication. No personal data.')} />
            <Stars value={stars} />
            <Spacer h={8} />
            <Button title={L('Envoyer', 'Send')} disabled={text.trim().length < 10} onPress={() => setReviews((l) => [{ id: uid('rev_'), orderId: o.id, cookId: o.cookId, rating: stars, text: text.trim(), author: prefs.buyerName || L('Client·e', 'Customer'), status: 'pending', at: new Date().toISOString() }, ...l])} />
          </Card>
        )
      ) : null}
      <Spacer />
      <Button variant="ghost" small icon="help-buoy-outline" title={L('Un problème ? Contacter le support', 'A problem? Contact support')} onPress={() => router.push({ pathname: '/report', params: { target: 'order', id: o.id } })} />
    </Screen>
  );
}
