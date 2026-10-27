import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useData, useL } from '@/lib/data';
import { Ionicons, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function TabsLayout() {
  const { ready, prefs, cart, orders } = useData();
  const { L } = useL();
  if (!ready)
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} accessibilityLabel="Chargement" />
      </View>
    );
  if (!prefs.onboarded || !prefs.consents.terms) return <Redirect href="/welcome" />;
  const icon = (name: IconName) =>
    function TabIcon({ color, size }: { color: unknown; size: number }) {
      return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;
    };
  const n = cart.lines.reduce((s, l) => s + l.qty, 0);
  const incoming = orders.filter((o) => o.side === 'cook' && o.status === 'requested').length;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, minHeight: 60 },
        tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.muted, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: L('Découvrir', 'Discover'), headerShown: false, tabBarIcon: icon('restaurant-outline') }} />
      <Tabs.Screen name="cart" options={{ title: L('Panier', 'Cart'), tabBarIcon: icon('bag-handle-outline'), tabBarBadge: n || undefined, tabBarBadgeStyle: { backgroundColor: t.primary } }} />
      <Tabs.Screen name="orders" options={{ title: L('Commandes', 'Orders'), tabBarIcon: icon('receipt-outline') }} />
      <Tabs.Screen name="kitchen" options={{ title: L('Cuisiner', 'Cook'), tabBarIcon: icon('flame-outline'), tabBarBadge: incoming || undefined, tabBarBadgeStyle: { backgroundColor: t.success } }} />
      <Tabs.Screen name="account" options={{ title: L('Compte', 'Account'), tabBarIcon: icon('person-circle-outline') }} />
    </Tabs>
  );
}
