import { useThemeController } from '@/theme/colors';

export const gradientPalettes = {
  light: {
    appBackground: ['#fbfbf8', '#f4f5f0', '#edeFE9'] as const,
    card: ['#ffffff', '#fafaf6'] as const,
    hero: ['#ffffff', '#f2f3ee'] as const,
    primaryButton: ['#bdf14a', '#93D51F'] as const,
    amberCard: ['#fff8e7', '#ffffff'] as const,
    matchHero: ['#2a0631', '#430f4e'] as const,
  },
  dark: {
    appBackground: ['#11120f', '#080908', '#040504'] as const,
    card: ['#191a17', '#121310'] as const,
    hero: ['#1b1d19', '#10110f'] as const,
    primaryButton: ['#bdf14a', '#93D51F'] as const,
    amberCard: ['#2a210d', '#151913'] as const,
    matchHero: ['#27052d', '#420d4d'] as const,
  },
} as const;

export const gradients = gradientPalettes.dark;

export type GradientName = keyof typeof gradients;

export function useAppGradients() {
  return gradientPalettes[useThemeController().mode];
}
