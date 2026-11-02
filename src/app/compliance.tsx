import { useI18n } from '@/i18n';
import { useL } from '@/lib/data';
import { Badge, Body, Card, H2, Muted, Notice, Row, Screen } from '@/ui/kit';

export default function Compliance() {
  const { L } = useL();
  const { t } = useI18n();
  const steps = [
    { t: L('Checklist hygiène déclarative', 'Self-declared hygiene checklist'), s: L('Disponible', 'Available'), tone: 'success' as const },
    { t: L('Allergènes obligatoires (14, présent / traces / absent)', 'Mandatory allergens (14, present / traces / absent)'), s: L('Disponible', 'Available'), tone: 'success' as const },
    { t: L('Avis modérés, signalements', 'Moderated reviews, reports'), s: L('Disponible', 'Available'), tone: 'success' as const },
    { t: t('complianceTitle'), s: L('À venir — badge après validation admin', 'Coming — badge after admin review'), tone: 'neutral' as const },
    { t: L('Autocontrôle documenté, traçabilité', 'Documented self-checks, traceability'), s: L('À venir', 'Coming'), tone: 'neutral' as const },
    { t: L('Vérification d’identité des cuisiniers', 'Cook identity verification'), s: L('À venir', 'Coming'), tone: 'neutral' as const },
    { t: L('Assurance RC pour les cuisiniers', 'Liability insurance for cooks'), s: L('À valider', 'To validate'), tone: 'neutral' as const },
  ];
  return (
    <Screen>
      <Notice tone="warning" title={L('Responsabilité', 'Responsibility')} text={t('ofcoShort')} />
      <H2>{L('Conformité / prochaines étapes', 'Compliance / next steps')}</H2>
      <Card>{steps.map((x) => <Row key={x.t} style={{ justifyContent: 'space-between', paddingVertical: 8 }}><Body style={{ flex: 1 }}>{x.t}</Body><Badge label={x.s} tone={x.tone} /></Row>)}</Card>
      <Body>{t('complianceBody')}</Body>
      <Muted style={{ marginTop: 8 }}>{L('Les mentions « halal » sont des déclarations des cuisiniers, non certifiées par Bissabi.', '“Halal” labels are cooks’ declarations, not certified by Bissabi.')}</Muted>
      <Muted style={{ marginTop: 8 }}>{t('launchZone')}</Muted>
    </Screen>
  );
}
