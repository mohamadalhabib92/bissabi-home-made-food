import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useData, useL } from '@/lib/data';
import { serverCourierStep } from '@/lib/courierServer';
import { paymentsLive } from '@/lib/payments';
import { Body, Button, Card, Empty, Field, H1, Muted, Notice, Screen, Spacer } from '@/ui/kit';

export default function CourierJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, courierAct } = useData();
  const { L } = useL();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const o = orders.find((x) => x.id === id);
  if (!o || !o.delivery) return <Screen><Empty title={L('Course introuvable', 'Job not found')} /></Screen>;
  const act = async (action: 'accept' | 'decline' | 'pickup' | 'en_route' | 'deliver') => {
    const remote = action === 'decline' ? null : await serverCourierStep(o.id, action, code);
    if (remote === false) {
      setMsg(L('Étape refusée. Vérifiez le code, la validation et la disponibilité.', 'Step refused. Check the code, validation and availability.'));
      return;
    }
    const result = courierAct(o.id, action, code);
    setMsg(remote === true || result === 'ok' ? L('Étape enregistrée', 'Step saved') : L('Étape refusée. Vérifiez le code, la validation et la disponibilité.', 'Step refused. Check the code, validation and availability.'));
  };
  return (
    <Screen>
      {!paymentsLive ? <Notice tone="info" title={L('Exercice', 'Practice')} text={L('Aucun paiement réel de la course.', 'No real payment for this job.')} /> : null}
      <H1>{o.number}</H1>
      <Muted>{o.buyerName} · {o.delivery.state}</Muted>
      {o.address ? <Body>{o.address}</Body> : <Muted>{L('Adresse communiquée par la cuisine au retrait.', 'Address shared by the kitchen at pickup.')}</Muted>}
      <Spacer />
      <Card>
        {o.lines.map((l) => <Body key={l.dishId}>{l.qty} × {l.title}</Body>)}
      </Card>
      {o.delivery.state === 'offered' ? (
        <>
          <Button title={L('Accepter', 'Accept')} onPress={() => act('accept')} />
          <Spacer h={8} />
          <Button variant="ghost" title={L('Refuser', 'Decline')} onPress={() => act('decline')} />
        </>
      ) : null}
      {o.delivery.state === 'accepted' ? (
        <>
          <Field label={L('Code de retrait à la cuisine', 'Pickup code at the kitchen')} value={code} onChangeText={setCode} keyboardType="number-pad" />
          <Button title={L('Confirmer le retrait', 'Confirm pickup')} onPress={() => act('pickup')} />
        </>
      ) : null}
      {o.delivery.state === 'picked_up' ? <Button title={L('En route', 'On the way')} onPress={() => act('en_route')} /> : null}
      {o.delivery.state === 'en_route' ? (
        <>
          <Field label={L('Code de livraison', 'Delivery code')} value={code} onChangeText={setCode} keyboardType="number-pad" />
          <Button title={L('Confirmer la livraison', 'Confirm delivery')} onPress={() => act('deliver')} />
        </>
      ) : null}
      {o.delivery.state === 'delivered' ? <Notice tone="success" title={L('Livré', 'Delivered')} text={o.delivery.proofAt} /> : null}
      {msg ? <Muted style={{ marginTop: 8 }}>{msg}</Muted> : null}
    </Screen>
  );
}
