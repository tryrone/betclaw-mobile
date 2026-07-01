import { useThemeController } from '@/theme/colors';

/** Dark-only design: one gradient set mapped to both scheme keys (see colors.ts). */
const darkGradients = {
  appBackground: ['#020605', '#061813', '#020403'] as const,
  card: ['#0c1815', '#080e0d'] as const,
  hero: ['#0b1516', '#0a0e13', '#1c0d11'] as const,
  primaryButton: ['#5ff7dd', '#2ef2d0'] as const,
  amberCard: ['#141207', '#080e0d'] as const,
  matchHero: ['#0b1714', '#080c10', '#141105'] as const,
  /** Floating bottom dock background. */
  dock: ['rgba(4,16,14,0.96)', 'rgba(2,17,15,0.96)', 'rgba(46,242,208,0.08)'] as const,
  /** "More" modal sheet background. */
  sheet: ['rgba(46,242,208,0.10)', 'rgba(4,16,14,0.96)', 'rgba(255,211,77,0.06)'] as const,
  /** Active nav item highlight. */
  navActive: ['rgba(46,242,208,0.22)', 'rgba(46,242,208,0.06)'] as const,
} as const;

export const gradientPalettes = {
  light: darkGradients,
  dark: darkGradients,
} as const;

export const gradients = gradientPalettes.dark;

export type GradientName = keyof typeof gradients;

export function useAppGradients() {
  return gradientPalettes[useThemeController().mode];
}
