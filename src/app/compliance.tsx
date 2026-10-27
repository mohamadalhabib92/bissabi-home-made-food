import { useL } from '@/lib/data';
import { Badge, Body, Card, H2, Muted, Notice, Row, Screen } from '@/ui/kit';

export default function Compliance() {
  const { L } = useL();
  const steps = [
    { t: L('Checklist hygiène déclarative', 'Self-declared hygiene checklist'), s: L('Disponible', 'Available'), tone: 'success' as const },
    { t: L('Allergènes obligatoires (14, OIDAl annexe 6)', 'Mandatory allergens (14, OIDAl annex 6)'), s: L('Disponible', 'Available'), tone: 'success' as const },
    { t: L('Avis modérés, signalements', 'Moderated reviews, reports'), s: L('Disponible', 'Available'), tone: 'success' as const },
    { t: L('Gate SCAV : annonce d’activité à l’autorité cantonale (chimiste cantonal)', 'SCAV gate: activity notification to the cantonal authority (cantonal chemist)'), s: L('À venir', 'Coming'), tone: 'neutral' as const },
    { t: L('Gate SCAV : autocontrôle documenté, traçabilité', 'SCAV gate: documented self-checks, traceability'), s: L('À venir', 'Coming'), tone: 'neutral' as const },
    { t: L('Vérification d’identité des cuisiniers', 'Cook identity verification'), s: L('À venir', 'Coming'), tone: 'neutral' as const },
    { t: L('Assurance RC pour les cuisiniers', 'Liability insurance for cooks'), s: L('À étudier', 'To study'), tone: 'neutral' as const },
  ];
  return (
    <Screen>
      <Notice tone="warning" title={L('Responsabilité', 'Responsibility')} text={L('Les cuisiniers sont responsables de la conformité ; Bissabi prépare les gates SCAV — pas de certification affichée tant que non réelle.', 'Cooks are responsible for compliance; Bissabi is preparing the SCAV gates — no certification is shown until it is real.')} />
      <H2>{L('Conformité / prochaines étapes', 'Compliance / next steps')}</H2>
      <Card>{steps.map((x) => <Row key={x.t} style={{ justifyContent: 'space-between', paddingVertical: 8 }}><Body style={{ flex: 1 }}>{x.t}</Body><Badge label={x.s} tone={x.tone} /></Row>)}</Card>
      <Body>{L('Aucun badge « certifié », « contrôlé » ou « SCAV » n’est affiché dans l’app tant que le contrôle correspondant n’existe pas réellement.', 'No “certified”, “inspected” or “SCAV” badge is shown in the app until the matching check really exists.')}</Body>
      <Muted style={{ marginTop: 8 }}>{L('Les mentions « halal » sont des déclarations des cuisiniers, non certifiées par Bissabi.', '“Halal” labels are cooks’ declarations, not certified by Bissabi.')}</Muted>
    </Screen>
  );
}
