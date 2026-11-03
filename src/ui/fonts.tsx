import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { useFonts } from 'expo-font';
import { createContext, useContext, type ReactNode } from 'react';

export type AppFonts = {
  display?: string;
  ui?: string;
  uiStrong?: string;
  price?: string;
};

const EMPTY: AppFonts = {};
const Ctx = createContext<AppFonts>(EMPTY);

/**
 * Charge Poppins / Inter / Outfit sans bloquer le premier écran.
 * Tant que les fichiers ne sont pas prêts, ou s'ils échouent, la police système reste en place.
 * Aucun appel réseau : les fichiers sont dans le bundle.
 */
export function FontProvider({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts({
    Poppins_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Outfit_500Medium,
  });
  const value: AppFonts = loaded && !error
    ? {
        display: 'Poppins_600SemiBold',
        ui: 'Inter_400Regular',
        uiStrong: 'Inter_600SemiBold',
        price: 'Outfit_500Medium',
      }
    : EMPTY;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppFonts(): AppFonts {
  return useContext(Ctx);
}
