import { useI18n } from '@/i18n';
import { COMPANY } from '@/lib/company';
import { useL } from '@/lib/data';
import { Body, Card, H2, Muted, Notice, Screen, Spacer } from '@/ui/kit';

export default function Legal() {
  const { L } = useL();
  const { t } = useI18n();
  return (
    <Screen>
      <H2>{L('Éditeur', 'Publisher')}</H2>
      <Card>
        <Body>{COMPANY.name}</Body>
        <Body>{COMPANY.street}</Body>
        <Body>{COMPANY.city}, {COMPANY.country}</Body>
        <Body>UID : {COMPANY.uid}</Body>
      </Card>
      <H2>{L('Rôle de la plateforme', 'Platform role')}</H2>
      <Body>
        {L(
          'Bissabi Home Made met en relation des particuliers qui cuisinent et des voisins qui commandent à l’avance. Les plats sont préparés sous la responsabilité de chaque cuisinier·ère. La plateforme perçoit une commission de 15 % affichée avant paiement.',
          'Bissabi Home Made connects home cooks with neighbours who order in advance. Dishes are prepared under each cook’s responsibility. The platform charges a 15% commission shown before payment.',
        )}
      </Body>
      <Spacer />
      <Notice
        tone="warning"
        title={L('Brouillon — à faire valider par un avocat suisse', 'Draft — to be reviewed by a Swiss lawyer')}
        text={L(
          'Les textes ci-dessous sont un projet interne. Ils ne constituent pas un conseil juridique et ne remplacent pas des CGU / CGV définitives.',
          'The texts below are an internal draft. They are not legal advice and do not replace final terms.',
        )}
      />
      <H2>{L('Projet de CGU (FR)', 'Draft terms (FR)')}</H2>
      <Card>
        <Body>
          {`1. Objet. Bissabi Home Made (« Bissabi ») exploite une plateforme numérique de mise en relation entre des cuisinier·ères amateurs (« Cooks ») et des acheteur·euses (« Acheteurs ») pour des repas préparés à domicile, commandés à l’avance.

2. Intermédiaire. Bissabi n’est pas le fabricant, producteur ni vendeur des denrées alimentaires proposées par les Cooks. Le contrat de fourniture du repas est conclu entre le Cook et l’Acheteur. Bissabi fournit des services techniques de mise en relation, de paiement (le cas échéant) et d’affichage.

3. Responsabilité du Cook. Chaque Cook est seul responsable de la conformité de ses plats à la législation alimentaire suisse applicable (notamment LDAl, ODAlOUs, OIDAl, OHyg), de l’autocontrôle, de l’étiquetage / allergènes, de l’hygiène et de la qualité des denrées jusqu’à la remise. Les mentions « Halal » sont des déclarations du Cook, non certifiées par Bissabi.

4. Livraison. Si le Cook livre lui-même, il reste responsable du transport. Si un partenaire coursier intervient, le Cook reste responsable de la préparation du plat ; le coursier est responsable du transport et du maintien de la chaîne du froid / chaud pendant la course, selon le contrat partenaire. Bissabi n’est pas transporteur sauf mention contraire écrite.

5. Limitation. Dans les limites du droit suisse impératif, Bissabi n’est pas responsable des dommages résultant exclusivement des plats ou du comportement d’un Cook ou d’un coursier. Cette clause ne vise pas à exclure une responsabilité légale qui ne pourrait pas être écartée.

6. Compte et formation. La publication de plats peut être conditionnée à des bonnes pratiques internes (quiz formation). Ce module n’est pas une certification officielle.

7. Droit applicable. Droit suisse. For : siège de l’éditeur, sous réserve de fors légaux protecteurs.`}
        </Body>
      </Card>
      <H2>{L('Draft terms (EN)', 'Draft terms (EN)')}</H2>
      <Card>
        <Body>
          {`1. Purpose. Bissabi Home Made (“Bissabi”) operates a digital matching platform between amateur home cooks (“Cooks”) and buyers (“Buyers”) for home-prepared meals ordered ahead.

2. Intermediary. Bissabi is not the manufacturer, producer or seller of the food offered by Cooks. The meal supply contract is between Cook and Buyer. Bissabi provides technical matching, payment (where applicable) and display services.

3. Cook responsibility. Each Cook alone is responsible for compliance of their dishes with applicable Swiss food law (incl. FDA, FOpO, OIDAl, HygO), self-checks, labelling / allergens, hygiene and food quality until handover. “Halal” labels are Cook declarations, not certified by Bissabi.

4. Delivery. If the Cook self-delivers, they remain responsible for transport. If a courier partner is involved, the Cook remains responsible for preparing the dish; the courier is responsible for transport and maintaining the cold / hot chain during the run, per the partner contract. Bissabi is not a carrier unless otherwise agreed in writing.

5. Limitation. Within mandatory Swiss law, Bissabi is not liable for damage arising solely from dishes or from a Cook’s or courier’s conduct. This clause does not seek to exclude liability that cannot be waived.

6. Account & training. Publishing dishes may require internal good-practice training (quiz). That module is not an official certificate.

7. Governing law. Swiss law. Venue: publisher’s seat, subject to protective legal venues.`}
        </Body>
      </Card>
      <Muted style={{ marginTop: 12 }}>{t('legalValidate')}</Muted>
      <Muted style={{ marginTop: 8 }}>{t('launchZone')} {t('ofcoShort')}</Muted>
    </Screen>
  );
}
