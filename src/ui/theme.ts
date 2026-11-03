/**
 * Jetons Bissabi — source unique des couleurs, de la typo et des rayons.
 * Les composants lisent ce module. Les couleurs de marque ne sont pas recopiées dans les écrans.
 *
 * Contraste (texte courant sur crème #FAF8F2) : #1C1C1C et #5E5E5E passent le AA.
 * Le rouge #C8152A sur crème est réservé au texte ≥ 18 pt gras (wordmark). Sinon, blanc sur rouge.
 * L'or #C9A84C n'est pas utilisé comme couleur de texte sur crème : le texte or utilise accentInk.
 */
export const palette = {
  primary: '#C8152A',
  secondary: '#1A4D2E',
  accent: '#C9A84C',
  background: '#FAF8F2',
  surface: '#FFFFFF',
  text: '#1C1C1C',
  textSecondary: '#5E5E5E',
  border: '#E8E2D4',
  warning: '#B7791F',
  onPrimary: '#FFFFFF',
  surfaceAlt: '#F3EDE3',
  dangerBg: '#FBE7E9',
  successBg: '#E4EFE7',
  warningBg: '#FBF3E4',
  info: '#1F5B8C',
  infoBg: '#E6F0F8',
  accentBg: '#F6EED8',
  accentInk: '#7A5F12',
  shadow: '#000000',
  scrim: 'rgba(255,255,255,0.92)',
} as const;

/** Familles cibles. Les fichiers sont chargés au runtime ; le repli système est immédiat. */
export const fontFamilies = {
  display: 'Poppins',
  ui: 'Inter',
  numeric: 'Outfit',
} as const;

export const type = {
  display: 32,
  h1: 24,
  h2: 20,
  body: 16,
  caption: 13,
  price: 18,
} as const;

export const space = 8;

export const radii = {
  card: 12,
  sheet: 24,
  chip: 999,
} as const;

/** Fonds illustratifs des plats sans photo (pas des couleurs d'interface). */
export const dishTints = ['#F3E6D0', '#E9F0E6', '#F6E1E1', '#EFE8D8', '#E6ECF2'] as const;

export const theme = {
  bg: palette.background,
  surface: palette.surface,
  surfaceAlt: palette.surfaceAlt,
  text: palette.text,
  muted: palette.textSecondary,
  primary: palette.primary,
  onPrimary: palette.onPrimary,
  secondary: palette.secondary,
  accent: palette.accent,
  accentBg: palette.accentBg,
  accentInk: palette.accentInk,
  border: palette.border,
  danger: palette.primary,
  dangerBg: palette.dangerBg,
  success: palette.secondary,
  successBg: palette.successBg,
  warning: palette.warning,
  warningBg: palette.warningBg,
  info: palette.info,
  infoBg: palette.infoBg,
  shadow: palette.shadow,
  scrim: palette.scrim,
  radius: radii.card,
  radiusSheet: radii.sheet,
  radiusChip: radii.chip,
  space,
  type,
  fontFamilies,
  /** Renseigné par le chargeur de polices quand les fichiers sont prêts. Vide = police système. */
  displayFont: undefined as string | undefined,
  dishTints,
};

export type Theme = typeof theme;
