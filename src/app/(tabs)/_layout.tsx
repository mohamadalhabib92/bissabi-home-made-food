import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useI18n } from '@/i18n';
import { useData } from '@/lib/data';
import { useReboot } from '@/lib/reboot';
import { Breathing, haptic, Button, Ionicons, type IconName } from '@/ui/kit';
import { theme as t } from '@/ui/theme';

export default function TabsLayout() {
  // Libellés d'onglets : suivent la taille de texte du système jusqu'à ×1,4, au-delà la barre déborderait.
  const { fontScale } = useWindowDimensions();
  const tabFs = (n: number) => Math.round(n * Math.min(fontScale, 1.4));
  const { ready, storageReady, forceReady, prefs, cart, orders } = useData();
  const { L, t: tr } = useI18n();
  const reboot = useReboot();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (storageReady) return;
    const id = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(id);
  }, [storageReady]);
  if (!ready)
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {slow ? (
          <>
            <Text accessibilityRole="header" style={{ color: t.text, fontSize: t.type.h2, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>{tr('bootTitle')}</Text>
            <Text style={{ color: t.muted, fontSize: t.type.body, textAlign: 'center', marginBottom: 16 }}>{tr('bootBody')}</Text>
            <Button title={tr('bootRetry')} onPress={reboot} />
            <View style={{ height: 8 }} />
            <Button variant="secondary" title={tr('bootContinue')} onPress={forceReady} />
          </>
        ) : (
          <View accessible accessibilityLabel={L('Chargement', 'Loading')}>
            <Breathing color={t.primary}>
              <Ionicons name="restaurant-outline" size={28} color={t.primary} />
            </Breathing>
          </View>
        )}
      </View>
    );
  if (!prefs.onboarded || !prefs.consents.terms) return <Redirect href="/welcome" />;
  const icon = (name: IconName) =>
    function TabIcon({ color, size, focused }: { color: unknown; size: number; focused?: boolean }) {
      // Onglet actif : pictogramme plein (convention iOS), inactif : contour.
      const n = (focused ? name.replace(/-outline$/, '') : name) as IconName;
      return <Ionicons name={n} color={typeof color === 'string' ? color : undefined} size={size} />;
    };
  const n = cart.lines.reduce((s, l) => s + l.qty, 0);
  const incoming = orders.filter((o) => o.side === 'cook' && o.status === 'requested').length;
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic('select') }}
      screenOptions={{
        headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border, minHeight: 60 },
        tabBarActiveTintColor: t.primary, tabBarInactiveTintColor: t.muted, tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontSize: tabFs(12), fontWeight: '600' },
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
