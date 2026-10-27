import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useData, useL } from '@/lib/data';
import { stamp } from '@/lib/dates';
import { HYGIENE_CHECKLIST } from '@/lib/model';
import { Button, Card, Empty, Muted, Notice, Screen, Spacer, Toggle } from '@/ui/kit';

export default function Checklist() {
  const { myCook, setCooks } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  const [c, setC] = useState<Record<string, boolean>>(myCook?.checklist ?? {});
  if (!myCook) return <Screen><Empty title={L('Créez d’abord votre profil', 'Create your profile first')} action={<Button title={L('Profil', 'Profile')} onPress={() => router.replace('/studio/profile')} />} /></Screen>;
  const all = HYGIENE_CHECKLIST.every((h) => c[h.key]);
  return (
    <Screen>
      <Muted>{L('Checklist déclarative : vous attestez sur l’honneur. Ce n’est ni un contrôle, ni une certification.', 'Self-declared checklist: you attest on your honour. It is neither an inspection nor a certification.')}</Muted>
      <Spacer />
      <Card>{HYGIENE_CHECKLIST.map((h) => <Toggle key={h.key} label={h[lang]} value={!!c[h.key]} onChange={(v) => setC((x) => ({ ...x, [h.key]: v }))} />)}</Card>
      {myCook.checklistAt ? <Muted>{L('Dernière attestation', 'Last attested')} : {stamp(myCook.checklistAt, lang)}</Muted> : null}
      <Notice tone="info" title={L('Prochaine étape : SCAV', 'Next step: SCAV')} text={L('Les cuisiniers sont responsables de la conformité ; Bissabi prépare les gates SCAV — pas de certification affichée tant que non réelle.', 'Cooks are responsible for compliance; Bissabi is preparing the SCAV gates — no certification is shown until it is real.')} />
      <Button title={L('J’atteste et j’enregistre', 'I attest and save')} disabled={!all} onPress={() => { setCooks((l) => l.map((x) => (x.id === myCook.id ? { ...x, checklist: c, checklistAt: new Date().toISOString() } : x))); router.replace('/kitchen'); }} />
      {!all ? <Muted style={{ marginTop: 8 }}>{L('Cochez les 8 points pour publier vos plats.', 'Tick all 8 items to publish your dishes.')}</Muted> : null}
    </Screen>
  );
}
