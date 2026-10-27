import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Wordmark } from '@/components/brand';
import { useData, useL } from '@/lib/data';
import { Button, Card, Muted, Notice, Row, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function Welcome() {
  const { prefs, setPrefs } = useData();
  const { L } = useL();
  const router = useRouter();
  const [terms, setTerms] = useState(prefs.consents.terms);
  const [marketing, setMarketing] = useState(prefs.consents.marketing);
  const [mode, setMode] = useState(prefs.mode);
  const go = () => {
    setPrefs((p) => ({ ...p, onboarded: true, mode, consents: { ...p.consents, terms: true, marketing, at: new Date().toISOString() } }));
    router.replace(mode === 'cook' ? '/kitchen' : prefs.location ? '/' : '/location');
  };
  return (
    <Screen>
      <Spacer h={24} />
      <Wordmark size={28} />
      <Spacer h={20} />
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', lineHeight: 30 }}>
        {L('Des plats faits maison par vos voisins, commandés à l’avance.', 'Home-cooked dishes from your neighbours, ordered in advance.')}
      </Text>
      <Muted style={{ marginTop: 6 }}>{L('Pas un service de livraison de restaurants : des cuisinier·ères de quartier, des créneaux planifiés, des allergènes toujours affichés.', 'Not a restaurant delivery app: neighbourhood cooks, planned time slots, allergens always shown.')}</Muted>
      <Spacer />
      <Segmented label={L('Langue', 'Language')} options={[{ label: 'Français', value: 'fr' as const }, { label: 'English', value: 'en' as const }]} value={prefs.lang} onChange={(v) => setPrefs((p) => ({ ...p, lang: v }))} />
      <Segmented label={L('Je veux…', 'I want to…')} options={[{ label: L('Commander', 'Order food'), value: 'buyer' as const }, { label: L('Cuisiner', 'Cook'), value: 'cook' as const }]} value={mode} onChange={setMode} />
      <Card>
        <Toggle label={L('J’accepte les conditions d’utilisation et la politique de confidentialité (obligatoire)', 'I accept the terms of use and privacy policy (required)')} value={terms} onChange={setTerms} />
        <Toggle label={L('Recevoir des nouvelles de Bissabi (facultatif)', 'Receive news from Bissabi (optional)')} value={marketing} onChange={setMarketing} hint={L('Révocable à tout moment dans Compte.', 'You can withdraw anytime in Account.')} />
        <Row wrap>
          <Button small variant="ghost" title={L('Confidentialité', 'Privacy')} onPress={() => router.push('/privacy')} />
          <Button small variant="ghost" title={L('Mentions légales', 'Legal notice')} onPress={() => router.push('/legal')} />
        </Row>
      </Card>
      <Notice tone="info" title={L('Données de démonstration', 'Demo data')} text={L('Les cuisinier·ères et plats marqués « démo » sont fictifs, pour essayer l’app. Supprimables dans Compte.', 'Cooks and dishes marked “démo” are fictional, for trying the app. Remove them in Account.')} />
      <Button title={L('Commencer', 'Get started')} icon="arrow-forward" disabled={!terms} onPress={go} />
      <View style={{ height: 24 }} />
    </Screen>
  );
}
