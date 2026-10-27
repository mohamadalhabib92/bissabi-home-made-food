import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';
import { useData, useL } from '@/lib/data';
import type { Report } from '@/lib/model';
import { SUPPORT_EMAIL } from '@/lib/payments';
import { uid } from '@/lib/storage';
import { Button, Chip, Field, Muted, Notice, Row, Screen, Spacer } from '@/ui/kit';

export default function ReportScreen() {
  const p = useLocalSearchParams<{ target?: string; id?: string }>();
  const { setReports } = useData();
  const { L } = useL();
  const router = useRouter();
  const target = (['dish', 'cook', 'order'].includes(p.target ?? '') ? p.target : 'other') as Report['target'];
  const reasons = [L('Sécurité alimentaire', 'Food safety'), L('Allergènes erronés', 'Wrong allergens'), L('Commande non reçue', 'Order not received'), L('Comportement', 'Behaviour'), L('Paiement', 'Payment'), L('Autre', 'Other')];
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <Screen>
        <Notice tone="success" title={L('Merci, signalement enregistré', 'Thanks, report saved')} text={SUPPORT_EMAIL.configured ? L('Vous pouvez aussi écrire au support par e-mail.', 'You can also email support.') : L('Le support e-mail n’est pas encore configuré : le signalement reste sur cet appareil (démo).', 'Email support is not configured yet: the report stays on this device (demo).')} />
        {SUPPORT_EMAIL.configured ? <Button variant="secondary" icon="mail-outline" title={L('Écrire au support', 'Email support')} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL.value}?subject=${encodeURIComponent(`[HMF] ${reason}`)}&body=${encodeURIComponent(text)}`)} /> : null}
        <Spacer h={8} />
        <Button title={L('Fermer', 'Close')} onPress={() => router.back()} />
      </Screen>
    );
  return (
    <Screen>
      <Muted>{L('En cas d’urgence médicale (allergie), appelez le 144.', 'In a medical emergency (allergy), call 144.')}</Muted>
      <Spacer />
      <Row wrap>{reasons.map((r) => <Chip key={r} label={r} active={reason === r} onPress={() => setReason(r)} />)}</Row>
      <Spacer h={8} />
      <Field label={L('Décrivez la situation', 'Describe the situation')} value={text} onChangeText={setText} multiline maxLength={1000} />
      <Button title={L('Envoyer le signalement', 'Send report')} disabled={!reason || text.trim().length < 10} onPress={() => { setReports((l) => [{ id: uid('rep_'), target, targetId: p.id, reason, text: text.trim(), at: new Date().toISOString() }, ...l]); setSent(true); }} />
    </Screen>
  );
}
