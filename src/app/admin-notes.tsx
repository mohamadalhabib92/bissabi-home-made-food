import { useI18n } from '@/i18n';
import { useL } from '@/lib/data';
import { COMMISSION_PAID_BY, COMMISSION_RATE, DELIVERY_FEE_CHF, MIN_LEAD_HOURS } from '@/lib/pricing';
import { publicEnvList } from '@/lib/publicEnv';
import { supabaseStatus } from '@/lib/supabase';
import { Badge, Body, Card, H2, ListItem, Muted, Notice, Screen } from '@/ui/kit';

const OWNER_TODOS = [
  'Licence cantonale de restauration éventuelle — à valider',
  'Statut AVS / fiscal des cuisiniers — à valider',
  'Assurance RC produit — à valider',
  'TVA de la plateforme — à valider',
  'Texte final des CGU et de la politique de confidentialité (LPD, RGPD si applicable) — à valider',
  'commission_model : défaut = facturée au buyer (ligne visible). Confirmer — à valider',
  'Montants de parrainage — à valider',
  'Délai de 14 jours pour signaler un changement à l’OFCO — à valider',
];

export default function AdminNotes() {
  const { L } = useL();
  const { t } = useI18n();
  const supabase = supabaseStatus();
  return (
    <Screen>
      <H2>{L('Variables publiques (app)', 'Public variables (app)')}</H2>
      <Card>
        {publicEnvList.map((x) => (
          <ListItem
            key={x.name}
            title={x.name}
            right={<Badge label={x.configured ? L('configuré', 'set') : x.blocked ? L('ignorée', 'ignored') : 'YOUR_…'} tone={x.configured ? 'success' : 'warning'} />}
          />
        ))}
      </Card>
      {!supabase.configured ? <Notice tone="warning" title={t('configRequired')} text={supabase.message ?? ''} /> : null}
      <Muted style={{ marginBottom: 12 }}>{L('Les secrets (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, clé ASC, fichier .p8) restent sur le serveur. Jamais dans l’app ni dans EXPO_PUBLIC_*.', 'Secrets (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ASC key, .p8 file) stay on the server. Never in the app or in EXPO_PUBLIC_*.')}</Muted>
      <H2>{t('ownerTodosTitle')}</H2>
      <Muted style={{ marginBottom: 8 }}>{t('ownerTodosIntro')}</Muted>
      <Card>{OWNER_TODOS.map((item) => <ListItem key={item} title={item} />)}</Card>
      <H2>{L('Règles commerciales (à confirmer)', 'Business rules (to confirm)')}</H2>
      <Card>
        <ListItem title={L('Commission plateforme', 'Platform commission')} right={<Body>{Math.round(COMMISSION_RATE * 100)} % · {COMMISSION_PAID_BY === 'buyer' ? L('payée par le client', 'paid by buyer') : L('payée par le cuisinier', 'paid by cook')}</Body>} />
        <ListItem title={L('Frais de livraison', 'Delivery fee')} right={<Body>CHF {DELIVERY_FEE_CHF.toFixed(2)}</Body>} />
        <ListItem title={L('Délai minimum de commande', 'Minimum order notice')} right={<Body>{MIN_LEAD_HOURS} h</Body>} />
        <ListItem title={L('Zone', 'Area')} right={<Body>VD</Body>} />
      </Card>
      <H2>{L('Feuille de route paiement', 'Payments roadmap')}</H2>
      <Card>
        <ListItem title="Stripe Checkout (cartes ; TWINT si activé sur le compte Stripe)" right={<Badge label={L('Phase 1 — prêt si configuré', 'Phase 1 — ready if configured')} tone="info" />} />
        <ListItem title="Apple Pay / Google Pay" right={<Badge label={L('Phase 2', 'Phase 2')} />} />
        <ListItem title={L('Stripe Connect (versements cuisiniers)', 'Stripe Connect (cook payouts)')} right={<Badge label={L('Phase 2', 'Phase 2')} />} />
        <ListItem title="TWINT (FEATURE_TWINT)" right={<Badge label={L('désactivé', 'off')} />} />
      </Card>
    </Screen>
  );
}
