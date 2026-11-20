/**
 * prefs.location est un champ des préférences persistées (AsyncStorage / localStorage).
 * Le texte ne doit pas dire que la position n'est pas conservée, ni qu'elle est déjà effacée.
 * La désactivation dans Compte écrit location: null. Ce n'est pas l'état par défaut.
 */
export const LOCATION_STORED_FR =
  "Bissabi Home Made Food utilise votre position, arrondie à environ 100 m, pour afficher les plats et cuisiniers proches. Elle est enregistrée dans les préférences de cet appareil. Elle n'est pas envoyée à un serveur. La désactiver dans Compte efface cette préférence enregistrée.";

export const LOCATION_STORED_EN =
  "Bissabi Home Made Food uses your position, rounded to about 100 m, to show nearby dishes and cooks. It is saved in this device's preferences. It is not sent to a server. Turning it off in Account erases that saved preference.";
