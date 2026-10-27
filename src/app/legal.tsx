import { COMPANY } from '@/lib/company';
import { useL } from '@/lib/data';
import { Body, Card, H2, Muted, Screen } from '@/ui/kit';

export default function Legal() {
  const { L } = useL();
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
      <Body>{L('Bissabi Home Made met en relation des particuliers qui cuisinent et des voisins qui commandent à l’avance. Les plats sont préparés sous la responsabilité de chaque cuisinier·ère. La plateforme perçoit une commission de 15 % affichée avant paiement.', 'Bissabi Home Made connects home cooks with neighbours who order in advance. Dishes are prepared under each cook’s responsibility. The platform charges a 15% commission shown before payment.')}</Body>
      <Muted style={{ marginTop: 12 }}>{L('Conditions générales complètes : à finaliser avec un conseil juridique avant lancement public.', 'Full terms and conditions: to be finalised with legal counsel before public launch.')}</Muted>
    </Screen>
  );
}
