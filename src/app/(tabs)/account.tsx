import { useRouter } from 'expo-router';
import { Wordmark } from '@/components/brand';
import { COMPANY_LINE } from '@/lib/company';
import { confirmAsk } from '@/lib/confirm';
import { useData, useL } from '@/lib/data';
import { paymentsLive } from '@/lib/payments';
import { Badge, Button, Card, H2, ListItem, Muted, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';

export default function Account() {
  const { prefs, setPrefs, hasDemo, removeDemo, loadDemo, reviews, favorites, dishes, cooks } = useData();
  const { L } = useL();
  const router = useRouter();
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
  return (
    <Screen>
      <Wordmark />
      <Spacer />
      <Segmented label={L('Langue', 'Language')} options={[{ label: 'Français', value: 'fr' as const }, { label: 'English', value: 'en' as const }]} value={prefs.lang} onChange={(v) => setPrefs((p) => ({ ...p, lang: v }))} />
      <Card>
        <ListItem icon="language-outline" title={L('Autres langues', 'Other languages')} subtitle="DE · IT · ES · de-CH · AR" right={<Badge label={L('à venir', 'coming')} />} onPress={() => router.push('/languages')} />
        <ListItem icon="location-outline" title={L('Lieu', 'Location')} subtitle={prefs.location?.label ?? L('Non défini', 'Not set')} onPress={() => router.push('/location')} />
      </Card>
      <H2>{L('Favoris', 'Favourites')}</H2>
      <Card>
        {favorites.dishes.length || favorites.cooks.length ? (
          <>
            {favorites.cooks.map((id) => { const c = cooks.find((x) => x.id === id); return c ? <ListItem key={id} icon="person-outline" title={c.name} subtitle={c.commune} onPress={() => router.push(`/cook/${id}`)} /> : null; })}
            {favorites.dishes.map((id) => { const d = dishes.find((x) => x.id === id); return d ? <ListItem key={id} icon="heart" title={d.title} onPress={() => router.push(`/dish/${id}`)} /> : null; })}
          </>
        ) : <Muted>{L('Touchez ♥ sur un plat ou un profil.', 'Tap ♥ on a dish or a profile.')}</Muted>}
      </Card>
      <H2>{L('Confidentialité & consentements', 'Privacy & consents')}</H2>
      <Card>
        <Toggle label={L('Nouvelles de Bissabi (marketing)', 'Bissabi news (marketing)')} value={prefs.consents.marketing} onChange={(v) => setPrefs((p) => ({ ...p, consents: { ...p.consents, marketing: v, at: new Date().toISOString() } }))} />
        <Toggle label={L('Utiliser ma position GPS', 'Use my GPS location')} value={prefs.location?.source === 'gps'} onChange={(v) => (v ? router.push('/location') : setPrefs((p) => ({ ...p, location: null, consents: { ...p.consents, location: false } })))} hint={L('Désactiver efface la position enregistrée.', 'Turning off erases the saved position.')} />
        <ListItem icon="shield-outline" title={L('Mes données (export, suppression)', 'My data (export, deletion)')} onPress={() => router.push('/privacy')} />
      </Card>
      <H2>{L('Aide & confiance', 'Help & trust')}</H2>
      <Card>
        <ListItem icon="help-buoy-outline" title={L('Signaler / support', 'Report / support')} onPress={() => router.push('/report')} />
        <ListItem icon="document-text-outline" title={L('Conformité & prochaines étapes', 'Compliance & next steps')} onPress={() => router.push('/compliance')} />
        <ListItem icon="business-outline" title={L('Mentions légales', 'Legal notice')} onPress={() => router.push('/legal')} />
      </Card>
      <H2>{L('Administration', 'Administration')}</H2>
      <Card>
        <ListItem icon="chatbubbles-outline" title={L('Modération des avis', 'Review moderation')} right={pendingReviews ? <Badge label={String(pendingReviews)} tone="warning" /> : undefined} onPress={() => router.push('/moderation')} />
        <ListItem icon="construct-outline" title={L('Notes admin & configuration', 'Admin notes & configuration')} right={<Badge label={paymentsLive ? 'Stripe' : L('démo', 'demo')} tone={paymentsLive ? 'success' : 'warning'} />} onPress={() => router.push('/admin-notes')} />
      </Card>
      {hasDemo
        ? <Button variant="secondary" icon="flask-outline" title={L('Retirer les données de démo', 'Remove demo data')} onPress={() => confirmAsk(L('Retirer tous les cuisiniers, plats et commandes de démo ?', 'Remove all demo cooks, dishes and orders?'), removeDemo)} />
        : <Button variant="ghost" icon="flask-outline" title={L('Recharger la démo', 'Reload demo')} onPress={loadDemo} />}
      <Spacer />
      <Muted style={{ fontSize: 12, textAlign: 'center' }}>{COMPANY_LINE}</Muted>
    </Screen>
  );
}
