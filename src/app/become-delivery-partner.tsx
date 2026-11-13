import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Text } from 'react-native';
import { MOCK_PARTNERS, TRACKING_LABEL, advanceMockTracking, quoteAll, type DeliveryJob, type DeliveryQuote } from '@/lib/deliveryPartners';
import { useL } from '@/lib/data';
import { Body, Button, Card, H1, H2, Muted, Notice, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function BecomeDeliveryPartner() {
  const { L, lang } = useL();
  const router = useRouter();
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([]);
  const [job, setJob] = useState<DeliveryJob | null>(null);

  useEffect(() => {
    quoteAll(4.2, new Date().toISOString()).then(setQuotes);
  }, []);

  return (
    <Screen>
      <Stack.Screen options={{ title: L('Partenaire livraison', 'Delivery partner') }} />
      <H1>{L('Devenir partenaire livraison', 'Become a delivery partner')}</H1>
      <Body>
        {L(
          'Bissabi cherche des partenaires de livraison en Suisse romande (et au-delà) pour un modèle gagnant-gagnant : volume planifié, zones claires, co-marketing, responsabilité séparée (cook = plat ; coursier = transport + chaîne du froid pendant la course).',
          'Bissabi seeks delivery partners in French-speaking Switzerland (and beyond) for a win-win model: planned volume, clear zones, co-marketing, split responsibility (cook = food; courier = transport + cold chain during the run).',
        )}
      </Body>
      <Spacer />
      <Notice
        tone="warning"
        title={L('Noms génériques pour l’instant', 'Generic names for now')}
        text={L(
          'Les partenaires listés dans l’app sont des placeholders jusqu’à signature d’accords. Voir docs/DELIVERY-PARTNERS.md pour la recherche marché et le pitch.',
          'Partners listed in the app are placeholders until agreements are signed. See docs/DELIVERY-PARTNERS.md for market research and the pitch.',
        )}
      />
      <H2>{L('Ce que nous proposons', 'What we offer')}</H2>
      <Card>
        <Body>• {L('Volume / zones garantis négociés', 'Negotiated guaranteed volume / zones')}</Body>
        <Body>• {L('Partage de revenus transparent (options dans le doc)', 'Transparent revenue share (options in the doc)')}</Body>
        <Body>• {L('Co-branding sur les courses partenaires', 'Co-branding on partner runs')}</Body>
        <Body>• {L('API mock dès aujourd’hui (devis, ETA, tracking)', 'Mock API today (quote, ETA, tracking)')}</Body>
      </Card>
      <H2>{L('Placeholders (démo)', 'Placeholders (demo)')}</H2>
      {MOCK_PARTNERS.map((p) => (
        <Card key={p.id} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '700', color: t.text }}>{lang === 'en' ? p.labelEn : p.labelFr}</Text>
          <Muted>{lang === 'en' ? p.zonesHintEn : p.zonesHintFr} · {p.kind}</Muted>
        </Card>
      ))}
      <H2>{L('Devis mock (indicatif)', 'Mock quotes (indicative)')}</H2>
      <Muted>{L('Montants de démo internes — pas des tarifs opérateurs réels.', 'Internal demo amounts — not real operator tariffs.')}</Muted>
      {quotes.map((q) => (
        <Card key={q.partnerId} style={{ marginBottom: 8 }}>
          <Body>{q.partnerLabel}</Body>
          <Muted>CHF {q.feeChf.toFixed(2)} · ETA {q.etaMinutesMin}–{q.etaMinutesMax} min · {q.mock ? 'mock' : ''}</Muted>
          <Button
            small
            style={{ marginTop: 8 }}
            title={L('Simuler une course', 'Simulate a job')}
            onPress={async () => {
              const partner = MOCK_PARTNERS.find((x) => x.id === q.partnerId)!;
              const j = await partner.requestJob('order_demo', q);
              setJob(j);
            }}
          />
        </Card>
      ))}
      {job ? (
        <Card>
          <H2>{L('Tracking mock', 'Mock tracking')}</H2>
          <Body>{TRACKING_LABEL[job.state][lang]} · {job.id}</Body>
          <Button
            style={{ marginTop: 8 }}
            variant="secondary"
            title={L('Avancer l’état', 'Advance state')}
            onPress={() => setJob(advanceMockTracking(job.id))}
          />
        </Card>
      ) : null}
      <Spacer />
      <Button
        title={L('Lire le modèle partenaire (doc)', 'Read partner model (doc)')}
        variant="secondary"
        onPress={() => Linking.openURL('https://github.com/mohamadalhabib92/bissabi-home-made-food/blob/feat/marketplace-2026-11-05/docs/DELIVERY-PARTNERS.md')}
      />
      <Spacer h={8} />
      <Button title={L('Retour', 'Back')} variant="ghost" onPress={() => router.back()} />
      <Spacer h={24} />
      <Muted>
        {L(
          'Contact partenariats : via Mohamed (propriétaire). Aucun engagement commercial n’est créé par cette page.',
          'Partnerships contact: via Mohamed (owner). This page creates no commercial commitment.',
        )}
      </Muted>
    </Screen>
  );
}
