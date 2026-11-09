import { useI18n } from '@/i18n';
import { COMPANY } from '@/lib/company';
import { useL } from '@/lib/data';
import { DEMO_PHOTO_CREDITS } from '@/lib/dishPhotos';
import { Body, Card, H2, Muted, Screen } from '@/ui/kit';

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
      <Body>{L('Bissabi Home Made met en relation des particuliers qui cuisinent et des voisins qui commandent à l’avance. Les plats sont préparés sous la responsabilité de chaque cuisinier·ère. La plateforme retient 10 % du montant des plats sur le versement au cuisinier. Ce taux est celui du marché au moment du paiement. La livraison n’est pas dans cette assiette.', 'Bissabi Home Made connects home cooks with neighbours who order in advance. Dishes are prepared under each cook’s responsibility. The platform keeps 10% of the dish amount from the cook’s payout. That rate is the market rate at the moment of payment. Delivery is not part of this base.')}</Body>
      <H2>{L('Photos de démonstration', 'Demo photographs')}</H2>
      <Muted>{L('Elles ne s’affichent que si le plat de démo n’a pas de photo. Une photo ajoutée par un cuisinier n’est pas remplacée.', 'They only show when a demo dish has no photo. A photo added by a cook is not replaced.')}</Muted>
      <Card>
        {DEMO_PHOTO_CREDITS.map((credit) => (
          <Muted key={credit.dishId} style={{ marginTop: 6 }}>{credit.dish} — {credit.author} — {credit.license}</Muted>
        ))}
      </Card>
      <Muted style={{ marginTop: 12 }}>{t('legalValidate')}</Muted>
      <Muted style={{ marginTop: 8 }}>{t('launchZone')} {t('ofcoShort')}</Muted>
    </Screen>
  );
}
