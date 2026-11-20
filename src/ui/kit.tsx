import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { prefersReducedTransparency } from './access';
import { useAppFonts } from './fonts';
import { haptic } from './haptics';
import { FadeIn, PressableScale, prefersReducedMotion } from './motion';
import { currentScheme, spacing, theme as t, type Scheme } from './theme';

const S = () => getStyles();

export type IconName = ComponentProps<typeof Ionicons>['name'];
export { Ionicons };
export { Breathing, FadeIn, PressableScale, ProgressBar, Skeleton, SkeletonList, useFeedback } from './motion';
export { haptic } from './haptics';

/** Halo de couleur derrière le verre. Masqué si « Réduire la transparence » est actif. */
export function Wash() {
  if (prefersReducedTransparency()) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', top: -100, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: t.washA }} />
      <View style={{ position: 'absolute', top: 280, left: -120, width: 260, height: 260, borderRadius: 130, backgroundColor: t.washB }} />
      <View style={{ position: 'absolute', bottom: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: t.washGold }} />
    </View>
  );
}

/** Conteneur d'écran défilant, largeur max sur desktop (PWA). Fond transparent : le halo est derrière. */
export function Screen({ children, scroll = true, padded = true }: { children: ReactNode; scroll?: boolean; padded?: boolean }) {
  const insets = useSafeAreaInsets();
  const inner = (
    <View style={[S().inner, padded && { padding: spacing.lg }, { paddingBottom: spacing.xxxl + insets.bottom }]}>{children}</View>
  );
  return (
    <View style={S().screen}>
      {scroll ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const f = useAppFonts();
  return (
    <Text maxFontSizeMultiplier={1.6} accessibilityRole="header" style={[S().h1, f.display ? { fontFamily: f.display } : null, style]}>
      {children}
    </Text>
  );
}
export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const f = useAppFonts();
  return (
    <Text maxFontSizeMultiplier={1.8} accessibilityRole="header" style={[S().h2, f.display ? { fontFamily: f.display } : null, style]}>
      {children}
    </Text>
  );
}
export function Body({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const f = useAppFonts();
  return (
    <Text maxFontSizeMultiplier={2} style={[S().body, f.ui ? { fontFamily: f.ui } : null, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const f = useAppFonts();
  return <Text maxFontSizeMultiplier={2} style={[S().muted, f.ui ? { fontFamily: f.ui } : null, style]}>{children}</Text>;
}
export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text maxFontSizeMultiplier={1.6} style={[S().eyebrow, style]}>{children}</Text>;
}

export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [S().card, pressed && { opacity: 0.85, transform: [{ scale: 0.995 }] }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[S().card, style]}>{children}</View>;
}

export function Row({ children, style, gap = 8, wrap }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

export function Spacer({ h = 12 }: { h?: number }) {
  return <View style={{ height: h }} />;
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

function webBlur(reduce: boolean): ViewStyle {
  if (reduce || Platform.OS !== 'web') return {};
  return { backdropFilter: 'saturate(140%) blur(18px)', WebkitBackdropFilter: 'saturate(140%) blur(18px)' } as ViewStyle;
}

/** Panneau de verre (ou aplat opaque si la transparence est réduite). */
export function panelStyle(extra?: ViewStyle): ViewStyle {
  const reduce = prefersReducedTransparency();
  return {
    backgroundColor: reduce ? t.surface : t.surfaceGlass,
    borderWidth: 1,
    borderColor: reduce ? t.border : t.glassBorder,
    borderTopColor: reduce ? t.border : t.glassHighlight,
    ...shadow(1),
    ...webBlur(reduce),
    ...extra,
  };
}

/** Ombre large + ombre courte : le bouton a une hauteur, pas seulement une teinte. */
function relief(pressed: boolean, solid: boolean): ViewStyle {
  const dark = currentScheme() === 'dark';
  if (Platform.OS === 'web') {
    const rest = solid
      ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 1px rgba(28,20,12,0.14), 0 10px 18px rgba(28,20,12,0.18)'
      : dark
        ? 'inset 0 1px 0 rgba(255,244,230,0.2), 0 1px 1px rgba(0,0,0,0.35), 0 10px 18px rgba(0,0,0,0.35)'
        : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(28,20,12,0.08), 0 10px 18px rgba(28,20,12,0.12)';
    const down = 'inset 0 3px 6px rgba(28,20,12,0.28), 0 1px 1px rgba(28,20,12,0.12)';
    return { boxShadow: pressed ? down : rest } as ViewStyle;
  }
  return {
    shadowColor: t.shadow,
    shadowOpacity: pressed ? 0.12 : dark ? 0.45 : 0.22,
    shadowRadius: pressed ? 2 : 12,
    shadowOffset: { width: 0, height: pressed ? 1 : 6 },
    elevation: pressed ? 1 : 6,
  };
}

/** Bouton en relief : ombre double, arête claire, enfoncement au pressage. Cible ≥ 44 pt. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
  accessibilityLabel,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  accessibilityLabel?: string;
}) {
  const fonts = useAppFonts();
  const solid = variant === 'primary' || variant === 'danger';
  const reduce = prefersReducedTransparency();
  const bg = solid
    ? variant === 'danger'
      ? t.danger
      : t.primary
    : variant === 'secondary'
      ? reduce
        ? t.surfaceAlt
        : t.surfaceGlass
      : reduce
        ? 'transparent'
        : t.surfaceGlass;
  const fg = { primary: t.onPrimary, secondary: t.text, ghost: t.primary, danger: t.onPrimary }[variant];
  const off = disabled || loading;
  const hi = solid ? 'rgba(255,255,255,0.42)' : t.glassHighlight;
  const shade = solid ? 'rgba(0,0,0,0.28)' : currentScheme() === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(28,20,12,0.14)';
  return (
    <Pressable
      onPress={off ? undefined : () => { haptic(variant === 'danger' ? 'warning' : 'tap'); onPress?.(); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      hitSlop={6}
      style={({ pressed }) => [
        S().btn,
        small && S().btnSmall,
        relief(pressed && !off, solid),
        {
          backgroundColor: bg,
          borderTopColor: pressed && !off ? 'transparent' : hi,
          borderBottomColor: shade,
          borderLeftColor: solid ? 'transparent' : reduce ? t.border : t.glassBorder,
          borderRightColor: solid ? 'transparent' : reduce ? t.border : t.glassBorder,
        },
        pressed && !off && { transform: [{ translateY: 1 }] },
        off && { opacity: 0.45, elevation: 0 },
        !solid && webBlur(reduce),
        style,
      ]}
    >
      {({ pressed }) => (
        <>
          {pressed && !off ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.08)' }]} /> : null}
          {loading ? (
            <ActivityIndicator color={fg} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
              <Text maxFontSizeMultiplier={2} style={[S().btnText, small && { fontSize: 14 }, { color: fg }, fonts.uiStrong ? { fontFamily: fonts.uiStrong } : null]}>{title}</Text>
            </>
          )}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color = t.text, size = 22 }: { icon: IconName; onPress: () => void; label: string; color?: string; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [S().iconBtn, panelStyle({ borderRadius: 22 }), pressed && { transform: [{ translateY: 1 }], opacity: 0.88 }]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const c = color ?? t.primary;
  return (
    <PressableScale
      hapticKind="select"
      scaleTo={0.95}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        S().chip,
        { borderColor: active ? c : t.border, backgroundColor: active ? c : 'transparent' },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text maxFontSizeMultiplier={1.6} style={{ color: active ? t.onPrimary : t.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </PressableScale>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const map = {
    neutral: [t.surfaceAlt, t.muted],
    success: [t.successBg, t.success],
    warning: [t.warningBg, t.warning],
    danger: [t.dangerBg, t.danger],
    info: [t.infoBg, t.info],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[S().badge, { backgroundColor: bg }]}>
      <Text maxFontSizeMultiplier={1.6} style={{ color: fg, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

export function Field({ label, hint, error, style, ...props }: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  const fonts = useAppFonts();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={S().label}>{label}</Text>
      <TextInput
        placeholderTextColor={t.muted}
        accessibilityLabel={label}
        style={[S().input, fonts.ui ? { fontFamily: fonts.ui } : null, props.multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }, focused && !error ? { borderColor: t.primary, borderWidth: 1.5 } : null, error ? { borderColor: t.danger } : null, style]}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
      {error ? <Text style={{ color: t.danger, marginTop: 4, fontSize: 13 }}>{error}</Text> : hint ? <Muted style={{ marginTop: 4, fontSize: 13 }}>{hint}</Muted> : null}
    </View>
  );
}

/** Sélecteur segmenté (ex. TVA Oui / Non). */
export function Segmented<T extends string | number>({ options, value, onChange, label }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={S().label}>{label}</Text> : null}
      <View style={S().segment} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => {
                if (!on) haptic('select');
                onChange(o.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[S().segItem, on && { backgroundColor: currentScheme() === 'dark' ? t.border : t.surface, ...shadow(1) }]}
            >
              <Text maxFontSizeMultiplier={1.6} numberOfLines={2} style={{ color: on ? t.text : t.muted, fontWeight: on ? '700' : '500', fontSize: 14, textAlign: 'center' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Interrupteur à ressort (le pouce glisse, la piste se teinte). */
function SpringSwitch({ on }: { on: boolean }) {
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) {
      x.setValue(on ? 1 : 0);
      return;
    }
    Animated.spring(x, { toValue: on ? 1 : 0, speed: 20, bounciness: 6, useNativeDriver: false }).start();
  }, [on, x]);
  const bg = x.interpolate({ inputRange: [0, 1], outputRange: [t.border, t.primary] });
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });
  return (
    <Animated.View style={[S().track, { backgroundColor: bg }]}>
      <Animated.View style={[S().thumb, { transform: [{ translateX: tx }] }]} />
    </Animated.View>
  );
}

export function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <Pressable
      onPress={() => {
        haptic('select');
        onChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 12 }}
    >
      <View style={{ flex: 1 }}>
        <Body>{label}</Body>
        {hint ? <Muted style={{ fontSize: 13 }}>{hint}</Muted> : null}
      </View>
      <SpringSwitch on={value} />
    </Pressable>
  );
}

export function Empty({ icon = 'sparkles-outline', title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <FadeIn>
      <View style={S().empty}>
        <View style={S().emptyHalo}>
          <View style={S().emptyIcon}>
            <Ionicons name={icon} size={30} color={t.accent} />
          </View>
        </View>
        <Text accessibilityRole="header" style={[S().h2, { textAlign: 'center', marginBottom: 8 }]}>{title}</Text>
        {text ? <Muted style={{ textAlign: 'center', marginBottom: 16, maxWidth: 360 }}>{text}</Muted> : null}
        {action}
      </View>
    </FadeIn>
  );
}

export function Notice({ tone = 'info', title, text, icon }: { tone?: 'info' | 'warning' | 'danger' | 'success'; title: string; text?: string; icon?: IconName }) {
  const map = { info: [t.infoBg, t.info], warning: [t.warningBg, t.warning], danger: [t.dangerBg, t.danger], success: [t.successBg, t.success] } as const;
  const [bg, fg] = map[tone];
  const ic: IconName = icon ?? ({ info: 'information-circle', warning: 'warning', danger: 'alert-circle', success: 'checkmark-circle' } as const)[tone];
  return (
    <View style={[S().notice, { backgroundColor: bg }]} accessibilityRole="alert">
      <Ionicons name={ic} size={20} color={fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: fg, fontWeight: '700', fontSize: 14 }}>{title}</Text>
        {text ? <Text style={{ color: t.text, fontSize: 13, marginTop: 2, lineHeight: 19 }}>{text}</Text> : null}
      </View>
    </View>
  );
}

export function ListItem({ title, subtitle, right, icon, onPress }: { title: string; subtitle?: string; right?: ReactNode; icon?: IconName; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [S().li, pressed && { backgroundColor: t.surfaceAlt }]}
    >
      {icon ? (
        <View style={S().liIcon}>
          <Ionicons name={icon} size={18} color={t.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[S().body, { fontWeight: '600' }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Muted style={{ fontSize: 13 }} >
            {subtitle}
          </Muted>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={t.muted} /> : null}
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 10 }} />;
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const fonts = useAppFonts();
  return (
    <View style={[S().card, { flex: 1, minWidth: 140, marginBottom: 0 }]}>
      <Muted style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Muted>
      <Text maxFontSizeMultiplier={1.6} style={{ color: t.text, fontSize: t.type.price, fontWeight: '500', marginTop: 4, fontFamily: fonts.price }}>{value}</Text>
      {sub ? <Muted style={{ fontSize: 12, marginTop: 2 }}>{sub}</Muted> : null}
    </View>
  );
}

/** Bannière « Données d'exemple » pour toute donnée seed. */
export function DemoBanner({ text }: { text: string }) {
  return (
    <View style={S().demo} accessibilityRole="text">
      <Ionicons name="flask-outline" size={14} color={t.warning} />
      <Text style={{ color: t.warning, fontSize: 12, fontWeight: '600', flex: 1 }}>{text}</Text>
    </View>
  );
}

export function shadow(level = 1): ViewStyle {
  const dark = currentScheme() === 'dark';
  if (Platform.OS === 'android') return { elevation: level * (dark ? 3 : 2) };
  if (Platform.OS === 'web') {
    const soft = dark ? `0 ${4 * level}px ${14 * level}px rgba(0,0,0,0.45)` : `0 ${3 * level}px ${12 * level}px rgba(28,20,12,${0.08 * level})`;
    const tight = dark ? `0 1px 2px rgba(0,0,0,0.4)` : `0 1px 2px rgba(28,20,12,0.08)`;
    const edge = dark ? 'inset 0 1px 0 rgba(255,244,230,0.16)' : 'inset 0 1px 0 rgba(255,255,255,0.85)';
    return { boxShadow: `${edge}, ${tight}, ${soft}` } as ViewStyle;
  }
  return {
    shadowColor: t.shadow,
    shadowOpacity: (dark ? 0.4 : 0.1) * level,
    shadowRadius: 10 * level,
    shadowOffset: { width: 0, height: 4 * level },
  };
}

function makeStyles() {
  const glass = panelStyle();
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.bg },
  inner: { width: '100%', maxWidth: 860, alignSelf: 'center' },
  h1: { color: t.text, fontSize: t.type.h1, lineHeight: t.leading.h1, fontWeight: '600', letterSpacing: -0.5, marginBottom: spacing.xxs },
  h2: { color: t.text, fontSize: t.type.h2, lineHeight: t.leading.h2, fontWeight: '600', letterSpacing: -0.2, marginBottom: spacing.xs },
  body: { color: t.text, fontSize: t.type.body, lineHeight: t.leading.body },
  muted: { color: t.muted, fontSize: 15, lineHeight: t.leading.caption + 3 },
  eyebrow: { color: t.accentInk, fontSize: t.type.caption - 1, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: spacing.xxs + 2 },
  card: {
    ...glass,
    borderRadius: t.radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  btn: {
    minHeight: t.hit,
    minWidth: t.hit,
    paddingHorizontal: spacing.lg - 2,
    borderRadius: t.radiusButton,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  btnSmall: { minHeight: t.hit, paddingHorizontal: spacing.sm + 2 },
  btnText: { fontSize: t.type.body, fontWeight: '700', letterSpacing: 0.2, textAlign: 'center', flexShrink: 1 },
  iconBtn: { width: t.hit, height: t.hit, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: t.hit, maxWidth: '100%', paddingVertical: 6, paddingHorizontal: spacing.sm + 2, borderRadius: t.radiusChip, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  label: { color: t.muted, fontSize: t.type.caption, fontWeight: '600', marginBottom: spacing.xxs + 2, letterSpacing: 0.3 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: prefersReducedTransparency() ? t.border : t.glassBorder,
    borderRadius: t.radius - 4,
    paddingHorizontal: spacing.sm + 2,
    color: t.text,
    backgroundColor: prefersReducedTransparency() ? t.surface : t.surfaceGlass,
    fontSize: t.type.body,
  },
  segment: { flexDirection: 'row', backgroundColor: prefersReducedTransparency() ? t.surfaceAlt : t.surfaceGlass, borderRadius: t.radius - 2, padding: spacing.xxs, gap: spacing.xxs, borderWidth: 1, borderColor: prefersReducedTransparency() ? t.border : t.glassBorder },
  segItem: { flex: 1, minHeight: t.hit, paddingVertical: 6, borderRadius: t.radius - 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xs },
  track: { width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center' },
  thumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.9)', ...shadow(1) },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl, borderRadius: t.radius + 4, marginBottom: spacing.md, ...glass },
  emptyHalo: { width: 96, height: 96, borderRadius: 48, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: prefersReducedTransparency() ? t.surface : t.surfaceGlass, alignItems: 'center', justifyContent: 'center', ...shadow(1) },
  notice: { flexDirection: 'row', gap: spacing.xs + 2, padding: spacing.sm, borderRadius: t.radius - 4, marginBottom: spacing.sm },
  li: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.xs, paddingHorizontal: spacing.xxs, borderRadius: 10 },
  liIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: spacing.xs + 2, borderRadius: 8, backgroundColor: t.warningBg, marginBottom: spacing.sm },
  });
}
type Styles = ReturnType<typeof makeStyles>;
const cache: Partial<Record<string, Styles>> = {};
/** Styles du kit, une fois par schéma et par réglage de transparence. */
export const getStyles = (): Styles => {
  const key = `${currentScheme()}:${prefersReducedTransparency() ? 'solid' : 'glass'}`;
  return (cache[key] ??= makeStyles());
};
/** Compatibilité : `styles.x` lit toujours la version du schéma courant. */
export const styles = new Proxy({} as Styles, { get: (_o, k: string) => getStyles()[k as keyof Styles] });
