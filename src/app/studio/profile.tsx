import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AVATAR_COLORS } from '@/lib/cookutil';
import { useData, useL } from '@/lib/data';
import { COMMUNES, findCommune } from '@/lib/geo';
import type { Cook } from '@/lib/model';
import { uid } from '@/lib/storage';
import { Button, Card, Chip, Field, Muted, Notice, Row, Screen, Spacer, Toggle } from '@/ui/kit';

export default function CookProfile() {
  const { myCook, setCooks, setPrefs } = useData();
  const { L } = useL();
  const router = useRouter();
  const [name, setName] = useState(myCook?.name ?? '');
  const [commune, setCommune] = useState(myCook?.commune ?? '');
  const [bio, setBio] = useState(myCook?.bio ?? '');
  const [halal, setHalal] = useState(myCook?.halalKitchen ?? false);
  const [delivers, setDelivers] = useState(myCook?.delivers ?? false);
  const [langs, setLangs] = useState<string[]>(myCook?.languages ?? ['fr']);
  const [color, setColor] = useState(myCook?.avatarColor ?? AVATAR_COLORS[0]);
  const place = COMMUNES.find((c) => c.name.toLowerCase() === commune.trim().toLowerCase());
  const sugg = !place && commune.trim() ? findCommune(commune).slice(0, 5) : [];
  const valid = name.trim().length >= 2 && !!place && bio.trim().length >= 20;
  const save = () => {
    if (!place) return;
    const base: Cook = myCook ?? { id: uid('cook_'), checklist: {}, isMe: true, createdAt: new Date().toISOString() } as Cook;
    const next: Cook = { ...base, name: name.trim(), commune: place.name, npa: place.npa, lat: place.lat, lng: place.lng, bio: bio.trim(), halalKitchen: halal, delivers, languages: langs, avatarColor: color };
    setCooks((l) => (myCook ? l.map((c) => (c.id === next.id ? next : c)) : [...l, next]));
    setPrefs((p) => ({ ...p, mode: 'cook' }));
    if (myCook) router.back(); else router.replace('/studio/checklist');
  };
  return (
    <Screen>
      <Field label={L('Nom affiché', 'Display name')} value={name} onChangeText={setName} placeholder={L('Prénom + initiale, ex. Awa D.', 'First name + initial, e.g. Awa D.')} hint={L('Évitez votre nom complet : protégez votre vie privée.', 'Avoid your full name: protect your privacy.')} />
      <Field label={L('Commune', 'Town')} value={commune} onChangeText={setCommune} placeholder="Prilly" hint={place ? `${place.npa} ${place.name} · ${L('adresse exacte partagée seulement après acceptation', 'exact address only shared after acceptance')}` : undefined} error={commune && !place && !sugg.length ? L('Commune non couverte pour l’instant', 'Town not covered yet') : undefined} />
      {sugg.length ? <Row wrap>{sugg.map((s) => <Chip key={s.npa + s.name} label={s.name} onPress={() => setCommune(s.name)} />)}</Row> : null}
      <Field label={L('Présentation', 'About you')} value={bio} onChangeText={setBio} multiline placeholder={L('Votre histoire, vos spécialités, votre façon de cuisiner… (20 caractères min.)', 'Your story, specialities, how you cook… (20 chars min.)')} />
      <Toggle label={L('Ma cuisine est halal (déclaration)', 'My kitchen is halal (declaration)')} value={halal} onChange={setHalal} hint={L('Engagement personnel, non certifié par Bissabi.', 'Personal commitment, not certified by Bissabi.')} />
      <Toggle label={L('Je peux livrer moi-même', 'I can deliver myself')} value={delivers} onChange={setDelivers} hint={L('Sinon : retrait uniquement.', 'Otherwise: pickup only.')} />
      <Muted>{L('Langues parlées', 'Languages spoken')}</Muted>
      <Row wrap>{['fr', 'en', 'de', 'it', 'es', 'ar', 'wo'].map((k) => <Chip key={k} label={k.toUpperCase()} active={langs.includes(k)} onPress={() => setLangs((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]))} />)}</Row>
      <Spacer h={8} />
      <Muted>{L('Couleur de l’avatar', 'Avatar colour')}</Muted>
      <Row wrap>{AVATAR_COLORS.map((c) => <Chip key={c} label="●" color={c} active={color === c} onPress={() => setColor(c)} />)}</Row>
      <Spacer />
      <Card><Notice tone="info" title={L('Responsabilité', 'Responsibility')} text={L('Les cuisiniers sont responsables de la conformité ; Bissabi prépare les gates SCAV — pas de certification affichée tant que non réelle.', 'Cooks are responsible for compliance; Bissabi is preparing the SCAV gates — no certification is shown until it is real.')} /></Card>
      <Button title={myCook ? L('Enregistrer', 'Save') : L('Continuer vers la checklist', 'Continue to checklist')} disabled={!valid} onPress={save} />
    </Screen>
  );
}
