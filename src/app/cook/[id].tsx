import { isBadgeValid, BADGE_LABEL_FR, BADGE_LABEL_EN } from '@/lib/cookQualification';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Avatar, DishCard, Pill, Stars } from '@/components/brand';
import { useData, useL } from '@/lib/data';
import { stamp } from '@/lib/dates';
import { fmtKm } from '@/lib/geo';
import { openSlotsFor, rating } from '@/lib/market';
import { HYGIENE_CHECKLIST } from '@/lib/model';
import { Body, Button, Card, Empty, H1, H2, IconButton, Muted, Row, Screen, Spacer } from '@/ui/kit';

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cooks, dishes, slots, reviews, distanceTo, favorites, toggleFav } = useData();
  const { L } = useL();
  const router = useRouter();
  const cook = cooks.find((c) => c.id === id);
  if (!cook) return <Screen><Empty icon="help-circle-outline" title={L('Profil introuvable', 'Profile not found')} /></Screen>;
  const d = distanceTo(cook);
  const r = rating(reviews, cook.id);
  const mine = dishes.filter((x) => x.cookId === cook.id && x.active);
  const pub = reviews.filter((x) => x.cookId === cook.id && x.status === 'published');
  const checked = HYGIENE_CHECKLIST.filter((h) => cook.checklist[h.key]).length;
  const fav = favorites.cooks.includes(cook.id);
  return (
    <Screen>
      <Stack.Screen options={{ title: cook.name, headerRight: () => <IconButton icon={fav ? 'heart' : 'heart-outline'} label={L('Favori', 'Favourite')} onPress={() => toggleFav('cooks', cook.id)} /> }} />
      <Row>
        <Avatar cook={cook} size={64} />
        <View style={{ flex: 1 }}>
          <H1>{cook.name}</H1>
          <Muted>{cook.npa} {cook.commune}{d != null ? ` · ${fmtKm(d)}` : ''}</Muted>
          {r.count ? <Row gap={6}><Stars value={r.avg} /><Muted>{r.avg.toFixed(1)} ({r.count})</Muted></Row> : <Muted>{L('Pas encore d’avis', 'No reviews yet')}</Muted>}
        </View>
      </Row>
      <Spacer />
      <Row wrap gap={6}>
        {cook.originFlag ? <Pill label={`${cook.originFlag} ${cook.originCountry ?? ''}`} tone="gold" /> : null}
        {cook.ofcoStatus === 'ofco_verified' ? <Pill label={L('Annonce OFCO vérifiée (démo)', 'OFCO notice verified (demo)')} tone="green" /> : null}
        {cook.hygieneBadge ? <Pill label={L('Checklist hygiène OK (auto)', 'Hygiene checklist OK (self)')} /> : null}
        {cook.halalKitchen ? <Pill label={L('Cuisine halal (déclarée)', 'Halal kitchen (declared)')} tone="green" /> : <Pill label={L('Cuisine non déclarée halal', 'Kitchen not declared halal')} />}
        {isBadgeValid(cook.qualification) ? <Pill label={L(BADGE_LABEL_FR, BADGE_LABEL_EN)} tone="green" /> : null}
        {(cook.deliveryModes ?? (cook.delivers ? ['pickup', 'delivery'] : ['pickup'])).includes('partner') ? <Pill label={L('Livre via partenaire', 'Delivers via partner')} tone="gold" /> : null}
        <Pill label={cook.delivers ? L('Retrait & livraison', 'Pickup & delivery') : L('Retrait', 'Pickup')} tone="gold" />
        <Pill label={`${L('Checklist hygiène', 'Hygiene checklist')} ${checked}/${HYGIENE_CHECKLIST.length} (${L('auto-déclarée', 'self-declared')})`} />
        {cook.languages.map((x) => <Pill key={x} label={x.toUpperCase()} />)}
        {cook.demo ? <Pill label="démo" /> : null}
      </Row>
      <Spacer />
      <Body>{cook.bio}{cook.story ? `\n\n${cook.story}` : ''}{cook.originCountry ? `\n${cook.originFlag ?? ''} ${cook.originCountry}${cook.canton ? ` · ${cook.canton}` : ''}` : ''}</Body>
      {cook.specialties?.length ? (<><Spacer h={8} /><Row wrap gap={6}>{cook.specialties.map((s) => <Pill key={s} label={s} tone="cream" />)}</Row></>) : null}
      <Spacer />
      <H2>{L('Ses plats', 'Dishes')}</H2>
      {mine.length ? mine.map((x) => <DishCard key={x.id} dish={x} distance={d} nextSlot={openSlotsFor(x, slots)[0]} onPress={() => router.push(`/dish/${x.id}`)} />) : <Muted>{L('Aucun plat actif.', 'No active dish.')}</Muted>}
      <H2>{L('Avis vérifiés', 'Verified reviews')}</H2>
      {pub.length ? pub.map((x) => (
        <Card key={x.id}>
          <Row gap={8}><Stars value={x.rating} /><Muted>{x.author} · {stamp(x.at)}</Muted></Row>
          <Body>{x.text}</Body>
        </Card>
      )) : <Muted>{L('Les avis apparaissent après modération, uniquement pour des commandes terminées.', 'Reviews appear after moderation, only for completed orders.')}</Muted>}
      <Spacer />
      <Button variant="ghost" small icon="flag-outline" title={L('Signaler ce profil', 'Report this profile')} onPress={() => router.push({ pathname: '/report', params: { target: 'cook', id: cook.id } })} />
    </Screen>
  );
}
