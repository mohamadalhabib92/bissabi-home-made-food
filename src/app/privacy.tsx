import { useRouter } from 'expo-router';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { stamp } from '@/lib/dates';
import { downloadText } from '@/lib/download';
import { exportAll } from '@/lib/storage';
import { Body, Button, Card, H2, Muted, Screen, Spacer } from '@/ui/kit';

export default function Privacy() {
  const { prefs, wipe } = useData();
  const { L, lang } = useL();
  const router = useRouter();
  return (
    <Screen>
      <H2>{L('Ce que nous stockons', 'What we store')}</H2>
      <Body>{L('Tout est enregistré sur cet appareil : préférences, panier, commandes, profil cuisinier, plats. La position GPS est arrondie (~100 m) et n’est jamais envoyée. Aucun traceur publicitaire.', 'Everything is stored on this device: preferences, cart, orders, cook profile, dishes. GPS position is rounded (~100 m) and never sent. No ad trackers.')}</Body>
      <Spacer />
      <Body>{L('Lorsque le paiement est activé, Stripe traite les données de carte ; Bissabi n’y a jamais accès.', 'When payments are enabled, Stripe processes card data; Bissabi never sees it.')}</Body>
      <Spacer />
      <Card>
        <Muted>{L('Consentements', 'Consents')}{prefs.consents.at ? ` · ${stamp(prefs.consents.at, lang)}` : ''}</Muted>
        <Body>{L('Conditions', 'Terms')} : {prefs.consents.terms ? '✓' : '—'} · {L('Localisation', 'Location')} : {prefs.consents.location ? '✓' : '—'} · Marketing : {prefs.consents.marketing ? '✓' : '—'}</Body>
      </Card>
      <Button variant="secondary" icon="download-outline" title={L('Exporter mes données (JSON)', 'Export my data (JSON)')} onPress={async () => downloadText(`bissabi-home-made-export-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await exportAll(), null, 2), 'application/json')} />
      <Spacer h={10} />
      <Button variant="danger" icon="trash-outline" title={L('Supprimer mon compte et mes données', 'Delete my account and data')} onPress={() => confirmAsk(L('Supprimer définitivement toutes vos données de cet appareil ? Action irréversible.', 'Permanently delete all your data from this device? This cannot be undone.'), async () => { await wipe(); router.replace('/welcome'); }, L('Supprimer', 'Delete'))} />
      <Muted style={{ marginTop: 12 }}>{L('Droits LPD / RGPD : accès, rectification, effacement, portabilité. Contact via « Signaler / support ».', 'Swiss FADP / GDPR rights: access, rectification, erasure, portability. Contact via “Report / support”.')}</Muted>
    </Screen>
  );
}
