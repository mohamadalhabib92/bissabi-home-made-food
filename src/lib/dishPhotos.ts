import type { ImageSourcePropType } from 'react-native';
import { chooseDishPicture, type DishLike, type DishPicture } from './dishPicture';

/** Photos de démo, affichées seulement si le plat n'a pas de photo à lui. Jamais écrites dans AsyncStorage. */
export const DEMO_PHOTO_CREDITS = [
  {
    dishId: 'demo-d1',
    dish: 'Thiéboudienne',
    file: 'thieboudienne.webp',
    author: 'Ellen.Jedida',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Assiette_de_Thi%C3%A9boudi%C3%A8ne.jpg',
  },
  {
    dishId: 'demo-d2',
    dish: 'Mafé de poulet',
    file: 'mafe-poulet.webp',
    author: 'A Healthier Michigan',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:African_Chicken_Peanut_Stew_(37673757141).jpg',
  },
  {
    dishId: 'demo-d3',
    dish: 'Couscous royal',
    file: 'couscous-royal.webp',
    author: 'Msaidi Art',
    license: 'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
    sourceUrl: 'https://www.pexels.com/photo/traditional-moroccan-couscous-with-vegetables-and-chicken-38785621/',
  },
  {
    dishId: 'demo-d4',
    dish: 'Tajine poulet citron confit',
    file: 'tajine-citron.webp',
    author: 'Foodista',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Moroccan_food-Chicken_tagine_with_preserved_lemons_and_olives-01.jpg',
  },
  {
    dishId: 'demo-d5',
    dish: 'Papet vaudois',
    file: 'papet-vaudois.webp',
    author: 'Popo le Chien',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Papet_vaudois2.jpg',
  },
  {
    dishId: 'demo-d6',
    dish: 'Tarte au vin cuit',
    file: 'tarte-vin-cuit.webp',
    author: 'Calimo',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tarte_au_vin_cuit.jpg',
  },
  {
    dishId: 'demo-d7',
    dish: 'Gyozas porc & chou',
    file: 'gyoza-porc.webp',
    author: 'Daderot',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pork_gyoza_-_Massachusetts.jpg',
  },
  {
    dishId: 'demo-d8',
    dish: 'Dan dan noodles végé',
    file: 'dan-dan.webp',
    author: 'Fumikas Sagisavas',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dan_Dan_Noodles.jpg',
  },
  {
    dishId: 'demo-d9',
    dish: 'Mezze',
    file: 'mezze.webp',
    author: 'Contrapunctus-1',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_falafel_platter_at_Agasi,_Lajpat_Nagar,_Delhi.jpg',
  },
  {
    dishId: 'demo-d10',
    dish: 'Maamoul dattes & pistache',
    file: 'maamoul.webp',
    author: 'روتانا',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ma%27amoul_Filled_with_Dates_and_Nuts.jpg',
  },
] as const;

const CATALOG: Record<string, ImageSourcePropType> = {
  'demo-d1': require('../../assets/dishes/thieboudienne.webp'),
  'demo-d2': require('../../assets/dishes/mafe-poulet.webp'),
  'demo-d3': require('../../assets/dishes/couscous-royal.webp'),
  'demo-d4': require('../../assets/dishes/tajine-citron.webp'),
  'demo-d5': require('../../assets/dishes/papet-vaudois.webp'),
  'demo-d6': require('../../assets/dishes/tarte-vin-cuit.webp'),
  'demo-d7': require('../../assets/dishes/gyoza-porc.webp'),
  'demo-d8': require('../../assets/dishes/dan-dan.webp'),
  'demo-d9': require('../../assets/dishes/mezze.webp'),
  'demo-d10': require('../../assets/dishes/maamoul.webp'),
};

export function dishPicture(dish: DishLike): DishPicture<ImageSourcePropType> {
  return chooseDishPicture(dish, CATALOG);
}
