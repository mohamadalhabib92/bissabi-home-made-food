import { Stack, useRouter } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import { useL } from '@/lib/data';
import { Body, Button, Card, H1, H2, ListItem, Muted, Notice, Screen, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

const LINKS = {
  ofco: 'https://www.vd.ch/prestation/annoncer-une-entreprise-du-secteur-alimentaire-art-20-odalous',
  ldal: 'https://www.fedlex.admin.ch/eli/cc/2017/62/fr',
  odalous: 'https://www.fedlex.admin.ch/eli/cc/2017/63/fr',
  oidal: 'https://www.fedlex.admin.ch/eli/cc/2017/158/fr',
  ohyg: 'https://www.fedlex.admin.ch/eli/cc/2017/183/fr',
  blv: 'https://www.blv.admin.ch/fr/informations-aliments-vendus-en-vrac',
};

export default function BecomeCook() {
  const { L } = useL();
  const router = useRouter();
  const open = (url: string) => Linking.openURL(url);

  return (
    <Screen>
      <Stack.Screen options={{ title: L('Devenir cuisinier·ère', 'Become a cook') }} />
      <H1>{L('Cuisiner chez soi, vendre en Suisse', 'Cook at home, sell in Switzerland')}</H1>
      <Body>
        {L(
          'Bissabi Home Made met en relation des cuisinier·ères amateurs et des voisin·es. Ce guide résume les règles suisses connues — ce n’est pas un conseil juridique. Faites valider votre situation par l’autorité cantonale avant de vendre.',
          'Bissabi Home Made connects home cooks and neighbours. This guide summarises known Swiss rules — it is not legal advice. Confirm your situation with the cantonal authority before selling.',
        )}
      </Body>
      <Spacer />
      <Notice
        tone="warning"
        title={L('Pas une certification Bissabi', 'Not a Bissabi certification')}
        text={L(
          'Nous ne délivrons aucun certificat d’hygiène officiel. Le badge « Annonce OFCO vérifiée » n’apparaît qu’après validation admin d’une preuve d’annonce cantonale.',
          'We do not issue any official hygiene certificate. The “OFCO notice verified” badge only appears after admin validation of cantonal registration proof.',
        )}
      />
      <Spacer />
      <H2>{L('1. Annoncer votre activité', '1. Register your activity')}</H2>
      <Card>
        <Body>
          {L(
            'Dès que vous vendez des plats (même entre voisin·es via une app), vous sortez de l’usage domestique privé (LDAl art. 2). Vous devez annoncer l’activité à l’autorité cantonale (ODAlOUs art. 20), sauf remise vraiment occasionnelle (bazar, fête scolaire).',
            'As soon as you sell dishes (even to neighbours via an app), you leave private domestic use (FDA art. 2). You must notify the cantonal authority (FOpO art. 20), except truly occasional charity sales.',
          )}
        </Body>
        <Spacer h={8} />
        <Body>
          {L(
            'Canton de Vaud : Office de la consommation (OFCO), Epalinges. Formulaire signé obligatoire ; changements sous 14 jours. À Genève / Jura l’autorité s’appelle SCAV — le nom change selon le canton.',
            'Canton of Vaud: Consumer Affairs Office (OFCO), Epalinges. Signed form required; changes within 14 days. In Geneva / Jura the authority is called SCAV — the name varies by canton.',
          )}
        </Body>
        <Spacer h={8} />
        <Button title={L('Formulaire OFCO (VD)', 'OFCO form (VD)')} variant="secondary" onPress={() => open(LINKS.ofco)} />
      </Card>
      <H2>{L('2. Hygiène et autocontrôle', '2. Hygiene and self-checks')}</H2>
      <Card>
        <Body>
          {L(
            'Vous êtes responsable de la sécurité de vos plats (LDAl art. 26, autocontrôle). L’ordonnance sur l’hygiène (OHyg) exige des instructions adaptées. Un module Bissabi n’est qu’une bonne pratique, pas une certification officielle.',
            'You are responsible for food safety (FDA art. 26, self-checks). The Hygiene Ordinance requires suitable training. A Bissabi module is only good practice, not an official certificate.',
          )}
        </Body>
        <ListItem icon="hand-left-outline" title={L('Lavage des mains, tenue propre', 'Hand washing, clean clothing')} />
        <ListItem icon="snow-outline" title={L('Chaîne du froid ≤ 5 °C', 'Cold chain ≤ 5 °C')} />
        <ListItem icon="flame-outline" title={L('Cuisson / réchauffage ≥ 70 °C à cœur', 'Cook / reheat ≥ 70 °C core')} />
        <ListItem icon="git-branch-outline" title={L('Séparation cru / cuit', 'Raw / cooked separation')} />
      </Card>
      <H2>{L('3. Allergènes et étiquetage', '3. Allergens and labelling')}</H2>
      <Card>
        <Body>
          {L(
            'Les 14 allergènes de l’OIDAl (annexe 6) doivent être déclarés. En vente à distance (ODAlOUs art. 44), les mentions obligatoires doivent être disponibles au moment de l’offre dans l’app, et à la remise (étiquette). Pain / boulangerie : indiquer le pays de production.',
            'The 14 OIDAl annex 6 allergens must be declared. For distance selling (FOpO art. 44), mandatory info must be available at offer time in the app and at handover (label). Bakery goods: state country of production.',
          )}
        </Body>
        <Spacer h={8} />
        <Button title={L('OSAV — infos en vrac', 'FSVO — loose foods info')} variant="secondary" onPress={() => open(LINKS.blv)} />
      </Card>
      <H2>{L('4. Prix et revenus', '4. Prices and income')}</H2>
      <Card>
        <Body>
          {L(
            'Vous fixez vos prix. Bissabi affiche clairement la commission plateforme (15 % aujourd’hui en démo) et les frais de livraison avant paiement. Déclarez vos revenus selon votre statut (indépendant accessoire, AVS, éventuelle TVA). Ce point doit être validé avec votre fiduciaire — nous n’affichons aucune affirmation fiscale dans l’app.',
            'You set your prices. Bissabi clearly shows the platform commission (15 % in the current demo) and delivery fees before payment. Declare income according to your status (side self-employment, AHV, possible VAT). Confirm with your accountant — we show no tax claims in the app.',
          )}
        </Body>
      </Card>
      <H2>{L('5. Prochaines étapes dans l’app', '5. Next steps in the app')}</H2>
      <Card>
        <ListItem icon="person-outline" title={L('Créer mon profil cuisinier', 'Create my cook profile')} subtitle={L('Studio → profil', 'Studio → profile')} onPress={() => router.push('/studio/profile')} />
        <ListItem icon="checkbox-outline" title={L('Checklist hygiène', 'Hygiene checklist')} onPress={() => router.push('/studio/checklist')} />
        <ListItem icon="restaurant-outline" title={L('Publier un plat (allergènes obligatoires)', 'Publish a dish (allergens required)')} onPress={() => router.push('/(tabs)/kitchen')} />
        <ListItem icon="time-outline" title={L('Ouvrir des créneaux', 'Open slots')} onPress={() => router.push('/studio/slots')} />
        <ListItem icon="document-text-outline" title={L('Conformité & documents', 'Compliance & documents')} onPress={() => router.push('/compliance')} />
      </Card>
      <Muted>
        {L(
          'Sources : LDAl RS 817.0 · ODAlOUs RS 817.02 art. 20 & 44 · OIDAl RS 817.022.16 · OHyg RS 817.024.1 · pages OFCO (VD) et OSAV. Vérifié dans le benchmark HMF du 30.10.2026.',
          'Sources: Swiss FDA 817.0 · FOpO 817.02 art. 20 & 44 · OIDAl 817.022.16 · HygO 817.024.1 · OFCO (VD) and FSVO pages. Checked in the HMF benchmark dated 30.10.2026.',
        )}
      </Muted>
      <Spacer />
      <Button title={L('Ouvrir ma cuisine', 'Open my kitchen')} onPress={() => router.push('/(tabs)/kitchen')} />
      <Spacer h={24} />
      <Text style={{ color: t.muted, fontSize: 12 }}>
        {L('Textes légaux : liens Fedlex / VD.ch ci-dessus.', 'Legal texts: Fedlex / VD.ch links above.')}
      </Text>
    </Screen>
  );
}
