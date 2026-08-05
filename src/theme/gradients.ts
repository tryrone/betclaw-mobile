import { useThemeController } from '@/theme/colors';

const darkGradients = {
  appBackground: ['#0d1030', '#11143b', '#0d1030'] as const,
  card: ['#191e4d', '#15183f'] as const,
  hero: ['#20255b', '#171b47', '#11143b'] as const,
  primaryButton: ['#858ae2', '#7076d1'] as const,
  amberCard: ['#201f46', '#171a40'] as const,
  matchHero: ['#20265d', '#171b47', '#11143b'] as const,
  /** Floating bottom dock background. */
  dock: ['rgba(25,29,72,0.78)', 'rgba(17,20,59,0.74)', 'rgba(25,29,72,0.78)'] as const,
  /** "More" modal sheet background. */
  sheet: ['rgba(17,28,70,0.98)', 'rgba(9,16,47,0.99)', 'rgba(77,107,254,0.08)'] as const,
  /** Active nav item highlight. */
  navActive: ['rgba(77,107,254,0.24)', 'rgba(77,107,254,0.07)'] as const,
} as const;

/** Light counterpart — same keys so components stay theme-agnostic. Kept neutral and low-chroma to avoid metallic/colour-banding on light surfaces. */
const lightGradients = {
  appBackground: ['#fafbfc', '#f6f7fa', '#f0f2f7'] as const,
  card: ['#ffffff', '#fbfbfd'] as const,
  hero: ['#ffffff', '#f8f8fc', '#f2f3f8'] as const,
  primaryButton: ['#292d68', '#11143b'] as const,
  amberCard: ['#fff8f9', '#fbfbfd'] as const,
  matchHero: ['#ffffff', '#ffffff', '#f8f8fa'] as const,
  dock: ['rgba(255,255,255,0.80)', 'rgba(247,248,252,0.72)', 'rgba(255,255,255,0.80)'] as const,
  sheet: ['rgba(247,247,252,0.99)', 'rgba(255,255,255,0.99)', 'rgba(252,246,248,0.99)'] as const,
  navActive: ['rgba(24,25,65,0.14)', 'rgba(24,25,65,0.04)'] as const,
} as const;

export const gradientPalettes = {
  light: lightGradients,
  dark: darkGradients,
} as const;

export const gradients = gradientPalettes.light;

export type GradientName = keyof typeof gradients;

export function useAppGradients() {
  return gradientPalettes[useThemeController().mode];
}
