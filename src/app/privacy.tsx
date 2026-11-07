import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { stamp } from '@/lib/dates';
import { downloadText } from '@/lib/download';
import { useReboot } from '@/lib/reboot';
import type { RecoverySummary } from '@/lib/preserve';
import { exportAll, exportRecoveryRaw, purgeQuarantine, recoveryState, releaseLockedKey, restoreQuarantineKey } from '@/lib/storage';
import { Body, Button, Card, H2, Muted, Notice, Screen, Spacer } from '@/ui/kit';

const KEY_LABEL: Record<string, [string, string]> = {
  prefs: ['Préférences', 'Preferences'],
  cooks: ['Cuisiniers', 'Cooks'],
  dishes: ['Plats', 'Dishes'],
  slots: ['Créneaux', 'Slots'],
  orders: ['Commandes', 'Orders'],
  reviews: ['Avis', 'Reviews'],
  reports: ['Signalements', 'Reports'],
  favorites: ['Favoris', 'Favourites'],
  cart: ['Panier', 'Cart'],
};

export default function Privacy() {
  const { prefs, wipe, preservation } = useData();
  const { L, lang } = useL();
  const { t } = useI18n();
  const router = useRouter();
  const reboot = useReboot();
  const [copies, setCopies] = useState<RecoverySummary[]>([]);
  const [readable, setReadable] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void recoveryState().then((state) => {
      setReadable(state.readable);
      setCopies(state.copies);
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh, preservation]);

  const label = (key: string) => {
    const pair = KEY_LABEL[key];
    return pair ? L(pair[0], pair[1]) : key;
  };

  const after = (result: string) => {
    if (result === 'restored') {
      setStatus(t('preserveRestored'));
      reboot();
      return;
    }
    if (result === 'released') {
      setStatus(t('preserveReleased'));
      reboot();
      return;
    }
    if (result === 'blocked') setStatus(t('preserveBlocked'));
    else if (result === 'unreadable') setStatus(t('preserveUnreadable'));
    else if (result === 'missing') setStatus(t('preserveNoCopy'));
    else if (result === 'noop' || result === 'already') setStatus(t('preserveRestored'));
    refresh();
  };

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
      <H2>{t('preserveRecoveryTitle')}</H2>
      <Body>{t('preserveRecoveryBody')}</Body>
      <Muted style={{ marginTop: 8 }}>{t('preserveWipeBody')}</Muted>
      {!readable ? <Notice tone="warning" title={t('preserveUnreadable')} /> : null}
      {copies.map((copy) => (
        <Card key={copy.key}>
          <Body>{label(copy.key)} · {copy.bytes} {L('octets', 'bytes')} · {copy.reason}</Body>
          <Muted>{copy.capturedAt}{copy.conflictCount ? ` · ${copy.conflictCount} ${L('conflit(s) conservé(s)', 'kept conflict(s)')}` : ''}</Muted>
          <Spacer h={8} />
          <Button small variant="secondary" title={t('preserveRestore')} onPress={() => { void restoreQuarantineKey(copy.key, false).then(after); }} />
          <Spacer h={8} />
          <Button small variant="ghost" title={t('preserveReplace')} onPress={() => confirmAsk(L(`Remplacer la copie de travail « ${label(copy.key)} » par la copie de récupération ?`, `Replace the “${label(copy.key)}” working copy with the recovery copy?`), () => { void restoreQuarantineKey(copy.key, true).then(after); }, L('Remplacer', 'Replace'))} />
          {copy.reason === 'malformed' || copy.reason === 'future-schema' || copy.reason === 'incompatible-shape' ? (
            <>
              <Spacer h={8} />
              <Button small variant="ghost" title={t('preserveRelease')} onPress={() => confirmAsk(L('Repartir à vide pour cette clé ? La copie de récupération reste sur cet appareil.', 'Start empty for this key? The recovery copy stays on this device.'), () => { void releaseLockedKey(copy.key).then(after); }, L('Repartir à vide', 'Start empty'))} />
            </>
          ) : null}
        </Card>
      ))}
      <Button variant="secondary" icon="download-outline" title={t('preserveExportRecovery')} onPress={async () => {
        const raw = await exportRecoveryRaw();
        if (!raw) { setStatus(t('preserveNoCopy')); return; }
        await downloadText(`bissabi-home-made-recovery-${new Date().toISOString().slice(0, 10)}.json`, raw, 'application/json');
      }} />
      <Spacer h={10} />
      <Button variant="danger" icon="trash-outline" title={L('Supprimer mon compte et mes données', 'Delete my account and data')} onPress={() => confirmAsk(L('Effacer la copie de travail de cet appareil ? Une copie de récupération locale est gardée. Action séparée pour l’effacer aussi.', 'Erase the working copy on this device? A local recovery copy is kept. Erasing that copy is a separate action.'), async () => {
        const cleared = await wipe();
        if (cleared) router.replace('/welcome');
        else setStatus(t('preserveHeldTitle'));
      }, L('Supprimer', 'Delete'))} />
      <Spacer h={10} />
      <Button variant="danger" icon="trash-outline" title={t('preservePurge')} onPress={() => confirmAsk(L('Effacer définitivement la copie de récupération de cet appareil ?', 'Permanently erase the recovery copy from this device?'), async () => {
        const ok = await purgeQuarantine();
        setStatus(ok ? t('preservePurged') : t('preserveUnreadable'));
        refresh();
      }, L('Effacer la copie', 'Erase the copy'))} />
      {status ? <Muted style={{ marginTop: 12 }}>{status}</Muted> : null}
      <Muted style={{ marginTop: 12 }}>{L('Droits LPD / RGPD : accès, rectification, effacement, portabilité. Contact via « Signaler / support ».', 'Swiss FADP / GDPR rights: access, rectification, erasure, portability. Contact via “Report / support”.')}</Muted>
    </Screen>
  );
}
