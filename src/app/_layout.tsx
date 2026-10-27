import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataProvider, useL } from '@/lib/data';
import { theme as t } from '@/ui/theme';

function Nav() {
  const { L } = useL();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerTitleStyle: { fontWeight: '700' }, headerShadowVisible: false, contentStyle: { backgroundColor: t.bg }, headerBackTitle: L('Retour', 'Back') }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="location" options={{ title: L('Où êtes-vous ?', 'Where are you?') }} />
      <Stack.Screen name="dish/[id]" options={{ title: L('Plat', 'Dish') }} />
      <Stack.Screen name="cook/[id]" options={{ title: L('Cuisinier·ère', 'Cook') }} />
      <Stack.Screen name="checkout" options={{ title: L('Commande à l’avance', 'Advance order') }} />
      <Stack.Screen name="order/[id]" options={{ title: L('Commande', 'Order') }} />
      <Stack.Screen name="studio/profile" options={{ title: L('Mon profil cuisinier', 'My cook profile') }} />
      <Stack.Screen name="studio/checklist" options={{ title: L('Checklist hygiène', 'Hygiene checklist') }} />
      <Stack.Screen name="studio/dish/[id]" options={{ title: L('Plat', 'Dish') }} />
      <Stack.Screen name="studio/slots" options={{ title: L('Créneaux', 'Slots') }} />
      <Stack.Screen name="studio/order/[id]" options={{ title: L('Commande reçue', 'Incoming order') }} />
      <Stack.Screen name="studio/shopping" options={{ title: L('Liste de courses', 'Shopping list') }} />
      <Stack.Screen name="studio/earnings" options={{ title: L('Gains', 'Earnings') }} />
      <Stack.Screen name="compliance" options={{ title: L('Conformité & prochaines étapes', 'Compliance & next steps') }} />
      <Stack.Screen name="legal" options={{ title: L('Mentions légales', 'Legal notice') }} />
      <Stack.Screen name="privacy" options={{ title: L('Données personnelles', 'Personal data') }} />
      <Stack.Screen name="report" options={{ title: L('Signaler / support', 'Report / support'), presentation: 'modal' }} />
      <Stack.Screen name="moderation" options={{ title: L('Modération des avis', 'Review moderation') }} />
      <Stack.Screen name="languages" options={{ title: L('Langues', 'Languages') }} />
      <Stack.Screen name="admin-notes" options={{ title: L('Notes admin', 'Admin notes') }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <View style={{ flex: 1, backgroundColor: t.bg }}>
          <StatusBar style="dark" />
          <Nav />
        </View>
      </DataProvider>
    </SafeAreaProvider>
  );
}
