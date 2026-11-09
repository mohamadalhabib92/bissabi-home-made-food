/** Partenaire de livraison. Le pilote assigne à la main. Le partenaire futur refuse sans réseau. */

export type DeliveryAssignment = {
  orderId: string;
  marketId: string;
  pickupArea: string;
  dropArea: string;
};

export type DeliveryPartner = {
  id: 'manual' | 'future_partner';
  assign(input: DeliveryAssignment): { accepted: boolean; partnerMissionId: string | null; reason?: string };
};

export const manualPartner: DeliveryPartner = {
  id: 'manual',
  assign() {
    return { accepted: true, partnerMissionId: null };
  },
};

export const futurePartner: DeliveryPartner = {
  id: 'future_partner',
  assign() {
    return { accepted: false, partnerMissionId: null, reason: 'partner_not_connected' };
  },
};

export function partnerById(id: DeliveryPartner['id']): DeliveryPartner {
  return id === 'manual' ? manualPartner : futurePartner;
}
