/**
 * Verre — jetons Bissabi (clair et sombre).
 * Les surfaces sont translucides (verre) ; « Réduire la transparence » les rend opaques.
 * Le texte est prévu pour le AA sur le fond, sur la surface opaque, et sur le verre composé.
 *
 * Le rouge #C8152A reste la marque. L'or #C9A84C n'est pas une couleur de texte :
 * le texte or utilise accentInk. L'ambre d'avertissement est assombri pour le AA.
 */
export const palette = {
  primary: '#C8152A',
  secondary: '#1A4D2E',
  accent: '#C9A84C',
  background: '#FAF8F2',
  surface: '#FFFcf8',
  text: '#1C1C1C',
  textSecondary: '#5E5E5E',
  border: '#E8E2D4',
  /** Ambre lisible sur crème (l'ancien #B7791F restait sous 4,5:1). */
  warning: '#8A5208',
  onPrimary: '#FFFFFF',
  surfaceAlt: '#F3EDE3',
  dangerBg: '#FBE7E9',
  successBg: '#E4EFE7',
  warningBg: '#FBF3E4',
  info: '#1F5B8C',
  infoBg: '#E6F0F8',
  accentBg: '#F6EED8',
  accentInk: '#7A5F12',
  shadow: '#1C140C',
  scrim: 'rgba(255,252,248,0.88)',
} as const;

export const fontFamilies = {
  display: 'Poppins',
  ui: 'Inter',
  numeric: 'Outfit',
} as const;

/** Tailles de base. Le texte suit le Dynamic Type (allowFontScaling), plafonné dans le kit. */
export const type = {
  display: 32,
  h1: 24,
  h2: 20,
  body: 16,
  caption: 13,
  price: 18,
} as const;

export const leading = {
  display: 40,
  h1: 32,
  h2: 28,
  body: 24,
  caption: 18,
  price: 24,
} as const;

/** Échelle d'espacement (multiples de 4). `space` reste 8 pour les écrans déjà écrits. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const space = spacing.xs;

/** Cible tactile minimale (44 pt). */
export const hit = 44;

export const radii = {
  card: 16,
  sheet: 24,
  chip: 999,
  button: 14,
} as const;

export const dishTints = ['#F3E6D0', '#E9F0E6', '#F6E1E1', '#EFE8D8', '#E6ECF2'] as const;

export type Scheme = 'light' | 'dark';

export type VerreColors = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceGlass: string;
  glassBorder: string;
  glassHighlight: string;
  washA: string;
  washB: string;
  washGold: string;
  text: string;
  muted: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  accent: string;
  accentBg: string;
  accentInk: string;
  border: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  shadow: string;
  scrim: string;
  dishTints: readonly string[];
};

export const LIGHT: VerreColors = {
  bg: palette.background,
  surface: palette.surface,
  surfaceAlt: palette.surfaceAlt,
  surfaceGlass: 'rgba(255,252,248,0.72)',
  glassBorder: 'rgba(255,255,255,0.82)',
  glassHighlight: 'rgba(255,255,255,0.96)',
  washA: 'rgba(200,21,42,0.10)',
  washB: 'rgba(26,77,46,0.10)',
  washGold: 'rgba(201,168,76,0.16)',
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
  dishTints,
};

export const DARK: VerreColors = {
  bg: '#12100D',
  surface: '#1B1814',
  surfaceAlt: '#25211B',
  surfaceGlass: 'rgba(42,36,30,0.74)',
  glassBorder: 'rgba(255,244,230,0.16)',
  glassHighlight: 'rgba(255,244,230,0.28)',
  washA: 'rgba(239,90,99,0.16)',
  washB: 'rgba(140,199,161,0.12)',
  washGold: 'rgba(217,185,100,0.14)',
  text: '#F2EDE3',
  muted: '#B3AA9B',
  primary: '#EF5A63',
  onPrimary: '#1F0609',
  secondary: '#8CC7A1',
  accent: '#D9B964',
  accentBg: '#2E2714',
  accentInk: '#E3C878',
  border: '#332D25',
  danger: '#F2897E',
  dangerBg: '#3A1D19',
  success: '#8CC7A1',
  successBg: '#16291D',
  warning: '#E9C46A',
  warningBg: '#2E2512',
  info: '#8DB9E6',
  infoBg: '#13243A',
  shadow: '#000000',
  scrim: 'rgba(18,16,13,0.88)',
  dishTints: ['#2E2618', '#1E2A1F', '#2F1D1E', '#2A251B', '#1D242C'],
};

export const theme = {
  ...LIGHT,
  radius: radii.card,
  radiusSheet: radii.sheet,
  radiusChip: radii.chip,
  radiusButton: radii.button,
  space,
  spacing,
  hit,
  type,
  leading,
  fontFamilies,
  displayFont: undefined as string | undefined,
};

export type Theme = typeof theme;

let scheme: Scheme = 'light';
export const currentScheme = (): Scheme => scheme;
export const isDark = () => scheme === 'dark';

/** Applique la palette du schéma au thème partagé (lecture au rendu suivant). */
export function applyScheme(next: Scheme | null | undefined): Scheme {
  scheme = next === 'dark' ? 'dark' : 'light';
  Object.assign(theme, scheme === 'dark' ? DARK : LIGHT);
  return scheme;
}

export function colorsOf(next: Scheme): VerreColors {
  return next === 'dark' ? DARK : LIGHT;
}

type Rgba = { r: number; g: number; b: number; a: number };

export function rgbaOf(input: string): Rgba {
  const s = input.trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }
  const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return { r: 0, g: 0, b: 0, a: 1 };
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] == null ? 1 : Number(m[4]) };
}

/** Compose un voile (éventuellement translucide) sur un fond. */
export function composite(fg: string, bg: string): string {
  const f = rgbaOf(fg);
  const b = rgbaOf(bg);
  const a = f.a + b.a * (1 - f.a);
  const ch = (fc: number, bc: number) => Math.round((fc * f.a + bc * b.a * (1 - f.a)) / (a || 1));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(ch(f.r, b.r))}${hex(ch(f.g, b.g))}${hex(ch(f.b, b.b))}`;
}

function channel(c: number) {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(a: string, b: string): number {
  const lum = (input: string) => {
    const { r, g, b: bl } = rgbaOf(input);
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(bl);
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Fond réel d'un panneau de verre (voile composé sur le fond d'écran). */
export function glassBackdrop(next: Scheme = scheme): string {
  const colors = colorsOf(next);
  return composite(colors.surfaceGlass, colors.bg);
}

/** Encre lisible sur un aplat (avatar, pastille). Blanc si le contraste passe, sinon l'encre. */
export function inkOn(bg: string): string {
  return contrastRatio('#FFFFFF', bg) >= 4.5 ? '#FFFFFF' : '#1C1C1C';
}
