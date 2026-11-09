/**
 * Lien entre les données déjà sur l'appareil et un compte.
 * N'écrit pas les neuf clés. Le lien vit sous un autre préfixe.
 */

export const ACCOUNT_LINK_KEY = '@bissabi-home-made-food-account/link';

export type LocalSnapshot = {
  prefs: unknown;
  cooks: readonly { id: string }[];
  dishes: readonly { id: string }[];
  orders: readonly { id: string }[];
};

export type AccountLink = {
  accountId: string;
  linkedAt: string;
  cookIds: string[];
  dishIds: string[];
  orderIds: string[];
  deletionRequestedAt: string | null;
};

export function buildLink(accountId: string, local: LocalSnapshot, at: string): AccountLink {
  return {
    accountId,
    linkedAt: at,
    cookIds: local.cooks.map((item) => item.id),
    dishIds: local.dishes.map((item) => item.id),
    orderIds: local.orders.map((item) => item.id),
    deletionRequestedAt: null,
  };
}

/** Même objets qu'à l'entrée. Aucune copie, aucun effacement. */
export function linkWithoutWipe<T extends LocalSnapshot>(accountId: string, local: T, at: string): { local: T; link: AccountLink } {
  return { local, link: buildLink(accountId, local, at) };
}

export function requestDeletion(link: AccountLink, at: string): AccountLink {
  return { ...link, deletionRequestedAt: at };
}
