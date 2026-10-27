import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { useData, useL } from '@/lib/data';
import { COMMUNES, findCommune, km } from '@/lib/geo';
import { getGps } from '@/lib/location';
import { Button, Card, Field, ListItem, Muted, Notice, Screen, Spacer } from '@/ui/kit';

export default function LocationScreen() {
  const { setPrefs } = useData();
  const { L } = useL();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const done = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const gps = async () => {
    setBusy(true); setErr(null);
    const r = await getGps();
    setBusy(false);
    if (!r.ok) return setErr(r.reason === 'denied' ? L('Localisation refusée. Choisissez votre commune ci-dessous.', 'Location denied. Pick your town below.') : L('Position indisponible. Choisissez votre commune ci-dessous.', 'Location unavailable. Pick your town below.'));
    const near = [...COMMUNES].sort((a, b) => km(r, a) - km(r, b))[0];
    setPrefs((p) => ({ ...p, location: { lat: r.lat, lng: r.lng, label: L(`Ma position (près de ${near.name})`, `My location (near ${near.name})`), source: 'gps' }, consents: { ...p.consents, location: true } }));
    done();
  };
  const list = findCommune(q).slice(0, 12);
  return (
    <Screen>
      <Muted>{L('Nous affichons les cuisinier·ères dans un rayon de 1 à 5 km. Votre position reste sur cet appareil (arrondie à ~100 m) et n’est jamais partagée.', 'We show cooks within 1–5 km. Your position stays on this device (rounded to ~100 m) and is never shared.')}</Muted>
      <Spacer />
      <Button icon="locate-outline" title={L('Utiliser ma position', 'Use my location')} loading={busy} onPress={gps} />
      {err ? <><Spacer h={8} /><Notice tone="warning" title={err} /></> : null}
      <Spacer />
      <Field label={L('Ou choisissez votre commune / NPA', 'Or pick your town / postcode')} value={q} onChangeText={setQ} placeholder="Prilly, 1008…" />
      <Card>
        {list.map((c) => (
          <ListItem key={c.npa + c.name} icon="location-outline" title={c.name} subtitle={`${c.npa} · ${c.canton}`} onPress={() => { setPrefs((p) => ({ ...p, location: { lat: c.lat, lng: c.lng, label: c.name, source: 'commune' } })); done(); }} />
        ))}
        {!list.length ? <Text>{L('Aucune commune trouvée (Suisse romande uniquement pour l’instant).', 'No town found (French-speaking Switzerland only for now).')}</Text> : null}
      </Card>
    </Screen>
  );
}
