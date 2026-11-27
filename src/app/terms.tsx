import { COMPANY } from '@/lib/company';
import { useL } from '@/lib/data';
import { Body, Card, H2, Muted, Notice, Screen } from '@/ui/kit';

const DRAFT = {
  fr: 'Brouillon à valider par le propriétaire avant toute publication. Ce n’est pas un avis juridique.',
  de: 'Entwurf, vom Inhaber zu prüfen, bevor er veröffentlicht wird. Keine Rechtsberatung.',
  it: 'Bozza da convalidare dal titolare prima di qualsiasi pubblicazione. Non è un parere legale.',
  en: 'Draft for the owner to approve before publication. This is not legal advice.',
} as const;

export default function Terms() {
  const { L } = useL();
  return (
    <Screen>
      <Notice tone="warning" title={L('Texte non encore validé', 'Text not yet approved')} text={DRAFT.fr} />
      <Card>
        <Body>{COMPANY.name}</Body>
        <Body>{COMPANY.street}</Body>
        <Body>{COMPANY.city}, {COMPANY.country}</Body>
        <Body>UID {COMPANY.uid}</Body>
      </Card>
      <H2>{L('Conditions d’utilisation', 'Terms of use')}</H2>
      <Body>{L('Bissabi Home Made Food est une commande de quartier, à Lausanne et à Prilly, en francs suisses. On y trouve des cuisines maison (cuisinier·ères) et des traiteurs : menus, panier, retrait ou livraison par coursier, suivi. Quatre parcours : client, cuisine, coursier, administration. Français d’abord, puis allemand, italien et anglais.', 'Bissabi Home Made Food is neighbourhood ordering in Lausanne and Prilly, in Swiss francs. Home kitchens and caterers: menus, cart, pickup or courier delivery, tracking. Four journeys: customer, kitchen, courier, admin. French first, then German, Italian and English.')}</Body>
      <H2>{L('Conditions de vente', 'Terms of sale')}</H2>
      <Body>{L('Retrait ou livraison par un coursier. Cuisine maison et traiteur : la plateforme retient 10 % du sous-total des plats, les 14 allergènes sont obligatoires, et rien ne se vend sans la checklist hygiène. Un traiteur peut indiquer un minimum de portions et un délai plus long. Une commission ou une vérification différente pour les traiteurs n’est pas décidée. Stripe Connect (carte, TWINT, Apple Pay, Google Pay) n’encaisse pas encore.', 'Pickup or courier delivery. Home kitchen and caterer: the platform keeps 10% of the dish subtotal, the 14 allergens are mandatory, and nothing is sold without the hygiene checklist. A caterer can set a minimum number of portions and a longer notice. A different commission or check for caterers is not decided. Stripe Connect (card, TWINT, Apple Pay, Google Pay) is not collecting yet.')}</Body>
      <H2>Deutsch</H2>
      <Muted>{DRAFT.de}</Muted>
      <Body>Pilot Lausanne und Prilly, CHF. 10 % Provision vom Koch einbehalten. Kein echter Verkauf vor Hygiene und Freigabe. {COMPANY.name}, {COMPANY.street}, {COMPANY.city}, UID {COMPANY.uid}.</Body>
      <H2>Italiano</H2>
      <Muted>{DRAFT.it}</Muted>
      <Body>Pilota Losanna e Prilly, CHF. Commissione del 10 % trattenuta al cuoco. Nessuna vendita reale prima dell’igiene e della convalida. {COMPANY.name}, {COMPANY.street}, {COMPANY.city}, UID {COMPANY.uid}.</Body>
      <H2>English</H2>
      <Muted>{DRAFT.en}</Muted>
    </Screen>
  );
}
