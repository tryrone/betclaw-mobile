import { useThemeController } from '@/theme/colors';

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

/** Light counterpart — same keys so components stay theme-agnostic. Kept neutral and low-chroma to avoid metallic/colour-banding on light surfaces. */
const lightGradients = {
  appBackground: ['#f4f6f9', '#eef1f5', '#f4f6f9'] as const,
  card: ['#ffffff', '#f7f9fb'] as const,
  hero: ['#ffffff', '#f2f8f7', '#eef3f6'] as const,
  primaryButton: ['#3df0d2', '#0d9488'] as const,
  amberCard: ['#fff9ef', '#f7f9fb'] as const,
  matchHero: ['#ffffff', '#f3f8f7', '#eef3f6'] as const,
  dock: ['rgba(255,255,255,0.94)', 'rgba(246,248,251,0.94)', 'rgba(255,255,255,0.94)'] as const,
  sheet: ['rgba(244,250,249,0.97)', 'rgba(255,255,255,0.97)', 'rgba(244,247,250,0.97)'] as const,
  navActive: ['rgba(13,148,136,0.16)', 'rgba(13,148,136,0.04)'] as const,
} as const;

export const gradientPalettes = {
  light: lightGradients,
  dark: darkGradients,
} as const;

export const gradients = gradientPalettes.dark;

export type GradientName = keyof typeof gradients;

export function useAppGradients() {
  return gradientPalettes[useThemeController().mode];
}
