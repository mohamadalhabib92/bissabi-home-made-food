import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useData, useL } from '@/lib/data';
import { paymentsLive } from '@/lib/payments';
import { courierEarnings } from '@/lib/courierRun';
import type { CourierZone, VehicleType } from '@/lib/model';
import { Badge, Button, Card, Empty, Field, H1, H2, ListItem, Muted, Notice, Screen, Segmented, Spacer, Toggle } from '@/ui/kit';

const VEHICLES: { value: VehicleType; fr: string; en: string }[] = [
  { value: 'foot', fr: 'À pied', en: 'On foot' },
  { value: 'bike', fr: 'Vélo', en: 'Bike' },
  { value: 'scooter', fr: 'Scooter', en: 'Scooter' },
  { value: 'car', fr: 'Voiture', en: 'Car' },
];
const ZONES: { value: CourierZone; fr: string; en: string }[] = [
  { value: 'lausanne', fr: 'Lausanne', en: 'Lausanne' },
  { value: 'prilly', fr: 'Prilly', en: 'Prilly' },
  { value: 'both', fr: 'Lausanne et Prilly', en: 'Lausanne and Prilly' },
];

export default function CourierTab() {
  const { myCourier, saveCourier, setCourierAvailable, courierJobs, orders } = useData();
  const { L } = useL();
  const router = useRouter();
  const [name, setName] = useState(myCourier?.displayName ?? '');
  const [vehicle, setVehicle] = useState<VehicleType>(myCourier?.vehicle ?? 'bike');
  const [zone, setZone] = useState<CourierZone>(myCourier?.zone ?? 'both');
  const [available, setAvailable] = useState(myCourier?.available ?? false);
  const earned = courierEarnings(orders.filter((o) => o.delivery?.courierId === myCourier?.id && o.delivery?.state === 'delivered').length);
  if (!myCourier) {
    return (
      <Screen>
        <H1>{L('Devenir livreur·euse', 'Become a courier')}</H1>
        <Muted>{L('Identité déclarée, véhicule, zone Lausanne ou Prilly. Un admin valide le profil avant la première course. Aucune pièce n’est stockée ici.', 'Declared identity, vehicle, Lausanne or Prilly. An admin validates the profile before the first job. No ID document is stored here.')}</Muted>
        <Field label={L('Nom affiché', 'Display name')} value={name} onChangeText={setName} placeholder={L('Prénom + initiale', 'First name + initial')} />
        <Segmented label={L('Véhicule', 'Vehicle')} options={VEHICLES.map((v) => ({ label: L(v.fr, v.en), value: v.value }))} value={vehicle} onChange={setVehicle} />
        <Segmented label={L('Zone', 'Zone')} options={ZONES.map((z) => ({ label: L(z.fr, z.en), value: z.value }))} value={zone} onChange={setZone} />
        <Button title={L('Enregistrer mon profil', 'Save my profile')} disabled={name.trim().length < 2} onPress={() => saveCourier({ displayName: name.trim(), vehicle, zone, available: false })} />
      </Screen>
    );
  }
  return (
    <Screen>
      {!paymentsLive ? <Notice tone="info" title={L('Lancement bientôt', 'Launching soon')} text={L('Les courses sont des exercices. Aucune livraison n’est payée tant que le drapeau de lancement est fermé.', 'Jobs are practice. No delivery is paid while the launch flag is off.')} /> : null}
      {!myCourier.validated ? <Notice tone="warning" title={L('En attente de validation', 'Waiting for validation')} text={L('Un admin doit valider ce profil avant que vous preniez une course.', 'An admin must validate this profile before you take a job.')} /> : null}
      <Card>
        <H2>{myCourier.displayName}</H2>
        <Muted>{L(VEHICLES.find((v) => v.value === myCourier.vehicle)?.fr ?? '', VEHICLES.find((v) => v.value === myCourier.vehicle)?.en ?? '')} · {myCourier.zone}</Muted>
        <Toggle label={L('Disponible', 'Available')} value={myCourier.available} onChange={setCourierAvailable} />
        <Button small variant="ghost" title={L('Modifier le profil', 'Edit profile')} onPress={() => saveCourier({ displayName: name.trim() || myCourier.displayName, vehicle, zone, available })} />
        <Field label={L('Nom affiché', 'Display name')} value={name || myCourier.displayName} onChangeText={setName} />
        <Segmented label={L('Véhicule', 'Vehicle')} options={VEHICLES.map((v) => ({ label: L(v.fr, v.en), value: v.value }))} value={vehicle} onChange={setVehicle} />
        <Segmented label={L('Zone', 'Zone')} options={ZONES.map((z) => ({ label: L(z.fr, z.en), value: z.value }))} value={zone} onChange={setZone} />
      </Card>
      <H2>{L('Gains', 'Earnings')}</H2>
      <Card>
        <Muted>{L(`${earned.deliveries} course(s) livrée(s)`, `${earned.deliveries} delivery(ies) completed`)}</Muted>
        <H2>{L('Montant par course', 'Amount per delivery')} : {earned.label}</H2>
      </Card>
      <H2>{L('Courses', 'Jobs')}</H2>
      {courierJobs.length ? courierJobs.map((o) => (
        <Card key={o.id}>
          <ListItem title={o.number} subtitle={`${o.delivery?.state ?? ''} · ${o.buyerName}`} right={<Badge label={o.delivery?.state ?? ''} />} onPress={() => router.push(`/courier/${o.id}`)} />
        </Card>
      )) : <Empty icon="bicycle-outline" title={L('Aucune course', 'No job')} text={L('Les commandes de livraison prêtes apparaissent ici.', 'Delivery orders that are ready show up here.')} />}
      <Spacer />
    </Screen>
  );
}
