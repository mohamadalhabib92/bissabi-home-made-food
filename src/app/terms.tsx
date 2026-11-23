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
      <Body>{L('Bissabi Home Made Food met en relation des cuisines familiales et des clients à Lausanne et à Prilly, en francs suisses. Quatre parcours : client, cuisine familiale, coursier, administration Bissabi. L’application est en français d’abord. L’allemand, l’italien et l’anglais suivent.', 'Bissabi Home Made Food connects family kitchens and customers in Lausanne and Prilly, in Swiss francs. Four journeys: customer, family kitchen, courier, Bissabi admin. The app is French first. German, Italian and English follow.')}</Body>
      <H2>{L('Conditions de vente', 'Terms of sale')}</H2>
      <Body>{L('Retrait ou livraison par un coursier. La plateforme retient 10 % du sous-total des plats sur le versement au cuisinier (Stripe Connect : carte, TWINT, Apple Pay, Google Pay). Aucune vente réelle tant que la cuisine n’a pas passé la checklist hygiène et que les autorités, le paiement et la sécurité n’ont pas été validés. Les 14 allergènes sont obligatoires. Le badge OFCO n’apparaît qu’après vérification admin.', 'Pickup or courier delivery. The platform keeps 10% of the dish subtotal from the cook’s payout (Stripe Connect: card, TWINT, Apple Pay, Google Pay). No real sale until the kitchen has passed the hygiene checklist and the authorities, payments and security have been validated. The 14 allergens are mandatory. The OFCO badge appears only after an admin check.')}</Body>
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
