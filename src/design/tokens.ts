export type Colors = {
  primary: string;
  primaryVariant: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
};

export const circleAccentColors = [
  '#FF6B6B', // red
  '#6BCB77', // green
  '#4D96FF', // blue
  '#FFD93D', // yellow
  '#9B5DE5', // purple
  '#F15BB5', // pink
  '#00C2A8', // teal
  '#FF7F50', // coral
];

const lightColors: Colors = {
  primary: '#2563EB',
  primaryVariant: '#1E40AF',
  secondary: '#06B6D4',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E6EEF8',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
};

const darkColors: Colors = {
  primary: '#60A5FA',
  primaryVariant: '#3B82F6',
  secondary: '#2DD4BF',
  background: '#0B1220',
  surface: '#0F1724',
  textPrimary: '#E6EEF8',
  textSecondary: '#94A3B8',
  border: '#1F2A37',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
};

// 8-point spacing scale (allow 4px half-step)
export const spacing = {
  px: 4,
  xsmall: 8,
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 40,
  xxlarge: 48,
  huge: 64,
};

export const radii = {
  small: 4,
  medium: 8,
  large: 16,
  round: 9999,
};

export const elevation = {
  low: '0px 1px 2px rgba(2,6,23,0.06)',
  medium: '0px 4px 12px rgba(2,6,23,0.08)',
  high: '0px 12px 40px rgba(2,6,23,0.12)',
};

export const typography = {
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  sizes: {
    bodySmall: 14,
    body: 16,
    subhead: 18,
    h3: 20,
    h2: 24,
    h1: 28,
  },
  lineHeights: {
    body: 20,
    heading: 32,
  },
  weights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
};

export type ThemeTokens = {
  colors: Colors;
  spacing: typeof spacing;
  radii: typeof radii;
  elevation: typeof elevation;
  typography: typeof typography;
  circleAccentColors: string[];
};

export const lightTheme: ThemeTokens = {
  colors: lightColors,
  spacing,
  radii,
  elevation,
  typography,
  circleAccentColors,
};

export const darkTheme: ThemeTokens = {
  colors: darkColors,
  spacing,
  radii,
  elevation,
  typography,
  circleAccentColors,
};

// Simple hash to pick a consistent circle color from accent list
export function pickCircleColor(circleId: string): string {
  let hash = 0;
  for (let i = 0; i < circleId.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + circleId.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0;
  }
  const idx = Math.abs(hash) % circleAccentColors.length;
  return circleAccentColors[idx];
}

// Generate CSS variables for web usage (light or dark)
export function cssVariables(theme: 'light' | 'dark' = 'light'): string {
  const t = theme === 'light' ? lightTheme : darkTheme;
  const c = t.colors;
  return `:root {
  --color-primary: ${c.primary};
  --color-primary-variant: ${c.primaryVariant};
  --color-secondary: ${c.secondary};
  --color-background: ${c.background};
  --color-surface: ${c.surface};
  --color-text-primary: ${c.textPrimary};
  --color-text-secondary: ${c.textSecondary};
  --color-border: ${c.border};
  --color-success: ${c.success};
  --color-warning: ${c.warning};
  --color-danger: ${c.danger};
  --space-0: ${spacing.px}px;
  --space-1: ${spacing.xsmall}px;
  --space-2: ${spacing.small}px;
  --space-3: ${spacing.medium}px;
  --space-4: ${spacing.large}px;
  --radius-small: ${radii.small}px;
  --radius-medium: ${radii.medium}px;
  --radius-large: ${radii.large}px;
}`;
}

export default {
  light: lightTheme,
  dark: darkTheme,
};
