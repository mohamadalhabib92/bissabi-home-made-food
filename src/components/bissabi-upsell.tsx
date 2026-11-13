import { Linking, Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import {
  BISSABI_DEMO_PRODUCTS,
  BISSABI_FREE_DELIVERY_FROM_CHF,
  BISSABI_SITE,
  type BissabiLine,
  type BissabiOfferState,
  setBissabiQty,
} from '@/lib/bissabiDrinks';
import { IconButton, Muted, Row, shadow } from '@/ui/kit';
import { useAppFonts } from '@/ui/fonts';
import { theme as t } from '@/ui/theme';

export function BissabiUpsellCard({
  state,
  lines,
  onChange,
}: {
  state: BissabiOfferState;
  lines: BissabiLine[];
  onChange: (next: BissabiLine[]) => void;
}) {
  const { t: tr, L } = useI18n();
  const fonts = useAppFonts();
  const coming = state !== 'available';
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={coming ? tr('bissabiSoonTitle') : tr('bissabiUpsellTitle')}
      style={[{
        backgroundColor: t.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: coming ? t.border : t.accent,
        padding: 16,
        marginBottom: 14,
        gap: 8,
      }, shadow(1)]}
    >
      <Text style={{ color: t.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.4, fontFamily: fonts.display }}>
        BISSABI
      </Text>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', fontFamily: fonts.display }}>
        {coming ? tr('bissabiSoonTitle') : tr('bissabiUpsellTitle')}
      </Text>
      <Muted>{coming ? tr('bissabiSoonBody') : tr('bissabiUpsellBody')}</Muted>
      {!coming ? BISSABI_DEMO_PRODUCTS.map((p) => {
        const qty = lines.find((l) => l.productId === p.id)?.qty ?? 0;
        return (
          <Row key={p.id} style={{ paddingVertical: 6, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: '700' }}>{L(p.nameFr, p.nameEn)}</Text>
              <Muted>{p.volumeLabel} · {tr('bissabiExamplePrice')}</Muted>
            </View>
            <IconButton icon="remove" label={L('Moins', 'Less')} onPress={() => onChange(setBissabiQty(lines, p.id, qty - 1))} />
            <Text style={{ fontWeight: '700', minWidth: 20, textAlign: 'center', color: t.text }}>{qty}</Text>
            <IconButton icon="add" label={L('Plus', 'More')} onPress={() => onChange(setBissabiQty(lines, p.id, qty + 1))} />
          </Row>
        );
      }) : null}
      <Muted style={{ fontSize: 12 }}>
        {L(
          `Livraison Bissabi dans le canton de Vaud, offerte dès CHF ${BISSABI_FREE_DELIVERY_FROM_CHF}. Hors frais Home Made Food.`,
          `Bissabi delivery in canton Vaud, free from CHF ${BISSABI_FREE_DELIVERY_FROM_CHF}. Excludes Home Made Food fees.`,
        )}
      </Muted>
      <Pressable onPress={() => Linking.openURL(BISSABI_SITE)} accessibilityRole="link" accessibilityLabel={tr('visitBissabi')}>
        <Text style={{ color: t.secondary, fontWeight: '700', textDecorationLine: 'underline' }}>{tr('visitBissabi')} — bissabi.ch</Text>
      </Pressable>
    </View>
  );
}
