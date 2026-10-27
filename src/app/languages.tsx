import { useData, useL } from '@/lib/data';
import { Badge, Card, ListItem, Muted, Screen } from '@/ui/kit';

export default function Languages() {
  const { prefs, setPrefs } = useData();
  const { L } = useL();
  const live = [{ k: 'fr' as const, n: 'Français' }, { k: 'en' as const, n: 'English' }];
  const later = [
    { n: 'Deutsch', p: L('Phase 2', 'Phase 2') }, { n: 'Italiano', p: L('Phase 2', 'Phase 2') }, { n: 'Español', p: L('Phase 2', 'Phase 2') },
    { n: 'Schwiizerdütsch (de-CH)', p: L('Phase 3', 'Phase 3') }, { n: 'العربية (AR, droite-à-gauche)', p: L('Phase 3 — mise en page RTL', 'Phase 3 — RTL layout') },
  ];
  return (
    <Screen>
      <Card>{live.map((x) => <ListItem key={x.k} icon={prefs.lang === x.k ? 'radio-button-on' : 'radio-button-off'} title={x.n} right={<Badge label={L('Complet', 'Complete')} tone="success" />} onPress={() => setPrefs((p) => ({ ...p, lang: x.k }))} />)}</Card>
      <Muted style={{ marginBottom: 8 }}>{L('Prochaines langues (non sélectionnables tant que la traduction n’est pas complète) :', 'Upcoming languages (not selectable until fully translated):')}</Muted>
      <Card>{later.map((x) => <ListItem key={x.n} icon="time-outline" title={x.n} right={<Badge label={x.p} />} />)}</Card>
    </Screen>
  );
}
