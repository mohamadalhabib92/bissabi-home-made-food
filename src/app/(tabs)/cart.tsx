import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Avatar, DishVisual, TotalsTable } from '@/components/brand';
import { useData, useL } from '@/lib/data';
import { chf, quote } from '@/lib/pricing';
import { Button, Card, Empty, H2, IconButton, Muted, Notice, Row, Screen, Segmented, Spacer } from '@/ui/kit';
import { theme as t } from '@/ui/theme';
import { useState } from 'react';
import type { FulfilMode } from '@/lib/model';

export default function CartScreen() {
  const { cart, setCart, dishes, cooks, clearCart } = useData();
  const { L } = useL();
  const router = useRouter();
  const cook = cooks.find((c) => c.id === cart.cookId);
  const [mode, setMode] = useState<FulfilMode>('pickup');
  const lines = cart.lines.map((l) => ({ ...l, dish: dishes.find((d) => d.id === l.dishId) })).filter((l) => l.dish);
  if (!lines.length || !cook)
    return <Screen><Empty icon="bag-handle-outline" title={L('Votre panier est vide', 'Your cart is empty')} text={L('Découvrez les plats faits maison près de chez vous et commandez pour un prochain créneau.', 'Discover home-made dishes near you and order for an upcoming slot.')} action={<Button title={L('Découvrir', 'Discover')} onPress={() => router.push('/')} />} /></Screen>;
  const q = quote(lines.map((l) => ({ qty: l.qty, unitPrice: l.dish!.price })), cook.delivers ? mode : 'pickup');
  const setQty = (dishId: string, qty: number) => setCart((c) => {
    const ls = qty <= 0 ? c.lines.filter((l) => l.dishId !== dishId) : c.lines.map((l) => (l.dishId === dishId ? { ...l, qty: Math.min(20, qty) } : l));
    return { cookId: ls.length ? c.cookId : null, lines: ls };
  });
  return (
    <Screen>
      <Row><Avatar cook={cook} /><View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: t.text }}>{cook.name}</Text><Muted>{cook.commune}</Muted></View></Row>
      <Spacer />
      {lines.map((l) => (
        <Card key={l.dishId}>
          <Row>
            <View style={{ width: 64 }}><DishVisual dish={l.dish!} height={64} radius={10} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{l.dish!.title}</Text>
              <Muted>{chf(l.dish!.price)} × {l.qty} = {chf(l.dish!.price * l.qty)}</Muted>
            </View>
            <IconButton icon="remove" label={L('Moins', 'Less')} onPress={() => setQty(l.dishId, l.qty - 1)} />
            <Text style={{ fontWeight: '700', minWidth: 20, textAlign: 'center' }}>{l.qty}</Text>
            <IconButton icon="add" label={L('Plus', 'More')} onPress={() => setQty(l.dishId, l.qty + 1)} />
          </Row>
        </Card>
      ))}
      {cook.delivers
        ? <Segmented label={L('Mode (estimation)', 'Mode (estimate)')} options={[{ label: L('Retrait', 'Pickup'), value: 'pickup' as const }, { label: L('Livraison', 'Delivery'), value: 'delivery' as const }]} value={mode} onChange={setMode} />
        : <Muted style={{ marginBottom: 10 }}>{L('Ce cuisinier propose uniquement le retrait.', 'This cook offers pickup only.')}</Muted>}
      <Card>
        <H2>{L('Détail du prix', 'Price breakdown')}</H2>
        <TotalsTable {...q} L={L} />
      </Card>
      <Notice tone="info" title={L('Commande à l’avance', 'Advance order')} text={L('Vous choisissez le créneau à l’étape suivante. Le cuisinier confirme votre commande ; s’il refuse, vous êtes remboursé intégralement.', 'Pick the slot in the next step. The cook confirms your order; if they refuse, you are fully refunded.')} />
      <Button title={L('Choisir le créneau', 'Choose slot')} icon="arrow-forward" onPress={() => router.push({ pathname: '/checkout', params: { mode: cook.delivers ? mode : 'pickup' } })} />
      <Spacer h={8} />
      <Button variant="ghost" title={L('Vider le panier', 'Empty cart')} onPress={clearCart} />
    </Screen>
  );
}
