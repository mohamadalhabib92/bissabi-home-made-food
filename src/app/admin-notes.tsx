import { useL } from '@/lib/data';
import { COMMISSION_PAID_BY, COMMISSION_RATE, DELIVERY_FEE_CHF, MIN_LEAD_HOURS } from '@/lib/pricing';
import { PAYMENTS_API, STRIPE_PK, SUPPORT_EMAIL } from '@/lib/payments';
import { Badge, Body, Card, H2, ListItem, Muted, Screen } from '@/ui/kit';

export default function AdminNotes() {
  const { L } = useL();
  const v = (x: { name: string; configured: boolean }) => <ListItem key={x.name} title={x.name} right={<Badge label={x.configured ? L('configuré', 'set') : 'YOUR_…'} tone={x.configured ? 'success' : 'warning'} />} />;
  return (
    <Screen>
      <H2>{L('Variables publiques (app)', 'Public variables (app)')}</H2>
      <Card>{[STRIPE_PK, PAYMENTS_API, SUPPORT_EMAIL].map(v)}</Card>
      <Muted style={{ marginBottom: 12 }}>{L('YOUR_STRIPE_SECRET_KEY reste exclusivement sur le serveur (voir server/README.md). Jamais dans l’app ni dans EXPO_PUBLIC_*.', 'YOUR_STRIPE_SECRET_KEY stays server-side only (see server/README.md). Never in the app or EXPO_PUBLIC_*.')}</Muted>
      <H2>{L('Règles commerciales (à confirmer)', 'Business rules (to confirm)')}</H2>
      <Card>
        <ListItem title={L('Commission plateforme', 'Platform commission')} right={<Body>{Math.round(COMMISSION_RATE * 100)} % · {COMMISSION_PAID_BY === 'buyer' ? L('payée par le client', 'paid by buyer') : L('payée par le cuisinier', 'paid by cook')}</Body>} />
        <ListItem title={L('Frais de livraison', 'Delivery fee')} right={<Body>CHF {DELIVERY_FEE_CHF.toFixed(2)}</Body>} />
        <ListItem title={L('Délai minimum de commande', 'Minimum order notice')} right={<Body>{MIN_LEAD_HOURS} h</Body>} />
      </Card>
      <H2>{L('Feuille de route paiement', 'Payments roadmap')}</H2>
      <Card>
        <ListItem title="Stripe Checkout (cartes ; TWINT si activé sur le compte Stripe)" right={<Badge label={L('Phase 1 — prêt', 'Phase 1 — ready')} tone="info" />} />
        <ListItem title="Apple Pay / Google Pay" right={<Badge label={L('Phase 2', 'Phase 2')} />} />
        <ListItem title={L('Stripe Connect (versements cuisiniers)', 'Stripe Connect (cook payouts)')} right={<Badge label={L('Phase 2', 'Phase 2')} />} />
      </Card>
    </Screen>
  );
}
